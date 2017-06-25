import * as mkdirp from 'mkdirp';

export let domain = process.env.NODE_ENV === 'development'
	? 'http://development.gamejolt.com'
	: 'https://gamejolt.com';

let _pidDir = '';
export function PID_DIR() {
	return _pidDir;
}

export function ensurePidDir() {
	return new Promise((resolve, reject) => {
		mkdirp(_pidDir, (err, made) => {
			if (err) {
				return reject(err);
			}
			return resolve(made);
		});
	});
}

export function setPidDir(pidDir: string) {
	if (!_pidDir) {
		_pidDir = pidDir;
		return true;
	}
	return false;
}

import { Mutex } from './mutex';

export const MUTEX_NAME = 'game-jolt-client';

interface IMutexInstance {
	release: () => Promise<Error>;
	onReleased: Promise<Error>;
}
let clientMutexPromise: Promise<void> = null;
let clientMutex: IMutexInstance = null;

export function issetClientMutex() {
	return !!clientMutex;
}

export async function setClientMutex(): Promise<void> {
	if (process.platform !== 'win32') {
		return;
	}

	if (clientMutex) {
		return;
	}

	if (!clientMutexPromise) {
		clientMutexPromise = Mutex.create(MUTEX_NAME).then(mutexInst => {
			clientMutex = mutexInst;
			clientMutexPromise = null;
			clientMutex.onReleased.then(() => {
				clientMutex = null;
			});
		});
	}
	return clientMutexPromise;
}

export async function releaseClientMutex(): Promise<Error> {
	if (process.platform !== 'win32') {
		return null;
	}

	if (!clientMutex) {
		return null;
	}

	return clientMutex.release();
}

setClientMutex();
