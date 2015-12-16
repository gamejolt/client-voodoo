"use strict";

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
var fs = require('fs');
var _ = require('lodash');
var tarFS = require('tar-fs');
var events_1 = require('events');
var StreamSpeed = require('../downloader/stream-speed');
var common_1 = require('../common');

var Extractor = (function () {
    function Extractor() {
        (0, _classCallCheck3.default)(this, Extractor);
    }

    (0, _createClass3.default)(Extractor, null, [{
        key: "extract",
        value: function extract(from, to, options) {
            return new ExtractHandle(from, to, options);
        }
    }]);
    return Extractor;
})();

exports.Extractor = Extractor;

var ExtractHandle = (function () {
    function ExtractHandle(_from, _to, _options) {
        (0, _classCallCheck3.default)(this, ExtractHandle);

        this._from = _from;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            deleteSource: false,
            overwrite: false
        });
        this._emitter = new events_1.EventEmitter();
    }

    (0, _createClass3.default)(ExtractHandle, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this = this;

                var srcStat, destStat, filesInDest;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(this._running || this._terminated)) {
                                    _context.next = 4;
                                    break;
                                }

                                return _context.abrupt("return", false);

                            case 4:
                                if (!this._readStream) {
                                    _context.next = 8;
                                    break;
                                }

                                this._pipe();
                                this._readStream.resume();
                                return _context.abrupt("return", true);

                            case 8:
                                this._running = true;
                                this._promise = this.promise; // Make sure a promise exists when starting.
                                _context.next = 12;
                                return common_1.default.fsExists(this._from);

                            case 12:
                                if (_context.sent) {
                                    _context.next = 14;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because the source does not exist');

                            case 14:
                                _context.next = 16;
                                return common_1.default.fsStat(this._from);

                            case 16:
                                srcStat = _context.sent;

                                if (srcStat.isFile()) {
                                    _context.next = 19;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because the source is not a valid file');

                            case 19:
                                this._totalSize = srcStat.size;
                                this._totalProcessed = 0;
                                // If the destination already exists, make sure its valid.
                                _context.next = 23;
                                return common_1.default.fsExists(this._to);

                            case 23:
                                if (!_context.sent) {
                                    _context.next = 37;
                                    break;
                                }

                                _context.next = 26;
                                return common_1.default.fsStat(this._to);

                            case 26:
                                destStat = _context.sent;

                                if (destStat.isDirectory()) {
                                    _context.next = 29;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because its not a valid directory');

                            case 29:
                                _context.next = 31;
                                return common_1.default.fsReadDir(this._to);

                            case 31:
                                filesInDest = _context.sent;

                                if (!(filesInDest && filesInDest.length > 0)) {
                                    _context.next = 35;
                                    break;
                                }

                                if (this._options.overwrite) {
                                    _context.next = 35;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because it isnt empty');

                            case 35:
                                _context.next = 41;
                                break;

                            case 37:
                                _context.next = 39;
                                return common_1.default.mkdirp(this._to);

                            case 39:
                                if (_context.sent) {
                                    _context.next = 41;
                                    break;
                                }

                                throw new Error('Couldn\'t create destination folder path');

                            case 41:
                                if (!this._terminated) {
                                    _context.next = 43;
                                    break;
                                }

                                return _context.abrupt("return", false);

                            case 43:
                                return _context.abrupt("return", new _promise2.default(function (resolve) {
                                    return _this.extract(resolve);
                                }));

                            case 44:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "extract",
        value: function extract(resolve) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _this2 = this;

                var files, result, unlinked;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                files = [];
                                result = undefined;
                                _context2.prev = 2;
                                _context2.next = 5;
                                return new _promise2.default(function (_resolve, _reject) {
                                    _this2._readStream = fs.createReadStream(_this2._from);
                                    // If stopped between starting and here, the stop wouldn't have registered this read stream. So just do it now.
                                    if (!_this2._running) {
                                        _this2.stop(false);
                                    }
                                    var optionsMap = _this2._options.map;
                                    _this2._extractStream = tarFS.extract(_this2._to, _.assign(_this2._options, {
                                        map: function map(header) {
                                            if (optionsMap) {
                                                header = optionsMap(header);
                                            }
                                            // TODO: fuggin symlinks and the likes.
                                            if (header && header.type === 'file') {
                                                files.push(header.name);
                                                _this2.emitFile(header);
                                            }
                                            return header;
                                        }
                                    }));
                                    _this2._extractStream.on('finish', function () {
                                        return _resolve(true);
                                    });
                                    _this2._extractStream.on('error', function (err) {
                                        return _reject(err);
                                    });
                                    _this2._streamSpeed = new StreamSpeed.StreamSpeed(_this2._options);
                                    _this2._streamSpeed.stop(); //  Dont auto start. _pipe will take care of that
                                    _this2._streamSpeed.onSample(function (sample) {
                                        return _this2.emitProgress({
                                            progress: _this2._totalProcessed / _this2._totalSize,
                                            timeLeft: Math.round((_this2._totalSize - _this2._totalProcessed) / sample.currentAverage),
                                            sample: sample
                                        });
                                    });
                                    if (_this2._options.decompressStream) {
                                        _this2._streamSpeed.pipe(_this2._options.decompressStream).pipe(_this2._extractStream);
                                    } else {
                                        _this2._streamSpeed.pipe(_this2._extractStream);
                                    }
                                    _this2._pipe();
                                    resolve(true);
                                });

                            case 5:
                                result = _context2.sent;
                                _context2.next = 13;
                                break;

                            case 8:
                                _context2.prev = 8;
                                _context2.t0 = _context2["catch"](2);

                                resolve(false);
                                this._rejector(_context2.t0);
                                return _context2.abrupt("return");

                            case 13:
                                if (!(result && this._options.deleteSource)) {
                                    _context2.next = 24;
                                    break;
                                }

                                _context2.next = 16;
                                return common_1.default.fsUnlink(this._from);

                            case 16:
                                unlinked = _context2.sent;
                                _context2.t1 = unlinked;

                                if (!_context2.t1) {
                                    _context2.next = 22;
                                    break;
                                }

                                _context2.next = 21;
                                return common_1.default.fsExists(this._from);

                            case 21:
                                _context2.t1 = _context2.sent;

                            case 22:
                                if (!_context2.t1) {
                                    _context2.next = 24;
                                    break;
                                }

                                throw unlinked;

                            case 24:
                                this._resolver({
                                    success: result,
                                    files: files
                                });

                            case 25:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this, [[2, 8]]);
            }));
        }
    }, {
        key: "onProgress",
        value: function onProgress(unit, fn) {
            this._emitter.addListener('progress', function (progress) {
                progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
                fn(progress);
            });
            return this;
        }
    }, {
        key: "emitProgress",
        value: function emitProgress(progress) {
            this._emitter.emit('progress', progress);
        }
    }, {
        key: "onFile",
        value: function onFile(fn) {
            this._emitter.addListener('file', fn);
            return this;
        }
    }, {
        key: "emitFile",
        value: function emitFile(file) {
            this._emitter.emit('file', file);
        }
    }, {
        key: "_pipe",
        value: function _pipe() {
            var _this3 = this;

            this._readStream.on('data', function (data) {
                _this3._totalProcessed += data.length;
            }).on('error', function (err) {
                return _this3._rejector(err);
            });
            this._readStream.pipe(this._streamSpeed);
            this._streamSpeed.start();
        }
    }, {
        key: "_unpipe",
        value: function _unpipe() {
            this._readStream.unpipe();
            this._readStream.removeAllListeners();
            this._streamSpeed.stop();
        }
    }, {
        key: "stop",
        value: function stop(terminate) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var readStreamHack;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                this._running = false;
                                if (terminate) {
                                    this._terminated = true;
                                    readStreamHack = this._readStream;

                                    readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams
                                } else {
                                        this._readStream.pause();
                                        this._unpipe();
                                    }
                                return _context3.abrupt("return", true);

                            case 3:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "from",
        get: function get() {
            return this._from;
        }
    }, {
        key: "to",
        get: function get() {
            return this._to;
        }
    }, {
        key: "promise",
        get: function get() {
            var _this4 = this;

            if (!this._promise) {
                this._promise = new _promise2.default(function (resolve, reject) {
                    _this4._resolver = function (result) {
                        console.log('done');
                        if (this._streamSpeed) {
                            console.log('Removing stream speed');
                            this._streamSpeed.stop();
                        }
                        if (!this._terminated) {
                            resolve(result);
                        }
                    };
                    _this4._rejector = function (err) {
                        if (this._streamSpeed) {
                            this._streamSpeed.stop();
                        }
                        reject(err);
                    };
                });
            }
            return this._promise;
        }
    }]);
    return ExtractHandle;
})();

exports.ExtractHandle = ExtractHandle;
//# sourceMappingURL=index.js.map
