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
var path = require("path");
var events_1 = require("events");
var childProcess = require("child_process");
var _ = require("lodash");
var common_1 = require("../common");
var pid_finder_1 = require("./pid-finder");
var queue_1 = require("../queue");
var application_1 = require("../application");
var GameWrapper = require("client-game-wrapper");
var plist = require('plist');
var shellEscape = require('shell-escape');
function log(message) {
    console.log("Launcher: " + message);
}
var Launcher = (function () {
    function Launcher() {
    }
    // Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
    Launcher.launch = function (localPackage, os, arch, credentials, options) {
        return new LaunchHandle(localPackage, os, arch, credentials, options);
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
                        }
                        else if (options.stringifiedWrapper) {
                            parsedWrapper = JSON.parse(options.stringifiedWrapper);
                            instance_1 = new LaunchInstanceHandle(parsedWrapper.wrapperId, options.pollInterval);
                            log("Attaching new instance from stringified wrapper: id - " + instance_1.wrapperId + ", port - " + instance_1.wrapperPort + ", poll interval - " + options.pollInterval);
                        }
                        else if (options.wrapperId) {
                            instance_1 = new LaunchInstanceHandle(options.wrapperId, options.pollInterval);
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
Launcher._runningInstances = new Map();
exports.Launcher = Launcher;
var LaunchHandle = (function () {
    function LaunchHandle(_localPackage, _os, _arch, _credentials, options) {
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
        return result;
    };
    LaunchHandle.prototype.ensureExecutable = function (file) {
        // Ensure that the main launcher file is executable.
        return common_1.default.chmod(file, '0755');
    };
    LaunchHandle.prototype.ensureCredentials = function () {
        if (!this._credentials) {
            return Promise.resolve(null);
        }
        return common_1.default.fsWriteFile(path.join(this._localPackage.install_dir, '.gj-credentials'), "0.1.0\n" + this._credentials.username + "\n" + this._credentials.user_token + "\n");
    };
    LaunchHandle.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var launchOption, stat, isJava;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        launchOption = this.findLaunchOption();
                        if (!launchOption) {
                            throw new Error("Can't find valid launch options for the given os/arch");
                        }
                        this._executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;
                        this._file = path.join(this._localPackage.install_dir, this._executablePath);
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
            var cmd, args, wrapperId;
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
                        return [4 /*yield*/, application_1.Application.ensurePidDir()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 3:
                        _a.sent();
                        wrapperId = this._localPackage.id.toString();
                        GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, cmd, args, {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                pollInterval: this.options.pollInterval,
                            })];
                }
            });
        });
    };
    LaunchHandle.prototype.startLinux = function (stat, isJava) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, args, wrapperId;
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
                        return [4 /*yield*/, application_1.Application.ensurePidDir()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 3:
                        _a.sent();
                        wrapperId = this._localPackage.id.toString();
                        GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, cmd, args, {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                pollInterval: this.options.pollInterval,
                            })];
                }
            });
        });
    };
    LaunchHandle.prototype.startMac = function (stat, isJava) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, args, wrapperId, plistPath_1, plistStat, plistContents, parsedPlist, err_3, macosPath, macosStat, baseName, executableName, wrapperId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!stat.isFile())
                            return [3 /*break*/, 4];
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
                        return [4 /*yield*/, application_1.Application.ensurePidDir()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 3:
                        _a.sent();
                        wrapperId = this._localPackage.id.toString();
                        GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, cmd, args, {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                pollInterval: this.options.pollInterval,
                            })];
                    case 4:
                        if (!this._file.toLowerCase().endsWith('.app') && !this._file.toLowerCase().endsWith('.app/')) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Expecting .app folder");
                        }
                        plistPath_1 = path.join(this._file, 'Contents', 'Info.plist');
                        return [4 /*yield*/, common_1.default.fsExists(plistPath_1)];
                    case 5:
                        if (!(_a.sent())) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Missing Info.plist file.");
                        }
                        return [4 /*yield*/, common_1.default.fsStat(plistPath_1)];
                    case 6:
                        plistStat = _a.sent();
                        if (!plistStat.isFile()) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Info.plist isn't a valid file.");
                        }
                        return [4 /*yield*/, common_1.default.fsReadFile(plistPath_1, 'utf8')];
                    case 7:
                        plistContents = _a.sent();
                        parsedPlist = void 0;
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 9, , 11]);
                        // First try parsing normally.
                        parsedPlist = plist.parse(plistContents);
                        return [3 /*break*/, 11];
                    case 9:
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
                    case 10:
                        // If failed, it may be a plist in binary format (http://www.forensicswiki.org/wiki/Converting_Binary_Plists)
                        // This makes sure to convert it to xml before parsing.
                        plistContents = _a.sent();
                        parsedPlist = plist.parse(plistContents);
                        return [3 /*break*/, 11];
                    case 11:
                        if (!parsedPlist) {
                            throw new Error("That doesn't look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.");
                        }
                        macosPath = path.join(this._file, 'Contents', 'MacOS');
                        return [4 /*yield*/, common_1.default.fsExists(macosPath)];
                    case 12:
                        if (!(_a.sent())) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. Missing MacOS directory.");
                        }
                        return [4 /*yield*/, common_1.default.fsStat(macosPath)];
                    case 13:
                        macosStat = _a.sent();
                        if (!macosStat.isDirectory()) {
                            throw new Error("That doesn't look like a valid Mac OS X bundle. MacOS isn't a valid directory.");
                        }
                        baseName = path.basename(this._file);
                        executableName = parsedPlist.CFBundleExecutable || baseName.substr(0, baseName.length - '.app'.length);
                        this._executablePath = path.join(this._executablePath, 'Contents', 'MacOS', executableName);
                        this._file = path.join(this._localPackage.install_dir, this._executablePath);
                        return [4 /*yield*/, this.ensureExecutable(this._file)];
                    case 14:
                        _a.sent();
                        // Kept commented in case we lost our mind and we want to use gatekeeper
                        // let gatekeeper = await new Promise( ( resolve, reject ) =>
                        // {
                        // 	childProcess.exec( shellEscape( [ 'spctl', '--add', this._file ] ), ( err: Error, stdout: Buffer, stderr: Buffer ) =>
                        // 	{
                        // 		if ( err || ( stderr && stderr.length ) ) {
                        // 			return reject( err );
                        // 		}
                        // 		resolve();
                        // 	} );
                        // } );
                        return [4 /*yield*/, application_1.Application.ensurePidDir()];
                    case 15:
                        // Kept commented in case we lost our mind and we want to use gatekeeper
                        // let gatekeeper = await new Promise( ( resolve, reject ) =>
                        // {
                        // 	childProcess.exec( shellEscape( [ 'spctl', '--add', this._file ] ), ( err: Error, stdout: Buffer, stderr: Buffer ) =>
                        // 	{
                        // 		if ( err || ( stderr && stderr.length ) ) {
                        // 			return reject( err );
                        // 		}
                        // 		resolve();
                        // 	} );
                        // } );
                        _a.sent();
                        return [4 /*yield*/, this.ensureCredentials()];
                    case 16:
                        _a.sent();
                        wrapperId = this._localPackage.id.toString();
                        GameWrapper.start(wrapperId, application_1.Application.PID_DIR, this._localPackage.install_dir, this._file, [], {
                            cwd: path.dirname(this._file),
                            detached: true,
                            env: this.options.env,
                        });
                        return [2 /*return*/, Launcher.attach({
                                wrapperId: wrapperId,
                                pollInterval: this.options.pollInterval,
                            })];
                }
            });
        });
    };
    return LaunchHandle;
}());
exports.LaunchHandle = LaunchHandle;
var LaunchInstanceHandle = (function (_super) {
    __extends(LaunchInstanceHandle, _super);
    function LaunchInstanceHandle(_wrapperId, pollInterval) {
        var _this = _super.call(this) || this;
        _this._wrapperId = _wrapperId;
        _this._interval = setInterval(function () { return _this.tick(); }, pollInterval || 1000);
        _this._stable = false;
        return _this;
    }
    Object.defineProperty(LaunchInstanceHandle.prototype, "pid", {
        get: function () {
            return {
                wrapperId: this._wrapperId,
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
        return pid_finder_1.WrapperFinder.find(this._wrapperId)
            .then(function (port) {
            _this._stable = true;
            _this._wrapperPort = port;
            return true;
        })
            .catch(function (err) {
            if (_this._stable) {
                clearInterval(_this._interval);
                console.error(err);
                _this.emit('end', err);
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