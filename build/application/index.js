"use strict";

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var common_1 = require('../common');
var MUTEX_NAME = 'game-jolt-client';

var Application = function () {
    function Application() {
        (0, _classCallCheck3.default)(this, Application);
    }

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
        }
    }, {
        key: 'stop',
        value: function stop() {
            console.log('Releasing le mutex');
            if (this.mutex) {
                this.mutex.release();
                this.mutex = null;
            }
        }
    }, {
        key: 'PID_DIR',
        get: function get() {
            return this._pidDir;
        }
    }]);
    return Application;
}();

exports.Application = Application;
//# sourceMappingURL=index.js.map
