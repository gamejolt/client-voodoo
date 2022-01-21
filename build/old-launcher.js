"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OldLaunchInstance = exports.OldLauncher = void 0;
const net = require("net");
const path = require("path");
const fs_1 = require("./fs");
const config_1 = require("./config");
const events_1 = require("./events");
class OldLauncher {
    static async attach(wrapperId) {
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
exports.OldLauncher = OldLauncher;
class OldLaunchInstance extends events_1.TSEventEmitter {
    constructor(_wrapperId) {
        super();
        this._wrapperId = _wrapperId;
        this._interval = setInterval(() => this.tick(), 1000);
        this._stable = false;
    }
    get pid() {
        return {
            wrapperId: this._wrapperId,
        };
    }
    async tick() {
        try {
            await WrapperFinder.find(this._wrapperId);
            const wasStable = this._stable;
            this._stable = true;
            if (!wasStable) {
                console.log('Managed to connect to old launcher');
                this.emit('gameLaunched');
            }
            return true;
        }
        catch (err) {
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
exports.OldLaunchInstance = OldLaunchInstance;
class WrapperFinder {
    static async find(id) {
        let pidPath = path.join(config_1.Config.pid_dir, id);
        const port = await fs_1.default.readFile(pidPath, 'utf8');
        return new Promise((resolve, reject) => {
            let conn = net.connect({ port: parseInt(port, 10), host: '127.0.0.1' });
            conn
                .on('data', data => {
                let parsedData = data.toString().split(':');
                switch (parsedData[0]) {
                    case 'v0.0.1':
                    case 'v0.1.0':
                    case 'v0.2.0':
                    case 'v0.2.1':
                        if (parsedData[2] === id) {
                            resolve(parseInt(port, 10));
                        }
                        else {
                            reject(new Error(`Expecting wrapper id ${id}, received ${parsedData[2]}`));
                        }
                        break;
                }
                conn.end();
            })
                .on('end', () => {
                reject(new Error('Connection to wrapper ended before we got any info'));
            })
                .on('error', (err) => {
                reject(new Error('Got an error in the connection: ' + err.message));
            });
        });
    }
}
