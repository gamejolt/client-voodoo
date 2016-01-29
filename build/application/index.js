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
var windows_mutex_1 = require('windows-mutex');
var MUTEX_NAME = 'game-jolt-client';

var Application = (function () {
    function Application() {
        (0, _classCallCheck3.default)(this, Application);
    }

    (0, _createClass3.default)(Application, null, [{
        key: "start",
        value: function start() {
            var _this = this;

            console.log('Acquiring le mutex');
            this.mutex = null;
            try {
                this.mutex = new windows_mutex_1.Mutex(MUTEX_NAME);
            } catch (e) {}
            process.on('exit', function () {
                return _this.stop();
            });
        }
    }, {
        key: "stop",
        value: function stop() {
            console.log('Releasing le mutex');
            if (this.mutex) {
                this.mutex.release();
                this.mutex = null;
            }
        }
    }]);
    return Application;
})();

exports.Application = Application;
//# sourceMappingURL=index.js.map
