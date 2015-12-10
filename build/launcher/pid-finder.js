"use strict";

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
var childProcess = require('child_process');

var PidFinder = (function () {
    function PidFinder() {
        (0, _classCallCheck3.default)(this, PidFinder);
    }

    (0, _createClass3.default)(PidFinder, null, [{
        key: "isWindows",
        value: function isWindows() {
            return process.platform === 'win32';
        }
    }, {
        key: "find",
        value: function find(pid) {
            return this.isWindows() ? this.findWindows(pid) : this.findNonWindows(pid);
        }
    }, {
        key: "findWindows",
        value: function findWindows(pid) {
            return new _promise2.default(function (resolve, reject) {
                var cmd = childProcess.exec('tasklist.exe /FI:"PID eq ' + pid.toString() + '" /FO:CSV', function (err, stdout, stderr) {
                    if (err) {
                        return reject(err);
                    }
                    var data = stdout.toString().split('\n').filter(function (value) {
                        return !!value;
                    });
                    resolve(data.length >= 2);
                });
            });
        }
    }, {
        key: "findNonWindows",
        value: function findNonWindows(pid) {
            return new _promise2.default(function (resolve, reject) {
                var cmd = childProcess.exec('ps -p ' + pid.toString(), function (err, stdout, stderr) {
                    if (err) {
                        return reject(err);
                    }
                    var data = stdout.toString().split('\n');
                    resolve(data.length >= 2);
                });
            });
        }
    }]);
    return PidFinder;
})();

exports.PidFinder = PidFinder;
//# sourceMappingURL=pid-finder.js.map
