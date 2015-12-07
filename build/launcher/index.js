"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

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
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');
var Bluebird = require('bluebird');
var fsExists = function fsExists(path) {
    return new _promise2.default(function (resolve) {
        fs.exists(path, resolve);
    });
};
var fsStat = Bluebird.promisify(fs.stat);
var fsChmod = Bluebird.promisify(fs.chmod);

var Launcher = (function () {
    function Launcher() {
        (0, _classCallCheck3.default)(this, Launcher);
    }

    (0, _createClass3.default)(Launcher, null, [{
        key: "launch",
        value: function launch(build, os, arch) {
            return new LaunchHandle(build, os, arch);
        }
    }]);
    return Launcher;
})();

exports.Launcher = Launcher;

var LaunchHandle = (function () {
    function LaunchHandle(_build, _os, _arch) {
        (0, _classCallCheck3.default)(this, LaunchHandle);

        this._build = _build;
        this._os = _os;
        this._arch = _arch;
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
                for (var _iterator = (0, _getIterator3.default)(this._build.launch_options), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var launchOption = _step.value;

                    var lOs = launchOption.os.split('_');
                    if (lOs.length === 1) {
                        lOs.push('32');
                    }
                    if (lOs[0] === this._os) {
                        if (lOs[1] === this._arch) {
                            return launchOption;
                        }
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
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var launchOption, executablePath, stat, mode, uid, gid, child, pid;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                launchOption = this.findLaunchOption();

                                if (launchOption) {
                                    _context.next = 3;
                                    break;
                                }

                                throw new Error('Can\'t find valid launch options for the given os/arch');

                            case 3:
                                executablePath = launchOption.executable_path.replace(/\//, path.sep);

                                this._file = path.join(this._build.install_dir, 'game', executablePath);
                                // If the destination already exists, make sure its valid.
                                _context.next = 7;
                                return fsExists(this._file);

                            case 7:
                                if (_context.sent) {
                                    _context.next = 9;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file doesn\'t exist.');

                            case 9:
                                _context.next = 11;
                                return fsStat(this._file);

                            case 11:
                                stat = _context.sent;

                                if (stat.isFile()) {
                                    _context.next = 14;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file isn\'t valid.');

                            case 14:
                                if (!(process.platform !== 'win32')) {
                                    _context.next = 23;
                                    break;
                                }

                                mode = stat.mode;

                                if (mode) {
                                    _context.next = 18;
                                    break;
                                }

                                throw new Error('Can\'t determine if the file is executable by the current user.');

                            case 18:
                                uid = stat.uid;
                                gid = stat.gid;

                                if (!(!(mode & parseInt('0001', 8)) && !(mode & parseInt('0010', 8)) && process.getgid && gid === process.getgid() && !(mode & parseInt('0100', 8)) && process.getuid && uid === process.getuid())) {
                                    _context.next = 23;
                                    break;
                                }

                                _context.next = 23;
                                return fsChmod(this._file, '0777');

                            case 23:
                                child = childProcess.spawn(this._file, [], {
                                    cwd: path.dirname(this._file),
                                    detached: true
                                });
                                pid = child.pid;

                                child.unref();
                                return _context.abrupt("return", pid);

                            case 27:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "build",
        get: function get() {
            return this._build;
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
//# sourceMappingURL=index.js.map
