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
var Resumable = require('../common/resumable');
var common_1 = require('../common');
var through2 = require('through2');

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
function log(message) {
    console.log('Extractor: ' + message);
}

var ExtractHandle = (function () {
    function ExtractHandle(_from, _to, _options) {
        var _this = this;

        (0, _classCallCheck3.default)(this, ExtractHandle);

        this._from = _from;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            deleteSource: false,
            overwrite: false
        });
        this._firstRun = true;
        this._promise = new _promise2.default(function (resolve, reject) {
            _this._resolver = resolve;
            _this._rejector = reject;
        });
        this._emitter = new events_1.EventEmitter();
        this._resumable = new Resumable.Resumable();
        this._extractedFiles = [];
        this._totalSize = 0;
        this._totalProcessed = 0;
    }

    (0, _createClass3.default)(ExtractHandle, [{
        key: "prepareFS",
        value: function prepareFS() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var srcStat, destStat, filesInDest;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                log('Preparing fs');
                                _context.next = 3;
                                return common_1.default.fsExists(this._from);

                            case 3:
                                if (_context.sent) {
                                    _context.next = 5;
                                    break;
                                }

                                throw new Error('Can\'t unpack to destination because the source does not exist');

                            case 5:
                                _context.next = 7;
                                return common_1.default.fsStat(this._from);

                            case 7:
                                srcStat = _context.sent;

                                if (srcStat.isFile()) {
                                    _context.next = 10;
                                    break;
                                }

                                throw new Error('Can\'t unpack to destination because the source is not a valid file');

                            case 10:
                                this._totalSize = srcStat.size;
                                this._totalProcessed = 0;
                                // If the destination already exists, make sure its valid.
                                _context.next = 14;
                                return common_1.default.fsExists(this._to);

                            case 14:
                                if (!_context.sent) {
                                    _context.next = 28;
                                    break;
                                }

                                _context.next = 17;
                                return common_1.default.fsStat(this._to);

                            case 17:
                                destStat = _context.sent;

                                if (destStat.isDirectory()) {
                                    _context.next = 20;
                                    break;
                                }

                                throw new Error('Can\'t unpack to destination because its not a valid directory');

                            case 20:
                                _context.next = 22;
                                return common_1.default.fsReadDir(this._to);

                            case 22:
                                filesInDest = _context.sent;

                                if (!(filesInDest && filesInDest.length > 0)) {
                                    _context.next = 26;
                                    break;
                                }

                                if (this._options.overwrite) {
                                    _context.next = 26;
                                    break;
                                }

                                throw new Error('Can\'t unpack to destination because it isnt empty');

                            case 26:
                                _context.next = 32;
                                break;

                            case 28:
                                _context.next = 30;
                                return common_1.default.mkdirp(this._to);

                            case 30:
                                if (_context.sent) {
                                    _context.next = 32;
                                    break;
                                }

                                throw new Error('Couldn\'t create destination folder path');

                            case 32:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "unpack",
        value: function unpack() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _this2 = this;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                log('Unpacking from ' + this._from + ' to ' + this._to);
                                return _context2.abrupt("return", new _promise2.default(function (resolve, reject) {
                                    _this2._readStream = fs.createReadStream(_this2._from);
                                    _this2._readStream.on('error', function (err) {
                                        return _this2._rejector(err);
                                    });
                                    var optionsMap = _this2._options.map;
                                    _this2._extractStream = tarFS.extract(_this2._to, _.assign(_this2._options, {
                                        map: function map(header) {
                                            if (optionsMap) {
                                                header = optionsMap(header);
                                            }
                                            // TODO: fuggin symlinks and the likes.
                                            if (header && header.type === 'file') {
                                                _this2._extractedFiles.push(header.name);
                                                _this2.emitFile(header);
                                            }
                                            return header;
                                        }
                                    }));
                                    _this2._extractStream.on('finish', function () {
                                        return resolve();
                                    });
                                    _this2._extractStream.on('error', function (err) {
                                        return reject(err);
                                    });
                                    _this2._streamSpeed = new StreamSpeed.StreamSpeed(_this2._options);
                                    _this2._streamSpeed.stop(); //  Dont auto start. resume() will take care of that
                                    _this2._streamSpeed.onSample(function (sample) {
                                        return _this2.emitProgress({
                                            progress: _this2._totalProcessed / _this2._totalSize,
                                            timeLeft: Math.round((_this2._totalSize - _this2._totalProcessed) / sample.currentAverage),
                                            sample: sample
                                        });
                                    });
                                    if (_this2._options.decompressStream) {
                                        _this2._streamSpeed.stream.pipe(_this2._options.decompressStream).pipe(_this2._extractStream);
                                    } else {
                                        _this2._streamSpeed.stream.pipe(_this2._extractStream);
                                    }
                                    _this2.resume();
                                    _this2._resumable.started();
                                    _this2._emitter.emit('started');
                                    log('Resumable state: started');
                                }));

                            case 2:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "start",
        value: function start() {
            log('Starting resumable');
            this._resumable.start({ cb: this.onStarting, context: this });
        }
    }, {
        key: "onStarting",
        value: function onStarting() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var unlinked;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                log('Resumable state: starting');

                                if (!this._firstRun) {
                                    _context3.next = 28;
                                    break;
                                }

                                this._firstRun = false;
                                _context3.prev = 3;
                                _context3.next = 6;
                                return this.prepareFS();

                            case 6:
                                _context3.next = 8;
                                return this.unpack();

                            case 8:
                                if (!this._options.deleteSource) {
                                    _context3.next = 19;
                                    break;
                                }

                                _context3.next = 11;
                                return common_1.default.fsUnlink(this._from);

                            case 11:
                                unlinked = _context3.sent;
                                _context3.t0 = unlinked;

                                if (!_context3.t0) {
                                    _context3.next = 17;
                                    break;
                                }

                                _context3.next = 16;
                                return common_1.default.fsExists(this._from);

                            case 16:
                                _context3.t0 = _context3.sent;

                            case 17:
                                if (!_context3.t0) {
                                    _context3.next = 19;
                                    break;
                                }

                                throw unlinked;

                            case 19:
                                this.onFinished();
                                _context3.next = 26;
                                break;

                            case 22:
                                _context3.prev = 22;
                                _context3.t1 = _context3["catch"](3);

                                log('I really hate you babel: ' + _context3.t1.message + '\n' + _context3.t1.stack);
                                this.onError(_context3.t1);

                            case 26:
                                _context3.next = 32;
                                break;

                            case 28:
                                this.resume();
                                this._resumable.started();
                                this._emitter.emit('started');
                                log('Resumable state: started');

                            case 32:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[3, 22]]);
            }));
        }
    }, {
        key: "onStarted",
        value: function onStarted(cb) {
            this._emitter.once('started', cb);
            return this;
        }
    }, {
        key: "stop",
        value: function stop(terminate) {
            log('Stopping resumable');
            this._resumable.stop({ cb: terminate ? this.onTerminating : this.onStopping, context: this });
        }
    }, {
        key: "onStopping",
        value: function onStopping() {
            log('Resumable state: stopping');
            this.pause();
            this._resumable.stopped();
            this._emitter.emit('stopped');
            log('Resumable state: stopped');
        }
    }, {
        key: "onStopped",
        value: function onStopped(cb) {
            this._emitter.once('stopped', cb);
            return this;
        }
    }, {
        key: "onTerminating",
        value: function onTerminating() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                var readStreamHack, _unlinked;

                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                log('Resumable state: stopping');
                                readStreamHack = this._readStream;

                                readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams

                                if (!this._options.deleteSource) {
                                    _context4.next = 14;
                                    break;
                                }

                                _context4.next = 6;
                                return common_1.default.fsUnlink(this._from);

                            case 6:
                                _unlinked = _context4.sent;
                                _context4.t0 = _unlinked;

                                if (!_context4.t0) {
                                    _context4.next = 12;
                                    break;
                                }

                                _context4.next = 11;
                                return common_1.default.fsExists(this._from);

                            case 11:
                                _context4.t0 = _context4.sent;

                            case 12:
                                if (!_context4.t0) {
                                    _context4.next = 14;
                                    break;
                                }

                                throw _unlinked;

                            case 14:
                                this._resumable.stopped();
                                this._emitter.emit('stopped');
                                log('Resumable state: stopped');

                            case 17:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
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
        key: "resume",
        value: function resume() {
            var _this3 = this;

            this._readStream.pipe(through2(function (chunk, enc, cb) {
                _this3._totalProcessed += chunk.length;
                cb(null, chunk);
            })).pipe(this._streamSpeed.stream);
            this._streamSpeed.start();
        }
    }, {
        key: "pause",
        value: function pause() {
            if (this._readStream) {
                this._readStream.unpipe();
            }
            if (this._streamSpeed) {
                this._streamSpeed.stop();
            }
        }
    }, {
        key: "onError",
        value: function onError(err) {
            log(err.message + '\n' + err.stack);
            if (this._resumable.state === Resumable.State.STARTING) {
                log('Forced to stop before started. Marking as started first. ');
                this._resumable.started();
                this._emitter.emit('started');
                log('Resumable state: started');
            }
            this._resumable.stop({ cb: this.onErrorStopping, args: [err], context: this }, true);
        }
    }, {
        key: "onErrorStopping",
        value: function onErrorStopping(err) {
            this.pause();
            this._resumable.finished();
            this._rejector(err);
        }
    }, {
        key: "onFinished",
        value: function onFinished() {
            if (this._resumable.state === Resumable.State.STARTING) {
                log('Forced to stop before started. Marking as started first. ');
                this._resumable.started();
                this._emitter.emit('started');
                log('Resumable state: started');
            }
            this.pause();
            this._resumable.finished();
            this._resolver({
                files: this._extractedFiles
            });
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
        key: "state",
        get: function get() {
            return this._resumable.state;
        }
    }, {
        key: "promise",
        get: function get() {
            return this._promise;
        }
    }]);
    return ExtractHandle;
})();

exports.ExtractHandle = ExtractHandle;
//# sourceMappingURL=index.js.map
