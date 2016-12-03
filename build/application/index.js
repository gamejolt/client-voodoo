"use strict";
var MUTEX_NAME = 'game-jolt-client';
var Application = (function () {
    function Application() {
    }
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