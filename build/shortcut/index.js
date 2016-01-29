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
var shellEscape = require('shell-escape');

var Shortcut = (function () {
    function Shortcut() {
        (0, _classCallCheck3.default)(this, Shortcut);
    }

    (0, _createClass3.default)(Shortcut, null, [{
        key: "create",
        value: function create(program, icon) {
            var _this = this;

            if (process.platform === 'linux') {
                return this.removeLinux().then(function () {
                    return _this.createLinux(program, icon);
                });
            } else {
                throw new Error('Not supported');
            }
        }
    }, {
        key: "remove",
        value: function remove() {
            if (process.platform === 'linux') {
                return this.removeLinux();
            } else {
                throw new Error('Not supported');
            }
        }
    }, {
        key: "createLinux",
        value: function createLinux(program, icon) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var desktopFile, desktopContents;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                desktopFile = path.join(xdgBasedir.data, 'applications', 'game-jolt-client.desktop');
                                desktopContents = '[Desktop Entry]\n' + 'Version=1.0\n' + 'Type=Application\n' + 'Name=Game Jolt Client\n' + 'GenericName=Game Client\n' + 'Comment=The power of Game Jolt website in your desktop\n' + 'Exec=' + shellEscape([program]) + '\n' + 'Terminal=false\n' + 'Icon=' + icon + '\n' + 'Categories=Game;\n' + 'Keywords=Play;Games;GJ;GameJolt;Indie;\n' + 'Hidden=false\n' + 'Name[en_US]=Game Jolt Client\n';
                                _context.next = 4;
                                return common_1.default.fsWriteFile(desktopFile, desktopContents);

                            case 4:
                                return _context.abrupt("return", common_1.default.chmod(desktopFile, '0755'));

                            case 5:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "removeLinux",
        value: function removeLinux() {
            var desktopFile = path.join(xdgBasedir.data, 'applications', 'game-jolt-client.desktop');
            var oldDesktopFile = path.join(xdgBasedir.data, 'applications', 'Game Jolt Client.desktop');
            return _promise2.default.all([common_1.default.fsUnlink(desktopFile), common_1.default.fsUnlink(oldDesktopFile)]).then(function () {
                return true;
            }).catch(function (err) {
                return false;
            });
        }
    }]);
    return Shortcut;
})();

exports.Shortcut = Shortcut;
//# sourceMappingURL=index.js.map
