"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const mkdirp = require("mkdirp");
const mutex_1 = require("./mutex");
class Config {
    static get domain() {
        const isDev = this.env === 'development' || process.env['env'] === 'development' || process.env['ENV'] === 'development';
        return isDev ? 'http://development.gamejolt.com' : 'https://gamejolt.com';
    }
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
    static setPidDir(pidDir) {
        if (!this.pidDir) {
            this.pidDir = pidDir;
            return true;
        }
        return false;
    }
    static issetClientMutex() {
        return !!this.clientMutex;
    }
    static async setClientMutex() {
        if (process.platform !== 'win32') {
            return;
        }
        if (this.clientMutex) {
            return;
        }
        if (!this.clientMutexPromise) {
            this.clientMutexPromise = mutex_1.Mutex.create(this.mutex_name).then(mutexInst => {
                this.clientMutex = mutexInst;
                this.clientMutexPromise = null;
                this.clientMutex.onReleased.then(() => {
                    this.clientMutex = null;
                });
            });
        }
        return this.clientMutexPromise;
    }
    static async releaseClientMutex() {
        if (process.platform !== 'win32') {
            return null;
        }
        if (!this.clientMutex) {
            return null;
        }
        return this.clientMutex.release();
    }
}
exports.Config = Config;
Config.env = null;
Config.mutex_name = 'game-jolt-client';
Config.pidDir = '';
Config.clientMutexPromise = null;
Config.clientMutex = null;
// TODO: DO NOT DO THIS WHAT THE HELL??
// gamejolt should call setClientMutex when its ready to do so.
// Config.setClientMutex();
