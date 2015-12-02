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
var events_1 = require('events');
var Bluebird = require('bluebird');
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
        value: function download(from, to) {
            return new DownloadHandle(from, to);
        }
    }]);
    return Downloader;
})();

(function (DownloadHandleState) {
    DownloadHandleState[DownloadHandleState["STARTED"] = 0] = "STARTED";
    DownloadHandleState[DownloadHandleState["STARTING"] = 1] = "STARTING";
    DownloadHandleState[DownloadHandleState["STOPPED"] = 2] = "STOPPED";
    DownloadHandleState[DownloadHandleState["STOPPING"] = 3] = "STOPPING";
    DownloadHandleState[DownloadHandleState["FINISHED"] = 4] = "FINISHED";
})(exports.DownloadHandleState || (exports.DownloadHandleState = {}));
var DownloadHandleState = exports.DownloadHandleState;

var DownloadHandle = (function () {
    function DownloadHandle(_from, _to) {
        (0, _classCallCheck3.default)(this, DownloadHandle);

        this._from = _from;
        this._to = _to;
        this._state = DownloadHandleState.STOPPED;
        this._emitter = new events_1.EventEmitter();
        this.start();
    }

    (0, _createClass3.default)(DownloadHandle, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var exists, stat;
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
                                _context.next = 15;
                                return fsExists(this._to);

                            case 15:
                                exists = _context.sent;
                                _context.next = 18;
                                return fsExists(this._to);

                            case 18:
                                if (!_context.sent) {
                                    _context.next = 23;
                                    break;
                                }

                                _context.next = 21;
                                return fsStat(this._to);

                            case 21:
                                stat = _context.sent;

                                this._totalDownloaded = stat.size;

                            case 23:
                                _context.next = 28;
                                break;

                            case 25:
                                _context.prev = 25;
                                _context.t0 = _context["catch"](12);

                                this.onError(_context.t0);

                            case 28:
                                this.download();
                                return _context.abrupt("return", true);

                            case 30:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[12, 25]]);
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
                                this.response.removeAllListeners();
                                this.destStream.removeAllListeners();
                                this.response.unpipe(this.destStream);
                                this.destStream.close();
                                this.request.abort();
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
            this.destStream = fs.createWriteStream(this._to, {
                encoding: 'binary',
                flags: 'a'
            });
            this.request = http.request(httpOptions, function (response) {
                _this.response = response;
                _this._curSpeedInterval = setInterval(_this.onTick.bind(_this), 1000);
                _this._state = DownloadHandleState.STARTED;
                // Unsatisfiable request - most likely we've downloaded the whole thing already.
                // TODO - send HEAD request to get content-length and compare.
                if (_this.response.statusCode == 416) {
                    return _this.onFinished();
                }
                // Expecting the partial response status code
                if (_this.response.statusCode != 206) {
                    return _this.onError(new Error('Bad status code ' + _this.response.statusCode));
                }
                if (!_this.response.headers || !_this.response.headers['content-range']) {
                    return _this.onError(new Error('Missing or invalid content-range response header'));
                }
                try {
                    _this._totalSize = parseInt(_this.response.headers['content-range'].split('/')[1]);
                } catch (err) {
                    return _this.onError(new Error('Invalid content-range header: ' + _this.response.headers['content-range']));
                }
                _this.response.setEncoding('binary');
                _this.response.pipe(_this.destStream);
                _this.response.on('data', function (data) {
                    _this._totalDownloaded += data.length;
                    _this._curSpeed += data.length;
                });
                _this.destStream.on('finish', function () {
                    return _this.onFinished();
                });
                _this.response.on('error', function (err) {
                    return _this.onError(err);
                });
                _this.destStream.on('error', function (err) {
                    return _this.onError(err);
                });
            });
            this.request.on('error', function (err) {
                return _this.onError(err);
            });
            this.request.end();
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
            this._curSpeed = 0;
            if (this._curSpeedTicks.length > 5) {
                this._curSpeedTicks.pop();
            }
            this._emitter.emit('progress', this._totalDownloaded / this._totalSize, this.currentKbps, this.peakKbps, this.lowKbps, this.avgKbps);
        }
    }, {
        key: "onError",
        value: function onError(err) {
            this.stop();
            this._rejecter(err);
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
            return this._peakSpeed / 1024;
        }
    }, {
        key: "lowKbps",
        get: function get() {
            return this._lowSpeed / 1024;
        }
    }, {
        key: "avgKbps",
        get: function get() {
            return this._avgSpeed / 1024;
        }
    }, {
        key: "currentKbps",
        get: function get() {
            return this._curSpeed / 1024;
        }
    }, {
        key: "currentAveragedSpeed",
        get: function get() {
            if (this._curSpeedTicks.length === 0) {
                return this.currentKbps;
            }
            var sum = this._curSpeedTicks.reduce(function (accumulated, current) {
                return accumulated + current / 1024;
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
                    _this2._rejecter = reject;
                });
            }
            return this._promise;
        }
    }]);
    return DownloadHandle;
})();

exports.default = Downloader;
//# sourceMappingURL=index.js.map
