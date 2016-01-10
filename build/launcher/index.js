"use strict";

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var path = require('path');
var events_1 = require('events');
var childProcess = require('child_process');
var common_1 = require('../common');
var pid_finder_1 = require('./pid-finder');
var queue_1 = require('../queue');
var plist = require('plist');
var shellEscape = require('shell-escape');
var spawnShellEscape = function spawnShellEscape(cmd) {
    return '"' + cmd.replace(/(["\s'$`\\])/g, '\\$1') + '"';
};

var Launcher = (function () {
    function Launcher() {
        (0, _classCallCheck3.default)(this, Launcher);
    }

    (0, _createClass3.default)(Launcher, null, [{
        key: "launch",

        // Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
        value: function launch(localPackage, os, arch, options) {
            return new LaunchHandle(localPackage, os, arch, options);
        }
    }, {
        key: "attach",
        value: function attach(pid, expectedCmd, pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this = this;

                var instance;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!this._runningInstances.has(pid)) {
                                    this._runningInstances.set(pid, new LaunchInstanceHandle(pid, expectedCmd, pollInterval));
                                }
                                ;
                                instance = this._runningInstances.get(pid);

                                instance.on('end', function () {
                                    return _this.detach(pid);
                                });
                                queue_1.VoodooQueue.setSlower();
                                return _context.abrupt("return", instance);

                            case 6:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "detach",
        value: function detach(pid) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (this._runningInstances.delete(pid) && this._runningInstances.size === 0) {
                                    queue_1.VoodooQueue.setFaster();
                                }

                            case 1:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }]);
    return Launcher;
})();

Launcher._runningInstances = new _map2.default();
exports.Launcher = Launcher;

var LaunchHandle = (function () {
    function LaunchHandle(_localPackage, _os, _arch, options) {
        (0, _classCallCheck3.default)(this, LaunchHandle);

        this._localPackage = _localPackage;
        this._os = _os;
        this._arch = _arch;
        options = options || {
            pollInterval: 1000
        };
        this._promise = this.start(options.pollInterval);
    }

    (0, _createClass3.default)(LaunchHandle, [{
        key: "findLaunchOption",
        value: function findLaunchOption() {
            var result = null;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this._localPackage.launch_options), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var launchOption = _step.value;

                    var lOs = launchOption.os ? launchOption.os.split('_') : [];
                    if (lOs.length === 0) {
                        lOs = [null, '32'];
                    } else if (lOs.length === 1) {
                        lOs.push('32');
                    }
                    if (lOs[0] === this._os) {
                        if (lOs[1] === this._arch) {
                            return launchOption;
                        }
                        result = launchOption;
                    } else if (lOs[0] === null && !result) {
                        result = launchOption;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return result;
        }
    }, {
        key: "ensureExecutable",
        value: function ensureExecutable(file) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                // Ensure that the main launcher file is executable.
                                console.log('Setting the file to be executable');
                                _context3.next = 3;
                                return common_1.default.chmod(file, '0755');

                            case 3:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "start",
        value: function start(pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                var launchOption, executablePath, stat;
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
                                executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;

                                executablePath = executablePath.replace(/\//, path.sep);
                                this._file = path.join(this._localPackage.install_dir, executablePath);
                                // If the destination already exists, make sure its valid.
                                _context4.next = 8;
                                return common_1.default.fsExists(this._file);

                            case 8:
                                if (_context4.sent) {
                                    _context4.next = 10;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file doesn\'t exist.');

                            case 10:
                                _context4.next = 12;
                                return common_1.default.fsStat(this._file);

                            case 12:
                                stat = _context4.sent;
                                _context4.t0 = process.platform;
                                _context4.next = _context4.t0 === 'win32' ? 16 : _context4.t0 === 'linux' ? 17 : _context4.t0 === 'darwin' ? 18 : 19;
                                break;

                            case 16:
                                return _context4.abrupt("return", this.startWindows(stat, pollInterval));

                            case 17:
                                return _context4.abrupt("return", this.startLinux(stat, pollInterval));

                            case 18:
                                return _context4.abrupt("return", this.startMac(stat, pollInterval));

                            case 19:
                                throw new Error('What potato are you running on? Detected platform: ' + process.platform);

                            case 20:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "startWindows",
        value: function startWindows(stat, pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                var child, pid;
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
                                child = childProcess.spawn(this._file, [], {
                                    cwd: path.dirname(this._file),
                                    detached: true
                                });
                                pid = child.pid;

                                child.unref();
                                return _context5.abrupt("return", Launcher.attach(pid, null, pollInterval));

                            case 6:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: "startLinux",
        value: function startLinux(stat, pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee6() {
                var child, pid;
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
                                return common_1.default.chmod(this._file, '0755');

                            case 4:
                                child = childProcess.spawn(this._file, [], {
                                    cwd: path.dirname(this._file),
                                    detached: true
                                });
                                pid = child.pid;

                                child.unref();
                                return _context6.abrupt("return", Launcher.attach(pid, null, pollInterval));

                            case 8:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));
        }
    }, {
        key: "startMac",
        value: function startMac(stat, pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee7() {
                var pid, child, plistPath, plistStat, parsedPlist, macosPath, macosStat, baseName, executableName, executableFile;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                pid = undefined;

                                if (!stat.isFile()) {
                                    _context7.next = 9;
                                    break;
                                }

                                _context7.next = 4;
                                return common_1.default.chmod(this._file, '0755');

                            case 4:
                                child = childProcess.exec(shellEscape([this._file]), {
                                    cwd: path.dirname(this._file)
                                });

                                pid = child.pid;
                                child.unref();
                                _context7.next = 46;
                                break;

                            case 9:
                                if (!(!this._file.toLowerCase().endsWith('.app') && !this._file.toLowerCase().endsWith('.app/'))) {
                                    _context7.next = 11;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Expecting .app folder');

                            case 11:
                                plistPath = path.join(this._file, 'Contents', 'Info.plist');
                                _context7.next = 14;
                                return common_1.default.fsExists(plistPath);

                            case 14:
                                if (_context7.sent) {
                                    _context7.next = 16;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Missing Info.plist file.');

                            case 16:
                                _context7.next = 18;
                                return common_1.default.fsStat(plistPath);

                            case 18:
                                plistStat = _context7.sent;

                                if (plistStat.isFile()) {
                                    _context7.next = 21;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Info.plist isn\'t a valid file.');

                            case 21:
                                _context7.t0 = plist;
                                _context7.next = 24;
                                return common_1.default.fsReadFile(plistPath, 'utf8');

                            case 24:
                                _context7.t1 = _context7.sent;
                                parsedPlist = _context7.t0.parse.call(_context7.t0, _context7.t1);

                                if (parsedPlist) {
                                    _context7.next = 28;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.');

                            case 28:
                                macosPath = path.join(this._file, 'Contents', 'MacOS');
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
                                baseName = path.basename(this._file);
                                executableName = parsedPlist.CFBundleExecutable || baseName.substr(0, baseName.length - '.app'.length);
                                executableFile = path.join(macosPath, executableName);
                                _context7.next = 43;
                                return common_1.default.chmod(executableFile, '0755');

                            case 43:
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
                                child = childProcess.exec(shellEscape([executableFile]), {
                                    cwd: macosPath
                                });

                                pid = child.pid;
                                child.unref();

                            case 46:
                                return _context7.abrupt("return", Launcher.attach(pid, null, pollInterval));

                            case 47:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));
        }
    }, {
        key: "package",
        get: function get() {
            return this._localPackage;
        }
    }, {
        key: "file",
        get: function get() {
            return this._file;
        }
    }, {
        key: "promise",
        get: function get() {
            return this._promise;
        }
    }]);
    return LaunchHandle;
})();

exports.LaunchHandle = LaunchHandle;

var LaunchInstanceHandle = (function (_events_1$EventEmitte) {
    (0, _inherits3.default)(LaunchInstanceHandle, _events_1$EventEmitte);

    function LaunchInstanceHandle(_pid, _expectedCmd, pollInterval) {
        (0, _classCallCheck3.default)(this, LaunchInstanceHandle);

        var _this2 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(LaunchInstanceHandle).call(this));

        _this2._pid = _pid;
        _this2._expectedCmd = _expectedCmd;
        _this2._interval = setInterval(function () {
            return _this2.tick();
        }, pollInterval || 1000);
        return _this2;
    }

    (0, _createClass3.default)(LaunchInstanceHandle, [{
        key: "tick",
        value: function tick() {
            var _this3 = this;

            pid_finder_1.PidFinder.find(this._pid, this._expectedCmd).then(function (result) {
                if (!result) {
                    throw new Error('Process doesn\'t exist anymore');
                }
                _this3._expectedCmd = result;
            }).catch(function (err) {
                clearInterval(_this3._interval);
                console.log(err);
                _this3.emit('end', err);
            });
        }
    }, {
        key: "pid",
        get: function get() {
            return this._pid;
        }
    }]);
    return LaunchInstanceHandle;
})(events_1.EventEmitter);

exports.LaunchInstanceHandle = LaunchInstanceHandle;
//# sourceMappingURL=index.js.map
