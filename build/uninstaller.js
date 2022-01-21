"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UninstallInstance = exports.UninstallState = exports.Uninstaller = void 0;
const controller_1 = require("./controller");
const util = require("./util");
const data = require("./data");
const controller_wrapper_1 = require("./controller-wrapper");
class Uninstaller {
    static async uninstall(localPackage) {
        const dir = localPackage.install_dir;
        const port = await util.findFreePort();
        const args = [
            '--port',
            port.toString(),
            '--dir',
            dir,
            '--wait-for-connection',
            '2',
            '--symbiote',
            '--no-self-update',
            'uninstall',
        ];
        await controller_1.Controller.ensureMigrationFile(localPackage);
        const controller = await controller_1.Controller.launchNew(args);
        return new UninstallInstance(controller);
    }
    static async uninstallReattach(port, pid) {
        return new UninstallInstance(new controller_1.Controller(port, { process: pid }));
    }
}
exports.Uninstaller = Uninstaller;
var UninstallState;
(function (UninstallState) {
    UninstallState[UninstallState["Starting"] = 0] = "Starting";
    UninstallState[UninstallState["Uninstalling"] = 1] = "Uninstalling";
    UninstallState[UninstallState["Finished"] = 2] = "Finished";
})(UninstallState = exports.UninstallState || (exports.UninstallState = {}));
class UninstallInstance extends controller_wrapper_1.ControllerWrapper {
    constructor(controller) {
        super(controller);
        this.on('patcherState', (state) => {
            const oldState = this._state;
            this._state = this._getState(state);
            // Only emit state if it's changed
            if (oldState !== this._state) {
                this.controller.emit('state', this._state);
            }
        });
        this._state = UninstallState.Starting;
        this._isPaused = false;
        this.getState().then(() => {
            if (this._isPaused) {
                this.controller.sendResume();
            }
        });
    }
    async getState() {
        const state = await this.controller.sendGetState(false);
        this._isPaused = state.isPaused;
        this._state = this._getState(state.patcherState);
    }
    _getState(state) {
        switch (state) {
            case data.PatcherState.Start:
            case data.PatcherState.Preparing:
                return UninstallState.Starting;
            case data.PatcherState.Uninstall:
                return UninstallState.Uninstalling;
            case data.PatcherState.Finished:
                return UninstallState.Finished;
            default:
                throw new Error('Invalid state received: ' + state);
        }
    }
    get state() {
        return this._state;
    }
    isFinished() {
        return this._state === UninstallState.Finished;
    }
    isRunning() {
        return !this._isPaused;
    }
}
exports.UninstallInstance = UninstallInstance;
