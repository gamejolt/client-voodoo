"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var net = require("net");
var path = require("path");
var fs = require("./fs");
var config_1 = require("./config");
var events_1 = require("./events");
var OldLauncher = (function () {
    function OldLauncher() {
    }
    OldLauncher.attach = function (wrapperId) {
        return __awaiter(this, void 0, void 0, function () {
            var instance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        instance = new OldLaunchInstance(wrapperId);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var resolved = false;
                                instance
                                    .once('gameLaunched', function () {
                                    resolved = true;
                                    resolve(true);
                                })
                                    .once('gameOver', function () {
                                    resolved = true;
                                    reject(new Error('Failed to connect to launch instance'));
                                });
                                setInterval(function () {
                                    if (resolved) {
                                        return;
                                    }
                                    instance.abort();
                                }, 5000);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, instance];
                }
            });
        });
    };
    return OldLauncher;
}());
exports.OldLauncher = OldLauncher;
var OldLaunchInstance = (function (_super) {
    __extends(OldLaunchInstance, _super);
    function OldLaunchInstance(_wrapperId) {
        var _this = _super.call(this) || this;
        _this._wrapperId = _wrapperId;
        _this._interval = setInterval(function () { return _this.tick(); }, 1000);
        _this._stable = false;
        return _this;
    }
    Object.defineProperty(OldLaunchInstance.prototype, "pid", {
        get: function () {
            return {
                wrapperId: this._wrapperId,
            };
        },
        enumerable: true,
        configurable: true
    });
    OldLaunchInstance.prototype.tick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var port, wasStable, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, WrapperFinder.find(this._wrapperId)];
                    case 1:
                        port = _a.sent();
                        wasStable = this._stable;
                        this._stable = true;
                        this._wrapperPort = port;
                        if (!wasStable) {
                            this.emit('gameLaunched');
                        }
                        return [2 /*return*/, true];
                    case 2:
                        err_1 = _a.sent();
                        if (this._stable) {
                            this.abort();
                        }
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OldLaunchInstance.prototype.abort = function () {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this.emit('gameOver');
    };
    return OldLaunchInstance;
}(events_1.TSEventEmitter));
exports.OldLaunchInstance = OldLaunchInstance;
var WrapperFinder = (function () {
    function WrapperFinder() {
    }
    WrapperFinder.find = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var pidPath, port;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pidPath = path.join(config_1.Config.pid_dir, id);
                        return [4 /*yield*/, fs.readFileAsync(pidPath, 'utf8')];
                    case 1:
                        port = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var conn = net.connect({ port: parseInt(port, 10), host: '127.0.0.1' });
                                conn
                                    .on('data', function (data) {
                                    var parsedData = data.toString().split(':');
                                    switch (parsedData[0]) {
                                        case 'v0.0.1':
                                        case 'v0.1.0':
                                        case 'v0.2.0':
                                        case 'v0.2.1':
                                            if (parsedData[2] === id) {
                                                resolve(parseInt(port, 10));
                                            }
                                            else {
                                                reject(new Error("Expecting wrapper id " + id + ", received " + parsedData[2]));
                                            }
                                            break;
                                    }
                                    conn.end();
                                })
                                    .on('end', function () {
                                    reject(new Error('Connection to wrapper ended before we got any info'));
                                })
                                    .on('error', function (err) {
                                    reject(new Error('Got an error in the connection: ' + err.message));
                                });
                            })];
                }
            });
        });
    };
    return WrapperFinder;
}());
