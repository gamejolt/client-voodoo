"use strict";
var del = require("del");
var Uninstaller = (function () {
    function Uninstaller() {
    }
    Uninstaller.uninstall = function (localPackage) {
        return new UninstallHandle(localPackage);
    };
    return Uninstaller;
}());
exports.Uninstaller = Uninstaller;
var UninstallHandle = (function () {
    function UninstallHandle(_localPackage) {
        this._localPackage = _localPackage;
        this._promise = del(this._localPackage.install_dir, {
            cwd: this._localPackage.install_dir,
            force: true,
        });
    }
    Object.defineProperty(UninstallHandle.prototype, "dir", {
        get: function () {
            return this._localPackage.install_dir;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UninstallHandle.prototype, "promise", {
        get: function () {
            return this._promise;
        },
        enumerable: true,
        configurable: true
    });
    return UninstallHandle;
}());
exports.UninstallHandle = UninstallHandle;
//# sourceMappingURL=index.js.map