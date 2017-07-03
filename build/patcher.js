"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
// import * as config from 'config';
var controller_1 = require("./controller");
var util = require("./util");
var data = require("./data");
var config_1 = require("./config");
var controller_wrapper_1 = require("./controller-wrapper");
var queue_1 = require("./queue");
var Patcher = (function () {
    function Patcher() {
    }
    Patcher.patch = function (localPackage, getAuthToken, options) {
        return __awaiter(this, void 0, void 0, function () {
            var dir, port, gameUid, args;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = options || {};
                        dir = localPackage.install_dir;
                        return [4 /*yield*/, util.findFreePort()];
                    case 1:
                        port = _a.sent();
                        gameUid = localPackage.id + '-' + localPackage.build.id;
                        args = [
                            '--port',
                            port.toString(),
                            '--dir',
                            dir,
                            '--game',
                            gameUid,
                            '--platform-url',
                            config_1.Config.domain + '/x/updater/check-for-updates',
                            '--wait-for-connection',
                            '2',
                            '--symbiote',
                            '--no-loader',
                        ];
                        if (options.authToken) {
                            args.push('--auth-token', options.authToken);
                        }
                        if (options.runLater) {
                            args.push('--launch');
                        }
                        args.push('install');
                        return [2 /*return*/, this.manageInstanceInQueue(new PatchInstance(controller_1.Controller.launchNew(args), getAuthToken))];
                }
            });
        });
    };
    Patcher.patchReattach = function (port, pid, authTokenGetter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.manageInstanceInQueue(new PatchInstance(new controller_1.Controller(port, pid), authTokenGetter))];
            });
        });
    };
    Patcher.manageInstanceInQueue = function (instance) {
        // Queue.manage(instance);
        instance.on('resumed', function () {
            queue_1.Queue.manage(instance);
        });
        return instance;
    };
    return Patcher;
}());
exports.Patcher = Patcher;
var State;
(function (State) {
    State[State["Starting"] = 0] = "Starting";
    State[State["Downloading"] = 1] = "Downloading";
    State[State["Patching"] = 2] = "Patching";
    State[State["Finished"] = 3] = "Finished";
})(State = exports.State || (exports.State = {}));
var PatchInstance = (function (_super) {
    __extends(PatchInstance, _super);
    function PatchInstance(controller, authTokenGetter) {
        var _this = _super.call(this, controller) || this;
        _this.authTokenGetter = authTokenGetter;
        _this.on('patcherState', function (state) {
            console.log('patcher got state: ' + state);
            _this._state = _this._getState(state);
            console.log('patcher emitting state: ' + _this._state);
            _this.controller.emit('state', _this._state);
        })
            .on('updateFailed', function (reason) {
            // If the update was canceled the 'context canceled' will be emitted as the updateFailed reason.
            if (reason === 'context canceled') {
                return;
            }
            _this.controller.emit('done', reason);
        })
            .on('updateFinished', function () {
            _this.controller.emit('done');
        });
        _this._state = State.Starting;
        _this._isPaused = false;
        _this.getState().then(function () {
            queue_1.Queue.manage(_this);
            if (_this._isPaused) {
                _this.controller.sendResume();
            }
        });
        return _this;
    }
    PatchInstance.prototype.getState = function () {
        return __awaiter(this, void 0, void 0, function () {
            var state;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.controller.sendGetState(false)];
                    case 1:
                        state = _a.sent();
                        this._isPaused = state.isPaused;
                        this._state = this._getState(state.patcherState);
                        return [2 /*return*/];
                }
            });
        });
    };
    PatchInstance.prototype._getState = function (state) {
        switch (state) {
            case data.PatcherState.Start:
            case data.PatcherState.Preparing:
                return State.Starting;
            case data.PatcherState.Download:
            case data.PatcherState.UpdateReady:
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
    };
    Object.defineProperty(PatchInstance.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    PatchInstance.prototype.isDownloading = function () {
        return this._state === State.Starting || this._state === State.Downloading;
    };
    PatchInstance.prototype.isPatching = function () {
        return this._state === State.Patching;
    };
    PatchInstance.prototype.isFinished = function () {
        return this._state === State.Finished;
    };
    PatchInstance.prototype.isRunning = function () {
        return !this._isPaused;
    };
    PatchInstance.prototype.getAuthToken = function () {
        return this.authTokenGetter();
    };
    PatchInstance.prototype.resume = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        options = options || {};
                        if (!(!options.authToken &&
                            (this._state === State.Starting || this._state === State.Downloading)))
                            return [3 /*break*/, 2];
                        _a = options;
                        return [4 /*yield*/, this.authTokenGetter()];
                    case 1:
                        _a.authToken = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, this.controller.sendResume(options)];
                    case 3:
                        result = _b.sent();
                        if (result.success) {
                            this._isPaused = false;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    PatchInstance.prototype.pause = function (queue) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.controller.sendPause({ queue: !!queue })];
                    case 1:
                        result = _a.sent();
                        if (result.success) {
                            this._isPaused = true;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    PatchInstance.prototype.cancel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.controller.sendCancel()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return PatchInstance;
}(controller_wrapper_1.ControllerWrapper));
exports.PatchInstance = PatchInstance;
//# sourceMappingURL=patcher.js.map