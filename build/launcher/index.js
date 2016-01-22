"use strict";

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

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
function log(message) {
    console.log('Launcher: ' + message);
}

var Launcher = function () {
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
        value: function attach(pidOrLaunchInstance, expectedCmd, pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _this = this;

                var _ret;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.prev = 0;
                                return _context2.delegateYield(_regenerator2.default.mark(function _callee() {
                                    var pid, instance, _expectedCmd, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, cmd, parsedPid, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2;

                                    return _regenerator2.default.wrap(function _callee$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    pid = undefined;
                                                    instance = undefined;
                                                    _expectedCmd = null;

                                                    if (!(expectedCmd && expectedCmd.length)) {
                                                        _context.next = 24;
                                                        break;
                                                    }

                                                    _expectedCmd = new _set2.default();
                                                    _iteratorNormalCompletion = true;
                                                    _didIteratorError = false;
                                                    _iteratorError = undefined;
                                                    _context.prev = 8;
                                                    for (_iterator = (0, _getIterator3.default)(expectedCmd); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                                        cmd = _step.value;

                                                        _expectedCmd.add(cmd);
                                                    }
                                                    _context.next = 16;
                                                    break;

                                                case 12:
                                                    _context.prev = 12;
                                                    _context.t0 = _context["catch"](8);
                                                    _didIteratorError = true;
                                                    _iteratorError = _context.t0;

                                                case 16:
                                                    _context.prev = 16;
                                                    _context.prev = 17;

                                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                                        _iterator.return();
                                                    }

                                                case 19:
                                                    _context.prev = 19;

                                                    if (!_didIteratorError) {
                                                        _context.next = 22;
                                                        break;
                                                    }

                                                    throw _iteratorError;

                                                case 22:
                                                    return _context.finish(19);

                                                case 23:
                                                    return _context.finish(16);

                                                case 24:
                                                    if (!(typeof pidOrLaunchInstance === 'number')) {
                                                        _context.next = 30;
                                                        break;
                                                    }

                                                    pid = pidOrLaunchInstance;
                                                    log('Attaching new instance: pid - ' + pid + ', poll interval - ' + pollInterval + ', expected cmds - ' + (0, _stringify2.default)(expectedCmd || []));
                                                    instance = new LaunchInstanceHandle(pid, _expectedCmd, pollInterval);
                                                    _context.next = 62;
                                                    break;

                                                case 30:
                                                    if (!(typeof pidOrLaunchInstance === 'string')) {
                                                        _context.next = 59;
                                                        break;
                                                    }

                                                    log('Attaching new instance with stringified pid: ' + pidOrLaunchInstance);
                                                    parsedPid = JSON.parse(pidOrLaunchInstance);

                                                    pid = parsedPid.pid;

                                                    if (!(!_expectedCmd && parsedPid.expectedCmds && parsedPid.expectedCmds.length)) {
                                                        _context.next = 55;
                                                        break;
                                                    }

                                                    _expectedCmd = new _set2.default();
                                                    _iteratorNormalCompletion2 = true;
                                                    _didIteratorError2 = false;
                                                    _iteratorError2 = undefined;
                                                    _context.prev = 39;
                                                    for (_iterator2 = (0, _getIterator3.default)(parsedPid.expectedCmds); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                                        cmd = _step2.value;

                                                        _expectedCmd.add(cmd);
                                                    }
                                                    _context.next = 47;
                                                    break;

                                                case 43:
                                                    _context.prev = 43;
                                                    _context.t1 = _context["catch"](39);
                                                    _didIteratorError2 = true;
                                                    _iteratorError2 = _context.t1;

                                                case 47:
                                                    _context.prev = 47;
                                                    _context.prev = 48;

                                                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                                        _iterator2.return();
                                                    }

                                                case 50:
                                                    _context.prev = 50;

                                                    if (!_didIteratorError2) {
                                                        _context.next = 53;
                                                        break;
                                                    }

                                                    throw _iteratorError2;

                                                case 53:
                                                    return _context.finish(50);

                                                case 54:
                                                    return _context.finish(47);

                                                case 55:
                                                    log('Attaching new instance with parsed pid: pid - ' + pid + ', poll interval - ' + pollInterval + ', expected cmds - ' + (0, _stringify2.default)(parsedPid.expectedCmds || []));
                                                    instance = new LaunchInstanceHandle(pid, _expectedCmd, pollInterval);
                                                    _context.next = 62;
                                                    break;

                                                case 59:
                                                    instance = pidOrLaunchInstance;
                                                    pid = instance.pid;
                                                    log('Attaching existing instance: pid - ' + pid + ', poll interval - ' + pollInterval + ', expectedcmds - ' + (0, _stringify2.default)(expectedCmd || []));

                                                case 62:
                                                    _context.next = 64;
                                                    return instance.tick(true);

                                                case 64:
                                                    if (!_this._runningInstances.has(pid)) {
                                                        _this._runningInstances.set(pid, instance);
                                                    }
                                                    ;
                                                    instance = _this._runningInstances.get(pid);
                                                    instance.once('end', function () {
                                                        log('Ended');
                                                        var cmds = [];
                                                        var _iteratorNormalCompletion3 = true;
                                                        var _didIteratorError3 = false;
                                                        var _iteratorError3 = undefined;

                                                        try {
                                                            for (var _iterator3 = (0, _getIterator3.default)(instance.cmd.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                                                var cmd = _step3.value;

                                                                cmds.push(cmd);
                                                            }
                                                        } catch (err) {
                                                            _didIteratorError3 = true;
                                                            _iteratorError3 = err;
                                                        } finally {
                                                            try {
                                                                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                                                    _iterator3.return();
                                                                }
                                                            } finally {
                                                                if (_didIteratorError3) {
                                                                    throw _iteratorError3;
                                                                }
                                                            }
                                                        }

                                                        _this.detach(pid, cmds);
                                                    });
                                                    queue_1.VoodooQueue.setSlower();
                                                    return _context.abrupt("return", {
                                                        v: instance
                                                    });

                                                case 70:
                                                case "end":
                                                    return _context.stop();
                                            }
                                        }
                                    }, _callee, _this, [[8, 12, 16, 24], [17,, 19, 23], [39, 43, 47, 55], [48,, 50, 54]]);
                                })(), "t0", 2);

                            case 2:
                                _ret = _context2.t0;

                                if (!((typeof _ret === "undefined" ? "undefined" : (0, _typeof3.default)(_ret)) === "object")) {
                                    _context2.next = 5;
                                    break;
                                }

                                return _context2.abrupt("return", _ret.v);

                            case 5:
                                _context2.next = 11;
                                break;

                            case 7:
                                _context2.prev = 7;
                                _context2.t1 = _context2["catch"](0);

                                log('Got error: ' + _context2.t1.message + "\n" + _context2.t1.stack);
                                throw _context2.t1;

                            case 11:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[0, 7]]);
            }));
        }
    }, {
        key: "detach",
        value: function detach(pid, expectedCmd) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var instance, found, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, _cmd;

                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                log('Detaching: pid - ' + pid + ', expected cmds - ' + (0, _stringify2.default)(expectedCmd));
                                instance = this._runningInstances.get(pid);
                                found = !(expectedCmd && expectedCmd.length);

                                if (found) {
                                    _context3.next = 31;
                                    break;
                                }

                                _iteratorNormalCompletion4 = true;
                                _didIteratorError4 = false;
                                _iteratorError4 = undefined;
                                _context3.prev = 7;
                                _iterator4 = (0, _getIterator3.default)(expectedCmd);

                            case 9:
                                if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
                                    _context3.next = 17;
                                    break;
                                }

                                _cmd = _step4.value;

                                if (!instance.cmd.has(_cmd)) {
                                    _context3.next = 14;
                                    break;
                                }

                                found = true;
                                return _context3.abrupt("break", 17);

                            case 14:
                                _iteratorNormalCompletion4 = true;
                                _context3.next = 9;
                                break;

                            case 17:
                                _context3.next = 23;
                                break;

                            case 19:
                                _context3.prev = 19;
                                _context3.t0 = _context3["catch"](7);
                                _didIteratorError4 = true;
                                _iteratorError4 = _context3.t0;

                            case 23:
                                _context3.prev = 23;
                                _context3.prev = 24;

                                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                    _iterator4.return();
                                }

                            case 26:
                                _context3.prev = 26;

                                if (!_didIteratorError4) {
                                    _context3.next = 29;
                                    break;
                                }

                                throw _iteratorError4;

                            case 29:
                                return _context3.finish(26);

                            case 30:
                                return _context3.finish(23);

                            case 31:
                                if (instance && found) {
                                    instance.removeAllListeners();
                                    if (this._runningInstances.delete(pid) && this._runningInstances.size === 0) {
                                        queue_1.VoodooQueue.setFaster();
                                    }
                                } else {
                                    log('No instance with this pid and cmd was found');
                                }

                            case 32:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[7, 19, 23, 31], [24,, 26, 30]]);
            }));
        }
    }]);
    return Launcher;
}();

Launcher._runningInstances = new _map2.default();
exports.Launcher = Launcher;

var LaunchHandle = function () {
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
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = (0, _getIterator3.default)(this._localPackage.launch_options), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var launchOption = _step5.value;

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
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return result;
        }
    }, {
        key: "ensureExecutable",
        value: function ensureExecutable(file) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return common_1.default.chmod(file, '0755');

                            case 2:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "start",
        value: function start(pollInterval) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                var launchOption, executablePath, stat, isJava;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                launchOption = this.findLaunchOption();

                                if (launchOption) {
                                    _context5.next = 3;
                                    break;
                                }

                                throw new Error('Can\'t find valid launch options for the given os/arch');

                            case 3:
                                executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;

                                executablePath = executablePath.replace(/\//, path.sep);
                                this._file = path.join(this._localPackage.install_dir, executablePath);
                                // If the destination already exists, make sure its valid.
                                _context5.next = 8;
                                return common_1.default.fsExists(this._file);

                            case 8:
                                if (_context5.sent) {
                                    _context5.next = 10;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file doesn\'t exist.');

                            case 10:
                                _context5.next = 12;
                                return common_1.default.fsStat(this._file);

                            case 12:
                                stat = _context5.sent;
                                isJava = path.extname(this._file) === 'jar';
                                _context5.t0 = process.platform;
                                _context5.next = _context5.t0 === 'win32' ? 17 : _context5.t0 === 'linux' ? 18 : _context5.t0 === 'darwin' ? 19 : 20;
                                break;

                            case 17:
                                return _context5.abrupt("return", this.startWindows(stat, pollInterval, isJava));

                            case 18:
                                return _context5.abrupt("return", this.startLinux(stat, pollInterval, isJava));

                            case 19:
                                return _context5.abrupt("return", this.startMac(stat, pollInterval, isJava));

                            case 20:
                                throw new Error('What potato are you running on? Detected platform: ' + process.platform);

                            case 21:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: "startWindows",
        value: function startWindows(stat, pollInterval, isJava) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee6() {
                var cmd, args, child, pid;
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
                                cmd = undefined, args = undefined;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                child = childProcess.spawn(cmd, args, {
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
        key: "startLinux",
        value: function startLinux(stat, pollInterval, isJava) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee7() {
                var cmd, args, child, pid;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                if (stat.isFile()) {
                                    _context7.next = 2;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file isn\'t valid.');

                            case 2:
                                _context7.next = 4;
                                return common_1.default.chmod(this._file, '0755');

                            case 4:
                                cmd = undefined, args = undefined;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                child = childProcess.spawn(this._file, [], {
                                    cwd: path.dirname(this._file),
                                    detached: true
                                });
                                pid = child.pid;

                                child.unref();
                                return _context7.abrupt("return", Launcher.attach(pid, null, pollInterval));

                            case 10:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));
        }
    }, {
        key: "startMac",
        value: function startMac(stat, pollInterval, isJava) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee8() {
                var pid, _cmd2, args, child, plistPath, plistStat, parsedPlist, macosPath, macosStat, baseName, executableName, executableFile;

                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                pid = undefined;

                                if (!stat.isFile()) {
                                    _context8.next = 11;
                                    break;
                                }

                                _context8.next = 4;
                                return common_1.default.chmod(this._file, '0755');

                            case 4:
                                _cmd2 = undefined, args = undefined;

                                if (isJava) {
                                    _cmd2 = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    _cmd2 = this._file;
                                    args = [];
                                }
                                child = childProcess.exec(shellEscape([this._file]), {
                                    cwd: path.dirname(this._file)
                                });

                                pid = child.pid;
                                child.unref();
                                _context8.next = 48;
                                break;

                            case 11:
                                if (!(!this._file.toLowerCase().endsWith('.app') && !this._file.toLowerCase().endsWith('.app/'))) {
                                    _context8.next = 13;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Expecting .app folder');

                            case 13:
                                plistPath = path.join(this._file, 'Contents', 'Info.plist');
                                _context8.next = 16;
                                return common_1.default.fsExists(plistPath);

                            case 16:
                                if (_context8.sent) {
                                    _context8.next = 18;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Missing Info.plist file.');

                            case 18:
                                _context8.next = 20;
                                return common_1.default.fsStat(plistPath);

                            case 20:
                                plistStat = _context8.sent;

                                if (plistStat.isFile()) {
                                    _context8.next = 23;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Info.plist isn\'t a valid file.');

                            case 23:
                                _context8.t0 = plist;
                                _context8.next = 26;
                                return common_1.default.fsReadFile(plistPath, 'utf8');

                            case 26:
                                _context8.t1 = _context8.sent;
                                parsedPlist = _context8.t0.parse.call(_context8.t0, _context8.t1);

                                if (parsedPlist) {
                                    _context8.next = 30;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.');

                            case 30:
                                macosPath = path.join(this._file, 'Contents', 'MacOS');
                                _context8.next = 33;
                                return common_1.default.fsExists(macosPath);

                            case 33:
                                if (_context8.sent) {
                                    _context8.next = 35;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. Missing MacOS directory.');

                            case 35:
                                _context8.next = 37;
                                return common_1.default.fsStat(macosPath);

                            case 37:
                                macosStat = _context8.sent;

                                if (macosStat.isDirectory()) {
                                    _context8.next = 40;
                                    break;
                                }

                                throw new Error('That doesn\'t look like a valid Mac OS X bundle. MacOS isn\'t a valid directory.');

                            case 40:
                                baseName = path.basename(this._file);
                                executableName = parsedPlist.CFBundleExecutable || baseName.substr(0, baseName.length - '.app'.length);
                                executableFile = path.join(macosPath, executableName);
                                _context8.next = 45;
                                return common_1.default.chmod(executableFile, '0755');

                            case 45:
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

                            case 48:
                                return _context8.abrupt("return", Launcher.attach(pid, null, pollInterval));

                            case 49:
                            case "end":
                                return _context8.stop();
                        }
                    }
                }, _callee8, this);
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
}();

exports.LaunchHandle = LaunchHandle;

var LaunchInstanceHandle = function (_events_1$EventEmitte) {
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
        value: function tick(validate) {
            var _this3 = this;

            return pid_finder_1.PidFinder.find(this._pid, validate ? this._expectedCmd : null).then(function (result) {
                if (!result || result.size === 0) {
                    throw new Error('Process doesn\'t exist anymore');
                }
                if (!_this3._expectedCmd) {
                    _this3._expectedCmd = new _set2.default();
                }
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = (0, _getIterator3.default)(result.values()), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var value = _step6.value;

                        if (!_this3._expectedCmd.has(value)) {
                            log('Adding new expected cmd to launch instance handle ' + _this3._pid + ': ' + value);
                        }
                        _this3._expectedCmd.add(value);
                        var expectedCmdValues = [];
                        var _iteratorNormalCompletion7 = true;
                        var _didIteratorError7 = false;
                        var _iteratorError7 = undefined;

                        try {
                            for (var _iterator7 = (0, _getIterator3.default)(_this3._expectedCmd.values()), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                var expectedCmdValue = _step7.value;

                                expectedCmdValues.push(expectedCmdValue);
                            }
                        } catch (err) {
                            _didIteratorError7 = true;
                            _iteratorError7 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                    _iterator7.return();
                                }
                            } finally {
                                if (_didIteratorError7) {
                                    throw _iteratorError7;
                                }
                            }
                        }

                        var emittedPid = {
                            pid: _this3._pid,
                            expectedCmds: expectedCmdValues
                        };
                        _this3.emit('pid', (0, _stringify2.default)(emittedPid));
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }
            }).catch(function (err) {
                clearInterval(_this3._interval);
                console.log(err);
                _this3.emit('end', err);
                throw err;
            });
        }
    }, {
        key: "pid",
        get: function get() {
            return this._pid;
        }
    }, {
        key: "cmd",
        get: function get() {
            return this._expectedCmd;
        }
    }]);
    return LaunchInstanceHandle;
}(events_1.EventEmitter);

exports.LaunchInstanceHandle = LaunchInstanceHandle;
//# sourceMappingURL=index.js.map
