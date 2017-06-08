"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var config = require("config");
var Runner = require("./runner");
var util = require("./util");
var data = require("./data");
var Patcher = (function () {
    function Patcher() {
    }
    Patcher.patch = function (localPackage, options) {
        return __awaiter(this, void 0, void 0, function () {
            var dir, port, gameUid, args, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        options = options || {};
                        dir = localPackage.install_dir;
                        return [4 /*yield*/, util.findFreePort()];
                    case 1:
                        port = _b.sent();
                        console.log('port: ' + port);
                        gameUid = localPackage.id + '-' + localPackage.build.id;
                        args = [
                            '--port', port.toString(),
                            '--dir', dir,
                            '--game', gameUid,
                            '--platform-url', this.PLATFORM_URL,
                            '--paused',
                            '--no-loader'
                        ];
                        if (options.authToken) {
                            args.push('--auth-token', options.authToken);
                        }
                        if (options.runLater) {
                            args.push('--launch');
                        }
                        args.push('install');
                        _a = PatchInstance.bind;
                        return [4 /*yield*/, Runner.Instance.launchNew(args)];
                    case 2: return [2 /*return*/, new (_a.apply(PatchInstance, [void 0, _b.sent()]))()];
                }
            });
        });
    };
    Patcher.patchReattach = function (port, pid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new PatchInstance(new Runner.Instance(port, pid))];
            });
        });
    };
    return Patcher;
}());
Patcher.PLATFORM_URL = config.get('domain') + '/x/updater/check_for_updates';
exports.Patcher = Patcher;
var State;
(function (State) {
    State[State["Starting"] = 0] = "Starting";
    State[State["Downloading"] = 1] = "Downloading";
    State[State["Patching"] = 2] = "Patching";
    State[State["Finishing"] = 3] = "Finishing";
    State[State["Finished"] = 4] = "Finished";
})(State || (State = {}));
var PatchInstance = (function () {
    function PatchInstance(runner) {
        this.runner = runner;
        this._state = State.Starting;
        this._isPaused = false;
        this.start();
    }
    PatchInstance.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getState()];
                    case 1:
                        _a.sent();
                        this.runner
                            .on('patcherState', function (state) {
                            console.log(state);
                            _this._state = _this._getState(state);
                        });
                        if (!this._isPaused) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.runner.sendResume()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PatchInstance.prototype.getState = function () {
        return __awaiter(this, void 0, void 0, function () {
            var state;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runner.sendGetState(false)];
                    case 1:
                        state = _a.sent();
                        console.log(state);
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
                return State.Patching;
            case data.PatcherState.Cleanup:
                return State.Finishing;
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
        return this._state == State.Starting || this._state == State.Downloading;
    };
    PatchInstance.prototype.isPatching = function () {
        return this._state == State.Patching || this._state == State.Finishing;
    };
    PatchInstance.prototype.isFinished = function () {
        return this._state == State.Finished;
    };
    PatchInstance.prototype.isRunning = function () {
        return !this._isPaused;
    };
    PatchInstance.prototype.resume = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runner.sendResume()];
                    case 1:
                        result = _a.sent();
                        if (result.success) {
                            this._isPaused = false;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    PatchInstance.prototype.pause = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runner.sendResume()];
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
                    case 0: return [4 /*yield*/, this.runner.sendResume()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return PatchInstance;
}());
//# sourceMappingURL=patcher.js.map