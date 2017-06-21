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
var fs = require("mz/fs");
var path = require("path");
var controller_1 = require("./controller");
var util = require("./util");
var controller_wrapper_1 = require("./controller-wrapper");
var old_launcher_1 = require("./old-launcher");
var queue_1 = require("./queue");
var Launcher = (function () {
    function Launcher() {
    }
    // TODO(ylivay): Should set the credentials file for now.
    Launcher.launch = function (localPackage, credentials) {
        var executableArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            executableArgs[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var dir, port, gameUid, args, controller, instance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!credentials)
                            return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureCredentials(localPackage, credentials)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        dir = localPackage.install_dir;
                        return [4 /*yield*/, util.findFreePort()];
                    case 3:
                        port = _a.sent();
                        gameUid = localPackage.id + '-' + localPackage.build.id;
                        args = [
                            '--port',
                            port.toString(),
                            '--dir',
                            dir,
                            '--game',
                            gameUid,
                            '--wait-for-connection',
                            '2',
                            'run',
                        ];
                        args.push.apply(args, executableArgs);
                        controller = controller_1.Controller.launchNew(args);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                // tslint:disable-next-line:no-unused-expression
                                new LaunchInstance(controller, function (err, inst) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(inst);
                                });
                            })];
                    case 4:
                        instance = _a.sent();
                        return [2 /*return*/, this.manageInstanceInQueue(instance)];
                }
            });
        });
    };
    Launcher.attach = function (runningPid) {
        return __awaiter(this, void 0, void 0, function () {
            var instance, index, pidVersion, pidStr, parsedPid, controller_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        instance = null;
                        if (!(typeof runningPid !== 'string'))
                            return [3 /*break*/, 2];
                        return [4 /*yield*/, old_launcher_1.Launcher.attach(runningPid.wrapperId)];
                    case 1:
                        instance = _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        index = runningPid.indexOf(':');
                        if (index === -1) {
                            throw new Error('Invalid or unsupported running pid: ' + runningPid);
                        }
                        pidVersion = parseInt(runningPid.substring(0, index), 10);
                        pidStr = runningPid.substring(index + 1);
                        if (pidVersion !== 1) {
                            throw new Error('Invalid or unsupported running pid: ' + runningPid);
                        }
                        parsedPid = JSON.parse(pidStr);
                        controller_2 = new controller_1.Controller(parsedPid.port, parsedPid.pid);
                        controller_2.connect();
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                // tslint:disable-next-line:no-unused-expression
                                new LaunchInstance(controller_2, function (err, inst) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(inst);
                                });
                            })];
                    case 3:
                        instance = _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, this.manageInstanceInQueue(instance)];
                }
            });
        });
    };
    Launcher.ensureCredentials = function (localPackage, credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var manifestStr, manifest, str;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.readFile(path.join(localPackage.install_dir, '.manifest'), 'utf8')];
                    case 1:
                        manifestStr = _a.sent();
                        manifest = JSON.parse(manifestStr);
                        str = "0.2.1\n" + credentials.username + "\n" + credentials.user_token + "\n";
                        return [4 /*yield*/, Promise.all([
                                fs.writeFile(path.join(localPackage.install_dir, '.gj-credentials'), str),
                                fs.writeFile(path.join(localPackage.install_dir, manifest.gameInfo.dir, manifest.launchOptions.executable, '..', '.gj-credentials'), str),
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Launcher.manageInstanceInQueue = function (instance) {
        queue_1.Queue.setSlower();
        instance.once('gameOver', function () { return queue_1.Queue.setFaster(); });
        return instance;
    };
    return Launcher;
}());
exports.Launcher = Launcher;
var LaunchInstance = (function (_super) {
    __extends(LaunchInstance, _super);
    function LaunchInstance(controller, onReady) {
        var _this = _super.call(this, controller) || this;
        _this.on('gameClosed', function () {
            _this.controller.emit('gameOver');
        })
            .on('gameCrashed', function (err) {
            _this.controller.emit('gameOver', err);
        })
            .on('gameLaunchFinished', function () {
            _this.controller.emit('gameOver');
        })
            .on('gameLaunchFailed', function (err) {
            _this.controller.emit('gameOver', err);
        });
        _this.controller
            .sendGetState(false, 2000)
            .then(function (state) {
            _this._pid = state.pid;
            onReady(null, _this);
        })
            .catch(function (err) { return onReady(err, _this); });
        return _this;
    }
    Object.defineProperty(LaunchInstance.prototype, "pid", {
        get: function () {
            return ('1:' + JSON.stringify({ port: this.controller.port, pid: this._pid }));
        },
        enumerable: true,
        configurable: true
    });
    LaunchInstance.prototype.kill = function () {
        return this.controller.sendKillGame();
    };
    return LaunchInstance;
}(controller_wrapper_1.ControllerWrapper));
//# sourceMappingURL=launcher.js.map