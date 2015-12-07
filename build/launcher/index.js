"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

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
        value: function launch(file) {
            return new LaunchHandle(file);
        }
    }]);
    return Launcher;
})();

exports.Launcher = Launcher;

var LaunchHandle = (function () {
    function LaunchHandle(_file) {
        (0, _classCallCheck3.default)(this, LaunchHandle);

        this._file = _file;
        this._promise = this.start();
    }

    (0, _createClass3.default)(LaunchHandle, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var stat, mode, uid, gid, launchableFile, child, pid;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return fsExists(this._file);

                            case 2:
                                if (_context.sent) {
                                    _context.next = 4;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file doesn\'t exist.');

                            case 4:
                                _context.next = 6;
                                return fsStat(this._file);

                            case 6:
                                stat = _context.sent;

                                if (stat.isFile()) {
                                    _context.next = 9;
                                    break;
                                }

                                throw new Error('Can\'t launch because the file isn\'t valid.');

                            case 9:
                                if (!(process.platform !== 'win32')) {
                                    _context.next = 18;
                                    break;
                                }

                                mode = stat.mode;

                                if (mode) {
                                    _context.next = 13;
                                    break;
                                }

                                throw new Error('Can\'t determine if the file is executable by the current user.');

                            case 13:
                                uid = stat.uid;
                                gid = stat.gid;

                                if (!(!(mode & parseInt('0001', 8)) && !(mode & parseInt('0010', 8)) && process.getgid && gid === process.getgid() && !(mode & parseInt('0100', 8)) && process.getuid && uid === process.getuid())) {
                                    _context.next = 18;
                                    break;
                                }

                                _context.next = 18;
                                return fsChmod(this._file, '0777');

                            case 18:
                                launchableFile = path.resolve(process.cwd(), this._file);
                                child = childProcess.spawn(launchableFile, [], {
                                    cwd: path.dirname(launchableFile),
                                    detached: true
                                });
                                pid = child.pid;

                                child.unref();
                                return _context.abrupt("return", pid);

                            case 23:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
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
