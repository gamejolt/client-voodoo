import * as mkdirp from 'mkdirp';
import { Mutex } from './mutex';

interface IMutexInstance {
	release: () => Promise<Error>;
	onReleased: Promise<Error>;
}

export abstract class Config {
	static readonly domain = process.env.NODE_ENV === 'development'
		? 'http://development.gamejolt.com'
		: 'https://gamejolt.com';
	static readonly mutex_name = 'game-jolt-client';

	private static pidDir = '';
	private static clientMutexPromise: Promise<void> = null;
	private static clientMutex: IMutexInstance = null;

	static get pid_dir() {
		return this.pidDir;
	}

	static ensurePidDir() {
		return new Promise((resolve, reject) => {
			mkdirp(this.pidDir, (err, made) => {
				if (err) {
					return reject(err);
				}
				return resolve(made);
			});
		});
	}

	static setPidDir(pidDir: string) {
		if (!this.pidDir) {
			this.pidDir = pidDir;
			return true;
		}
		return false;
	}

	static issetClientMutex() {
		return !!this.clientMutex;
	}

	static async setClientMutex(): Promise<void> {
		if (process.platform !== 'win32') {
			return;
		}

		if (this.clientMutex) {
			return;
		}

		if (!this.clientMutexPromise) {
			this.clientMutexPromise = Mutex.create(
				this.mutex_name
			).then(mutexInst => {
				this.clientMutex = mutexInst;
				this.clientMutexPromise = null;
				this.clientMutex.onReleased.then(() => {
					this.clientMutex = null;
				});
			});
		}
		return this.clientMutexPromise;
	}

	static async releaseClientMutex(): Promise<Error> {
		if (process.platform !== 'win32') {
			return null;
		}

		if (!this.clientMutex) {
			return null;
		}

		return this.clientMutex.release();
	}
}

Config.setClientMutex();
