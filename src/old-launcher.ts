import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';
import * as config from './config';
import { TSEventEmitter } from './events';
import { IParsedWrapper } from './launcher';

export class Launcher {
	static async attach(wrapperId: string) {
		const instance = new LaunchInstance(wrapperId);

		await new Promise((resolve, reject) => {
			instance
				.once('gameLaunched', () => resolve(true))
				.once('gameOver', () =>
					reject(new Error('Failed to connect to launch instance'))
				);

			setInterval(() => instance.abort(), 5000);
		});

		return instance;
	}
}

type LaunchEvents = {
	'gameLaunched': () => void;
	'gameOver': () => void;
};

class LaunchInstance extends TSEventEmitter<LaunchEvents> {
	private _interval: NodeJS.Timer | null;
	private _wrapperPort: number;
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

	tick(): Promise<boolean> {
		return WrapperFinder.find(this._wrapperId)
			.then(port => {
				const wasStable = this._stable;
				this._stable = true;
				this._wrapperPort = port;

				if (!wasStable) {
					this.emit('gameLaunched');
				}
				return true;
			})
			.catch(err => {
				if (this._stable) {
					this.abort();
				}
				return false;
			});
	}

	abort() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
		this.emit('gameOver');
	}
}

abstract class WrapperFinder {
	static find(id: string): Promise<number> {
		let pidPath = path.join(config.PID_DIR, id);
		const port = fs.readFileSync(pidPath, 'utf8');
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
								reject(
									new Error(
										`Expecting wrapper id ${id}, received ${parsedData[2]}`
									)
								);
							}
							break;
					}
					conn.end();
				})
				.on('end', () => {
					reject(
						new Error('Connection to wrapper ended before we got any info')
					);
				})
				.on('error', (err: NodeJS.ErrnoException) => {
					reject(new Error('Got an error in the connection: ' + err.message));
				});
		});
	}
}
