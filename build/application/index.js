"use strict";
var common_1 = require("../common");
var MUTEX_NAME = 'game-jolt-client';
var Application = (function () {
    function Application() {
    }
    Object.defineProperty(Application, "PID_DIR", {
        get: function () {
            return this._pidDir;
        },
        enumerable: true,
        configurable: true
    });
    Application.ensurePidDir = function () {
        return common_1.default.mkdirp(this._pidDir);
    };
    Application.setPidDir = function (pidDir) {
        if (!this._pidDir) {
            this._pidDir = pidDir;
            return true;
        }
        return false;
    };
    Application.start = function () {
        var _this = this;
        var Mutex = require('windows-mutex');
        console.log('Acquiring le mutex');
        this.mutex = null;
        try {
            this.mutex = new Mutex(MUTEX_NAME);
        }
        catch (e) {
        }
        process.on('exit', function () { return _this.stop(); });
    };
    Application.stop = function () {
        console.log('Releasing le mutex');
        if (this.mutex) {
            this.mutex.release();
            this.mutex = null;
        }
    };
    return Application;
}());
exports.Application = Application;
//# sourceMappingURL=index.js.map