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
var cp = require("child_process");
var path = require("path");
var events_1 = require("./events");
var reconnector_1 = require("./reconnector");
var fs = require("fs");
var JSONStream = require('JSONStream');
var ps = require('ps-node');
function getExecutable() {
    var binFolder = path.resolve(__dirname, '..', 'bin');
    switch (process.platform) {
        case 'win32':
            return path.join(binFolder, 'joltron_win32.exe');
        case 'linux':
            return path.join(binFolder, 'joltron_linux');
        case 'darwin':
            return path.join(binFolder, 'joltron_osx');
        default:
            throw new Error('Unsupported OS');
    }
}
exports.getExecutable = getExecutable;
var SentMessage = (function () {
    function SentMessage(msg, timeout) {
        var _this = this;
        this.msg = JSON.stringify(msg);
        this.msgId = msg.msgId;
        this._resolved = false;
        this.promise = new Promise(function (resolve, reject) {
            _this.resolver = resolve;
            _this.rejector = reject;
            if (timeout && timeout !== Infinity) {
                setTimeout(function () {
                    _this._resolved = true;
                    reject(new Error('Message was not handled in time'));
                }, timeout);
            }
        });
    }
    Object.defineProperty(SentMessage.prototype, "resolved", {
        get: function () {
            return this._resolved;
        },
        enumerable: true,
        configurable: true
    });
    SentMessage.prototype.resolve = function (data) {
        this._resolved = true;
        this.resolver(data);
    };
    SentMessage.prototype.reject = function (reason) {
        this._resolved = true;
        this.rejector(reason);
    };
    return SentMessage;
}());
var Controller = (function (_super) {
    __extends(Controller, _super);
    function Controller(port, process) {
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
        if (process) {
            _this.process = process;
        }
        _this.reconnector = new reconnector_1.Reconnector(100, 3000);
        return _this;
    }
    Controller.prototype.newJsonStream = function () {
        var _this = this;
        return JSONStream.parse()
            .on('data', function (data) {
            console.log('Received json: ' + JSON.stringify(data));
            if (data.msgId &&
                _this.sentMessage &&
                data.msgId === _this.sentMessage.msgId) {
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
                var payload_1 = data.payload;
                if (!payload_1) {
                    return _this.sentMessage.reject(new Error('Missing `payload` field in response' +
                        ' in ' +
                        JSON.stringify(data)));
                }
                var type_1 = data.type;
                if (!type_1) {
                    return _this.sentMessage.reject(new Error('Missing `type` field in response' +
                        ' in ' +
                        JSON.stringify(data)));
                }
                switch (type_1) {
                    case 'state':
                        return _this.sentMessage.resolve(payload_1);
                    case 'result':
                        if (payload_1.success) {
                            return _this.sentMessage.resolve(data);
                        }
                        return _this.sentMessage.resolve(payload_1.err);
                    default:
                        return _this.sentMessage.reject(new Error('Unexpected `type` value: ' +
                            type_1 +
                            ' in ' +
                            JSON.stringify(data)));
                }
            }
            var type = data.type;
            if (!type) {
                return _this.emit('err', new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data)));
            }
            var payload = data.payload;
            if (!payload) {
                return _this.emit('err', new Error('Missing `payload` field in response' +
                    ' in ' +
                    JSON.stringify(data)));
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
                        case 'abort':
                            return _this.emit('fatal', new Error(payload));
                        case 'error':
                            return _this.emit('err', new Error(payload));
                        default:
                            return _this.emit('err', new Error('Unexpected update `message` value: ' +
                                message +
                                ' in ' +
                                JSON.stringify(data)));
                    }
                case 'progress':
                    return _this.emit('progress', payload);
                default:
                    return _this.emit('err', new Error('Unexpected `type` value: ' +
                        type +
                        ' in ' +
                        JSON.stringify(data)));
            }
        })
            .on('error', function (err) {
            console.log('json stream encountered an error: ' + err.message);
            console.log(err);
            _this.emit('fatal', err);
            _this.dispose();
        });
    };
    Controller.launchNew = function (args, options) {
        options = options || {
            detached: true,
            env: process.env,
            stdio: [
                'ignore',
                fs.openSync('joltron.log', 'a'),
                fs.openSync('joltron.log', 'a'),
            ],
        };
        var runnerExecutable = getExecutable();
        // Ensure that the runner is executable.
        fs.chmodSync(runnerExecutable, '0755');
        var portArg = args.indexOf('--port');
        if (portArg === -1) {
            throw new Error("Can't launch a new instance without specifying a port number");
        }
        var port = parseInt(args[portArg + 1], 10);
        console.log('Spawning ' + runnerExecutable + ' "' + args.join('" "') + '"');
        var runnerProc = cp.spawn(runnerExecutable, args, options);
        runnerProc.unref();
        var runnerInstance = new Controller(port, runnerProc.pid);
        runnerInstance.connect();
        return runnerInstance;
        // try {
        // 	await runnerInstance.connect();
        // 	return runnerInstance;
        // } catch (err) {
        // 	await runnerInstance.kill();
        // 	throw err;
        // }
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
            var _a, lastErr_1, err_1;
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
                            console.log("Disconnected from runner" +
                                (hasError ? ": " + lastErr_1.message : ''));
                            if (hasError) {
                                console.log(lastErr_1);
                            }
                            if (!_this.connectionLock) {
                                _this.emit('fatal', hasError
                                    ? lastErr_1
                                    : new Error("Unexpected disconnection from joltron"));
                            }
                        })
                            .pipe(this.newJsonStream());
                        this.consumeSendQueue();
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _b.sent();
                        console.log('Failed to connect in reconnector: ' + err_1.message);
                        this.emit('fatal', err_1);
                        return [3 /*break*/, 5];
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
            var err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.consumingQueue) {
                            return [2 /*return*/];
                        }
                        this.consumingQueue = true;
                        _a.label = 1;
                    case 1:
                        if (!(this.sendQueue.length !== 0))
                            return [3 /*break*/, 7];
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
                            }).catch(function (err) { return _this.sentMessage.reject(err); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.sentMessage.promise];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
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
    Controller.prototype.send = function (type, data, timeout) {
        var msgData = {
            type: type,
            msgId: (this.nextMessageId++).toString(),
            payload: data,
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
        return this.sendControl('kill', null, timeout).promise;
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
                return [2 /*return*/, msg.promise];
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
                return [2 /*return*/, msg.promise];
            });
        });
    };
    Controller.prototype.sendCancel = function (timeout) {
        return this.sendControl('cancel', null, timeout).promise;
    };
    Controller.prototype.sendGetState = function (includePatchInfo, timeout) {
        return this.send('state', { includePatchInfo: includePatchInfo }, timeout).promise;
    };
    Controller.prototype.sendCheckForUpdates = function (gameUID, platformURL, authToken, metadata, timeout) {
        var data = { gameUID: gameUID, platformURL: platformURL };
        if (authToken) {
            data.authToken = authToken;
        }
        if (metadata) {
            data.metadata = metadata;
        }
        return this.send('checkForUpdates', data, timeout).promise;
    };
    Controller.prototype.sendUpdateAvailable = function (updateMetadata, timeout) {
        return this.send('updateAvailable', updateMetadata, timeout).promise;
    };
    Controller.prototype.sendUpdateBegin = function (timeout) {
        return this.send('updateBegin', {}, timeout).promise;
    };
    Controller.prototype.sendUpdateApply = function (env, args, timeout) {
        return this.send('updateApply', { env: env, args: args }, timeout).promise;
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
//# sourceMappingURL=controller.js.map