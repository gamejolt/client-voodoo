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
	constructor(private interval: number, private timeout: number, private keepConnected: boolean) {
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
					this.connectPromise = null;
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

			// These are event handlers for the first connection event.
			// If we couldn't even establish the first connection, we don't bother retrying
			// since we only care about re-establishing a lost connection.
			// We save them as functions instead of using them inline so that we could
			// clear them specifically once a connection is made instead of removing all listeners for the socket.
			const onError = (err: Error) => (lastErr = err);
			const onClose = (hasError: boolean) => {
				console.log('socket.close');
				conn.removeListener('error', onError);
				conn.removeListener('close', onClose);

				if (hasError) {
					reject(lastErr);
				}
			};

			const conn = net
				.connect(options)
				.on('connect', () => {
					conn.removeListener('error', onError);
					conn.removeListener('close', onClose);

					conn.on('close', () => {
						console.log('socket.connect.close');
						this.conn = null;
						this._connected = false;

						// Only attempt to reconnect if this isn't a manual disconnection (this.disconnectPromise should be null)
						if (this.keepConnected && !this.disconnectPromise) {
							// TODO handle failure to reconnect, make it try for longer, emit events so that controller can propogate them to the client
							this.connect(options);
						}
					});
					resolve(conn);
				})
				// These events handle the first reconnection.
				// After a connection is made, we want to remove them.
				.once('error', onError)
				.once('close', onClose);
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
					console.log('disconnect.close');
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
