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
<<<<<<< HEAD
var path = require('path');
var events_1 = require('events');
var childProcess = require('child_process');
var _ = require('lodash');
var common_1 = require('../common');
var pid_finder_1 = require('./pid-finder');
var queue_1 = require('../queue');
var application_1 = require('../application');
var GameWrapper = require('client-game-wrapper');
var plist = require('plist');
var shellEscape = require('shell-escape');
var spawnShellEscape = function spawnShellEscape(cmd) {
    return '"' + cmd.replace(/(["\s'$`\\])/g, '\\$1') + '"';
};
=======
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
var path = require("path");
var events_1 = require("events");
var childProcess = require("child_process");
var _ = require("lodash");
var common_1 = require("../common");
var pid_finder_1 = require("./pid-finder");
var queue_1 = require("../queue");
var plist = require('plist');
var shellEscape = require('shell-escape');
var GameWrapper = require('client-game-wrapper');
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
function log(message) {
    console.log("Launcher: " + message);
}
var Launcher = (function () {
    function Launcher() {
    }
<<<<<<< HEAD

    (0, _createClass3.default)(Launcher, null, [{
        key: 'launch',

        // Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
        value: function launch(localPackage, os, arch, credentials, options) {
            return new LaunchHandle(localPackage, os, arch, credentials, options);
        }
    }, {
        key: 'attach',
        value: function attach(options) {
            return __awaiter(this, void 0, void 0, _regenerator2.default.mark(function _callee2() {
                var _this = this;

                var _ret;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.prev = 0;
                                return _context2.delegateYield(_regenerator2.default.mark(function _callee() {
                                    var wrapper, instance, parsedWrapper, success, i;
                                    return _regenerator2.default.wrap(function _callee$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    wrapper = void 0;
                                                    instance = void 0;

                                                    if (!options.instance) {
                                                        _context.next = 7;
                                                        break;
                                                    }

                                                    instance = options.instance;
                                                    log('Attaching existing instance: id - ' + instance.wrapperId + ', port - ' + instance.wrapperPort + ', poll interval - ' + options.pollInterval);
                                                    _context.next = 19;
                                                    break;

                                                case 7:
                                                    if (!options.stringifiedWrapper) {
                                                        _context.next = 13;
                                                        break;
                                                    }

                                                    parsedWrapper = JSON.parse(options.stringifiedWrapper);

                                                    instance = new LaunchInstanceHandle(parsedWrapper.wrapperId, options.pollInterval);
                                                    log('Attaching new instance from stringified wrapper: id - ' + instance.wrapperId + ', port - ' + instance.wrapperPort + ', poll interval - ' + options.pollInterval);
                                                    _context.next = 19;
                                                    break;

                                                case 13:
                                                    if (!options.wrapperId) {
                                                        _context.next = 18;
                                                        break;
                                                    }

                                                    instance = new LaunchInstanceHandle(options.wrapperId, options.pollInterval);
                                                    log('Attaching new instance: id - ' + instance.wrapperId + ', port - ' + instance.wrapperPort + ', poll interval - ' + options.pollInterval);
                                                    _context.next = 19;
                                                    break;

                                                case 18:
                                                    throw new Error('Invalid launch attach options');

                                                case 19:
                                                    // This validates if the process actually started and gets the command its running with
                                                    // It'll throw if it failed into this promise chain, so it shouldn't ever attach an invalid process.
                                                    success = false;
                                                    i = 0;

                                                case 21:
                                                    if (!(i < 25)) {
                                                        _context.next = 37;
                                                        break;
                                                    }

                                                    _context.prev = 22;
                                                    _context.next = 25;
                                                    return instance.tick();

                                                case 25:
                                                    if (!_context.sent) {
                                                        _context.next = 28;
                                                        break;
                                                    }

                                                    success = true;
                                                    return _context.abrupt('break', 37);

                                                case 28:
                                                    _context.next = 32;
                                                    break;

                                                case 30:
                                                    _context.prev = 30;
                                                    _context.t0 = _context['catch'](22);

                                                case 32:
                                                    _context.next = 34;
                                                    return common_1.default.wait(200);

                                                case 34:
                                                    i++;
                                                    _context.next = 21;
                                                    break;

                                                case 37:
                                                    if (!success) {
                                                        // Here is where it throws
                                                        instance.abort(new Error('Couldn\'t attach to launch instance'));
                                                    }
                                                    if (!_this._runningInstances.has(instance.wrapperId)) {
                                                        _this._runningInstances.set(instance.wrapperId, instance);
                                                    }
                                                    ;
                                                    instance = _this._runningInstances.get(instance.wrapperId);
                                                    instance.once('end', function () {
                                                        log('Ended');
                                                        _this.detach(instance.wrapperId);
                                                    });
                                                    queue_1.VoodooQueue.setSlower();
                                                    return _context.abrupt('return', {
                                                        v: instance
                                                    });

                                                case 44:
                                                case 'end':
                                                    return _context.stop();
                                            }
                                        }
                                    }, _callee, _this, [[22, 30]]);
                                })(), 't0', 2);

                            case 2:
                                _ret = _context2.t0;

                                if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
                                    _context2.next = 5;
                                    break;
                                }

                                return _context2.abrupt('return', _ret.v);

                            case 5:
                                _context2.next = 11;
                                break;

                            case 7:
                                _context2.prev = 7;
                                _context2.t1 = _context2['catch'](0);

                                log('Got error: ' + _context2.t1.message + "\n" + _context2.t1.stack);
                                throw _context2.t1;

                            case 11:
                            case 'end':
                                return _context2.stop();
=======
    // Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
    Launcher.launch = function (localPackage, os, arch, options) {
        return new LaunchHandle(localPackage, os, arch, options);
    };
    Launcher.attach = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var instance_1, parsedWrapper, success, i, err_1, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        if (options.instance) {
                            instance_1 = options.instance;
                            log("Attaching existing instance: id - " + instance_1.wrapperId + ", port - " + instance_1.wrapperPort + ", poll interval - " + options.pollInterval);
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
                        }
                        else if (options.stringifiedWrapper) {
                            parsedWrapper = JSON.parse(options.stringifiedWrapper);
                            instance_1 = new LaunchInstanceHandle(parsedWrapper.wrapperId, parsedWrapper.wrapperPort, options.pollInterval);
                            log("Attaching new instance from stringified wrapper: id - " + instance_1.wrapperId + ", port - " + instance_1.wrapperPort + ", poll interval - " + options.pollInterval);
                        }
                        else if (options.wrapperId && options.wrapperPort) {
                            instance_1 = new LaunchInstanceHandle(options.wrapperId, options.wrapperPort, options.pollInterval);
                            log("Attaching new instance: id - " + instance_1.wrapperId + ", port - " + instance_1.wrapperPort + ", poll interval - " + options.pollInterval);
                        }
                        else {
                            throw new Error('Invalid launch attach options');
                        }
                        success = false;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 25))
                            return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, instance_1.tick()];
                    case 3:
                        if (_a.sent()) {
                            success = true;
                            return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, common_1.default.wait(200)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 1];
                    case 8:
                        if (!success) {
                            // Here is where it throws
                            instance_1.abort(new Error("Couldn't attach to launch instance"));
                        }
                        if (!this._runningInstances.has(instance_1.wrapperId)) {
                            this._runningInstances.set(instance_1.wrapperId, instance_1);
                        }
                        ;
                        instance_1 = this._runningInstances.get(instance_1.wrapperId);
                        instance_1.once('end', function () {
                            log('Ended');
                            _this.detach(instance_1.wrapperId);
                        });
                        queue_1.VoodooQueue.setSlower();
                        return [2 /*return*/, instance_1];
                    case 9:
                        err_2 = _a.sent();
                        log("Got error: " + err_2.message + "\n" + err_2.stack);
                        throw err_2;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    Launcher.detach = function (wrapperId, expectedWrapperPort) {
        return __awaiter(this, void 0, void 0, function () {
            var instance;
            return __generator(this, function (_a) {
                log("Detaching: wrapperId - " + wrapperId + ", expected port - " + expectedWrapperPort);
                instance = this._runningInstances.get(wrapperId);
                if (instance && (!expectedWrapperPort || instance.wrapperPort === expectedWrapperPort)) {
                    instance.removeAllListeners();
                    if (this._runningInstances.delete(wrapperId) && this._runningInstances.size === 0) {
                        queue_1.VoodooQueue.setFaster();
                    }
                }
                else {
                    log('No instance with this pid and cmd was found');
                }
                return [2 /*return*/];
            });
        });
    };
    return Launcher;
}());
exports.Launcher = Launcher;
<<<<<<< HEAD

var LaunchHandle = function () {
    function LaunchHandle(_localPackage, _os, _arch, _credentials, options) {
        (0, _classCallCheck3.default)(this, LaunchHandle);

=======
Launcher._runningInstances = new Map();
var LaunchHandle = (function () {
    function LaunchHandle(_localPackage, _os, _arch, options) {
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
        this._localPackage = _localPackage;
        this._os = _os;
        this._arch = _arch;
        this._credentials = _credentials;
        this.options = options;
        this.options = _.defaultsDeep(this.options || {}, {
            pollInterval: 1000,
            env: _.cloneDeep(process.env),
        });
        this._promise = this.start();
    }
    Object.defineProperty(LaunchHandle.prototype, "package", {
        get: function () {
            return this._localPackage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LaunchHandle.prototype, "file", {
        get: function () {
            return this._file;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LaunchHandle.prototype, "promise", {
        get: function () {
            return this._promise;
        },
        enumerable: true,
        configurable: true
    });
    LaunchHandle.prototype.findLaunchOption = function () {
        var result = null;
        for (var _i = 0, _a = this._localPackage.launch_options; _i < _a.length; _i++) {
            var launchOption = _a[_i];
            var lOs = launchOption.os ? launchOption.os.split('_') : [];
            if (lOs.length === 0) {
                lOs = [null, '32'];
            }
            else if (lOs.length === 1) {
                lOs.push('32');
            }
            if (lOs[0] === this._os) {
                if (lOs[1] === this._arch) {
                    return launchOption;
                }
                result = launchOption;
            }
            else if (lOs[0] === null && !result) {
                result = launchOption;
            }
        }
<<<<<<< HEAD
    }, {
        key: 'ensureCredentials',
        value: function ensureCredentials() {
            return common_1.default.fsWriteFile(path.join(this._localPackage.install_dir, '.gj-credentials'), '0.1.0\n' + this._credentials.username + '\n' + this._credentials.user_token + '\n');
        }
    }, {
        key: 'start',
        value: function start() {
            return __awaiter(this, void 0, void 0, _regenerator2.default.mark(function _callee4() {
                var launchOption, stat, isJava;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                launchOption = this.findLaunchOption();

                                if (launchOption) {
                                    _context4.next = 3;
                                    break;
                                }

                                throw new Error('Can\'t find valid launch options for the given os/arch');

                            case 3:
                                this._executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;
                                this._file = path.join(this._localPackage.install_dir, this._executablePath);
                                // If the destination already exists, make sure its valid.
                                _context4.next = 7;
                                return common_1.default.fsExists(this._file);

                            case 7:
                                if (_context4.sent) {
                                    _context4.next = 9;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file doesn\'t exist.');

                            case 9:
                                _context4.next = 11;
                                return common_1.default.fsStat(this._file);

                            case 11:
                                stat = _context4.sent;
                                isJava = path.extname(this._file) === 'jar';
                                _context4.t0 = process.platform;
                                _context4.next = _context4.t0 === 'win32' ? 16 : _context4.t0 === 'linux' ? 17 : _context4.t0 === 'darwin' ? 18 : 19;
                                break;

                            case 16:
                                return _context4.abrupt('return', this.startWindows(stat, isJava));

                            case 17:
                                return _context4.abrupt('return', this.startLinux(stat, isJava));

                            case 18:
                                return _context4.abrupt('return', this.startMac(stat, isJava));

                            case 19:
                                throw new Error('What potato are you running on? Detected platform: ' + process.platform);

                            case 20:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: 'startWindows',
        value: function startWindows(stat, isJava) {
            return __awaiter(this, void 0, void 0, _regenerator2.default.mark(function _callee5() {
                var cmd, args, wrapperId, wrapperPort;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                if (stat.isFile()) {
                                    _context5.next = 2;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file isn\'t valid.');

                            case 2:
                                _context5.next = 4;
                                return this.ensureExecutable(this._file);

                            case 4:
                                cmd = void 0, args = void 0;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                _context5.next = 8;
                                return application_1.Application.ensurePidDir();

                            case 8:
                                _context5.next = 10;
                                return this.ensureCredentials();

                            case 10:
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, this._executablePath, args, {
                                    cwd: path.dirname(this._file),
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context5.abrupt('return', Launcher.attach({
                                    wrapperId: wrapperId,
                                    pollInterval: this.options.pollInterval
                                }));

                            case 13:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: 'startLinux',
        value: function startLinux(stat, isJava) {
            return __awaiter(this, void 0, void 0, _regenerator2.default.mark(function _callee6() {
                var cmd, args, wrapperId, wrapperPort;
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                if (stat.isFile()) {
                                    _context6.next = 2;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file isn\'t valid.');

                            case 2:
                                _context6.next = 4;
                                return this.ensureExecutable(this._file);

                            case 4:
                                cmd = void 0, args = void 0;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                _context6.next = 8;
                                return application_1.Application.ensurePidDir();

                            case 8:
                                _context6.next = 10;
                                return this.ensureCredentials();

                            case 10:
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, this._executablePath, args, {
                                    cwd: path.dirname(this._file),
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context6.abrupt('return', Launcher.attach({
                                    wrapperId: wrapperId,
                                    pollInterval: this.options.pollInterval
                                }));

                            case 13:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));
        }
    }, {
        key: 'startMac',
        value: function startMac(stat, isJava) {
            return __awaiter(this, void 0, void 0, _regenerator2.default.mark(function _callee8() {
                var _this2 = this;

                var pid, cmd, args, wrapperId, wrapperPort, _ret2;

                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                pid = void 0;

                                if (!stat.isFile()) {
                                    _context8.next = 15;
                                    break;
                                }

                                _context8.next = 4;
                                return this.ensureExecutable(this._file);

                            case 4:
                                cmd = void 0, args = void 0;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                _context8.next = 8;
                                return application_1.Application.ensurePidDir();

                            case 8:
                                _context8.next = 10;
                                return this.ensureCredentials();

                            case 10:
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, this._executablePath, args, {
                                    cwd: path.dirname(this._file),
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context8.abrupt('return', Launcher.attach({
                                    wrapperId: wrapperId,
                                    pollInterval: this.options.pollInterval
                                }));

                            case 15:
                                return _context8.delegateYield(_regenerator2.default.mark(function _callee7() {
                                    var plistPath, plistStat, plistContents, parsedPlist, macosPath, macosStat, baseName, executableName, wrapperId, wrapperPort;
                                    return _regenerator2.default.wrap(function _callee7$(_context7) {
                                        while (1) {
                                            switch (_context7.prev = _context7.next) {
                                                case 0:
                                                    if (!(!_this2._file.toLowerCase().endsWith('.app') && !_this2._file.toLowerCase().endsWith('.app/'))) {
                                                        _context7.next = 2;
                                                        break;
                                                    }

                                                    throw new Error('That doesn\'t look like a valid Mac OS X bundle. Expecting .app folder');

                                                case 2:
                                                    plistPath = path.join(_this2._file, 'Contents', 'Info.plist');
                                                    _context7.next = 5;
                                                    return common_1.default.fsExists(plistPath);

                                                case 5:
                                                    if (_context7.sent) {
                                                        _context7.next = 7;
                                                        break;
                                                    }

                                                    throw new Error('That doesn\'t look like a valid Mac OS X bundle. Missing Info.plist file.');

                                                case 7:
                                                    _context7.next = 9;
                                                    return common_1.default.fsStat(plistPath);

                                                case 9:
                                                    plistStat = _context7.sent;

                                                    if (plistStat.isFile()) {
                                                        _context7.next = 12;
                                                        break;
                                                    }

                                                    throw new Error('That doesn\'t look like a valid Mac OS X bundle. Info.plist isn\'t a valid file.');

                                                case 12:
                                                    _context7.next = 14;
                                                    return common_1.default.fsReadFile(plistPath, 'utf8');

                                                case 14:
                                                    plistContents = _context7.sent;
                                                    parsedPlist = void 0;
                                                    _context7.prev = 16;

                                                    // First try parsing normally.
                                                    parsedPlist = plist.parse(plistContents);
                                                    _context7.next = 26;
                                                    break;

                                                case 20:
                                                    _context7.prev = 20;
                                                    _context7.t0 = _context7['catch'](16);
                                                    _context7.next = 24;
                                                    return new _promise2.default(function (resolve, reject) {
                                                        childProcess.exec(shellEscape(['plutil', '-convert', 'xml1', '-o', '-', plistPath]), function (err, stdout, stderr) {
                                                            if (err) {
                                                                return reject(err);
                                                            }
                                                            var errMsg = void 0;
                                                            if (stderr && (errMsg = stderr.toString('utf8'))) {
                                                                return reject(new Error(errMsg));
                                                            }
                                                            return resolve(stdout.toString('utf8'));
                                                        });
                                                    });

                                                case 24:
                                                    plistContents = _context7.sent;

                                                    parsedPlist = plist.parse(plistContents);

                                                case 26:
                                                    if (parsedPlist) {
                                                        _context7.next = 28;
                                                        break;
                                                    }

                                                    throw new Error('That doesn\'t look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.');

                                                case 28:
                                                    macosPath = path.join(_this2._file, 'Contents', 'MacOS');
                                                    _context7.next = 31;
                                                    return common_1.default.fsExists(macosPath);

                                                case 31:
                                                    if (_context7.sent) {
                                                        _context7.next = 33;
                                                        break;
                                                    }

                                                    throw new Error('That doesn\'t look like a valid Mac OS X bundle. Missing MacOS directory.');

                                                case 33:
                                                    _context7.next = 35;
                                                    return common_1.default.fsStat(macosPath);

                                                case 35:
                                                    macosStat = _context7.sent;

                                                    if (macosStat.isDirectory()) {
                                                        _context7.next = 38;
                                                        break;
                                                    }

                                                    throw new Error('That doesn\'t look like a valid Mac OS X bundle. MacOS isn\'t a valid directory.');

                                                case 38:
                                                    baseName = path.basename(_this2._file);
                                                    executableName = parsedPlist.CFBundleExecutable || baseName.substr(0, baseName.length - '.app'.length);

                                                    _this2._executablePath = path.join(_this2._executablePath, 'Contents', 'MacOS', executableName);
                                                    _this2._file = path.join(_this2._localPackage.install_dir, _this2._executablePath);
                                                    _context7.next = 44;
                                                    return _this2.ensureExecutable(_this2._file);

                                                case 44:
                                                    _context7.next = 46;
                                                    return application_1.Application.ensurePidDir();

                                                case 46:
                                                    _context7.next = 48;
                                                    return _this2.ensureCredentials();

                                                case 48:
                                                    wrapperId = _this2._localPackage.id.toString();
                                                    wrapperPort = GameWrapper.start(wrapperId, application_1.Application.PID_DIR, _this2._localPackage.install_dir, _this2._executablePath, [], {
                                                        cwd: path.dirname(_this2._file),
                                                        detached: true,
                                                        env: _this2.options.env
                                                    });
                                                    return _context7.abrupt('return', {
                                                        v: Launcher.attach({
                                                            wrapperId: wrapperId,
                                                            pollInterval: _this2.options.pollInterval
                                                        })
                                                    });

                                                case 51:
                                                case 'end':
                                                    return _context7.stop();
                                            }
                                        }
                                    }, _callee7, _this2, [[16, 20]]);
                                })(), 't0', 16);

                            case 16:
                                _ret2 = _context8.t0;

                                if (!((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object")) {
                                    _context8.next = 19;
                                    break;
                                }

                                return _context8.abrupt('return', _ret2.v);

                            case 19:
                            case 'end':
                                return _context8.stop();
=======
        return result;
    };
    LaunchHandle.prototype.ensureExecutable = function (file) {
        // Ensure that the main launcher file is executable.
        return common_1.default.chmod(file, '0755');
    };
    LaunchHandle.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var launchOption, executablePath, stat, isJava;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        launchOption = this.findLaunchOption();
                        if (!launchOption) {
                            throw new Error("Can't find valid launch options for the given os/arch");
                        }
                        executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;
                        executablePath = executablePath.replace(/\//, path.sep);
                        this._file = path.join(this._localPackage.install_dir, executablePath);
                        return [4 /*yield*/, common_1.default.fsExists(this._file)];
                    case 1:
                        // If the destination already exists, make sure its valid.
                        if (!(_a.sent())) {
                            throw new Error("Can't launch because the file doesn't exist.");
                        }
                        return [4 /*yield*/, common_1.default.fsStat(this._file)];
                    case 2:
                        stat = _a.sent();
                        isJava = path.extname(this._file) === 'jar';
                        switch (process.platform) {
                            case 'win32':
                                return [2 /*return*/, this.startWindows(stat, isJava)];
                            case 'linux':
                                return [2 /*return*/, this.startLinux(stat, isJava)];
                            case 'darwin':
                                return [2 /*return*/, this.startMac(stat, isJava)];
                            default:
                                throw new Error("What potato are you running on? Detected platform: " + process.platform);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    LaunchHandle.prototype.startWindows = function (stat, isJava) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, args, wrapperId, wrapperPort;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!stat.isFile()) {
                            throw new Error("Can't launch because the file isn't valid.");
                        }
                        return [4 /*yield*/, this.ensureExecutable(this._file)];
                    case 1:
                        _a.sent();
                        if (isJava) {
                            cmd = 'java';
                            args = ['-jar', this._file];
                        }
                        else {
                            cmd = this._file;
                            args = [];
                        }
                        wrapperId = this._localPackage.id.toString();
                        wrapperPort = GameWrapper.start(wrapperId, this._file, args, {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                wrapperPort: wrapperPort,
                                pollInterval: this.options.pollInterval,
                            })];
                }
            });
        });
    };
    LaunchHandle.prototype.startLinux = function (stat, isJava) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, args, wrapperId, wrapperPort;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!stat.isFile()) {
                            throw new Error("Can't launch because the file isn't valid.");
                        }
                        return [4 /*yield*/, this.ensureExecutable(this._file)];
                    case 1:
                        _a.sent();
                        if (isJava) {
                            cmd = 'java';
                            args = ['-jar', this._file];
                        }
                        else {
                            cmd = this._file;
                            args = [];
                        }
                        wrapperId = this._localPackage.id.toString();
                        wrapperPort = GameWrapper.start(wrapperId, this._file, args, {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                wrapperPort: wrapperPort,
                                pollInterval: this.options.pollInterval,
                            })];
                }
            });
        });
    };
    LaunchHandle.prototype.startMac = function (stat, isJava) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, args, wrapperId, wrapperPort, plistPath_1, plistStat, plistContents, parsedPlist, err_3, macosPath, macosStat, baseName, executableName, executableFile, wrapperId, wrapperPort;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!stat.isFile())
                            return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ensureExecutable(this._file)];
                    case 1:
                        _a.sent();
                        cmd = void 0, args = void 0;
                        if (isJava) {
                            cmd = 'java';
                            args = ['-jar', this._file];
                        }
                        else {
                            cmd = this._file;
                            args = [];
                        }
                        wrapperId = this._localPackage.id.toString();
                        wrapperPort = GameWrapper.start(wrapperId, this._file, args, {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                wrapperPort: wrapperPort,
                                pollInterval: this.options.pollInterval,
                            })];
                    case 2:
                        if (!this._file.toLowerCase().endsWith('.app') && !this._file.toLowerCase().endsWith('.app/')) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Expecting .app folder");
                        }
                        plistPath_1 = path.join(this._file, 'Contents', 'Info.plist');
                        return [4 /*yield*/, common_1.default.fsExists(plistPath_1)];
                    case 3:
                        if (!(_a.sent())) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Missing Info.plist file.");
                        }
                        return [4 /*yield*/, common_1.default.fsStat(plistPath_1)];
                    case 4:
                        plistStat = _a.sent();
                        if (!plistStat.isFile()) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Info.plist isn't a valid file.");
                        }
                        return [4 /*yield*/, common_1.default.fsReadFile(plistPath_1, 'utf8')];
                    case 5:
                        plistContents = _a.sent();
                        parsedPlist = void 0;
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 7, , 9]);
                        // First try parsing normally.
                        parsedPlist = plist.parse(plistContents);
                        return [3 /*break*/, 9];
                    case 7:
                        err_3 = _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                childProcess.exec(shellEscape(['plutil', '-convert', 'xml1', '-o', '-', plistPath_1]), function (err, stdout, stderr) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    var errMsg;
                                    if (stderr && (errMsg = stderr.toString('utf8'))) {
                                        return reject(new Error(errMsg));
                                    }
                                    return resolve(stdout.toString('utf8'));
                                });
                            })];
                    case 8:
                        // If failed, it may be a plist in binary format (http://www.forensicswiki.org/wiki/Converting_Binary_Plists)
                        // This makes sure to convert it to xml before parsing.
                        plistContents = _a.sent();
                        parsedPlist = plist.parse(plistContents);
                        return [3 /*break*/, 9];
                    case 9:
                        if (!parsedPlist) {
                            throw new Error("That doesn't look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.");
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
                        }
                        macosPath = path.join(this._file, 'Contents', 'MacOS');
                        return [4 /*yield*/, common_1.default.fsExists(macosPath)];
                    case 10:
                        if (!(_a.sent())) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Missing MacOS directory.");
                        }
                        return [4 /*yield*/, common_1.default.fsStat(macosPath)];
                    case 11:
                        macosStat = _a.sent();
                        if (!macosStat.isDirectory()) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. MacOS isn't a valid directory.");
                        }
                        baseName = path.basename(this._file);
                        executableName = parsedPlist.CFBundleExecutable || baseName.substr(0, baseName.length - '.app'.length);
                        executableFile = path.join(macosPath, executableName);
                        return [4 /*yield*/, this.ensureExecutable(executableFile)];
                    case 12:
                        _a.sent();
                        wrapperId = this._localPackage.id.toString();
                        wrapperPort = GameWrapper.start(wrapperId, executableFile, [], {
                            cwd: macosPath,
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                wrapperPort: wrapperPort,
                                pollInterval: this.options.pollInterval,
                            })];
                }
            });
        });
    };
    return LaunchHandle;
}());
exports.LaunchHandle = LaunchHandle;
<<<<<<< HEAD

var LaunchInstanceHandle = function (_events_1$EventEmitte) {
    (0, _inherits3.default)(LaunchInstanceHandle, _events_1$EventEmitte);

    function LaunchInstanceHandle(_wrapperId, pollInterval) {
        (0, _classCallCheck3.default)(this, LaunchInstanceHandle);

        var _this3 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(LaunchInstanceHandle).call(this));

        _this3._wrapperId = _wrapperId;
        _this3._interval = setInterval(function () {
            return _this3.tick();
        }, pollInterval || 1000);
        _this3._stable = false;
        return _this3;
    }

    (0, _createClass3.default)(LaunchInstanceHandle, [{
        key: 'tick',
        value: function tick() {
            var _this4 = this;

            return pid_finder_1.WrapperFinder.find(this._wrapperId).then(function (port) {
                _this4._stable = true;
                _this4._wrapperPort = port;
                return true;
            }).catch(function (err) {
                if (_this4._stable) {
                    clearInterval(_this4._interval);
                    console.error(err);
                    _this4.emit('end', err);
                }
                return false;
            });
        }
    }, {
        key: 'abort',
        value: function abort(err) {
            clearInterval(this._interval);
            console.error(err);
            this.emit('end', err);
            throw err;
        }
    }, {
        key: 'pid',
        get: function get() {
            return {
                wrapperId: this._wrapperId
=======
var LaunchInstanceHandle = (function (_super) {
    __extends(LaunchInstanceHandle, _super);
    function LaunchInstanceHandle(_wrapperId, _wrapperPort, pollInterval) {
        var _this = _super.call(this) || this;
        _this._wrapperId = _wrapperId;
        _this._wrapperPort = _wrapperPort;
        _this._interval = setInterval(function () { return _this.tick(); }, pollInterval || 1000);
        _this._stable = false;
        return _this;
    }
    Object.defineProperty(LaunchInstanceHandle.prototype, "pid", {
        get: function () {
            return {
                wrapperId: this._wrapperId,
                wrapperPort: this._wrapperPort,
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LaunchInstanceHandle.prototype, "wrapperId", {
        get: function () {
            return this._wrapperId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LaunchInstanceHandle.prototype, "wrapperPort", {
        get: function () {
            return this._wrapperPort;
        },
        enumerable: true,
        configurable: true
    });
    LaunchInstanceHandle.prototype.tick = function () {
        var _this = this;
        return pid_finder_1.WrapperFinder.find(this._wrapperId, this._wrapperPort)
            .then(function () {
            _this._stable = true;
            return true;
        })
            .catch(function (err) {
            if (_this._stable) {
                clearInterval(_this._interval);
                console.error(err);
                _this.emit('end', err);
                throw err;
            }
            return false;
        });
    };
    LaunchInstanceHandle.prototype.abort = function (err) {
        clearInterval(this._interval);
        console.error(err);
        this.emit('end', err);
        throw err;
    };
    return LaunchInstanceHandle;
}(events_1.EventEmitter));
exports.LaunchInstanceHandle = LaunchInstanceHandle;
//# sourceMappingURL=index.js.map