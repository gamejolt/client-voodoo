"use strict";

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
