"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutexInstance = exports.Mutex = void 0;
const controller_1 = require("./controller");
const util = require("./util");
class Mutex {
    static async create(name) {
        const port = await util.findFreePort();
        const args = [
            '--port',
            port.toString(),
            '--wait-for-connection',
            '20',
            '--symbiote',
            '--mutex',
            name,
            '--no-self-update',
            'noop',
        ];
        const controller = await controller_1.Controller.launchNew(args);
        return new MutexInstance(controller);
    }
}
exports.Mutex = Mutex;
class MutexInstance {
    constructor(controller) {
        this.controller = controller;
        this.releasePromise = new Promise(resolve => {
            this.controller.on('fatal', resolve);
        });
    }
    release() {
        return this.controller.kill().then(() => this.releasePromise);
    }
    get onReleased() {
        return this.releasePromise;
    }
}
exports.MutexInstance = MutexInstance;
