"use strict";

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var stream_speed_1 = require('../downloader/stream-speed');
var _ = require('lodash');

var VoodooQueue = (function () {
    function VoodooQueue() {
        (0, _classCallCheck3.default)(this, VoodooQueue);
    }

    (0, _createClass3.default)(VoodooQueue, null, [{
        key: "log",
        value: function log(message, patch) {
            var state = patch ? this._patches.get(patch) : null;
            console.log('Voodoo Queue: ' + message + (state ? ' ( ' + (0, _stringify2.default)(state) + ' )' : ''));
        }
    }, {
        key: "reset",
        value: function reset(cancel) {
            this.log('Resetting');
            var patchesToReset = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this._patches.keys()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var patch = _step.value;

                    this.unmanage(patch);
                    patchesToReset.push(patch);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.log('Restting ' + patchesToReset.length + ' patches');
            this._maxDownloads = this._fastProfile.downloads;
            this._maxExtractions = this._fastProfile.extractions;
            this._settingDownloads = false;
            this._settingExtractions = false;
            this._patches.clear();
            return _promise2.default.all(patchesToReset.map(function (patch) {
                return cancel ? patch.cancel() : patch.stop();
            }));
        }
    }, {
        key: "fetch",
        value: function fetch(running, isDownloading) {
            this.log('Fetching ' + (running ? 'running' : 'pending') + ' ' + (isDownloading ? 'downloading' : isDownloading === false ? 'patching' : 'all') + ' tasks');
            var patches = [];
            this._patches.forEach(function (patchState, patch) {
                if (running !== patchState.queued && (typeof isDownloading !== 'boolean' || isDownloading === patch.isDownloading())) {
                    patches.push({
                        patch: patch,
                        state: patchState,
                        sort: patchState.timeLeft || patchState.timeLeft === 0 ? patchState.timeLeft : Infinity
                    });
                }
            });
            var sorted = _.sortBy(patches, 'sort');
            var sortedPatches = sorted.map(function (value) {
                return {
                    patch: value.patch,
                    state: value.state
                };
            });
            return sortedPatches;
        }
    }, {
        key: "applyProfile",
        value: function applyProfile(profile) {
            this._maxDownloads = profile.downloads;
            this._maxExtractions = profile.extractions;
            this.tick();
        }
    }, {
        key: "setFaster",
        value: function setFaster() {
            this.log('Applying faster profile');
            this._isFast = true;
            this.applyProfile(this._fastProfile);
        }
    }, {
        key: "setSlower",
        value: function setSlower() {
            this.log('Applying slower profile');
            this._isFast = false;
            this.applyProfile(this._slowProfile);
        }
    }, {
        key: "onProgress",
        value: function onProgress(patch, state, progress) {
            state.timeLeft = progress.timeLeft;
            this.log('Updated download time left', patch);
        }
    }, {
        key: "onPatching",
        value: function onPatching(patch, state, progress) {
            this.log('Received patch unpacking', patch);
            var concurrentPatches = this.fetch(true, false);
            // Use > and not >= because also counting self
            if (concurrentPatches.length > this._maxExtractions) {
                this.pausePatch(patch, state);
            }
            this.tick(true);
        }
    }, {
        key: "onExtractProgress",
        value: function onExtractProgress(patch, state, progress) {
            state.timeLeft = progress.timeLeft;
            this.log('Updated unpack time left', patch);
        }
    }, {
        key: "onPaused",
        value: function onPaused(patch, state, voodooQueue) {
            this.log('Received patch paused', patch);
            if (state) {
                if (voodooQueue) {
                    state.queued = true;
                } else {
                    this.unmanage(patch);
                }
            }
        }
    }, {
        key: "onResumed",
        value: function onResumed(patch, state, voodooQueue) {
            this.log('Received patch resumed', patch);
            if (state) {
                state.queued = false;
            }
        }
    }, {
        key: "onCanceled",
        value: function onCanceled(patch, state) {
            this.log('Received patch cancel', patch);
            this.unmanage(patch);
        }
    }, {
        key: "canResume",
        value: function canResume(patch) {
            this.log('Checking if patch can resume');
            var isDownloading = patch.isDownloading();
            var operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
            var concurrentPatches = this.fetch(true, isDownloading);
            this.log('Patch to manage is currently: ' + (isDownloading ? 'Downloading' : 'Patching'));
            this.log('Queue manager is currently handling: ' + concurrentPatches.length + ' concurrent operations and can handle: ' + (operationLimit === -1 ? 'Infinite' : operationLimit) + ' operations');
            return operationLimit < 0 || operationLimit > concurrentPatches.length;
        }
    }, {
        key: "manage",
        value: function manage(patch) {
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
                events: {}
            };
            state.events.onProgress = this.onProgress.bind(this, patch, state);
            state.events.onPatching = this.onPatching.bind(this, patch, state);
            state.events.onExtractProgress = this.onExtractProgress.bind(this, patch, state);
            state.events.onPaused = this.onPaused.bind(this, patch, state);
            state.events.onResumed = this.onResumed.bind(this, patch, state);
            state.events.onCanceled = this.onCanceled.bind(this, patch, state);
            this._patches.set(patch, state);
            patch.onProgress(stream_speed_1.SampleUnit.KBps, state.events.onProgress).onPatching(state.events.onPatching).onExtractProgress(stream_speed_1.SampleUnit.KBps, state.events.onExtractProgress).onPaused(state.events.onPaused).onResumed(state.events.onResumed).onCanceled(state.events.onCanceled).promise.then(function () {
                if (!state.managed) {
                    return;
                }
                _this.log('Finished', patch);
                _this.unmanage(patch);
            }).catch(function (err) {
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
        }
    }, {
        key: "unmanage",
        value: function unmanage(patch) {
            this.log('Unmanaging', patch);
            var state = this._patches.get(patch);
            if (!state) {
                return;
            }
            patch.deregisterOnProgress(state.events.onProgress).deregisterOnPatching(state.events.onPatching).deregisterOnExtractProgress(state.events.onExtractProgress).deregisterOnPaused(state.events.onPaused).deregisterOnResumed(state.events.onResumed).deregisterOnCanceled(state.events.onCanceled);
            state.managed = false;
            this._patches.delete(patch);
            this.tick();
        }
    }, {
        key: "resumePatch",
        value: function resumePatch(patch, state) {
            this.log('Resuming patch', patch);
            var result = undefined;
            try {
                patch.start({ voodooQueue: true });
            } catch (err) {
                result = false;
            }
            return result;
        }
    }, {
        key: "pausePatch",
        value: function pausePatch(patch, state) {
            this.log('Pausing patch', patch);
            var result = undefined;
            try {
                patch.stop({ voodooQueue: true });
            } catch (err) {
                result = false;
            }
            return result;
        }
    }, {
        key: "tick",
        value: function tick(downloads) {
            if (typeof downloads !== 'boolean') {
                this.tick(false);
                this.tick(true);
                return;
            }
            this.log('Ticking ' + (downloads ? 'downloads' : 'extractions'));
            var running = this.fetch(true, downloads);
            var pending = this.fetch(false, downloads);
            this.log('Running: ' + running.length + ', Pending: ' + pending.length);
            var limit = downloads ? this._maxDownloads : this._maxExtractions;
            var patchesToResume = limit - running.length;
            if (limit < 0 || patchesToResume > 0) {
                patchesToResume = limit < 0 ? pending.length : Math.min(patchesToResume, pending.length);
                this.log('Patches to resume: ' + patchesToResume);
                for (var i = 0; i < patchesToResume; i += 1) {
                    this.resumePatch(pending[i].patch, pending[i].state);
                }
            } else if (patchesToResume < 0) {
                var patchesToPause = -patchesToResume;
                this.log('Patches to pause: ' + patchesToPause);
                for (var i = 0; i < patchesToPause; i += 1) {
                    this.pausePatch(running[i].patch, running[i].state);
                }
            }
        }
    }, {
        key: "setMaxDownloads",
        value: function setMaxDownloads(newMaxDownloads) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                this.log('Setting max downloads to ' + newMaxDownloads);

                                if (!this._settingDownloads) {
                                    _context.next = 4;
                                    break;
                                }

                                this.log('Can\'t set max downloads now because theres a setting in progress');
                                return _context.abrupt("return", false);

                            case 4:
                                this._settingDownloads = true;
                                _context.prev = 5;

                                this._maxDownloads = newMaxDownloads;
                                // Wait for next tick in case states change inside a patcher's onPause/onResume.
                                // Example: when a patcher is pended by the queue manager it calls the patch handle's onPause event (as part of stopping it)
                                // If in that event handler the max download count increases the task will not resume because the queue manager has yet
                                // to tag it as pending because it's waiting for it to stop completely, which only happens after onPause is called
                                _context.next = 9;
                                return new _promise2.default(function (resolve) {
                                    return process.nextTick(resolve);
                                });

                            case 9:
                                this.tick(true);

                            case 10:
                                _context.prev = 10;

                                this._settingDownloads = false;
                                return _context.finish(10);

                            case 13:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[5,, 10, 13]]);
            }));
        }
    }, {
        key: "setMaxExtractions",
        value: function setMaxExtractions(newMaxExtractions) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                this.log('Setting max extraccions to ' + newMaxExtractions);

                                if (!this._settingExtractions) {
                                    _context2.next = 4;
                                    break;
                                }

                                this.log('Can\'t set max extractions now because theres a setting in progress');
                                return _context2.abrupt("return", false);

                            case 4:
                                this._settingExtractions = true;
                                _context2.prev = 5;

                                this._maxExtractions = newMaxExtractions;
                                _context2.next = 9;
                                return new _promise2.default(function (resolve) {
                                    return process.nextTick(resolve);
                                });

                            case 9:
                                this.tick(false);

                            case 10:
                                _context2.prev = 10;

                                this._settingExtractions = false;
                                return _context2.finish(10);

                            case 13:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[5,, 10, 13]]);
            }));
        }
    }, {
        key: "faster",
        get: function get() {
            return _.clone(this._fastProfile);
        },
        set: function set(profile) {
            this._fastProfile = _.clone(profile);
            if (this._isFast) {
                this.applyProfile(this._fastProfile);
            }
        }
    }, {
        key: "slower",
        get: function get() {
            return _.clone(this._slowProfile);
        },
        set: function set(profile) {
            this._slowProfile = _.clone(profile);
            if (!this._isFast) {
                this.applyProfile(this._slowProfile);
            }
        }
    }, {
        key: "maxDownloads",
        get: function get() {
            return this._maxDownloads;
        }
    }, {
        key: "maxExtractions",
        get: function get() {
            return this._maxExtractions;
        }
    }]);
    return VoodooQueue;
})();

VoodooQueue._isFast = true;
VoodooQueue._fastProfile = {
    downloads: 3,
    extractions: 3
};
VoodooQueue._slowProfile = {
    downloads: 0,
    extractions: 0
};
VoodooQueue._maxDownloads = VoodooQueue._fastProfile.downloads;
VoodooQueue._maxExtractions = VoodooQueue._fastProfile.extractions;
VoodooQueue._settingDownloads = false;
VoodooQueue._settingExtractions = false;
VoodooQueue._patches = new _map2.default();
exports.VoodooQueue = VoodooQueue;
//# sourceMappingURL=index.js.map
