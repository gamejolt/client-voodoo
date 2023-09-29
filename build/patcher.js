"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatchInstance = exports.State = exports.Patcher = void 0;
// import * as config from 'config';
const controller_1 = require("./controller");
const util = require("./util");
const data = require("./data");
const config_1 = require("./config");
const controller_wrapper_1 = require("./controller-wrapper");
const queue_1 = require("./queue");
class Patcher {
    /**
     * Starts a new installation/update, or resumes the operation if it was closed prematurely.
     * If the game is already managed by another joltron instance, joltron will send back an abort message and terminate itself.
     * client voodoo will re-emit this as a fatal error.
     *
     * This function returns immediately after launching the joltron executable.
     *
     * @param localPackage
     * @param getAuthToken a callback that joltron will use to fetch a new game api token for the package it's patching.
     * @param options
     */
    static async patch(localPackage, getAuthToken, options) {
        options = options || {};
        const dir = localPackage.install_dir;
        const port = await util.findFreePort();
        const gameUid = localPackage.update
            ? `${localPackage.update.id}-${localPackage.update.build.id}`
            : `${localPackage.id}-${localPackage.build.id}`;
        const args = [
            '--port',
            port.toString(),
            '--dir',
            dir,
            '--game',
            gameUid,
            '--platform-url',
            config_1.Config.domain + '/x/updater/check-for-updates',
            '--wait-for-connection',
            '20',
            '--symbiote',
            '--no-loader',
            '--no-self-update',
        ];
        if (options.authToken) {
            args.push('--auth-token', options.authToken);
        }
        if (options.runLater) {
            args.push('--launch');
        }
        args.push('install');
        // As far as joltron is concerned, an installation can also be an update, therefore it might need the migration file.
        await controller_1.Controller.ensureMigrationFile(localPackage);
        const controller = await controller_1.Controller.launchNew(args);
        return this.manageInstanceInQueue(new PatchInstance(controller, getAuthToken));
    }
    static async patchReattach(port, pid, authTokenGetter) {
        return this.manageInstanceInQueue(new PatchInstance(new controller_1.Controller(port, { process: pid }), authTokenGetter));
    }
    static manageInstanceInQueue(instance) {
        // Queue.manage(instance);
        instance.on('resumed', () => {
            queue_1.Queue.manage(instance);
        });
        return instance;
    }
}
exports.Patcher = Patcher;
var State;
(function (State) {
    State[State["Starting"] = 0] = "Starting";
    State[State["Downloading"] = 1] = "Downloading";
    State[State["Patching"] = 2] = "Patching";
    State[State["Finished"] = 3] = "Finished";
})(State = exports.State || (exports.State = {}));
class PatchInstance extends controller_wrapper_1.ControllerWrapper {
    constructor(controller, authTokenGetter) {
        super(controller);
        this.authTokenGetter = authTokenGetter;
        this.on('patcherState', (state) => {
            console.log('patcher got state: ' + state);
            const oldState = this._state;
            this._state = this._getState(state);
            // Only emit state if it's changed
            if (oldState !== this._state) {
                console.log('patcher emitting state: ' + this._state);
                this.controller.emit('state', this._state);
            }
        })
            .on('updateFailed', reason => {
            // If the update was canceled the 'context canceled' will be emitted as the updateFailed reason.
            if (reason === 'context canceled') {
                return;
            }
            this.controller.emit('done', reason);
        })
            .on('updateFinished', () => {
            this.controller.emit('done');
        });
        this._state = State.Starting;
        this._isPaused = false;
        this.getState().then(() => {
            queue_1.Queue.manage(this);
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
                return State.Starting;
            case data.PatcherState.Download:
            case data.PatcherState.UpdateReady: // not really considered downloading, but it is the step right before extracting.
                return State.Downloading;
            case data.PatcherState.PrepareExtract:
            case data.PatcherState.Extract:
            case data.PatcherState.Cleanup:
                return State.Patching;
            case data.PatcherState.Finished:
                return State.Finished;
            default:
                throw new Error('Invalid state received: ' + state);
        }
    }
    get state() {
        return this._state;
    }
    isDownloading() {
        return this._state === State.Starting || this._state === State.Downloading;
    }
    isPatching() {
        return this._state === State.Patching;
    }
    isFinished() {
        return this._state === State.Finished;
    }
    isRunning() {
        return !this._isPaused;
    }
    getAuthToken() {
        return this.authTokenGetter();
    }
    async resume(options) {
        options = options || {};
        if (!options.authToken &&
            (this._state === State.Starting || this._state === State.Downloading)) {
            options.authToken = await this.authTokenGetter();
        }
        const result = await this.controller.sendResume(options);
        if (result.success) {
            this._isPaused = false;
        }
        return result;
    }
    async pause(queue) {
        const result = await this.controller.sendPause({ queue: !!queue });
        if (result.success) {
            this._isPaused = true;
        }
        return result;
    }
    cancel(waitOnlyForSend) {
        return this.controller.sendCancel(undefined, waitOnlyForSend);
    }
}
exports.PatchInstance = PatchInstance;
