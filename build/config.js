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
var mkdirp = require("mkdirp");
var mutex_1 = require("./mutex");
var Config = (function () {
    function Config() {
    }
    Object.defineProperty(Config, "pid_dir", {
        get: function () {
            return this.pidDir;
        },
        enumerable: true,
        configurable: true
    });
    Config.ensurePidDir = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            mkdirp(_this.pidDir, function (err, made) {
                if (err) {
                    return reject(err);
                }
                return resolve(made);
            });
        });
    };
    Config.setPidDir = function (pidDir) {
        if (!this.pidDir) {
            this.pidDir = pidDir;
            return true;
        }
        return false;
    };
    Config.issetClientMutex = function () {
        return !!this.clientMutex;
    };
    Config.setClientMutex = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (process.platform !== 'win32') {
                    return [2 /*return*/];
                }
                if (this.clientMutex) {
                    return [2 /*return*/];
                }
                if (!this.clientMutexPromise) {
                    this.clientMutexPromise = mutex_1.Mutex.create(this.mutex_name).then(function (mutexInst) {
                        _this.clientMutex = mutexInst;
                        _this.clientMutexPromise = null;
                        _this.clientMutex.onReleased.then(function () {
                            _this.clientMutex = null;
                        });
                    });
                }
                return [2 /*return*/, this.clientMutexPromise];
            });
        });
    };
    Config.releaseClientMutex = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (process.platform !== 'win32') {
                    return [2 /*return*/, null];
                }
                if (!this.clientMutex) {
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, this.clientMutex.release()];
            });
        });
    };
    return Config;
}());
Config.domain = process.env.NODE_ENV === 'development'
    ? 'http://development.gamejolt.com'
    : 'https://gamejolt.com';
Config.mutex_name = 'game-jolt-client';
Config.pidDir = '';
Config.clientMutexPromise = null;
Config.clientMutex = null;
exports.Config = Config;
Config.setClientMutex();
//# sourceMappingURL=config.js.map