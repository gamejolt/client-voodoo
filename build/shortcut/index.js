"use strict";

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

var Shortcut = (function () {
    function Shortcut() {
        (0, _classCallCheck3.default)(this, Shortcut);
    }

    (0, _createClass3.default)(Shortcut, null, [{
        key: "create",
        value: function create(program, icon) {
            if (process.platform === 'linux') {
                return this.createLinux(program, icon);
            } else {
                throw new Error('Not supported');
            }
        }
    }, {
        key: "createLinux",
        value: function createLinux(program, icon) {
            var desktopContents = '[Desktop Entry]\nVersion=1.0\nType=Application\nName=Game Jolt Client\nGenericName=Game Client\nComment=The power of Game Jolt website in your desktop\nExec=' + program + '\nTerminal=false\nIcon=' + icon + '\nCategories=Game;\nKeywords=Play;Games;GJ;GameJolt;Indie;\nHidden=false\nName[en_US]=Game Jolt Client\n';
            return common_1.default.fsWriteFile(path.join(xdgBasedir.data, 'applications', 'Game Jolt Client.desktop'), desktopContents);
        }
    }]);
    return Shortcut;
})();

exports.default = Shortcut;
//# sourceMappingURL=index.js.map
