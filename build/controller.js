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
var cp = require("child_process");
var path = require("path");
var events_1 = require("./events");
var reconnector_1 = require("./reconnector");
var fs_1 = require("./fs");
var JSONStream = require('JSONStream');
var ps = require('ps-node');
function getExecutable() {
    var executable = 'GameJoltRunner';
    if (process.platform === 'win32') {
        executable += '.exe';
    }
    return path.resolve(__dirname, '..', 'bin', executable);
}
exports.getExecutable = getExecutable;
var SentMessage = (function () {
    function SentMessage(msg, timeout) {
        var _this = this;
        this.msg = JSON.stringify(msg);
        this.msgId = msg.msgId;
        // Initialize the result promise
        this._resultResolved = false;
        this.resultPromise = new Promise(function (resolve, reject) {
            _this.resultResolver = resolve;
            _this.resultRejector = reject;
            if (timeout && timeout !== Infinity) {
                setTimeout(function () {
                    _this._resultResolved = true;
                    reject(new Error('Message was not handled in time'));
                }, timeout);
            }
        });
        // Initialize the request promise
        this._requestResolved = false;
        this.requestPromise = new Promise(function (resolve, reject) {
            _this.requestResolver = resolve;
            _this.requestRejector = reject;
            if (timeout && timeout !== Infinity) {
                setTimeout(function () {
                    _this._requestResolved = true;
                    reject(new Error('Message was not sent in time'));
                }, timeout);
            }
        });
    }
    Object.defineProperty(SentMessage.prototype, "resolved", {
        get: function () {
            return this._resultResolved;
        },
        enumerable: true,
        configurable: true
    });
    SentMessage.prototype.resolve = function (data_) {
        this._resultResolved = true;
        this.resultResolver(data_);
    };
    SentMessage.prototype.reject = function (reason) {
        this._resultResolved = true;
        this.resultRejector(reason);
    };
    Object.defineProperty(SentMessage.prototype, "sent", {
        get: function () {
            return this._requestResolved;
        },
        enumerable: true,
        configurable: true
    });
    SentMessage.prototype.resolveSend = function () {
        this._requestResolved = true;
        this.requestResolver();
    };
    SentMessage.prototype.rejectSend = function (reason) {
        this.reject(reason);
        this._requestResolved = true;
        this.requestRejector(reason);
    };
    return SentMessage;
}());
var Controller = (function (_super) {
    __extends(Controller, _super);
    function Controller(port, options) {
        var _this = _super.call(this) || this;
        _this.connectionLock = null;
        _this.conn = null;
        _this.nextMessageId = 0;
        _this.sendQueue = [];
        _this.sentMessage = null;
        _this.consumingQueue = false;
        _this.expectingQueuePauseIds = [];
        _this.expectingQueueResumeIds = [];
        _this.expectingQueuePause = 0;
        _this.expectingQueueResume = 0;
        _this.port = port;
        options = options || {};
        if (options.process) {
            _this.process = options.process;
        }
        _this.reconnector = new reconnector_1.Reconnector(100, 3000, !!options.keepConnected);
        return _this;
    }
    Controller.prototype.newJsonStream = function () {
        var _this = this;
        return JSONStream.parse()
            .on('data', function (data_) {
            console.log('Received json: ' + JSON.stringify(data_));
            var payload, type;
            if (data_.msgId && _this.sentMessage && data_.msgId === _this.sentMessage.msgId) {
                var idx = _this.expectingQueuePauseIds.indexOf(_this.sentMessage.msgId);
                if (idx !== -1) {
                    _this.expectingQueuePauseIds.splice(idx);
                    _this.expectingQueuePause++;
                }
                idx = _this.expectingQueueResumeIds.indexOf(_this.sentMessage.msgId);
                if (idx !== -1) {
                    _this.expectingQueueResumeIds.splice(idx);
                    _this.expectingQueueResume++;
                }
                payload = data_.payload;
                if (!payload) {
                    return _this.sentMessage.reject(new Error('Missing `payload` field in response' +
                        ' in ' +
                        JSON.stringify(data_)));
                }
                type = data_.type;
                if (!type) {
                    return _this.sentMessage.reject(new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data_)));
                }
                switch (type) {
                    case 'state':
                        return _this.sentMessage.resolve(payload);
                    case 'result':
                        if (payload.success) {
                            return _this.sentMessage.resolve(data_);
                        }
                        return _this.sentMessage.resolve(payload.err);
                    default:
                        return _this.sentMessage.reject(new Error('Unexpected `type` value: ' +
                            type +
                            ' in ' +
                            JSON.stringify(data_)));
                }
            }
            type = data_.type;
            if (!type) {
                return _this.emit('err', new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data_)));
            }
            payload = data_.payload;
            if (!payload) {
                return _this.emit('err', new Error('Missing `payload` field in response' + ' in ' + JSON.stringify(data_)));
            }
            switch (type) {
                case 'update':
                    var message = payload.message;
                    payload = payload.payload; // lol
                    switch (message) {
                        case 'gameLaunchBegin':
                            return _this.emit.apply(_this, [message, payload.dir].concat(payload.args));
                        case 'gameLaunchFinished':
                            return _this.emit(message);
                        case 'gameLaunchFailed':
                            return _this.emit(message, payload);
                        case 'gameCrashed':
                            return _this.emit(message, payload);
                        case 'gameClosed':
                            return _this.emit(message);
                        case 'gameKilled':
                            return _this.emit(message);
                        case 'gameRelaunchBegin':
                            return _this.emit.apply(_this, [message, payload.dir].concat(payload.args));
                        case 'gameRelaunchFailed':
                            return _this.emit(message, payload);
                        case 'noUpdateAvailable':
                            return _this.emit(message);
                        case 'updateAvailable':
                            return _this.emit(message, payload);
                        case 'updateBegin':
                            return _this.emit(message, payload.dir, payload.metadata);
                        case 'updateFinished':
                            return _this.emit(message);
                        case 'updateReady':
                            return _this.emit(message);
                        case 'updateApply':
                            return _this.emit.apply(_this, [message].concat(payload.args));
                        case 'updateFailed':
                            return _this.emit(message, payload);
                        case 'paused':
                            if (_this.expectingQueuePause > 0) {
                                _this.expectingQueuePause--;
                                return _this.emit(message, true);
                            }
                            return _this.emit(message, false);
                        case 'resumed':
                            if (_this.expectingQueueResume > 0) {
                                _this.expectingQueueResume--;
                                return _this.emit(message, true);
                            }
                            return _this.emit(message, false);
                        case 'canceled':
                            return _this.emit(message);
                        case 'uninstallBegin':
                            return _this.emit(message, payload);
                        case 'uninstallFailed':
                            return _this.emit(message, payload);
                        case 'uninstallFinished':
                            return _this.emit(message);
                        case 'rollbackBegin':
                            return _this.emit(message, payload);
                        case 'rollbackFailed':
                            return _this.emit(message, payload);
                        case 'rollbackFinished':
                            return _this.emit(message);
                        case 'patcherState':
                            return _this.emit(message, payload);
                        case 'log':
                            var logLevel = payload.level;
                            switch (logLevel) {
                                case 'fatal':
                                    logLevel = 'error';
                                // tslint:disable-next-line:no-switch-case-fall-through
                                case 'error':
                                case 'warn':
                                case 'info':
                                case 'debug':
                                case 'trace':
                                    console[logLevel]("[joltron - " + payload.level + "] " + payload.message);
                                    return;
                                default:
                                    console.log("[joltron - info] " + payload.message);
                                    return;
                            }
                        case 'abort':
                            return _this.emit('fatal', new Error(payload));
                        case 'error':
                            return _this.emit('err', new Error(payload));
                        default:
                            return _this.emit('err', new Error('Unexpected update `message` value: ' +
                                message +
                                ' in ' +
                                JSON.stringify(data_)));
                    }
                case 'progress':
                    return _this.emit('progress', payload);
                default:
                    return _this.emit('err', new Error('Unexpected `type` value: ' + type + ' in ' + JSON.stringify(data_)));
            }
        })
            .on('error', function (err) {
            console.error('json stream encountered an error: ' + err.message);
            console.error(err);
            _this.emit('fatal', err);
            _this.dispose();
        });
    };
    Controller.ensureMigrationFile = function (localPackage) {
        return __awaiter(this, void 0, void 0, function () {
            var migration, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        migration = {
                            version0: {
                                packageId: localPackage.id,
                                buildId: localPackage.build.id,
                                executablePath: localPackage.executablePath,
                            },
                        };
                        if (localPackage.update) {
                            migration.version0.updateId = localPackage.update.id;
                            migration.version0.updateBuildId = localPackage.update.build.id;
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs_1.default.writeFile(path.join(localPackage.install_dir, '..', '.migration'), JSON.stringify(migration))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Controller.launchNew = function (args, options) {
        return __awaiter(this, void 0, void 0, function () {
            var runnerExecutable, portArg, port, runnerProc, runnerInstance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = options || {
                            detached: true,
                            env: process.env,
                            stdio: 'ignore',
                        };
                        runnerExecutable = getExecutable();
                        // Ensure that the runner is executable.
                        return [4 /*yield*/, fs_1.default.chmod(runnerExecutable, '0755')];
                    case 1:
                        // Ensure that the runner is executable.
                        _a.sent();
                        portArg = args.indexOf('--port');
                        if (portArg === -1) {
                            throw new Error("Can't launch a new instance without specifying a port number");
                        }
                        port = parseInt(args[portArg + 1], 10);
                        console.log('Spawning ' + runnerExecutable + ' "' + args.join('" "') + '"');
                        runnerProc = cp.spawn(runnerExecutable, args, options);
                        runnerProc.unref();
                        runnerInstance = new Controller(port, {
                            process: runnerProc.pid,
                            keepConnected: !!options.keepConnected,
                        });
                        runnerInstance.connect();
                        return [2 /*return*/, runnerInstance];
                }
            });
        });
    };
    Object.defineProperty(Controller.prototype, "connected", {
        get: function () {
            return this.reconnector.connected;
        },
        enumerable: true,
        configurable: true
    });
    Controller.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a, lastErr_1, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.connectionLock) {
                            throw new Error("Can't connect while connection is transitioning");
                        }
                        this.connectionLock = true;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        _a = this;
                        return [4 /*yield*/, this.reconnector.connect({ port: this.port })];
                    case 2:
                        _a.conn = _b.sent();
                        this.connectionLock = false;
                        this.conn.setKeepAlive(true, 1000);
                        this.conn.setEncoding('utf8');
                        this.conn.setNoDelay(true);
                        lastErr_1 = null;
                        this.conn
                            .on('error', function (err) { return (lastErr_1 = err); })
                            .on('close', function (hasError) {
                            _this.conn = null;
                            if (_this.sentMessage) {
                                _this.sentMessage.reject(new Error("Disconnected before receiving message response" +
                                    (hasError ? ": " + lastErr_1.message : '')));
                            }
                            console.log("Disconnected from runner" + (hasError ? ": " + lastErr_1.message : ''));
                            if (hasError) {
                                console.log(lastErr_1);
                            }
                            if (!_this.connectionLock) {
                                _this.emit('fatal', hasError ? lastErr_1 : new Error("Unexpected disconnection from joltron"));
                            }
                        })
                            .pipe(this.newJsonStream());
                        this.consumeSendQueue();
                        return [3 /*break*/, 5];
                    case 3:
                        err_2 = _b.sent();
                        console.log('Failed to connect in reconnector: ' + err_2.message);
                        this.emit('fatal', err_2);
                        throw err_2;
                    case 4:
                        this.connectionLock = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Controller.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.connectionLock) {
                            throw new Error("Can't disconnect while connection is transitioning");
                        }
                        this.connectionLock = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, this.reconnector.disconnect()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        this.connectionLock = false;
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Controller.prototype.dispose = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.disconnect()];
                    case 1:
                        _a.sent();
                        this.reconnector.removeAllListeners();
                        return [2 /*return*/];
                }
            });
        });
    };
    Controller.prototype.consumeSendQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.consumingQueue) {
                            return [2 /*return*/];
                        }
                        this.consumingQueue = true;
                        _a.label = 1;
                    case 1:
                        if (!(this.sendQueue.length !== 0)) return [3 /*break*/, 7];
                        this.sentMessage = this.sendQueue.shift();
                        if (this.sentMessage.resolved) {
                            this.sentMessage = null;
                            return [3 /*break*/, 1];
                        }
                        if (!this.connected || this.connectionLock) {
                            this.sentMessage.reject(new Error('Not connected'));
                            this.sentMessage = null;
                            return [3 /*break*/, 1];
                        }
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.conn.write(_this.sentMessage.msg, function (err) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve();
                                });
                            }).catch(function (err) {
                                _this.sentMessage.rejectSend(err);
                            })];
                    case 2:
                        _a.sent();
                        this.sentMessage.resolveSend();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.sentMessage.resultPromise];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        this.sentMessage = null;
                        return [3 /*break*/, 1];
                    case 7:
                        this.consumingQueue = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    Controller.prototype.send = function (type, payload, timeout) {
        var msgData = {
            type: type,
            msgId: (this.nextMessageId++).toString(),
            payload: payload,
        };
        console.log('Sending ' + JSON.stringify(msgData));
        var msg = new SentMessage(msgData, timeout);
        this.sendQueue.push(msg);
        if (this.connected) {
            this.consumeSendQueue();
        }
        return msg;
    };
    Controller.prototype.sendControl = function (command, extraData, timeout) {
        var msg = { command: command };
        if (extraData && extraData !== {}) {
            msg.extraData = extraData;
        }
        return this.send('control', msg, timeout);
    };
    Controller.prototype.sendKillGame = function (timeout) {
        return this.sendControl('kill', null, timeout).resultPromise;
    };
    Controller.prototype.sendPause = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var msg;
            return __generator(this, function (_a) {
                options = options || {};
                msg = this.sendControl('pause', null, options.timeout);
                if (options.queue) {
                    this.expectingQueuePauseIds.push(msg.msgId);
                }
                return [2 /*return*/, msg.resultPromise];
            });
        });
    };
    Controller.prototype.sendResume = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var extraData, msg;
            return __generator(this, function (_a) {
                options = options || {};
                extraData = {};
                if (options.authToken) {
                    extraData.authToken = options.authToken;
                }
                if (options.extraMetadata) {
                    extraData.extraMetadata = options.extraMetadata;
                }
                msg = this.sendControl('resume', extraData, options.timeout);
                if (options.queue) {
                    this.expectingQueueResumeIds.push(msg.msgId);
                }
                return [2 /*return*/, msg.resultPromise];
            });
        });
    };
    Controller.prototype.sendCancel = function (timeout, waitOnlyForSend) {
        var msg = this.sendControl('cancel', null, timeout);
        return waitOnlyForSend ? msg.requestPromise : msg.resultPromise;
    };
    Controller.prototype.sendGetState = function (includePatchInfo, timeout) {
        return this.send('state', { includePatchInfo: includePatchInfo }, timeout)
            .resultPromise;
    };
    Controller.prototype.sendCheckForUpdates = function (gameUID, platformURL, authToken, metadata, timeout) {
        var payload = { gameUID: gameUID, platformURL: platformURL };
        if (authToken) {
            payload.authToken = authToken;
        }
        if (metadata) {
            payload.metadata = metadata;
        }
        return this.send('checkForUpdates', payload, timeout).resultPromise;
    };
    Controller.prototype.sendUpdateAvailable = function (updateMetadata, timeout) {
        return this.send('updateAvailable', updateMetadata, timeout).resultPromise;
    };
    Controller.prototype.sendUpdateBegin = function (timeout) {
        return this.send('updateBegin', {}, timeout).resultPromise;
    };
    Controller.prototype.sendUpdateApply = function (env, args, timeout) {
        return this.send('updateApply', { env: env, args: args }, timeout)
            .resultPromise;
    };
    Controller.prototype.kill = function () {
        var _this = this;
        if (this.process) {
            return new Promise(function (resolve, reject) {
                if (typeof _this.process === 'number') {
                    ps.kill(_this.process, function (err) {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                }
                else {
                    _this.process.once('close', resolve).once('error', reject);
                    _this.process.kill();
                }
            });
        }
        return Promise.resolve();
    };
    return Controller;
}(events_1.TSEventEmitter));
exports.Controller = Controller;
