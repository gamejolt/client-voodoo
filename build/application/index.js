"use strict";
<<<<<<< HEAD

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var common_1 = require('../common');
=======
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
var MUTEX_NAME = 'game-jolt-client';
var Application = (function () {
    function Application() {
    }
<<<<<<< HEAD

    (0, _createClass3.default)(Application, null, [{
        key: 'ensurePidDir',
        value: function ensurePidDir() {
            return common_1.default.mkdirp(this._pidDir);
        }
    }, {
        key: 'setPidDir',
        value: function setPidDir(pidDir) {
            if (!this._pidDir) {
                this._pidDir = pidDir;
                return true;
            }
            return false;
        }
    }, {
        key: 'start',
        value: function start() {
            var _this = this;

            var Mutex = require('windows-mutex');
            console.log('Acquiring le mutex');
            this.mutex = null;
            try {
                this.mutex = new Mutex(MUTEX_NAME);
            } catch (e) {}
            process.on('exit', function () {
                return _this.stop();
            });
=======
    Application.start = function () {
        var _this = this;
        var Mutex = require('windows-mutex');
        console.log('Acquiring le mutex');
        this.mutex = null;
        try {
            this.mutex = new Mutex(MUTEX_NAME);
        }
        catch (e) {
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
        }
        process.on('exit', function () { return _this.stop(); });
    };
    Application.stop = function () {
        console.log('Releasing le mutex');
        if (this.mutex) {
            this.mutex.release();
            this.mutex = null;
        }
<<<<<<< HEAD
    }, {
        key: 'PID_DIR',
        get: function get() {
            return this._pidDir;
        }
    }]);
=======
    };
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
    return Application;
}());
exports.Application = Application;
//# sourceMappingURL=index.js.map