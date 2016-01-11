"use strict";

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

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
function log(message) {
    console.log('Pid Finder: ' + message);
}

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
        value: function find(pid, expectedCmd) {
            return PidFinder.isWindows() ? PidFinder.findWindows(pid, expectedCmd) : PidFinder.findNonWindows(pid, expectedCmd);
        }
    }, {
        key: "findWindows",
        value: function findWindows(pid, expectedCmd) {
            return new _promise2.default(function (resolve, reject) {
                var expectedCmdArray = [];
                if (expectedCmd && expectedCmd.size) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = (0, _getIterator3.default)(expectedCmd.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var expectedCmdValue = _step.value;

                            expectedCmdArray.push(expectedCmdValue);
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }

                    log('Finding pid on windows. pid: ' + pid + ', expected cmds: ' + (0, _stringify2.default)(expectedCmdArray));
                } else {
                    log('Finding pid on windows. pid: ' + pid + ', no expected cmd');
                }
                log('Running cmd: "tasklist.exe /FI"pid eq ' + pid + '" /FO:CSV"');
                var cmd = childProcess.exec('tasklist.exe /FI:"PID eq ' + pid.toString() + '" /FO:CSV', function (err, stdout, stderr) {
                    var result = new _set2.default();
                    if (err) {
                        log('Error: ' + err.message);
                        return reject(err);
                    }
                    var dataStr = stdout.toString();
                    log('Result: ' + dataStr);
                    var data = dataStr.split('\n').filter(function (value) {
                        return !!value;
                    });
                    if (data.length < 2) {
                        return resolve(result);
                    }
                    var found = false;
                    for (var i = 1; i < data.length; i++) {
                        var imageName = /^\"(.*?)\",/.exec(data[i]);
                        if (expectedCmd && expectedCmd.has(imageName[1])) {
                            log('Bingo, we\'re still running');
                            found = true;
                        }
                        log('Found matching process: ' + imageName[1]);
                        result.add(imageName[1]);
                    }
                    if (expectedCmd && expectedCmd.size && !found) {
                        log('Expected to match with a cmd name but none did.');
                        log('Returning empty set');
                        result.clear();
                        resolve(result);
                    }
                    log('Returning');
                    resolve(result);
                });
            });
        }
    }, {
        key: "findNonWindows",
        value: function findNonWindows(pid, expectedCmd) {
            return new _promise2.default(function (resolve, reject) {
                var expectedCmdArray = [];
                if (expectedCmd && expectedCmd.size) {
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = (0, _getIterator3.default)(expectedCmd.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var expectedCmdValue = _step2.value;

                            expectedCmdArray.push(expectedCmdValue);
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }

                    log('Finding pid on non windows. pid: ' + pid + ', expected cmds: ' + (0, _stringify2.default)(expectedCmdArray));
                } else {
                    log('Finding pid on non windows. pid: ' + pid + ', no expected cmd');
                }
                log('Running cmd: "ps -p ' + pid + ' -o cmd"');
                var cmd = childProcess.exec('ps -p ' + pid.toString() + ' -o cmd', function (err, stdout, stderr) {
                    var result = new _set2.default();
                    if (err) {
                        log('Error: ' + err.message);
                        log('Suppressing, returning empty set');
                        // Have to resolve to '' instead of rejecting even on error cases.
                        // This is because on no processes found stupid ps also returns a failed signal code.
                        // return reject( err );
                        return resolve(result);
                    }
                    var dataStr = stdout.toString();
                    log('Result: ' + dataStr);
                    var data = dataStr.split(/[\r\n]/).filter(function (value) {
                        return !!value;
                    });
                    var found = false;
                    for (var i = 1; i < data.length; i++) {
                        if (expectedCmd && expectedCmd.has(data[i])) {
                            log('Bingo, we\'re still running');
                            found = true;
                        }
                        log('Found matching process: ' + data[i]);
                        result.add(data[i]);
                    }
                    if (expectedCmd && expectedCmd.size && !found) {
                        log('Expected to match with a cmd name but none did.');
                        log('Returning empty set');
                        result.clear();
                        resolve(result);
                    }
                    log('Returning');
                    resolve(result);
                });
            });
        }
    }]);
    return PidFinder;
})();

exports.PidFinder = PidFinder;
//# sourceMappingURL=pid-finder.js.map
