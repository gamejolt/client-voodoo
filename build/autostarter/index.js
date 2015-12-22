"use strict";

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
var common_1 = require('../common');
var xdgBasedir = require('xdg-basedir');
var Winreg = require('winreg');
var Bluebird = require('bluebird');
var applescript = Bluebird.promisify(require('applescript').execString);
var shellEscape = require('shell-escape');
var autostartId = 'GameJoltClient';

var WindowsAutostarter = (function () {
    function WindowsAutostarter() {
        (0, _classCallCheck3.default)(this, WindowsAutostarter);
    }

    (0, _createClass3.default)(WindowsAutostarter, [{
        key: "set",
        value: function set(program, args) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                return _context.abrupt("return", new _promise2.default(function (resolve) {
                                    WindowsAutostarter.getKey().set(autostartId, Winreg.REG_SZ, '\"' + program + '\"' + (args && args.length ? ' ' + args.join(' ') : ''), resolve);
                                }));

                            case 1:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "unset",
        value: function unset() {
            return new _promise2.default(function (resolve) {
                WindowsAutostarter.getKey().remove(autostartId, resolve);
            });
        }
    }, {
        key: "isset",
        value: function isset() {
            return new _promise2.default(function (resolve) {
                WindowsAutostarter.getKey().get(autostartId, function (err, item) {
                    resolve(!!item);
                });
            });
        }
    }], [{
        key: "getKey",
        value: function getKey() {
            return new Winreg({
                hive: Winreg.HKCU,
                key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
            });
        }
    }]);
    return WindowsAutostarter;
})();

var LinuxAutostarter = (function () {
    function LinuxAutostarter() {
        (0, _classCallCheck3.default)(this, LinuxAutostarter);
    }

    (0, _createClass3.default)(LinuxAutostarter, [{
        key: "createRunner",
        value: function createRunner(program, runner, args) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var runnerScript;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                runnerScript = '#!/bin/bash\n' + 'if [ -e "' + program + '" ]; then\n' + '	' + shellEscape([program].concat(args || [])) + '\n' + 'fi';
                                _context2.next = 3;
                                return common_1.default.fsWriteFile(runner, runnerScript);

                            case 3:
                                _context2.next = 5;
                                return common_1.default.chmod(runner, '0777');

                            case 5:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "set",
        value: function set(program, args, runner) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var desktopContents;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.next = 2;
                                return this.createRunner(program, runner, args);

                            case 2:
                                desktopContents = '[Desktop Entry]\n' + 'Version=1.0\n' + 'Type=Application\n' + 'Name=Game Jolt Client\n' + 'GenericName=Game Client\n' + 'Comment=The power of Game Jolt website in your desktop\n' + 'Exec=' + runner + '\n' + 'Terminal=false\n' + 'Categories=Game;\n' + 'Keywords=Play;GJ;GameJolt;\n' + 'Hidden=false\n' + 'Name[en_US]=Game Jolt Client\n' + 'TX-GNOME-Autostart-enabled=true\n';
                                _context3.next = 5;
                                return common_1.default.fsWriteFile(LinuxAutostarter.desktopFilePath, desktopContents);

                            case 5:
                                _context3.next = 7;
                                return common_1.default.chmod(LinuxAutostarter.desktopFilePath, '0777');

                            case 7:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "unset",
        value: function unset() {
            return common_1.default.fsUnlink(LinuxAutostarter.desktopFilePath).then(function (err) {
                if (err) {
                    throw err;
                }
            });
        }
    }, {
        key: "isset",
        value: function isset() {
            return common_1.default.fsExists(LinuxAutostarter.desktopFilePath);
        }
    }]);
    return LinuxAutostarter;
})();

LinuxAutostarter.desktopFilePath = path.join(xdgBasedir.config, 'autostart', autostartId + '.desktop');

var MacAutostarter = (function () {
    function MacAutostarter() {
        (0, _classCallCheck3.default)(this, MacAutostarter);
    }

    (0, _createClass3.default)(MacAutostarter, [{
        key: "createRunner",
        value: function createRunner(program, runner, args) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                var runnerScript;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                runnerScript = '#!/bin/bash\n' + 'if [ -e "' + program + '" ]; then\n' + '	' + shellEscape([program].concat(args || [])) + '\n' + 'fi';
                                _context4.next = 3;
                                return common_1.default.fsWriteFile(runner, runnerScript);

                            case 3:
                                _context4.next = 5;
                                return common_1.default.chmod(runner, '0777');

                            case 5:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "set",
        value: function set(program, args, runner) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                _context5.next = 2;
                                return this.createRunner(program, runner, args);

                            case 2:
                                return _context5.abrupt("return", applescript('tell application "System Events" to make login item at end with properties {path:"' + runner + '", hidden:false, name:"' + autostartId + '"}'));

                            case 3:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: "unset",
        value: function unset(runner) {
            return applescript('tell application "System Events" to delete every login item whose name is "' + autostartId + '"');
        }
    }, {
        key: "isset",
        value: function isset() {
            return applescript('tell application "System Events" to get the name of every login item').then(function (loginItems) {
                return loginItems && loginItems.indexOf(autostartId) !== -1;
            });
        }
    }]);
    return MacAutostarter;
})();

var Autostarter = (function () {
    function Autostarter() {
        (0, _classCallCheck3.default)(this, Autostarter);
    }

    (0, _createClass3.default)(Autostarter, null, [{
        key: "_getAutostarter",
        value: function _getAutostarter() {
            switch (process.platform) {
                case 'win32':
                    return this.winAutostarter;
                case 'linux':
                    return this.linuxAutostarter;
                case 'darwin':
                    return this.macAutostarter;
            }
        }
    }, {
        key: "set",
        value: function set(path, args, runner) {
            var _this = this;

            return this.unset(path).then(function () {
                return _this._getAutostarter().set(path, args, runner);
            });
        }
    }, {
        key: "unset",
        value: function unset(runner) {
            var _this2 = this;

            var autostarter = this._getAutostarter();
            return this.isset().then(function (isset) {
                if (isset) {
                    return _this2._getAutostarter().unset(runner);
                }
            });
        }
    }, {
        key: "isset",
        value: function isset() {
            return this._getAutostarter().isset();
        }
    }]);
    return Autostarter;
})();

Autostarter.winAutostarter = new WindowsAutostarter();
Autostarter.linuxAutostarter = new LinuxAutostarter();
Autostarter.macAutostarter = new MacAutostarter();
exports.Autostarter = Autostarter;
//# sourceMappingURL=index.js.map
