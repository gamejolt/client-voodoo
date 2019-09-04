import * as cp from 'child_process';
import * as path from 'path';
import * as net from 'net';
import * as data from './data';
import { TSEventEmitter } from './events';
import { Reconnector } from './reconnector';
import fs from './fs';
import * as GameJolt from './gamejolt';
import { Logger } from './logger';
import { Tail } from 'tail';

const JSONStream = require('JSONStream');
const ps = require('ps-node');

export function getExecutable() {
	let executable = 'GameJoltRunner';
	if (process.platform === 'win32') {
		executable += '.exe';
	}

	return path.resolve(__dirname, '..', 'bin', executable);
}

class SentMessage<T> {
	readonly msg: string;
	readonly msgId: string;

	// Result promise - will resolve when the message is acknowledged and responded to by joltron
	private _resultResolved: boolean;
	private resultResolver: Function;
	private resultRejector: Function;
	readonly resultPromise: Promise<T>;

	// Request promise - will resolve when the message is SENT.
	private _requestResolved: boolean;
	private requestResolver: Function;
	private requestRejector: Function;
	readonly requestPromise: Promise<void>;

	constructor(msg: any, timeout?: number) {
		this.msg = JSON.stringify(msg);
		this.msgId = msg.msgId;

		// Initialize the result promise
		this._resultResolved = false;
		this.resultPromise = new Promise<T>((resolve, reject) => {
			this.resultResolver = resolve;
			this.resultRejector = reject;
			if (timeout && timeout !== Infinity) {
				setTimeout(() => {
					this._resultResolved = true;
					reject(new Error('Message was not handled in time'));
				}, timeout);
			}
		});

		// Initialize the request promise
		this._requestResolved = false;
		this.requestPromise = new Promise<void>((resolve, reject) => {
			this.requestResolver = resolve;
			this.requestRejector = reject;
			if (timeout && timeout !== Infinity) {
				setTimeout(() => {
					this._requestResolved = true;
					reject(new Error('Message was not sent in time'));
				}, timeout);
			}
		});
	}

	get resolved() {
		return this._resultResolved;
	}

	resolve(data_: any) {
		this._resultResolved = true;
		this.resultResolver(data_);
	}

	reject(reason: any) {
		this._resultResolved = true;
		this.resultRejector(reason);
	}

	get sent() {
		return this._requestResolved;
	}

	resolveSend() {
		this._requestResolved = true;
		this.requestResolver();
	}

	rejectSend(reason: any) {
		this.reject(reason);
		this._requestResolved = true;
		this.requestRejector(reason);
	}
}

export type Events = {
	// called when an error happens which prevents future operations on the controller
	'fatal': (err: Error) => void;
	// called when an error happens which isn't severe enough to prevent future operations on the controller
	'err': (err: Error) => void;
	// called when the controller is closed (after connection was permanently closed or a fatal error)
	'close': () => void;
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
	// called as a response for checking updates when theres no update available
	'noUpdateAvailable': () => void;
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
	// called when something requests the underlying game to open (while it's already open and managed by another joltron instance)
	'openRequested': () => void;
	// called when an uninstall operation begins
	'uninstallBegin': (dir: string) => void;
	// called when an uninstall operation failed for whatever reason
	'uninstallFailed': (reason: string) => void;
	// called when an uninstall operation finished successfully
	'uninstallFinished': () => void;
	// called when an rollback operation begins
	'rollbackBegin': (dir: string) => void;
	// called when an rollback operation failed for whatever reason
	'rollbackFailed': (reason: string) => void;
	// called when an rollback operation finished successfully
	'rollbackFinished': () => void;
	// called when the patcher state changes
	'patcherState': (state: data.PatcherState) => void;
	// called periodically to report download/extract progress.
	// At the moment it isn't called for binary diff progress.
	'progress': (progress: data.MsgProgress) => void;
};

export type Options = {
	process?: cp.ChildProcess | number;
	keepConnected?: boolean;
	sequentialMessageId?: boolean;
};

export type LaunchOptions = cp.SpawnOptions & {
	keepConnected?: boolean;
};

export class Controller extends TSEventEmitter<Events> {
	readonly port: number;
	private process: cp.ChildProcess | number; // process or pid
	private reconnector: Reconnector;
	private connectionLock: boolean = null;
	private conn: net.Socket | null = null;
	private _nextMessageId = -1;
	private sequentialMessageId = false;
	private sendQueue: SentMessage<any>[] = [];
	private sentMessage: SentMessage<any> | null = null;
	private consumingQueue = false;

	private expectingQueuePauseIds: string[] = [];
	private expectingQueueResumeIds: string[] = [];
	private expectingQueuePause = 0;
	private expectingQueueResume = 0;

	constructor(port: number, options?: Options) {
		super();
		this.port = port;
		options = options || {};
		if (options.process) {
			this.process = options.process;
		}
		if (options.sequentialMessageId) {
			this.sequentialMessageId = true;
		}

		this.reconnector = new Reconnector(100, 3000, !!options.keepConnected);
	}

	private nextMessageId() {
		if (this.sequentialMessageId) {
			this._nextMessageId++;
		} else {
			this._nextMessageId = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
		}

		return this._nextMessageId.toString();
	}

	private newJsonStream() {
		return JSONStream.parse()
			.on('data', data_ => {
				console.log('Received json: ' + JSON.stringify(data_));

				let payload: any, type: string;

				if (data_.msgId && this.sentMessage && data_.msgId === this.sentMessage.msgId) {
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

					payload = data_.payload;
					if (!payload) {
						return this.sentMessage.reject(
							new Error(
								'Missing `payload` field in response' +
								' in ' +
								JSON.stringify(data_)
							)
						);
					}

					type = data_.type;
					if (!type) {
						return this.sentMessage.reject(
							new Error(
								'Missing `type` field in response' + ' in ' + JSON.stringify(data_)
							)
						);
					}

					switch (type) {
						case 'state':
							return this.sentMessage.resolve(payload);
						case 'result':
							if (payload.success) {
								return this.sentMessage.resolve(payload);
							}
							return this.sentMessage.reject(payload.err);
						default:
							return this.sentMessage.reject(
								new Error(
									'Unexpected `type` value: ' +
									type +
									' in ' +
									JSON.stringify(data_)
								)
							);
					}
				}

				type = data_.type;
				if (!type) {
					return this.emit(
						'err',
						new Error(
							'Missing `type` field in response' + ' in ' + JSON.stringify(data_)
						)
					);
				}

				payload = data_.payload;
				if (!payload) {
					return this.emit(
						'err',
						new Error(
							'Missing `payload` field in response' + ' in ' + JSON.stringify(data_)
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
							case 'noUpdateAvailable':
								return this.emit(message);
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
							case 'openRequested':
								return this.emit(message);
							case 'uninstallBegin':
								return this.emit(message, payload);
							case 'uninstallFailed':
								return this.emit(message, payload);
							case 'uninstallFinished':
								return this.emit(message);
							case 'rollbackBegin':
								return this.emit(message, payload);
							case 'rollbackFailed':
								return this.emit(message, payload);
							case 'rollbackFinished':
								return this.emit(message);
							case 'patcherState':
								return this.emit(message, payload);
							case 'log':
								let logLevel = payload.level;
								switch (logLevel) {
									case 'fatal':
										logLevel = 'error';

									// tslint:disable-next-line:no-switch-case-fall-through
									case 'error':
									case 'warn':
									case 'info':
									case 'debug':
									case 'trace':
										console[logLevel](
											`[joltron - ${payload.level}] ${payload.message}`
										);
										return;

									default:
										console.log(`[joltron - info] ${payload.message}`);
										return;
								}
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
										JSON.stringify(data_)
									)
								);
						}
					case 'progress':
						return this.emit('progress', payload);
					default:
						return this.emit(
							'err',
							new Error(
								'Unexpected `type` value: ' + type + ' in ' + JSON.stringify(data_)
							)
						);
				}
			})
			.on('error', err => {
				console.error('json stream encountered an error: ' + err.message);
				console.error(err);
				this.emit('fatal', err);
				this.dispose();
			});
	}

	static async ensureMigrationFile(localPackage: GameJolt.IGamePackage) {
		const migration: any = {
			version0: {
				packageId: localPackage.id,
				buildId: localPackage.build.id,
				executablePath: localPackage.executablePath,
			},
		};

		if (localPackage.update) {
			migration.version0.updateId = localPackage.update.id;
			migration.version0.updateBuildId = localPackage.update.build.id;
		}

		try {
			await fs.writeFile(
				path.join(
					localPackage.install_dir,
					'..',
					'.migration-' + path.basename(localPackage.install_dir)
				),
				JSON.stringify(migration)
			);
		} catch (err) {
			// We don't care if this fails because if the game directory doesn't exist we don't need a .migration file.
		}
	}

	static async launchNew(args: string[], options?: LaunchOptions) {
		let joltronLogs = true;
		let joltronOut: { name: string, fd: number } | null = null;
		let joltronErr: { name: string, fd: number } | null = null;
		let joltronOutLogger: Tail | null = null;
		let joltronErrLogger: Tail | null = null;

		try {
			joltronOut = await fs.createTempFile('joltron-', 'out');
			joltronErr = await fs.createTempFile('joltron-', 'err');
			joltronOutLogger = Logger.createLoggerFromFile(joltronOut.name, 'joltron', 'info');
			joltronErrLogger = Logger.createLoggerFromFile(joltronErr.name, 'joltron', 'error');
			console.log(`Logging joltron output to "${joltronOut.name}" and "${joltronErr.name}"`);
		} catch (e) {
			console.warn('Failed to make temp log files for joltron. Logs from joltron will be disabled:', e);
			joltronLogs = false;
		}

		try {
			options = options || {
				detached: true,
				env: process.env,
				stdio: joltronLogs ? ['ignore', joltronOut.fd, joltronErr.fd] : 'ignore',
			};

			let runnerExecutable = getExecutable();

			// Ensure that the runner is executable.
			await fs.chmod(runnerExecutable, '0755');

			const portArg = args.indexOf('--port');
			if (portArg === -1) {
				throw new Error(`Can't launch a new instance without specifying a port number`);
			}
			const port = parseInt(args[portArg + 1], 10);

			console.log('Spawning ' + runnerExecutable + ' "' + args.join('" "') + '"');
			const runnerProc = cp.spawn(runnerExecutable, args, options);
			runnerProc.unref();

			const runnerInstance = new Controller(port, {
				process: runnerProc.pid,
				keepConnected: !!options.keepConnected,
			});
			runnerInstance.connect();
			runnerInstance.on('close', () => {
				if (joltronLogs) {
					joltronOutLogger.unwatch();
					joltronErrLogger.unwatch();
					joltronLogs = false;
				}
			});

			return runnerInstance;
		} catch (e) {
			if (joltronLogs) {
				joltronOutLogger.unwatch();
				joltronErrLogger.unwatch();
				joltronLogs = false;
			}
			throw e;
		}
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
			this.connectionLock = false;

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
						`Disconnected from runner` + (hasError ? `: ${lastErr.message}` : '')
					);
					if (hasError) {
						console.log(lastErr);
					}

					if (!this.connectionLock) {
						this.emit(
							'fatal',
							hasError ? lastErr : new Error(`Unexpected disconnection from joltron`)
						);
					}

					this.emit('close');
				})
				.pipe(this.newJsonStream());

			this.consumeSendQueue();
		} catch (err) {
			console.log('Failed to connect in reconnector: ' + err.message);
			this.emit('fatal', err);
			this.emit('close');
			throw err;
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
			}).catch(err => {
				this.sentMessage.rejectSend(err);
			});
			this.sentMessage.resolveSend();

			try {
				await this.sentMessage.resultPromise;
			} catch (err) { }
			this.sentMessage = null;
		}

		this.consumingQueue = false;
	}

	private send<T>(type: string, payload: Object, timeout?: number) {
		const msgData = {
			type: type,
			msgId: this.nextMessageId(),
			payload: payload,
		};
		console.log('Sending ' + JSON.stringify(msgData));

		const msg = new SentMessage<T>(msgData, timeout);
		this.sendQueue.push(msg);

		if (this.connected) {
			this.consumeSendQueue();
		}

		return msg;
	}

	private sendControl(command: string, extraData?: { [key: string]: string }, timeout?: number) {
		const msg: any = { command };
		if (extraData && extraData !== {}) {
			msg.extraData = extraData;
		}
		return this.send<data.MsgResultResponse>('control', msg, timeout);
	}

	sendKillGame(timeout?: number) {
		return this.sendControl('kill', null, timeout).resultPromise;
	}

	async sendPause(options?: { queue?: boolean; timeout?: number }) {
		options = options || {};
		const msg = this.sendControl('pause', null, options.timeout);
		if (options.queue) {
			this.expectingQueuePauseIds.push(msg.msgId);
		}
		return msg.resultPromise;
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
		return msg.resultPromise;
	}

	sendCancel(timeout?: number, waitOnlyForSend?: boolean) {
		const msg = this.sendControl('cancel', null, timeout);
		return waitOnlyForSend ? msg.requestPromise : msg.resultPromise;
	}

	sendGetState(includePatchInfo: boolean, timeout?: number) {
		return this.send<data.MsgStateResponse>('state', { includePatchInfo }, timeout)
			.resultPromise;
	}

	sendCheckForUpdates(
		gameUID: string,
		platformURL: string,
		authToken?: string,
		metadata?: string,
		timeout?: number
	) {
		let payload: any = { gameUID, platformURL };
		if (authToken) {
			payload.authToken = authToken;
		}
		if (metadata) {
			payload.metadata = metadata;
		}
		return this.send<data.MsgResultResponse>('checkForUpdates', payload, timeout).resultPromise;
	}

	sendUpdateAvailable(updateMetadata: data.UpdateMetadata, timeout?: number) {
		return this.send('updateAvailable', updateMetadata, timeout).resultPromise;
	}

	sendUpdateBegin(timeout?: number) {
		return this.send<data.MsgResultResponse>('updateBegin', {}, timeout).resultPromise;
	}

	sendUpdateApply(env: Object, args: string[], timeout?: number) {
		return this.send<data.MsgResultResponse>('updateApply', { env, args }, timeout)
			.resultPromise;
	}

	kill() {
		if (this.process) {
			return new Promise<void>((resolve, reject) => {
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
