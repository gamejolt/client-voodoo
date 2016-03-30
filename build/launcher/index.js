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

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

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
var _ = require('lodash');
var common_1 = require('../common');
var pid_finder_1 = require('./pid-finder');
var queue_1 = require('../queue');
var plist = require('plist');
var shellEscape = require('shell-escape');
var spawnShellEscape = function spawnShellEscape(cmd) {
    return '"' + cmd.replace(/(["\s'$`\\])/g, '\\$1') + '"';
};
var GameWrapper = require('client-game-wrapper');
function log(message) {
    console.log('Launcher: ' + message);
}

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
        value: function attach(options) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
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
                                                    wrapper = undefined;
                                                    instance = undefined;

                                                    if (!options.instance) {
                                                        _context.next = 7;
                                                        break;
                                                    }

                                                    instance = options.instance;
                                                    log("Attaching existing instance: id - " + instance.wrapperId + ", port - " + instance.wrapperPort + ", poll interval - " + options.pollInterval);
                                                    _context.next = 19;
                                                    break;

                                                case 7:
                                                    if (!options.stringifiedWrapper) {
                                                        _context.next = 13;
                                                        break;
                                                    }

                                                    parsedWrapper = JSON.parse(options.stringifiedWrapper);

                                                    instance = new LaunchInstanceHandle(parsedWrapper.wrapperId, parsedWrapper.wrapperPort, options.pollInterval);
                                                    log("Attaching new instance from stringified wrapper: id - " + instance.wrapperId + ", port - " + instance.wrapperPort + ", poll interval - " + options.pollInterval);
                                                    _context.next = 19;
                                                    break;

                                                case 13:
                                                    if (!(options.wrapperId && options.wrapperPort)) {
                                                        _context.next = 18;
                                                        break;
                                                    }

                                                    instance = new LaunchInstanceHandle(options.wrapperId, options.wrapperPort, options.pollInterval);
                                                    log("Attaching new instance: id - " + instance.wrapperId + ", port - " + instance.wrapperPort + ", poll interval - " + options.pollInterval);
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
                                                    return _context.abrupt("break", 37);

                                                case 28:
                                                    _context.next = 32;
                                                    break;

                                                case 30:
                                                    _context.prev = 30;
                                                    _context.t0 = _context["catch"](22);

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
                                                    return _context.abrupt("return", {
                                                        v: instance
                                                    });

                                                case 44:
                                                case "end":
                                                    return _context.stop();
                                            }
                                        }
                                    }, _callee, _this, [[22, 30]]);
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
        value: function detach(wrapperId, expectedWrapperPort) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var instance;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                log("Detaching: wrapperId - " + wrapperId + ", expected port - " + expectedWrapperPort);
                                instance = this._runningInstances.get(wrapperId);

                                if (instance && (!expectedWrapperPort || instance.wrapperPort === expectedWrapperPort)) {
                                    instance.removeAllListeners();
                                    if (this._runningInstances.delete(wrapperId) && this._runningInstances.size === 0) {
                                        queue_1.VoodooQueue.setFaster();
                                    }
                                } else {
                                    log('No instance with this pid and cmd was found');
                                }

                            case 3:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
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
        this.options = options;
        this.options = _.defaultsDeep(this.options || {}, {
            pollInterval: 1000,
            env: _.cloneDeep(process.env)
        });
        this._promise = this.start();
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
        value: function start() {
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
                                return _context5.abrupt("return", this.startWindows(stat, isJava));

                            case 18:
                                return _context5.abrupt("return", this.startLinux(stat, isJava));

                            case 19:
                                return _context5.abrupt("return", this.startMac(stat, isJava));

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
        value: function startWindows(stat, isJava) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee6() {
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
                                cmd = undefined, args = undefined;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, this._file, args, {
                                    cwd: path.dirname(this._file),
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context6.abrupt("return", Launcher.attach({
                                    wrapperId: wrapperId,
                                    wrapperPort: wrapperPort,
                                    pollInterval: this.options.pollInterval
                                }));

                            case 7:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));
        }
    }, {
        key: "startLinux",
        value: function startLinux(stat, isJava) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee7() {
                var cmd, args, wrapperId, wrapperPort;
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
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, this._file, args, {
                                    cwd: path.dirname(this._file),
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context7.abrupt("return", Launcher.attach({
                                    wrapperId: wrapperId,
                                    wrapperPort: wrapperPort,
                                    pollInterval: this.options.pollInterval
                                }));

                            case 9:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));
        }
    }, {
        key: "startMac",
        value: function startMac(stat, isJava) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee8() {
                var pid, cmd, args, wrapperId, wrapperPort, plistPath, plistStat, parsedPlist, macosPath, macosStat, baseName, executableName, executableFile;
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
                                cmd = undefined, args = undefined;

                                if (isJava) {
                                    cmd = 'java';
                                    args = ['-jar', this._file];
                                } else {
                                    cmd = this._file;
                                    args = [];
                                }
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, this._file, args, {
                                    cwd: path.dirname(this._file),
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context8.abrupt("return", Launcher.attach({
                                    wrapperId: wrapperId,
                                    wrapperPort: wrapperPort,
                                    pollInterval: this.options.pollInterval
                                }));

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
                                wrapperId = this._localPackage.id.toString();
                                wrapperPort = GameWrapper.start(wrapperId, executableFile, [], {
                                    cwd: macosPath,
                                    detached: true,
                                    env: this.options.env
                                });
                                return _context8.abrupt("return", Launcher.attach({
                                    wrapperId: wrapperId,
                                    wrapperPort: wrapperPort,
                                    pollInterval: this.options.pollInterval
                                }));

                            case 48:
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
})();

exports.LaunchHandle = LaunchHandle;

var LaunchInstanceHandle = (function (_events_1$EventEmitte) {
    (0, _inherits3.default)(LaunchInstanceHandle, _events_1$EventEmitte);

    function LaunchInstanceHandle(_wrapperId, _wrapperPort, pollInterval) {
        (0, _classCallCheck3.default)(this, LaunchInstanceHandle);

        var _this2 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(LaunchInstanceHandle).call(this));

        _this2._wrapperId = _wrapperId;
        _this2._wrapperPort = _wrapperPort;
        _this2._interval = setInterval(function () {
            return _this2.tick();
        }, pollInterval || 1000);
        _this2._stable = false;
        return _this2;
    }

    (0, _createClass3.default)(LaunchInstanceHandle, [{
        key: "tick",
        value: function tick() {
            var _this3 = this;

            return pid_finder_1.WrapperFinder.find(this._wrapperId, this._wrapperPort).then(function () {
                _this3._stable = true;
                return true;
            }).catch(function (err) {
                if (_this3._stable) {
                    clearInterval(_this3._interval);
                    console.error(err);
                    _this3.emit('end', err);
                    throw err;
                }
                return false;
            });
        }
    }, {
        key: "abort",
        value: function abort(err) {
            clearInterval(this._interval);
            console.error(err);
            this.emit('end', err);
            throw err;
        }
    }, {
        key: "pid",
        get: function get() {
            return {
                wrapperId: this._wrapperId,
                wrapperPort: this._wrapperPort
            };
        }
    }, {
        key: "wrapperId",
        get: function get() {
            return this._wrapperId;
        }
    }, {
        key: "wrapperPort",
        get: function get() {
            return this._wrapperPort;
        }
    }]);
    return LaunchInstanceHandle;
})(events_1.EventEmitter);

exports.LaunchInstanceHandle = LaunchInstanceHandle;
//# sourceMappingURL=index.js.map
