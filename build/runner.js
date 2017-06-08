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
var net = require("net");
var events_1 = require("./events");
var fs = require("fs");
var reconnect = require('reconnect-core')(function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return net.connect.apply(null, args);
});
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
            if (timeout && timeout != Infinity) {
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
var Instance = (function (_super) {
    __extends(Instance, _super);
    function Instance(port, process) {
        var _this = _super.call(this) || this;
        _this.port = port;
        if (process) {
            _this.process = process;
        }
        _this.nextMessageId = 0;
        _this.sendQueue = [];
        _this.sentMessage = null;
        _this.consumingQueue = false;
        var incomingJson = JSONStream.parse();
        incomingJson
            .on('data', function (data) {
            console.log('Received json: ' + JSON.stringify(data));
            if (data.msgId && _this.sentMessage && data.msgId == _this.sentMessage.msgId) {
                var payload_1 = data.payload;
                if (!payload_1) {
                    return _this.sentMessage.reject(new Error('Missing `payload` field in response' + ' in ' + JSON.stringify(data)));
                }
                var type_1 = data.type;
                if (!type_1) {
                    return _this.sentMessage.reject(new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data)));
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
                        return _this.sentMessage.reject(new Error('Unexpected `type` value: ' + type_1 + ' in ' + JSON.stringify(data)));
                }
            }
            var type = data.type;
            if (!type) {
                return _this.emit('error', new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data)));
            }
            var payload = data.payload;
            if (!payload) {
                return _this.emit('error', new Error('Missing `payload` field in response' + ' in ' + JSON.stringify(data)));
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
                        case 'updatePaused':
                            return _this.emit(message);
                        case 'updateResumed':
                            return _this.emit(message);
                        case 'updateCanceled':
                            return _this.emit(message);
                        case 'uninstallBegin':
                            return _this.emit(message, payload);
                        case 'uninstallFailed':
                            return _this.emit(message, payload);
                        case 'uninstallFinished':
                            return _this.emit(message);
                        case 'patcherState':
                            return _this.emit(message, payload);
                        default:
                            return _this.emit('error', new Error('Unexpected update `message` value: ' + message + ' in ' + JSON.stringify(data)));
                    }
                case 'progress':
                    break;
                default:
                    return _this.emit('error', new Error('Unexpected `type` value: ' + type + ' in ' + JSON.stringify(data)));
            }
        })
            .on('error', function (err) {
            _this.emit('error', err);
            _this.dispose();
        });
        _this.reconnector = reconnect({
            initialDelay: 100,
            maxDelay: 1000,
            strategy: 'fibonacci',
            failAfter: 7,
            randomisationFactor: 0,
            immediate: false,
        }, function (conn) {
            _this.conn = conn;
            _this.conn.setKeepAlive(true, 1000);
            _this.conn.setEncoding('utf8');
            _this.conn.setTimeout(10000);
            _this.conn.pipe(incomingJson);
            _this.consumeSendQueue();
        });
        _this.connectionLock = false;
        _this.reconnector
            .on('connect', function (conn) {
            // Once connected, don't attempt to reconnect on disconnection.
            // We only want to use reconnect core for the initial connection attempts.
            _this.reconnector.reconnect = false;
            // console.log( 'Connected to runner' );
        })
            .on('disconnect', function (err) {
            _this.conn = null;
            if (_this.sentMessage) {
                _this.sentMessage.reject(new Error('Disconnected before receiving message response'));
            }
            console.log('Disconnected from runner' + (_this.reconnector.reconnect ? ', reconnecting...' : ''));
            if (err) {
                console.log('Received error: ' + err.message);
            }
        })
            .on('error', function (err) {
            _this.conn = null;
            if (_this.sentMessage) {
                _this.sentMessage.reject(new Error('Connection got an error before receiving message response: ' + err.message));
            }
            console.log('Received error: ' + err.message);
        });
        return _this;
    }
    Instance.launchNew = function (args, options) {
        return __awaiter(this, void 0, void 0, function () {
            var runnerExecutable, portArg, port, runnerInstance, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runnerExecutable = getExecutable();
                        // Ensure that the runner is executable.
                        fs.chmodSync(runnerExecutable, '0755');
                        portArg = args.indexOf('--port');
                        if (portArg == -1) {
                            throw new Error('Can\'t launch a new instance without specifying a port number');
                        }
                        port = parseInt(args[portArg + 1]);
                        console.log('Spawning ' + runnerExecutable + ' "' + args.join('" "') + '"');
                        runnerInstance = new Instance(port, cp.spawn(runnerExecutable, args, options));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, runnerInstance.connect()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, runnerInstance];
                    case 3:
                        err_1 = _a.sent();
                        return [4 /*yield*/, runnerInstance.kill()];
                    case 4:
                        _a.sent();
                        throw err_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(Instance.prototype, "connected", {
        get: function () {
            return this.reconnector.connected;
        },
        enumerable: true,
        configurable: true
    });
    Instance.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.connectionLock) {
                reject(new Error('Can\'t connect while connection is transitioning'));
                return;
            }
            if (_this.reconnector.connected) {
                resolve();
                return;
            }
            _this.connectionLock = true;
            // Make functions that can be safely removed from event listeners.
            // Once one of them is called, it'll remove the other before resolving or rejecting the promise.
            var _reconnector = _this.reconnector;
            var __this = _this;
            function onConnected() {
                _reconnector.removeListener('fail', onFail);
                __this.connectionLock = false;
                resolve();
            }
            function onFail(err) {
                _reconnector.removeListener('connect', onConnected);
                __this.connectionLock = false;
                reject(err);
            }
            _this.reconnector
                .once('connect', onConnected)
                .once('fail', onFail)
                .connect(_this.port);
            // // Only do the actual connection if not already connecting.
            // // Otherwise simply wait on event that should be emitter from a previous in connection that is in progress.
            // if ( !this.reconnector._connection || !this.reconnector._connection.connecting ) {
            // 	this.reconnector.connect( this.port );
            // }
        });
    };
    Instance.prototype.disconnect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.connectionLock) {
                reject(new Error('Can\'t disconnect while connection is transitioning'));
                return;
            }
            if (!_this.reconnector.connected) {
                resolve();
                return;
            }
            _this.connectionLock = true;
            // Make functions that can be safely removed from event listeners.
            // Once one of them is called, it'll remove the other before resolving or rejecting the promise.
            var _reconnector = _this.reconnector;
            var __this = _this;
            function onDisconnected() {
                _reconnector.removeListener('error', onError);
                __this.connectionLock = false;
                resolve();
            }
            function onError(err) {
                _reconnector.removeListener('disconnect', onDisconnected);
                __this.connectionLock = false;
                reject(err);
            }
            _this.reconnector
                .once('disconnect', onDisconnected)
                .once('error', onError)
                .disconnect();
        });
    };
    Instance.prototype.dispose = function () {
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
    Instance.prototype.consumeSendQueue = function () {
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
                        if (!(this.sendQueue.length != 0)) return [3 /*break*/, 7];
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
    Instance.prototype.send = function (type, data, timeout) {
        var msg = new SentMessage({
            type: type,
            msgId: (this.nextMessageId++).toString(),
            payload: data,
        }, timeout);
        this.sendQueue.push(msg);
        if (this.connected) {
            this.consumeSendQueue();
        }
        return msg.promise;
    };
    Instance.prototype.sendControl = function (command, timeout) {
        return this.send('control', { command: command }, timeout);
    };
    Instance.prototype.sendKillGame = function (timeout) {
        return this.sendControl('kill', timeout);
    };
    Instance.prototype.sendPause = function (timeout) {
        return this.sendControl('pause', timeout);
    };
    Instance.prototype.sendResume = function (timeout) {
        return this.sendControl('resume', timeout);
    };
    Instance.prototype.sendCancel = function (timeout) {
        return this.sendControl('cancel', timeout);
    };
    Instance.prototype.sendGetState = function (includePatchInfo, timeout) {
        return this.send('state', { includePatchInfo: includePatchInfo }, timeout);
    };
    Instance.prototype.sendCheckForUpdates = function (gameUID, platformURL, authToken, metadata, timeout) {
        var data = { gameUID: gameUID, platformURL: platformURL };
        if (authToken) {
            data.authToken = authToken;
        }
        if (metadata) {
            data.metadata = metadata;
        }
        return this.send('checkForUpdates', data, timeout);
    };
    // TODO: use types
    Instance.prototype.sendUpdateAvailable = function (updateMetadata, timeout) {
        return this.send('updateAvailable', updateMetadata, timeout);
    };
    Instance.prototype.sendUpdateBegin = function (timeout) {
        return this.send('updateBegin', {}, timeout);
    };
    Instance.prototype.sendUpdateApply = function (env, args, timeout) {
        return this.send('updateApply', { env: env, args: args }, timeout);
    };
    Instance.prototype.kill = function () {
        var _this = this;
        if (this.process) {
            return new Promise(function (resolve, reject) {
                if (typeof _this.process == 'number') {
                    ps.kill(_this.process.toString(), function (err) {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                }
                else {
                    _this.process
                        .once('close', resolve)
                        .once('error', reject);
                    _this.process.kill();
                }
            });
        }
        return Promise.resolve();
    };
    return Instance;
}(events_1.TSEventEmitter));
exports.Instance = Instance;
//# sourceMappingURL=runner.js.map