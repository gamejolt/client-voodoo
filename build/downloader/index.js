"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

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
var http = require('http');
var url = require('url');
var path = require('path');
var events_1 = require('events');
var _ = require('lodash');
var decompressStream = require('iltorb').decompressStream;
var Bluebird = require('bluebird');
var mkdirp = Bluebird.promisify(require('mkdirp'));
var fsUnlink = Bluebird.promisify(fs.unlink);
var fsExists = function fsExists(path) {
    return new _promise2.default(function (resolve) {
        fs.exists(path, resolve);
    });
};
var fsStat = Bluebird.promisify(fs.stat);

var Downloader = (function () {
    function Downloader() {
        (0, _classCallCheck3.default)(this, Downloader);
    }

    (0, _createClass3.default)(Downloader, null, [{
        key: "download",
        value: function download(from, to, options) {
            return new DownloadHandle(from, to, options);
        }
    }]);
    return Downloader;
})();

exports.Downloader = Downloader;
(function (DownloadHandleState) {
    DownloadHandleState[DownloadHandleState["STARTED"] = 0] = "STARTED";
    DownloadHandleState[DownloadHandleState["STARTING"] = 1] = "STARTING";
    DownloadHandleState[DownloadHandleState["STOPPED"] = 2] = "STOPPED";
    DownloadHandleState[DownloadHandleState["STOPPING"] = 3] = "STOPPING";
    DownloadHandleState[DownloadHandleState["FINISHED"] = 4] = "FINISHED";
})(exports.DownloadHandleState || (exports.DownloadHandleState = {}));
var DownloadHandleState = exports.DownloadHandleState;
var TICKS_PER_SECOND = 2;

var DownloadHandle = (function () {
    function DownloadHandle(_from, _to, options) {
        (0, _classCallCheck3.default)(this, DownloadHandle);

        this._from = _from;
        this._to = _to;
        options = _.defaults(options || {}, {
            brotli: true
        });
        this._useBrotli = options.brotli;
        this._state = DownloadHandleState.STOPPED;
        this._emitter = new events_1.EventEmitter();
        this.start();
    }

    (0, _createClass3.default)(DownloadHandle, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var parsedDownloadUrl, exists, stat;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(this._state !== DownloadHandleState.STOPPED)) {
                                    _context.next = 2;
                                    break;
                                }

                                return _context.abrupt("return", false);

                            case 2:
                                this._state = DownloadHandleState.STARTING;
                                this._promise = this.promise; // Make sure a promise exists when starting.
                                this._peakSpeed = 0;
                                this._lowSpeed = 0;
                                this._avgSpeed = 0;
                                this._speedTicksCount = 0;
                                this._curSpeed = 0;
                                this._curSpeedTicks = [];
                                this._totalSize = 0;
                                this._totalDownloaded = 0;
                                _context.prev = 12;
                                parsedDownloadUrl = url.parse(this._from, true);

                                this._toFilename = path.parse(parsedDownloadUrl.pathname).base;
                                this._toFile = path.join(this._to, this._toFilename);
                                _context.next = 18;
                                return fsExists(this._toFile);

                            case 18:
                                exists = _context.sent;
                                _context.next = 21;
                                return fsExists(this._toFile);

                            case 21:
                                if (!_context.sent) {
                                    _context.next = 28;
                                    break;
                                }

                                _context.next = 24;
                                return fsStat(this._toFile);

                            case 24:
                                stat = _context.sent;

                                this._totalDownloaded = stat.size;
                                _context.next = 32;
                                break;

                            case 28:
                                _context.next = 30;
                                return mkdirp(this._to);

                            case 30:
                                if (_context.sent) {
                                    _context.next = 32;
                                    break;
                                }

                                throw new Error('Couldn\'t create the destination folder path');

                            case 32:
                                _context.next = 37;
                                break;

                            case 34:
                                _context.prev = 34;
                                _context.t0 = _context["catch"](12);

                                this.onError(_context.t0);

                            case 37:
                                this.download();
                                return _context.abrupt("return", true);

                            case 39:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[12, 34]]);
            }));
        }
    }, {
        key: "stop",
        value: function stop() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!(this._state !== DownloadHandleState.STARTED)) {
                                    _context2.next = 2;
                                    break;
                                }

                                return _context2.abrupt("return", false);

                            case 2:
                                this._state = DownloadHandleState.STOPPING;
                                clearInterval(this._curSpeedInterval);
                                this._response.removeAllListeners();
                                this._destStream.removeAllListeners();
                                this._response.unpipe(this._destStream);
                                this._destStream.close();
                                this._request.abort();
                                this._state = DownloadHandleState.STOPPED;
                                return _context2.abrupt("return", true);

                            case 11:
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
            var _this = this;

            var hostUrl = url.parse(this._from);
            var httpOptions = {
                host: hostUrl.host,
                path: hostUrl.path,
                headers: {
                    'Range': 'bytes=' + this._totalDownloaded.toString() + '-'
                }
            };
            this._destStream = fs.createWriteStream(this._toFile, {
                encoding: 'binary',
                flags: 'a'
            });
            this._request = http.request(httpOptions, function (response) {
                _this._response = response;
                _this._curSpeedInterval = setInterval(_this.onTick.bind(_this), 1000 / TICKS_PER_SECOND);
                _this._state = DownloadHandleState.STARTED;
                // Unsatisfiable request - most likely we've downloaded the whole thing already.
                // TODO - send HEAD request to get content-length and compare.
                if (_this._response.statusCode == 416) {
                    return _this.onFinished();
                }
                // Expecting the partial response status code
                if (_this._response.statusCode != 206) {
                    return _this.onError(new Error('Bad status code ' + _this._response.statusCode));
                }
                if (!_this._response.headers || !_this._response.headers['content-range']) {
                    return _this.onError(new Error('Missing or invalid content-range response header'));
                }
                try {
                    _this._totalSize = parseInt(_this._response.headers['content-range'].split('/')[1]);
                } catch (err) {
                    return _this.onError(new Error('Invalid content-range header: ' + _this._response.headers['content-range']));
                }
                _this._response.setEncoding('binary');
                // if ( this._useBrotli ) {
                // 	this._response
                // 		.pipe( decompressStream() )
                // 		.pipe( this._destStream );
                // }
                // else {
                // 	this._response.pipe( this._destStream );
                // }
                _this._response.pipe(_this._destStream);
                _this._response.on('data', function (data) {
                    _this._totalDownloaded += data.length;
                    _this._curSpeed += data.length;
                });
                _this._destStream.on('finish', function () {
                    return _this.onFinished();
                });
                _this._response.on('error', function (err) {
                    return _this.onError(err);
                });
                _this._destStream.on('error', function (err) {
                    return _this.onError(err);
                });
            });
            this._request.on('error', function (err) {
                return _this.onError(err);
            });
            this._request.end();
        }
    }, {
        key: "onProgress",
        value: function onProgress(fn) {
            this._emitter.addListener('progress', fn);
            return this;
        }
    }, {
        key: "onTick",
        value: function onTick() {
            this._curSpeedTicks.unshift(this._curSpeed);
            this._speedTicksCount += 1;
            this._avgSpeed += (this._curSpeed - this._avgSpeed) / this._speedTicksCount;
            this._peakSpeed = Math.max(this._peakSpeed, this._curSpeed);
            this._lowSpeed = Math.min(this._lowSpeed || Infinity, this._curSpeed);
            if (this._curSpeedTicks.length > 5 * TICKS_PER_SECOND) {
                this._curSpeedTicks.pop();
            }
            this._emitter.emit('progress', {
                progress: this._totalDownloaded / this._totalSize,
                curKbps: this.currentKbps,
                peakKbps: this.peakKbps,
                lowKbps: this.lowKbps,
                avgKbps: this.avgKbps
            });
            this._curSpeed = 0;
        }
    }, {
        key: "onError",
        value: function onError(err) {
            this.stop();
            this._rejector(err);
            this._promise = null;
        }
    }, {
        key: "onFinished",
        value: function onFinished() {
            this.stop();
            this._state = DownloadHandleState.FINISHED;
            this._resolver();
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
        key: "peakKbps",
        get: function get() {
            return this._peakSpeed / 1024 / TICKS_PER_SECOND;
        }
    }, {
        key: "lowKbps",
        get: function get() {
            return this._lowSpeed / 1024 / TICKS_PER_SECOND;
        }
    }, {
        key: "avgKbps",
        get: function get() {
            return this._avgSpeed / 1024 / TICKS_PER_SECOND;
        }
    }, {
        key: "currentKbps",
        get: function get() {
            return this._curSpeed / 1024 / TICKS_PER_SECOND;
        }
    }, {
        key: "currentAveragedSpeed",
        get: function get() {
            if (this._curSpeedTicks.length === 0) {
                return this.currentKbps;
            }
            var sum = this._curSpeedTicks.reduce(function (accumulated, current) {
                return accumulated + current / 1024 / TICKS_PER_SECOND;
            }, 0);
            return sum / this._curSpeedTicks.length;
        }
    }, {
        key: "promise",
        get: function get() {
            var _this2 = this;

            if (!this._promise) {
                this._promise = new _promise2.default(function (resolve, reject) {
                    _this2._resolver = resolve;
                    _this2._rejector = reject;
                });
            }
            return this._promise;
        }
    }]);
    return DownloadHandle;
})();
//# sourceMappingURL=index.js.map
