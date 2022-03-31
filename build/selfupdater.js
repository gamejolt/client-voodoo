"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfUpdaterInstance = exports.SelfUpdater = void 0;
const fs_1 = require("./fs");
const controller_1 = require("./controller");
const controller_wrapper_1 = require("./controller-wrapper");
class SelfUpdater {
    static async attach(manifestFile) {
        const manifestStr = await fs_1.default.readFile(manifestFile, 'utf8');
        const manifest = JSON.parse(manifestStr);
        if (!manifest.runningInfo) {
            throw new Error(`Manifest doesn't have a running info, cannot connect to self updater`);
        }
        const controller = new controller_1.Controller(manifest.runningInfo.port, {
            process: manifest.runningInfo.pid,
            keepConnected: true,
        });
        controller.connect();
        return new SelfUpdaterInstance(controller);
    }
}
exports.SelfUpdater = SelfUpdater;
class SelfUpdaterInstance extends controller_wrapper_1.ControllerWrapper {
    constructor(controller) {
        super(controller);
    }
    async checkForUpdates(options) {
        options = options || {};
        const result = await this.controller.sendCheckForUpdates('', '', options.authToken, options.metadata);
        return result.success;
    }
    async updateBegin() {
        const result = await this.controller.sendUpdateBegin();
        return result.success;
    }
    async updateApply() {
        const result = await this.controller.sendUpdateApply(process.env, process.argv.slice(2));
        return result.success;
    }
}
exports.SelfUpdaterInstance = SelfUpdaterInstance;
