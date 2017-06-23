import * as cp from 'child_process';
import * as path from 'path';
import * as net from 'net';
import * as data from './data';
import { TSEventEmitter } from './events';
import { Reconnector } from './reconnector';
import * as fs from 'fs';

const JSONStream = require('JSONStream');
const ps = require('ps-node');

export function getExecutable() {
	let binFolder = path.resolve(__dirname, '..', 'bin');
	switch (process.platform) {
		case 'win32':
			return path.join(binFolder, 'joltron_win32.exe');
		case 'linux':
			return path.join(binFolder, 'joltron_linux');
		case 'darwin':
			return path.join(binFolder, 'joltron_osx');
		default:
			throw new Error('Unsupported OS');
	}
}

class SentMessage<T> {
	readonly msg: string;
	readonly msgId: string;
	private _resolved: boolean;
	private resolver: Function;
	private rejector: Function;
	readonly promise: Promise<T>;

	constructor(msg: any, timeout?: number) {
		this.msg = JSON.stringify(msg);
		this.msgId = msg.msgId;
		this._resolved = false;
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolver = resolve;
			this.rejector = reject;
			if (timeout && timeout !== Infinity) {
				setTimeout(() => {
					this._resolved = true;
					reject(new Error('Message was not handled in time'));
				}, timeout);
			}
		});
	}

	get resolved() {
		return this._resolved;
	}

	resolve(data: any) {
		this._resolved = true;
		this.resolver(data);
	}

	reject(reason: any) {
		this._resolved = true;
		this.rejector(reason);
	}
}

export type Events = {
	// called when an error happens which prevents future operations on the controller
	'fatal': (err: Error) => void;
	// called when an error happens which isn't severe enough to prevent future operations on the controller
	'err': (err: Error) => void;
	// called when a launch operation begins
	'gameLaunchBegin': (dir: string, ...args: string[]) => void;
	// called when the launch operation ends completely
	'gameLaunchFinished': () => void;
	// called when the game fails to launch
	'gameLaunchFailed': (reason: string) => void;
	// called when the game quit due to crash
	'gameCrashed': (reason: string) => void;
	// called when the game quit normally
	'gameClosed': () => void;
	// called when the runner attempts to kill a game. It'll most likely follow a gameCrashed event
	'gameKilled': () => void;
	// called when a game is attempted to be launched again (right after a game is updated while its running)
	'gameRelaunchBegin': (dir: string, ...args: string[]) => void;
	// same as gameLaunchFailed only for relaunch
	'gameRelaunchFailed': (reason: string) => void;
	// called when a new update is available to begin
	'updateAvailable': (metadata: data.UpdateMetadata) => void;
	// called when an update begins (either an install or update during run)
	'updateBegin': (dir: string, metadata: data.UpdateMetadata) => void;
	// called when an update finished successfully
	'updateFinished': () => void;
	// called when an update is ready to be applied (finished downloading and is waiting for extract)
	'updateReady': () => void;
	// called when an update is applying (used to wait for game to quit or force kill it to resume updating)
	'updateApply': (...args: string[]) => void;
	// called when an update fails for whatever reason
	'updateFailed': (reason: string) => void;
	// called when an update is paused
	'paused': (queue: boolean) => void;
	// called when an update is resumed
	'resumed': (unqueue: boolean) => void;
	// called when an update is canceled
	'canceled': () => void;
	// called when an uninstall operation begins
	'uninstallBegin': (dir: string) => void;
	// called when an uninstall operation failed for whatever reason
	'uninstallFailed': (reason: string) => void;
	// called when an uninstall operation finished successfully
	'uninstallFinished': () => void;
	// called when the patcher state changes
	'patcherState': (state: data.PatcherState) => void;
	// called periodically to report download/extract progress.
	// At the moment it isn't called for binary diff progress.
	'progress': (progress: data.MsgProgress) => void;
};

export class Controller extends TSEventEmitter<Events> {
	readonly port: number;
	private process: cp.ChildProcess | number; // process or pid
	private reconnector: Reconnector;
	private connectionLock: boolean = null;
	private conn: net.Socket | null = null;
	private nextMessageId = 0;
	private sendQueue: SentMessage<any>[] = [];
	private sentMessage: SentMessage<any> | null = null;
	private consumingQueue = false;

	private expectingQueuePauseIds: string[] = [];
	private expectingQueueResumeIds: string[] = [];
	private expectingQueuePause = 0;
	private expectingQueueResume = 0;

	constructor(port: number, process?: cp.ChildProcess | number) {
		super();
		this.port = port;
		if (process) {
			this.process = process;
		}

		this.reconnector = new Reconnector(100, 3000);
	}

	private newJsonStream() {
		return JSONStream.parse()
			.on('data', data => {
				console.log('Received json: ' + JSON.stringify(data));

				if (
					data.msgId &&
					this.sentMessage &&
					data.msgId === this.sentMessage.msgId
				) {
					let idx = this.expectingQueuePauseIds.indexOf(this.sentMessage.msgId);
					if (idx !== -1) {
						this.expectingQueuePauseIds.splice(idx);
						this.expectingQueuePause++;
					}

					idx = this.expectingQueueResumeIds.indexOf(this.sentMessage.msgId);
					if (idx !== -1) {
						this.expectingQueueResumeIds.splice(idx);
						this.expectingQueueResume++;
					}

					const payload = data.payload;
					if (!payload) {
						return this.sentMessage.reject(
							new Error(
								'Missing `payload` field in response' +
									' in ' +
									JSON.stringify(data)
							)
						);
					}

					const type = data.type;
					if (!type) {
						return this.sentMessage.reject(
							new Error(
								'Missing `type` field in response' +
									' in ' +
									JSON.stringify(data)
							)
						);
					}

					switch (type) {
						case 'state':
							return this.sentMessage.resolve(payload);
						case 'result':
							if (payload.success) {
								return this.sentMessage.resolve(data);
							}
							return this.sentMessage.resolve(payload.err);
						default:
							return this.sentMessage.reject(
								new Error(
									'Unexpected `type` value: ' +
										type +
										' in ' +
										JSON.stringify(data)
								)
							);
					}
				}

				const type = data.type;
				if (!type) {
					return this.emit(
						'err',
						new Error(
							'Missing `type` field in response' + ' in ' + JSON.stringify(data)
						)
					);
				}

				let payload = data.payload;
				if (!payload) {
					return this.emit(
						'err',
						new Error(
							'Missing `payload` field in response' +
								' in ' +
								JSON.stringify(data)
						)
					);
				}

				switch (type) {
					case 'update':
						const message = payload.message;
						payload = payload.payload; // lol
						switch (message) {
							case 'gameLaunchBegin':
								return this.emit(message, payload.dir, ...payload.args);
							case 'gameLaunchFinished':
								return this.emit(message);
							case 'gameLaunchFailed':
								return this.emit(message, payload);
							case 'gameCrashed':
								return this.emit(message, payload);
							case 'gameClosed':
								return this.emit(message);
							case 'gameKilled':
								return this.emit(message);
							case 'gameRelaunchBegin':
								return this.emit(message, payload.dir, ...payload.args);
							case 'gameRelaunchFailed':
								return this.emit(message, payload);
							case 'updateAvailable':
								return this.emit(message, payload);
							case 'updateBegin':
								return this.emit(message, payload.dir, payload.metadata);
							case 'updateFinished':
								return this.emit(message);
							case 'updateReady':
								return this.emit(message);
							case 'updateApply':
								return this.emit(message, ...payload.args);
							case 'updateFailed':
								return this.emit(message, payload);
							case 'paused':
								if (this.expectingQueuePause > 0) {
									this.expectingQueuePause--;
									return this.emit(message, true);
								}
								return this.emit(message, false);
							case 'resumed':
								if (this.expectingQueueResume > 0) {
									this.expectingQueueResume--;
									return this.emit(message, true);
								}
								return this.emit(message, false);
							case 'canceled':
								return this.emit(message);
							case 'uninstallBegin':
								return this.emit(message, payload);
							case 'uninstallFailed':
								return this.emit(message, payload);
							case 'uninstallFinished':
								return this.emit(message);
							case 'patcherState':
								return this.emit(message, payload);
							case 'abort':
								return this.emit('fatal', new Error(payload));
							case 'error':
								return this.emit('err', new Error(payload));
							default:
								return this.emit(
									'err',
									new Error(
										'Unexpected update `message` value: ' +
											message +
											' in ' +
											JSON.stringify(data)
									)
								);
						}
					case 'progress':
						return this.emit('progress', payload);
					default:
						return this.emit(
							'err',
							new Error(
								'Unexpected `type` value: ' +
									type +
									' in ' +
									JSON.stringify(data)
							)
						);
				}
			})
			.on('error', err => {
				console.log('json stream encountered an error: ' + err.message);
				console.log(err);
				this.emit('fatal', err);
				this.dispose();
			});
	}

	static launchNew(args: string[], options?: cp.SpawnOptions) {
		options = options || {
			detached: true,
			env: process.env,
			stdio: [
				'ignore',
				fs.openSync('joltron.log', 'a'),
				fs.openSync('joltron.log', 'a'),
			],
		};

		let runnerExecutable = getExecutable();

		// Ensure that the runner is executable.
		fs.chmodSync(runnerExecutable, '0755');

		const portArg = args.indexOf('--port');
		if (portArg === -1) {
			throw new Error(
				`Can't launch a new instance without specifying a port number`
			);
		}
		const port = parseInt(args[portArg + 1], 10);

		console.log('Spawning ' + runnerExecutable + ' "' + args.join('" "') + '"');
		const runnerProc = cp.spawn(runnerExecutable, args, options);
		runnerProc.unref();

		const runnerInstance = new Controller(port, runnerProc.pid);
		runnerInstance.connect();
		return runnerInstance;

		// try {
		// 	await runnerInstance.connect();
		// 	return runnerInstance;
		// } catch (err) {
		// 	await runnerInstance.kill();
		// 	throw err;
		// }
	}

	get connected() {
		return this.reconnector.connected;
	}

	async connect() {
		if (this.connectionLock) {
			throw new Error(`Can't connect while connection is transitioning`);
		}

		this.connectionLock = true;
		try {
			this.conn = await this.reconnector.connect({ port: this.port });
			this.conn.setKeepAlive(true, 1000);
			this.conn.setEncoding('utf8');
			this.conn.setNoDelay(true);

			let lastErr: Error = null;
			this.conn
				.on('error', (err: Error) => (lastErr = err))
				.on('close', (hasError: boolean) => {
					this.conn = null;
					if (this.sentMessage) {
						this.sentMessage.reject(
							new Error(
								`Disconnected before receiving message response` +
									(hasError ? `: ${lastErr.message}` : '')
							)
						);
					}

					console.log(
						`Disconnected from runner` +
							(hasError ? `: ${lastErr.message}` : '')
					);
					if (hasError) {
						console.log(lastErr);
					}

					if (!this.connectionLock) {
						this.emit(
							'fatal',
							hasError
								? lastErr
								: new Error(`Unexpected disconnection from joltron`)
						);
					}
				})
				.pipe(this.newJsonStream());

			this.consumeSendQueue();
		} catch (err) {
			console.log('Failed to connect in reconnector: ' + err.message);
			this.emit('fatal', err);
		} finally {
			this.connectionLock = false;
		}
	}

	async disconnect() {
		if (this.connectionLock) {
			throw new Error(`Can't disconnect while connection is transitioning`);
		}

		this.connectionLock = true;
		try {
			await this.reconnector.disconnect();
		} finally {
			this.connectionLock = false;
		}
	}

	async dispose() {
		await this.disconnect();
		this.reconnector.removeAllListeners();
	}

	private async consumeSendQueue() {
		if (this.consumingQueue) {
			return;
		}

		this.consumingQueue = true;

		while (this.sendQueue.length !== 0) {
			this.sentMessage = this.sendQueue.shift();
			if (this.sentMessage.resolved) {
				this.sentMessage = null;
				continue;
			}

			if (!this.connected || this.connectionLock) {
				this.sentMessage.reject(new Error('Not connected'));
				this.sentMessage = null;
				continue;
			}

			await new Promise<void>((resolve, reject) => {
				this.conn.write(this.sentMessage.msg, (err?: Error) => {
					if (err) {
						return reject(err);
					}

					resolve();
				});
			}).catch(err => this.sentMessage.reject(err));

			try {
				await this.sentMessage.promise;
			} catch (err) {}
			this.sentMessage = null;
		}

		this.consumingQueue = false;
	}

	private send<T>(type: string, data: Object, timeout?: number) {
		const msgData = {
			type: type,
			msgId: (this.nextMessageId++).toString(),
			payload: data,
		};
		console.log('Sending ' + JSON.stringify(msgData));

		const msg = new SentMessage<T>(msgData, timeout);
		this.sendQueue.push(msg);

		if (this.connected) {
			this.consumeSendQueue();
		}

		return msg;
	}

	private sendControl(
		command: string,
		extraData?: { [key: string]: string },
		timeout?: number
	) {
		const msg: any = { command };
		if (extraData && extraData !== {}) {
			msg.extraData = extraData;
		}
		return this.send<data.MsgResultResponse>('control', msg, timeout);
	}

	sendKillGame(timeout?: number) {
		return this.sendControl('kill', null, timeout).promise;
	}

	async sendPause(options?: { queue?: boolean; timeout?: number }) {
		options = options || {};
		const msg = this.sendControl('pause', null, options.timeout);
		if (options.queue) {
			this.expectingQueuePauseIds.push(msg.msgId);
		}
		return msg.promise;
	}

	async sendResume(options?: {
		queue?: boolean;
		authToken?: string;
		extraMetadata?: string;
		timeout?: number;
	}) {
		options = options || {};
		let extraData: any = {};
		if (options.authToken) {
			extraData.authToken = options.authToken;
		}
		if (options.extraMetadata) {
			extraData.extraMetadata = options.extraMetadata;
		}
		const msg = this.sendControl('resume', extraData, options.timeout);
		if (options.queue) {
			this.expectingQueueResumeIds.push(msg.msgId);
		}
		return msg.promise;
	}

	sendCancel(timeout?: number) {
		return this.sendControl('cancel', null, timeout).promise;
	}

	sendGetState(includePatchInfo: boolean, timeout?: number) {
		return this.send<data.MsgStateResponse>(
			'state',
			{ includePatchInfo },
			timeout
		).promise;
	}

	sendCheckForUpdates(
		gameUID: string,
		platformURL: string,
		authToken?: string,
		metadata?: string,
		timeout?: number
	) {
		let data: any = { gameUID, platformURL };
		if (authToken) {
			data.authToken = authToken;
		}
		if (metadata) {
			data.metadata = metadata;
		}
		return this.send('checkForUpdates', data, timeout).promise;
	}

	sendUpdateAvailable(updateMetadata: data.UpdateMetadata, timeout?: number) {
		return this.send('updateAvailable', updateMetadata, timeout).promise;
	}

	sendUpdateBegin(timeout?: number) {
		return this.send('updateBegin', {}, timeout).promise;
	}

	sendUpdateApply(env: Object, args: string[], timeout?: number) {
		return this.send('updateApply', { env, args }, timeout).promise;
	}

	kill() {
		if (this.process) {
			return new Promise((resolve, reject) => {
				if (typeof this.process === 'number') {
					ps.kill(this.process, err => {
						if (err) {
							reject(err);
						}
						resolve();
					});
				} else {
					this.process.once('close', resolve).once('error', reject);

					this.process.kill();
				}
			});
		}
		return Promise.resolve();
	}
}
