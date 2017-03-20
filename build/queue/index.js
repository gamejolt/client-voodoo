"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var stream_speed_1 = require("../downloader/stream-speed");
var _ = require("lodash");
var VoodooQueue = (function () {
    function VoodooQueue() {
    }
    VoodooQueue.log = function (message, patch) {
        var state = patch ? this._patches.get(patch) : null;
        console.log('Voodoo Queue: ' + message + (state ? (' ( ' + JSON.stringify({
            queued: state.queued,
            timeLeft: state.timeLeft,
            managed: state.managed,
        }) + ' )') : ''));
    };
    VoodooQueue.reset = function (cancel) {
        this.log('Restting ' + this._patches.size + ' patches');
        var patchesToReset = [];
        var values = [];
        this._patches.forEach(function (key, patch) { return values.push(patch); });
        for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
            var patch = values_1[_i];
            this.unmanage(patch, true);
            patchesToReset.push(patch);
        }
        this._maxDownloads = this._fastProfile.downloads;
        this._maxExtractions = this._fastProfile.extractions;
        this._settingDownloads = false;
        this._settingExtractions = false;
        this._patches.clear();
        return Promise.all(patchesToReset.map(function (patch) { return cancel ? patch.cancel() : patch.stop(); }));
    };
    VoodooQueue.fetch = function (running, isDownloading) {
        this.log('Fetching ' + (running ? 'running' : 'pending') + ' ' + (isDownloading ? 'downloading' : (isDownloading === false ? 'patching' : 'all')) + ' tasks');
        var patches = [];
        this._patches.forEach(function (patchState, patch) {
            if (running !== patchState.queued &&
                (typeof isDownloading !== 'boolean' ||
                    isDownloading === patch.isDownloading())) {
                patches.push({
                    patch: patch,
                    state: patchState,
                    sort: (patchState.timeLeft || patchState.timeLeft === 0) ? patchState.timeLeft : Infinity,
                });
            }
        });
        var sorted = _.sortBy(patches, 'sort');
        var sortedPatches = sorted.map(function (value) {
            return {
                patch: value.patch,
                state: value.state,
            };
        });
        return sortedPatches;
    };
    VoodooQueue.applyProfile = function (profile) {
        this._maxDownloads = profile.downloads;
        this._maxExtractions = profile.extractions;
        this.tick();
    };
    Object.defineProperty(VoodooQueue, "faster", {
        get: function () {
            return _.clone(this._fastProfile);
        },
        set: function (profile) {
            this._fastProfile = _.clone(profile);
            if (this._isFast) {
                this.applyProfile(this._fastProfile);
            }
        },
        enumerable: true,
        configurable: true
    });
    VoodooQueue.setFaster = function () {
        this.log('Applying faster profile');
        this._isFast = true;
        this.applyProfile(this._fastProfile);
    };
    Object.defineProperty(VoodooQueue, "slower", {
        get: function () {
            return _.clone(this._slowProfile);
        },
        set: function (profile) {
            this._slowProfile = _.clone(profile);
            if (!this._isFast) {
                this.applyProfile(this._slowProfile);
            }
        },
        enumerable: true,
        configurable: true
    });
    VoodooQueue.setSlower = function () {
        this.log('Applying slower profile');
        this._isFast = false;
        this.applyProfile(this._slowProfile);
    };
    VoodooQueue.onProgress = function (patch, state, progress) {
        if (!state.managed) {
            return;
        }
        state.timeLeft = progress.timeLeft;
    };
    VoodooQueue.onPatching = function (patch, state, progress) {
        if (!state.managed) {
            return;
        }
        this.log('Received patch unpacking', patch);
        var concurrentPatches = this.fetch(true, false);
        // Use > and not >= because also counting self
        if (this._maxExtractions >= 0 && concurrentPatches.length > this._maxExtractions) {
            this.pausePatch(patch, state);
        }
        this.tick(true);
    };
    VoodooQueue.onExtractProgress = function (patch, state, progress) {
        if (!state.managed) {
            return;
        }
        state.timeLeft = progress.timeLeft;
    };
    VoodooQueue.onPaused = function (patch, state, voodooQueue) {
        if (!state.managed) {
            return;
        }
        this.log('Received patch paused', patch);
        if (voodooQueue) {
            state.queued = true;
        }
        else {
            this.unmanage(patch);
        }
    };
    VoodooQueue.onResumed = function (patch, state, voodooQueue) {
        if (!state.managed) {
            return;
        }
        this.log('Received patch resumed', patch);
        state.queued = false;
    };
    VoodooQueue.onCanceled = function (patch, state) {
        if (!state.managed) {
            return;
        }
        this.log('Received patch cancel', patch);
        this.unmanage(patch);
    };
    VoodooQueue.canResume = function (patch) {
        var isDownloading = patch.isDownloading();
        var operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
        var concurrentPatches = this.fetch(true, isDownloading);
        this.log('Checking if patch can resume a ' + (isDownloading ? 'download' : 'patch') + ' operation');
        this.log('Queue manager is currently handling: ' + concurrentPatches.length + ' concurrent operations and can handle: ' + (operationLimit === -1 ? 'Infinite' : operationLimit) + ' operations');
        return operationLimit < 0 || operationLimit > concurrentPatches.length;
    };
    VoodooQueue.manage = function (patch) {
        var _this = this;
        if (this._patches.has(patch)) {
            this.log('Already managing this patch');
            return this._patches.get(patch);
        }
        this.log('Managing patch handle');
        if (patch.isFinished()) {
            this.log('Refusing to manage a finished patch');
            return null;
        }
        var queued = !this.canResume(patch);
        var state = {
            queued: queued,
            timeLeft: Infinity,
            managed: true,
            events: {},
        };
        state.events.onProgress = this.onProgress.bind(this, patch, state);
        state.events.onPatching = this.onPatching.bind(this, patch, state);
        state.events.onExtractProgress = this.onExtractProgress.bind(this, patch, state);
        state.events.onPaused = this.onPaused.bind(this, patch, state);
        state.events.onResumed = this.onResumed.bind(this, patch, state);
        state.events.onCanceled = this.onCanceled.bind(this, patch, state);
        this._patches.set(patch, state);
        patch
            .onProgress(stream_speed_1.SampleUnit.KBps, state.events.onProgress)
            .onPatching(state.events.onPatching)
            .onExtractProgress(stream_speed_1.SampleUnit.KBps, state.events.onExtractProgress)
            .onPaused(state.events.onPaused)
            .onResumed(state.events.onResumed)
            .onCanceled(state.events.onCanceled)
            .promise
            .then(function () {
            if (!state.managed) {
                return;
            }
            _this.log('Finished', patch);
            _this.unmanage(patch);
        })
            .catch(function (err) {
            if (!state.managed) {
                return;
            }
            _this.log('Finished with error: ' + err.message, patch);
            _this.unmanage(patch);
        });
        if (state.queued) {
            this.pausePatch(patch, state);
        }
        return state;
    };
    VoodooQueue.unmanage = function (patch, noTick) {
        this.log('Unmanaging', patch);
        var state = this._patches.get(patch);
        if (!state) {
            return;
        }
        patch
            .deregisterOnProgress(state.events.onProgress)
            .deregisterOnPatching(state.events.onPatching)
            .deregisterOnExtractProgress(state.events.onExtractProgress)
            .deregisterOnPaused(state.events.onPaused)
            .deregisterOnResumed(state.events.onResumed)
            .deregisterOnCanceled(state.events.onCanceled);
        state.managed = false;
        this._patches.delete(patch);
        if (!noTick) {
            this.tick();
        }
    };
    VoodooQueue.resumePatch = function (patch, state) {
        this.log('Resuming patch', patch);
        var result;
        try {
            patch.start({ voodooQueue: true });
        }
        catch (err) {
            result = false;
        }
        return result;
    };
    VoodooQueue.pausePatch = function (patch, state) {
        this.log('Pausing patch', patch);
        var result;
        try {
            patch.stop({ voodooQueue: true });
        }
        catch (err) {
            result = false;
        }
        return result;
    };
    VoodooQueue.tick = function (downloads) {
        if (typeof downloads !== 'boolean') {
            this.tick(false);
            this.tick(true);
            return;
        }
        var running = this.fetch(true, downloads);
        var pending = this.fetch(false, downloads);
        this.log('Ticking ' + (downloads ? 'downloads' : 'extractions') + '. Running: ' + running.length + ', Pending: ' + pending.length);
        var limit = downloads ? this._maxDownloads : this._maxExtractions;
        var patchesToResume = limit - running.length;
        if (limit < 0 || patchesToResume > 0) {
            patchesToResume = limit < 0 ? pending.length : Math.min(patchesToResume, pending.length);
            this.log('Resuming ' + patchesToResume + ' patches');
            for (var i = 0; i < patchesToResume; i += 1) {
                this.resumePatch(pending[i].patch, pending[i].state);
            }
        }
        else if (patchesToResume < 0) {
            var patchesToPause = -patchesToResume;
            this.log('Pausing ' + patchesToPause + ' patches');
            for (var i = 0; i < patchesToPause; i += 1) {
                this.pausePatch(running[i].patch, running[i].state);
            }
        }
    };
    Object.defineProperty(VoodooQueue, "maxDownloads", {
        get: function () {
            return this._maxDownloads;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VoodooQueue, "maxExtractions", {
        get: function () {
            return this._maxExtractions;
        },
        enumerable: true,
        configurable: true
    });
    VoodooQueue.setMaxDownloads = function (newMaxDownloads) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('Setting max downloads to ' + newMaxDownloads);
                        if (this._settingDownloads) {
                            this.log('Can\'t set max downloads now because theres a setting in progress');
                            return [2 /*return*/, false];
                        }
                        this._settingDownloads = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        this._maxDownloads = newMaxDownloads;
                        // Wait for next tick in case states change inside a patcher's onPause/onResume.
                        // Example: when a patcher is pended by the queue manager it calls the patch handle's onPause event (as part of stopping it)
                        // If in that event handler the max download count increases the task will not resume because the queue manager has yet
                        // to tag it as pending because it's waiting for it to stop completely, which only happens after onPause is called
                        return [4 /*yield*/, new Promise(function (resolve) { return process.nextTick(resolve); })];
                    case 2:
                        // Wait for next tick in case states change inside a patcher's onPause/onResume.
                        // Example: when a patcher is pended by the queue manager it calls the patch handle's onPause event (as part of stopping it)
                        // If in that event handler the max download count increases the task will not resume because the queue manager has yet
                        // to tag it as pending because it's waiting for it to stop completely, which only happens after onPause is called
                        _a.sent();
                        this.tick(true);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 4:
                        this._settingDownloads = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/, true];
                }
            });
        });
    };
    VoodooQueue.setMaxExtractions = function (newMaxExtractions) {
        return __awaiter(this, void 0, void 0, function () {
            var err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('Setting max extraccions to ' + newMaxExtractions);
                        if (this._settingExtractions) {
                            this.log('Can\'t set max extractions now because theres a setting in progress');
                            return [2 /*return*/, false];
                        }
                        this._settingExtractions = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        this._maxExtractions = newMaxExtractions;
                        return [4 /*yield*/, new Promise(function (resolve) { return process.nextTick(resolve); })];
                    case 2:
                        _a.sent();
                        this.tick(false);
                        return [3 /*break*/, 5];
                    case 3:
                        err_2 = _a.sent();
                        return [2 /*return*/, false];
                    case 4:
                        this._settingExtractions = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/, true];
                }
            });
        });
    };
    return VoodooQueue;
}());
VoodooQueue._isFast = true;
VoodooQueue._fastProfile = {
    downloads: 3,
    extractions: 3,
};
VoodooQueue._slowProfile = {
    downloads: 0,
    extractions: 0,
};
VoodooQueue._maxDownloads = VoodooQueue._fastProfile.downloads;
VoodooQueue._maxExtractions = VoodooQueue._fastProfile.extractions;
VoodooQueue._settingDownloads = false;
VoodooQueue._settingExtractions = false;
VoodooQueue._patches = new Map();
exports.VoodooQueue = VoodooQueue;
//# sourceMappingURL=index.js.map