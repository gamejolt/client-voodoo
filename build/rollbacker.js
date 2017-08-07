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
var controller_1 = require("./controller");
var util = require("./util");
var data = require("./data");
var controller_wrapper_1 = require("./controller-wrapper");
var Rollbacker = (function () {
    function Rollbacker() {
    }
    Rollbacker.rollback = function (localPackage) {
        return __awaiter(this, void 0, void 0, function () {
            var dir, port, args;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dir = localPackage.install_dir;
                        return [4 /*yield*/, util.findFreePort()];
                    case 1:
                        port = _a.sent();
                        args = [
                            '--port',
                            port.toString(),
                            '--dir',
                            dir,
                            '--wait-for-connection',
                            '2',
                            '--symbiote',
                            'rollback',
                        ];
                        return [2 /*return*/, new RollbackInstance(controller_1.Controller.launchNew(args))];
                }
            });
        });
    };
    Rollbacker.rollbackReattach = function (port, pid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new RollbackInstance(new controller_1.Controller(port, pid))];
            });
        });
    };
    return Rollbacker;
}());
exports.Rollbacker = Rollbacker;
var RollbackState;
(function (RollbackState) {
    RollbackState[RollbackState["Starting"] = 0] = "Starting";
    RollbackState[RollbackState["Rollback"] = 1] = "Rollback";
    RollbackState[RollbackState["Finished"] = 2] = "Finished";
})(RollbackState = exports.RollbackState || (exports.RollbackState = {}));
var RollbackInstance = (function (_super) {
    __extends(RollbackInstance, _super);
    function RollbackInstance(controller) {
        var _this = _super.call(this, controller) || this;
        _this.on('patcherState', function (state) {
            var oldState = _this._state;
            _this._state = _this._getState(state);
            // Only emit state if it's changed
            if (oldState !== _this._state) {
                _this.controller.emit('state', _this._state);
            }
        });
        _this._state = RollbackState.Starting;
        _this._isPaused = false;
        _this.getState().then(function () {
            if (_this._isPaused) {
                _this.controller.sendResume();
            }
        });
        return _this;
    }
    RollbackInstance.prototype.getState = function () {
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
    RollbackInstance.prototype._getState = function (state) {
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
    };
    Object.defineProperty(RollbackInstance.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    RollbackInstance.prototype.isFinished = function () {
        return this._state === RollbackState.Finished;
    };
    RollbackInstance.prototype.isRunning = function () {
        return !this._isPaused;
    };
    return RollbackInstance;
}(controller_wrapper_1.ControllerWrapper));
exports.RollbackInstance = RollbackInstance;
