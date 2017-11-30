import * as net from 'net';
import * as path from 'path';
import * as fs from './fs';
import { Config } from './config';
import { TSEventEmitter } from './events';
import { IParsedWrapper } from './launcher';
import { Events } from './controller';

export class OldLauncher {
	static async attach(wrapperId: string) {
		const instance = new OldLaunchInstance(wrapperId);

		await new Promise((resolve, reject) => {
			let resolved = false;
			instance
				.once('gameLaunched', () => {
					resolved = true;
					resolve(true);
				})
				.once('gameOver', () => {
					resolved = true;
					reject(new Error('Failed to connect to launch instance'));
				});

			setTimeout(() => {
				if (resolved) {
					return;
				}
				instance.abort();
			}, 5000);
		});

		return instance;
	}
}

export type OldLauncherEvents = Events & {
	'gameLaunched': () => void;
	'gameOver': () => void;
};

export class OldLaunchInstance extends TSEventEmitter<OldLauncherEvents> {
	private _interval: NodeJS.Timer | null;
	private _stable: boolean;

	constructor(private _wrapperId: string) {
		super();
		this._interval = setInterval(() => this.tick(), 1000);
		this._stable = false;
	}

	get pid(): IParsedWrapper {
		return {
			wrapperId: this._wrapperId,
		};
	}

	async tick(): Promise<boolean> {
		try {
			await WrapperFinder.find(this._wrapperId);
			const wasStable = this._stable;
			this._stable = true;

			if (!wasStable) {
				console.log('Managed to connect to old launcher');
				this.emit('gameLaunched');
			}
			return true;
		} catch (err) {
			if (this._stable) {
				this.abort();
			}
			return false;
		}
	}

	abort() {
		console.log('Old launcher detected to close. Emitting gameOVer');
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
		this.emit('gameOver');
	}
}

abstract class WrapperFinder {
	static async find(id: string): Promise<number> {
		let pidPath = path.join(Config.pid_dir, id);
		const port = await fs.readFileAsync(pidPath, 'utf8');
		return new Promise<number>((resolve, reject) => {
			let conn = net.connect({ port: parseInt(port, 10), host: '127.0.0.1' });
			conn
				.on('data', data => {
					let parsedData: string[] = data.toString().split(':');
					switch (parsedData[0]) {
						case 'v0.0.1':
						case 'v0.1.0':
						case 'v0.2.0':
						case 'v0.2.1':
							if (parsedData[2] === id) {
								resolve(parseInt(port, 10));
							} else {
								reject(new Error(`Expecting wrapper id ${id}, received ${parsedData[2]}`));
							}
							break;
					}
					conn.end();
				})
				.on('end', () => {
					reject(new Error('Connection to wrapper ended before we got any info'));
				})
				.on('error', (err: NodeJS.ErrnoException) => {
					reject(new Error('Got an error in the connection: ' + err.message));
				});
		});
	}
}
