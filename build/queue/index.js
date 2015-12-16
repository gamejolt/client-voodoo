"use strict";

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

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
        key: "reset",
        value: function reset() {
            console.log('Resetting');
            var patchesToReset = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this._patches.keys()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var patch = _step.value;

                    this.dequeue(patch);
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

            console.log('Restting ' + patchesToReset.length + ' patches');
            this._maxDownloads = 3;
            this._maxExtractions = 3;
            this._settingDownloads = false;
            this._settingExtractions = false;
            this._patches.clear();
            return _promise2.default.all(patchesToReset.map(function (patch) {
                return patch.cancel();
            }));
        }
    }, {
        key: "fetch",
        value: function fetch(running, isDownloading) {
            console.log('Fetching ' + (running ? 'running' : 'pending') + ' ' + (isDownloading ? 'downloading' : isDownloading === false ? 'patching' : 'all') + ' tasks');
            var patches = [];
            this._patches.forEach(function (patchState, patch) {
                if (running !== patchState.queued && (typeof isDownloading !== 'boolean' || isDownloading === patch.isDownloading())) {
                    patches.push({
                        patch: patch,
                        state: patchState,
                        sort: patchState.timeLeft
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
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                this._maxDownloads = this._fastProfile.downloads;
                                this._maxExtractions = this._fastProfile.extractions;
                                _context.next = 4;
                                return this.tick();

                            case 4:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "faster",
        value: function faster() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                this.applyProfile(this._fastProfile);

                            case 1:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "slower",
        value: function slower() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                this.applyProfile(this._slowProfile);

                            case 1:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "log",
        value: function log(patch, message) {
            var state = this._patches.get(patch);
            console.log('Voodoo Queue: ' + message + ' ( ' + (0, _stringify2.default)(state) + ' )');
        }
    }, {
        key: "onProgress",
        value: function onProgress(patch, state, progress) {
            state.timeLeft = progress.timeLeft;
            this.log(patch, 'Updated time left');
        }
    }, {
        key: "onPatching",
        value: function onPatching(patch, state, progress) {
            this.log(patch, 'Patching');
            var concurrentPatches = this.fetch(true, false);
            // Use > and not >= because also counting self
            if (concurrentPatches.length > this._maxExtractions) {
                this.pausePatch(patch, state);
            }
        }
    }, {
        key: "onExtractProgress",
        value: function onExtractProgress(patch, state, progress) {
            state.timeLeft = progress.timeLeft;
            this.log(patch, 'Updated time left');
        }
    }, {
        key: "onPaused",
        value: function onPaused(patch, state) {
            this.log(patch, 'Paused');
            if (state && !state.expectingManagement) {
                this.dequeue(patch);
            }
        }
    }, {
        key: "onResumed",
        value: function onResumed(patch, state) {
            this.log(patch, 'Resumed');
            console.log(state);
            if (!state.expectingManagement) {
                this.dequeue(patch);
            }
        }
    }, {
        key: "onCanceled",
        value: function onCanceled(patch, state) {
            this.log(patch, 'Cancelled');
            this.dequeue(patch);
        }
    }, {
        key: "enqueue",
        value: function enqueue(patch) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                var _this = this;

                var isDownloading, operationLimit, concurrentPatches, state;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                if (!patch.isFinished()) {
                                    _context4.next = 2;
                                    break;
                                }

                                return _context4.abrupt("return", null);

                            case 2:
                                isDownloading = patch.isDownloading();
                                operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
                                concurrentPatches = this.fetch(true, isDownloading);
                                state = {
                                    queued: concurrentPatches.length >= operationLimit,
                                    expectingManagement: 0,
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
                                    _this.log(patch, 'Finished');
                                    _this.dequeue(patch);
                                });

                                if (!state.queued) {
                                    _context4.next = 17;
                                    break;
                                }

                                _context4.next = 17;
                                return this.pausePatch(patch, state);

                            case 17:
                                this.log(patch, 'Enqueued a patch');
                                return _context4.abrupt("return", state);

                            case 19:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "dequeue",
        value: function dequeue(patch) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                var state;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                this.log(patch, 'Dequeueing');
                                state = this._patches.get(patch);

                                if (state) {
                                    _context5.next = 4;
                                    break;
                                }

                                return _context5.abrupt("return");

                            case 4:
                                this.log(patch, 'Deregistering events');
                                patch.deregisterOnProgress(state.events.onProgress).deregisterOnPatching(state.events.onPatching).deregisterOnExtractProgress(state.events.onExtractProgress).deregisterOnPaused(state.events.onPaused).deregisterOnResumed(state.events.onResumed).deregisterOnCanceled(state.events.onCanceled);
                                state.managed = false;
                                this._patches.delete(patch);
                                _context5.next = 10;
                                return this.tick();

                            case 10:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: "resumePatch",
        value: function resumePatch(patch, state) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee6() {
                var result;
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                this.log(patch, 'Resuming patch');
                                state.expectingManagement += 1;
                                result = undefined;
                                _context6.prev = 3;

                                console.log('Expecting management');
                                _context6.next = 7;
                                return patch.start();

                            case 7:
                                result = _context6.sent;

                                if (result) {
                                    state.queued = false;
                                }
                                _context6.next = 14;
                                break;

                            case 11:
                                _context6.prev = 11;
                                _context6.t0 = _context6["catch"](3);

                                result = false;

                            case 14:
                                console.log('Not expecting management');
                                state.expectingManagement = Math.max(state.expectingManagement - 1, 0);
                                return _context6.abrupt("return", result);

                            case 17:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this, [[3, 11]]);
            }));
        }
    }, {
        key: "pausePatch",
        value: function pausePatch(patch, state) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee7() {
                var result;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                this.log(patch, 'Pausing patch');
                                state.expectingManagement += 1;
                                result = undefined;
                                _context7.prev = 3;
                                _context7.next = 6;
                                return patch.stop();

                            case 6:
                                result = _context7.sent;

                                if (result) {
                                    state.queued = true;
                                }
                                _context7.next = 13;
                                break;

                            case 10:
                                _context7.prev = 10;
                                _context7.t0 = _context7["catch"](3);

                                result = false;

                            case 13:
                                state.expectingManagement = Math.max(state.expectingManagement - 1, 0);
                                return _context7.abrupt("return", result);

                            case 15:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this, [[3, 10]]);
            }));
        }
    }, {
        key: "tick",
        value: function tick(downloads) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee8() {
                var running, pending, patchesToResume, i, patchesToPause;
                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                if (!(typeof downloads !== 'boolean')) {
                                    _context8.next = 6;
                                    break;
                                }

                                _context8.next = 3;
                                return this.tick(false);

                            case 3:
                                _context8.next = 5;
                                return this.tick(true);

                            case 5:
                                return _context8.abrupt("return");

                            case 6:
                                running = this.fetch(true, downloads);
                                pending = this.fetch(false, downloads);

                                console.log('Running: ' + running.length + ', Pending: ' + pending.length);
                                patchesToResume = (downloads ? this._maxDownloads : this._maxExtractions) - running.length;

                                if (!(patchesToResume > 0)) {
                                    _context8.next = 22;
                                    break;
                                }

                                patchesToResume = Math.min(patchesToResume, pending.length);
                                console.log('Patches to resume: ' + patchesToResume);
                                i = 0;

                            case 14:
                                if (!(i < patchesToResume)) {
                                    _context8.next = 20;
                                    break;
                                }

                                _context8.next = 17;
                                return this.resumePatch(pending[i].patch, pending[i].state);

                            case 17:
                                i += 1;
                                _context8.next = 14;
                                break;

                            case 20:
                                _context8.next = 32;
                                break;

                            case 22:
                                if (!(patchesToResume < 0)) {
                                    _context8.next = 32;
                                    break;
                                }

                                patchesToPause = -patchesToResume;

                                console.log('Patches to pause: ' + patchesToPause);
                                i = 0;

                            case 26:
                                if (!(i < patchesToPause)) {
                                    _context8.next = 32;
                                    break;
                                }

                                _context8.next = 29;
                                return this.pausePatch(running[i].patch, running[i].state);

                            case 29:
                                i += 1;
                                _context8.next = 26;
                                break;

                            case 32:
                            case "end":
                                return _context8.stop();
                        }
                    }
                }, _callee8, this);
            }));
        }
    }, {
        key: "setMaxDownloads",
        value: function setMaxDownloads(newMaxDownloads) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee9() {
                return _regenerator2.default.wrap(function _callee9$(_context9) {
                    while (1) {
                        switch (_context9.prev = _context9.next) {
                            case 0:
                                console.log('Setting max downloads');

                                if (!this._settingDownloads) {
                                    _context9.next = 4;
                                    break;
                                }

                                console.log('Nope');
                                return _context9.abrupt("return", false);

                            case 4:
                                this._settingDownloads = true;
                                _context9.prev = 5;

                                this._maxDownloads = newMaxDownloads;
                                // Wait for next tick in case states change inside a patcher's onPause/onResume.
                                // Example: when a patcher is pended by the queue manager it calls the patch handle's onPause event (as part of stopping it)
                                // If in that event handler the max download count increases the task will not resume because the queue manager has yet
                                // to tag it as pending because it's waiting for it to stop completely, which only happens after onPause is called
                                _context9.next = 9;
                                return new _promise2.default(function (resolve) {
                                    return process.nextTick(resolve);
                                });

                            case 9:
                                _context9.next = 11;
                                return this.tick(true);

                            case 11:
                                _context9.prev = 11;

                                this._settingDownloads = false;
                                return _context9.finish(11);

                            case 14:
                            case "end":
                                return _context9.stop();
                        }
                    }
                }, _callee9, this, [[5,, 11, 14]]);
            }));
        }
    }, {
        key: "setMaxExtractions",
        value: function setMaxExtractions(newMaxExtractions) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee10() {
                return _regenerator2.default.wrap(function _callee10$(_context10) {
                    while (1) {
                        switch (_context10.prev = _context10.next) {
                            case 0:
                                if (!this._settingExtractions) {
                                    _context10.next = 2;
                                    break;
                                }

                                return _context10.abrupt("return", false);

                            case 2:
                                this._settingExtractions = true;
                                _context10.prev = 3;

                                this._maxExtractions = newMaxExtractions;
                                _context10.next = 7;
                                return new _promise2.default(function (resolve) {
                                    return process.nextTick(resolve);
                                });

                            case 7:
                                _context10.next = 9;
                                return this.tick(false);

                            case 9:
                                _context10.prev = 9;

                                this._settingExtractions = false;
                                return _context10.finish(9);

                            case 12:
                            case "end":
                                return _context10.stop();
                        }
                    }
                }, _callee10, this, [[3,, 9, 12]]);
            }));
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

VoodooQueue._fastProfile = {
    downloads: 3,
    extractions: 3
};
VoodooQueue._slowProfile = {
    downloads: 3,
    extractions: 3
};
VoodooQueue._maxDownloads = 3;
VoodooQueue._maxExtractions = 3;
VoodooQueue._settingDownloads = false;
VoodooQueue._settingExtractions = false;
VoodooQueue._patches = new _map2.default();
exports.VoodooQueue = VoodooQueue;
//# sourceMappingURL=index.js.map
