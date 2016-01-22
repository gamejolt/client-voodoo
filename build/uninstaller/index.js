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
var del = require('del');

var Uninstaller = function () {
    function Uninstaller() {
        (0, _classCallCheck3.default)(this, Uninstaller);
    }

    (0, _createClass3.default)(Uninstaller, null, [{
        key: "uninstall",
        value: function uninstall(localPackage) {
            return new UninstallHandle(localPackage);
        }
    }]);
    return Uninstaller;
}();

exports.Uninstaller = Uninstaller;

var UninstallHandle = function () {
    function UninstallHandle(_localPackage) {
        (0, _classCallCheck3.default)(this, UninstallHandle);

        this._localPackage = _localPackage;
        this._promise = del(this._localPackage.install_dir, {
            cwd: this._localPackage.install_dir,
            force: true
        });
    }

    (0, _createClass3.default)(UninstallHandle, [{
        key: "dir",
        get: function get() {
            return this._localPackage.install_dir;
        }
    }, {
        key: "promise",
        get: function get() {
            return this._promise;
        }
    }]);
    return UninstallHandle;
}();

exports.UninstallHandle = UninstallHandle;
//# sourceMappingURL=index.js.map
