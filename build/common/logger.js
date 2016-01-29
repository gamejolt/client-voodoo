"use strict";

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

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
var util = require('util');
var os = require('os');
var _ = require('lodash');
var fs = require('fs');
var index_1 = require('./index');
var LOG_LINES = 300;
var CONSOLE_LOG = console.log;
var CONSOLE_ERR = console.error;

var Logger = (function () {
    function Logger() {
        (0, _classCallCheck3.default)(this, Logger);
    }

    (0, _createClass3.default)(Logger, null, [{
        key: "_flushFile",
        value: function _flushFile() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var str;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.prev = 0;

                                if (this._file) {
                                    this._file.close();
                                }
                                this._file = null;
                                _context.next = 5;
                                return index_1.default.fsUnlink(this._filePath);

                            case 5:
                                str = this._logLines.join('\n') + '\n';
                                _context.next = 8;
                                return index_1.default.fsWriteFile(this._filePath, str);

                            case 8:
                                CONSOLE_LOG.apply(console, ['Flushing log file of length ' + this._logLines.join('\n').length + ' with ' + this._logLines.length + ' rows']);
                                this._file = fs.createWriteStream(this._filePath, {
                                    flags: 'a',
                                    encoding: 'utf8'
                                });
                                _context.next = 15;
                                break;

                            case 12:
                                _context.prev = 12;
                                _context.t0 = _context["catch"](0);

                                CONSOLE_LOG.apply(console, ['Babel sucks: ' + _context.t0.message + '\n' + _context.t0.stack]);

                            case 15:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[0, 12]]);
            }));
        }
    }, {
        key: "_log",
        value: function _log() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            CONSOLE_LOG.apply(console, args);
            var str = util.format.apply(console, args).split('\n');
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(str), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var strVal = _step.value;

                    this._logLines.push(strVal);
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

            if (this._file) {
                this._file.write(str + '\n');
            }
            if (this._logLines.length > LOG_LINES) {
                this._logLines = _.clone(this._logLines.slice(this._logLines.length - LOG_LINES));
            }
        }
    }, {
        key: "_logErr",
        value: function _logErr() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            CONSOLE_ERR.apply(console, args);
            var str = util.format.apply(console, args).split('\n');
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(str), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var strVal = _step2.value;

                    this._logLines.push(strVal);
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

            if (this._file) {
                this._file.write(str + '\n');
            }
            if (this._logLines.length > LOG_LINES) {
                this._logLines = this._logLines.slice(this._logLines.length - LOG_LINES);
            }
        }
    }, {
        key: "hijack",
        value: function hijack(file) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var readLines, flushFunc;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!this._hijacked) {
                                    _context2.next = 2;
                                    break;
                                }

                                return _context2.abrupt("return");

                            case 2:
                                this._filePath = file || 'client.log';
                                _context2.next = 5;
                                return index_1.default.fsExists(this._filePath);

                            case 5:
                                if (!_context2.sent) {
                                    _context2.next = 18;
                                    break;
                                }

                                _context2.prev = 6;
                                _context2.next = 9;
                                return index_1.default.fsReadFile(this._filePath, 'utf8');

                            case 9:
                                readLines = _context2.sent;

                                console.log(typeof readLines === "undefined" ? "undefined" : (0, _typeof3.default)(readLines));
                                this._logLines = readLines.split('\n');
                                if (this._logLines.length > LOG_LINES) {
                                    this._logLines = this._logLines.slice(this._logLines.length - LOG_LINES);
                                }
                                _context2.next = 18;
                                break;

                            case 15:
                                _context2.prev = 15;
                                _context2.t0 = _context2["catch"](6);

                                console.log('Seroiusly babel gtfo: ' + _context2.t0.message + '\n' + _context2.t0.stack);

                            case 18:
                                this._file = fs.createWriteStream(this._filePath, {
                                    flags: 'a',
                                    encoding: 'utf8'
                                });
                                flushFunc = this._flushFile.bind(this);

                                this._flushInterval = setInterval(flushFunc, 10000);
                                console.log = this._log.bind(this);
                                console.info = this._log.bind(this);
                                console.warn = this._logErr.bind(this);
                                console.error = this._logErr.bind(this);
                                this._hijacked = true;

                            case 26:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[6, 15]]);
            }));
        }
    }, {
        key: "unhijack",
        value: function unhijack() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (this._hijacked) {
                                    _context3.next = 2;
                                    break;
                                }

                                return _context3.abrupt("return");

                            case 2:
                                clearInterval(this._flushInterval);
                                if (this._file) {
                                    this._file.close();
                                }
                                _context3.next = 6;
                                return index_1.default.fsWriteFile(this._filePath, this._logLines.join('\n'));

                            case 6:
                                console.log = CONSOLE_LOG;
                                console.info = CONSOLE_LOG;
                                console.warn = CONSOLE_ERR;
                                console.error = CONSOLE_ERR;
                                this._hijacked = false;

                            case 11:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "getClientLog",
        value: function getClientLog() {
            return {
                logLines: _.clone(this._logLines),
                osInfo: {
                    os: os.platform(),
                    arch: os.arch(),
                    release: os.release(),
                    uptime: os.uptime(),
                    freeMemory: os.freemem(),
                    totalMemory: os.totalmem(),
                    cpuCount: os.cpus().length
                }
            };
        }
    }]);
    return Logger;
})();

Logger._logLines = [];
Logger._hijacked = false;
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map
