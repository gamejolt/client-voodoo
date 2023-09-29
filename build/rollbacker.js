"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbackInstance = exports.RollbackState = exports.Rollbacker = void 0;
const controller_1 = require("./controller");
const util = require("./util");
const data = require("./data");
const controller_wrapper_1 = require("./controller-wrapper");
class Rollbacker {
    static async rollback(localPackage) {
        const dir = localPackage.install_dir;
        const port = await util.findFreePort();
        const args = [
            '--port',
            port.toString(),
            '--dir',
            dir,
            '--wait-for-connection',
            '20',
            '--symbiote',
            '--no-self-update',
            'rollback',
        ];
        const controller = await controller_1.Controller.launchNew(args);
        return new RollbackInstance(controller);
    }
    static async rollbackReattach(port, pid) {
        return new RollbackInstance(new controller_1.Controller(port, { process: pid }));
    }
}
exports.Rollbacker = Rollbacker;
var RollbackState;
(function (RollbackState) {
    RollbackState[RollbackState["Starting"] = 0] = "Starting";
    RollbackState[RollbackState["Rollback"] = 1] = "Rollback";
    RollbackState[RollbackState["Finished"] = 2] = "Finished";
})(RollbackState = exports.RollbackState || (exports.RollbackState = {}));
class RollbackInstance extends controller_wrapper_1.ControllerWrapper {
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
        this._state = RollbackState.Starting;
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
                return RollbackState.Starting;
            case data.PatcherState.Rollback:
                return RollbackState.Rollback;
            case data.PatcherState.Finished:
                return RollbackState.Finished;
            default:
                throw new Error('Invalid state received: ' + state);
        }
    }
    get state() {
        return this._state;
    }
    isFinished() {
        return this._state === RollbackState.Finished;
    }
    isRunning() {
        return !this._isPaused;
    }
}
exports.RollbackInstance = RollbackInstance;
