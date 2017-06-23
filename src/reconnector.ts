import * as net from 'net';
import { TSEventEmitter } from './events';
import { sleep } from './util';

export interface IConnectionOptions {
	port: number;
	host?: string;
	localAddress?: string;
	localPort?: string;
	family?: number;
	allowHalfOpen?: boolean;
}

export type Events = {
	'attempt': (n: number) => void;
};

export class Reconnector extends TSEventEmitter<Events> {
	private _connected = false;
	private conn: net.Socket;
	private connectPromise: Promise<net.Socket> | null;
	private disconnectPromise: Promise<Error | void> | null;
	constructor(private interval: number, private timeout: number) {
		super();
	}

	get connected() {
		return this._connected;
	}

	connect(options: IConnectionOptions): Promise<net.Socket> {
		// If already connected return the current connection.
		// Note: This will also return if we're in the process of disconnecting.
		if (this._connected) {
			return Promise.resolve(this.conn);
		}

		// If we're in the process of connecting, return
		if (this.connectPromise) {
			return this.connectPromise;
		}

		this.connectPromise = new Promise<net.Socket>(async (resolve, reject) => {
			const startTime = Date.now();
			for (let i = 1; true; i++) {
				this.emit('attempt', i);

				try {
					this.conn = await this.attempt(options);
					this._connected = true;
					this.connectPromise = null;
					return resolve(this.conn);
				} catch (err) {}

				if (Date.now() - startTime + this.interval > this.timeout) {
					return reject(new Error(`Couldn't connect in time`));
				}

				await sleep(this.interval);
			}
		});

		return this.connectPromise;
	}

	private attempt(options: IConnectionOptions): Promise<net.Socket> {
		return new Promise<net.Socket>((resolve, reject) => {
			let lastErr: Error = null;
			const conn = net
				.connect(options)
				.on('connect', () => {
					conn.removeAllListeners();
					conn.on('close', () => {
						this.conn = null;
						this._connected = false;
					});
					resolve(conn);
				})
				.on('error', (err: Error) => (lastErr = err))
				.on('close', (hasError: boolean) => {
					conn.removeAllListeners();
					if (hasError) {
						reject(lastErr);
					}
				});
		});
	}

	disconnect(): Promise<Error | void> {
		if (!this._connected) {
			return Promise.resolve();
		}
		if (this.disconnectPromise) {
			return this.disconnectPromise;
		}

		this.disconnectPromise = new Promise<Error | void>(resolve => {
			let lastErr: Error = null;
			this.conn
				.on('error', (err: Error) => (lastErr = err))
				.on('close', (hasError: boolean) => {
					this.conn = null;
					this._connected = false;
					this.disconnectPromise = null;

					if (hasError) {
						return resolve(lastErr);
					}
					return resolve();
				})
				.end();
		});

		return this.disconnectPromise;
	}
}
