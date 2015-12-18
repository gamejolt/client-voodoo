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
var url = require('url');
var path = require('path');
var events_1 = require('events');
var _ = require('lodash');
var request = require('request');
var StreamSpeed = require('./stream-speed');
var Resumable = require('../common/resumable');
var common_1 = require('../common');

var Downloader = (function () {
    function Downloader() {
        (0, _classCallCheck3.default)(this, Downloader);
    }

    (0, _createClass3.default)(Downloader, null, [{
        key: "download",
        value: function download(generateUrl, to, options) {
            return new DownloadHandle(generateUrl, to, options);
        }
    }]);
    return Downloader;
})();

exports.Downloader = Downloader;
function log(message) {
    console.log('Downloader: ' + message);
}

var DownloadHandle = (function () {
    function DownloadHandle(_generateUrl, _to, _options) {
        var _this = this;

        (0, _classCallCheck3.default)(this, DownloadHandle);

        this._generateUrl = _generateUrl;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            overwrite: false
        });
        this._promise = new _promise2.default(function (resolve, reject) {
            _this._resolver = resolve;
            _this._rejector = reject;
        });
        this._emitter = new events_1.EventEmitter();
        this._resumable = new Resumable.Resumable();
        this._totalSize = 0;
        this._totalDownloaded = 0;
    }

    (0, _createClass3.default)(DownloadHandle, [{
        key: "prepareFS",
        value: function prepareFS() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var stat, unlinked, toDir, dirStat;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                log('Preparing fs');
                                // If the actual file already exists, we resume download.
                                _context.next = 3;
                                return common_1.default.fsExists(this._to);

                            case 3:
                                if (!_context.sent) {
                                    _context.next = 21;
                                    break;
                                }

                                _context.next = 6;
                                return common_1.default.fsStat(this._to);

                            case 6:
                                stat = _context.sent;

                                if (stat.isFile()) {
                                    _context.next = 11;
                                    break;
                                }

                                throw new Error('Can\'t resume downloading because the destination isn\'t a file.');

                            case 11:
                                if (!this._options.overwrite) {
                                    _context.next = 18;
                                    break;
                                }

                                _context.next = 14;
                                return common_1.default.fsUnlink(this._to);

                            case 14:
                                unlinked = _context.sent;

                                if (!unlinked) {
                                    _context.next = 17;
                                    break;
                                }

                                throw new Error('Can\'t download because destination cannot be overwritten.');

                            case 17:
                                stat.size = 0;

                            case 18:
                                this._totalDownloaded = stat.size;
                                _context.next = 36;
                                break;

                            case 21:
                                toDir = path.dirname(this._to);
                                _context.next = 24;
                                return common_1.default.fsExists(toDir);

                            case 24:
                                if (!_context.sent) {
                                    _context.next = 32;
                                    break;
                                }

                                _context.next = 27;
                                return common_1.default.fsStat(toDir);

                            case 27:
                                dirStat = _context.sent;

                                if (dirStat.isDirectory()) {
                                    _context.next = 30;
                                    break;
                                }

                                throw new Error('Can\'t download to destination because the path is invalid.');

                            case 30:
                                _context.next = 36;
                                break;

                            case 32:
                                _context.next = 34;
                                return common_1.default.mkdirp(toDir);

                            case 34:
                                if (_context.sent) {
                                    _context.next = 36;
                                    break;
                                }

                                throw new Error('Couldn\'t create the destination folder path');

                            case 36:
                                this._options.overwrite = false;

                            case 37:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "generateUrl",
        value: function generateUrl() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _generateUrl;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                log('Generating url');
                                _generateUrl = this._generateUrl;

                                if (!(typeof _generateUrl === 'string')) {
                                    _context2.next = 6;
                                    break;
                                }

                                this._url = _generateUrl;
                                _context2.next = 9;
                                break;

                            case 6:
                                _context2.next = 8;
                                return _generateUrl();

                            case 8:
                                this._url = _context2.sent;

                            case 9:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "download",
        value: function download() {
            var _this2 = this;

            log('Downloading from ' + this._url);
            var hostUrl = url.parse(this._url);
            var httpOptions = {
                headers: {
                    'Range': 'bytes=' + this._totalDownloaded.toString() + '-'
                }
            };
            this._destStream = fs.createWriteStream(this._to, {
                flags: 'a'
            });
            this._request = request.get(this._url, httpOptions).on('response', function (response) {
                // If received a redirect, simply skip the response and wait for the next one
                if (response.statusCode === 301) {
                    return;
                }
                _this2._response = response;
                _this2._streamSpeed = new StreamSpeed.StreamSpeed(_this2._options);
                _this2._streamSpeed.onSample(function (sample) {
                    return _this2.emitProgress({
                        progress: _this2._totalDownloaded / _this2._totalSize,
                        timeLeft: Math.round((_this2._totalSize - _this2._totalDownloaded) / sample.currentAverage),
                        sample: sample
                    });
                }).on('error', function (err) {
                    return _this2.onError(err);
                });
                // Unsatisfiable request - most likely we've downloaded the whole thing already.
                // TODO - send HEAD request to get content-length and compare.
                if (_this2._response.statusCode === 416) {
                    _this2.onFinished();
                    return;
                }
                // Expecting the partial response status code
                if (_this2._response.statusCode !== 206) {
                    return _this2.onError(new Error('Bad status code ' + _this2._response.statusCode));
                }
                if (!_this2._response.headers || !_this2._response.headers['content-range']) {
                    return _this2.onError(new Error('Missing or invalid content-range response header'));
                }
                try {
                    _this2._totalSize = parseInt(_this2._response.headers['content-range'].split('/')[1]);
                } catch (err) {
                    return _this2.onError(new Error('Invalid content-range header: ' + _this2._response.headers['content-range']));
                }
                if (_this2._options.decompressStream) {
                    _this2._request.pipe(_this2._streamSpeed).pipe(_this2._options.decompressStream).pipe(_this2._destStream);
                } else {
                    _this2._request.pipe(_this2._streamSpeed).pipe(_this2._destStream);
                }
                _this2._destStream.on('finish', function () {
                    return _this2.onFinished();
                });
                _this2._destStream.on('error', function (err) {
                    return _this2.onError(err);
                });
                _this2._resumable.started();
                _this2._emitter.emit('started');
                log('Resumable state: started');
            }).on('data', function (data) {
                _this2._totalDownloaded += data.length;
            }).on('error', function (err) {
                if (!_this2._response) {
                    throw err;
                } else {
                    _this2.onError(err);
                }
            });
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
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                log('Resumable state: starting');
                                _context3.prev = 1;
                                _context3.next = 4;
                                return this.prepareFS();

                            case 4:
                                _context3.next = 6;
                                return this.generateUrl();

                            case 6:
                                this.download();
                                _context3.next = 13;
                                break;

                            case 9:
                                _context3.prev = 9;
                                _context3.t0 = _context3["catch"](1);

                                log('I hate you babel: ' + _context3.t0.message + '\n' + _context3.t0.stack);
                                this.onError(_context3.t0);

                            case 13:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[1, 9]]);
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
        value: function stop() {
            log('Stopping resumable');
            this._resumable.stop({ cb: this.onStopping, context: this });
        }
    }, {
        key: "onStopping",
        value: function onStopping() {
            log('Resumable state: stopping');
            this._streamSpeed.stop();
            this._streamSpeed = null;
            this._response.removeAllListeners();
            this._destStream.removeAllListeners();
            this._response.unpipe(this._destStream);
            this._destStream.close();
            this._destStream = null;
            this._request.abort();
            this._request = null;
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
        key: "onError",
        value: function onError(err) {
            var _this3 = this;

            this._resumable.stop({ cb: function cb() {
                    return _this3.onErrorStopping(err);
                }, context: this }, true);
        }
    }, {
        key: "onErrorStopping",
        value: function onErrorStopping(err) {
            this.onStopping();
            this._resumable.finished();
            this._rejector(err);
        }
    }, {
        key: "onFinished",
        value: function onFinished() {
            if (this._resumable.state === Resumable.State.STARTING) {
                this._resumable.started();
                this._emitter.emit('started');
                log('Resumable state: started');
            }
            this.onStopping();
            this._resumable.finished();
            this._resolver();
        }
    }, {
        key: "url",
        get: function get() {
            return this._url;
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
        key: "totalSize",
        get: function get() {
            return this._totalSize;
        }
    }, {
        key: "totalDownloaded",
        get: function get() {
            return this._totalDownloaded;
        }
    }, {
        key: "promise",
        get: function get() {
            return this._promise;
        }
    }]);
    return DownloadHandle;
})();

exports.DownloadHandle = DownloadHandle;
//# sourceMappingURL=index.js.map
