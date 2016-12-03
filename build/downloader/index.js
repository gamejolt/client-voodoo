"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require("fs");
var path = require("path");
var events_1 = require("events");
var _ = require("lodash");
var request = require("request");
var StreamSpeed = require("./stream-speed");
var Resumable = require("../common/resumable");
var common_1 = require("../common");
var Downloader = (function () {
    function Downloader() {
    }
    Downloader.download = function (generateUrl, to, options) {
        return new DownloadHandle(generateUrl, to, options);
    };
    return Downloader;
}());
exports.Downloader = Downloader;
function log(message) {
    console.log("Downloader: " + message);
}
var DownloadHandle = (function () {
    function DownloadHandle(_generateUrl, _to, _options) {
        var _this = this;
        this._generateUrl = _generateUrl;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            overwrite: false,
        });
        this._promise = new Promise(function (resolve, reject) {
            _this._resolver = resolve;
            _this._rejector = reject;
        });
        this._emitter = new events_1.EventEmitter();
        this._resumable = new Resumable.Resumable();
        this._totalSize = 0;
        this._totalDownloaded = 0;
    }
    Object.defineProperty(DownloadHandle.prototype, "url", {
        get: function () {
            return this._url;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DownloadHandle.prototype, "to", {
        get: function () {
            return this._to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DownloadHandle.prototype, "state", {
        get: function () {
            return this._resumable.state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DownloadHandle.prototype, "totalSize", {
        get: function () {
            return this._totalSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DownloadHandle.prototype, "totalDownloaded", {
        get: function () {
            return this._totalDownloaded;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DownloadHandle.prototype, "promise", {
        get: function () {
            return this._promise;
        },
        enumerable: true,
        configurable: true
    });
    DownloadHandle.prototype.prepareFS = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stat, toDir, dirStat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log('Preparing fs');
                        return [4 /*yield*/, common_1.default.fsExists(this._to)];
                    case 1:
                        if (!_a.sent())
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, common_1.default.fsStat(this._to)];
                    case 2:
                        stat = _a.sent();
                        if (!!stat.isFile())
                            return [3 /*break*/, 3];
                        throw new Error("Can't resume downloading because the destination isn't a file.");
                    case 3:
                        if (!this._options.overwrite)
                            return [3 /*break*/, 5];
                        return [4 /*yield*/, common_1.default.fsUnlink(this._to)];
                    case 4:
                        _a.sent();
                        stat.size = 0;
                        _a.label = 5;
                    case 5:
                        this._totalDownloaded = stat.size;
                        return [3 /*break*/, 11];
                    case 6:
                        toDir = path.dirname(this._to);
                        return [4 /*yield*/, common_1.default.fsExists(toDir)];
                    case 7:
                        if (!_a.sent())
                            return [3 /*break*/, 9];
                        return [4 /*yield*/, common_1.default.fsStat(toDir)];
                    case 8:
                        dirStat = _a.sent();
                        if (!dirStat.isDirectory()) {
                            throw new Error("Can't download to destination because the path is invalid.");
                        }
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, common_1.default.mkdirp(toDir)];
                    case 10:
                        if (!(_a.sent())) {
                            throw new Error("Couldn't create the destination folder path");
                        }
                        _a.label = 11;
                    case 11:
                        this._options.overwrite = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    DownloadHandle.prototype.generateUrl = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _generateUrl, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log('Generating url');
                        _generateUrl = this._generateUrl;
                        if (!(typeof _generateUrl === 'string'))
                            return [3 /*break*/, 1];
                        this._url = _generateUrl;
                        return [3 /*break*/, 3];
                    case 1:
                        _a = this;
                        return [4 /*yield*/, _generateUrl()];
                    case 2:
                        _a._url = _b.sent();
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DownloadHandle.prototype.download = function () {
        var _this = this;
        log("Downloading from " + this._url);
        var httpOptions = {
            headers: {
                'Range': "bytes=" + this._totalDownloaded.toString() + "-",
            },
        };
        this._destStream = fs.createWriteStream(this._to, {
            flags: 'a',
        });
        this._request = request.get(this._url, httpOptions)
            .on('response', function (response) {
            // If received a redirect, simply skip the response and wait for the next one
            if (response.statusCode === 301) {
                return;
            }
            _this._response = response;
            _this._streamSpeed = new StreamSpeed.StreamSpeed(_this._options);
            _this._streamSpeed
                .onSample(function (sample) { return _this.emitProgress({
                progress: _this._totalDownloaded / _this._totalSize,
                timeLeft: Math.round((_this._totalSize - _this._totalDownloaded) / sample.currentAverage),
                sample: sample,
            }); })
                .stream.on('error', function (err) { return _this.onError(err); });
            // Unsatisfiable request - most likely we've downloaded the whole thing already.
            // TODO - send HEAD request to get content-length and compare.
            if (_this._response.statusCode === 416) {
                _this.onFinished();
                return;
            }
            // Expecting the partial response status code
            if (_this._response.statusCode !== 206) {
                return _this.onError(new Error("Bad status code " + _this._response.statusCode));
            }
            if (!_this._response.headers || !_this._response.headers['content-range']) {
                return _this.onError(new Error('Missing or invalid content-range response header'));
            }
            try {
                _this._totalSize = parseInt(_this._response.headers['content-range'].split('/')[1]);
            }
            catch (err) {
                return _this.onError(new Error("Invalid content-range header: " + _this._response.headers['content-range']));
            }
            if (_this._options.decompressStream) {
                _this._request
                    .pipe(_this._streamSpeed.stream)
                    .pipe(_this._options.decompressStream)
                    .pipe(_this._destStream);
            }
            else {
                _this._request
                    .pipe(_this._streamSpeed.stream)
                    .pipe(_this._destStream);
            }
            _this._destStream.on('finish', function () { return _this.onFinished(); });
            _this._destStream.on('error', function (err) { return _this.onError(err); });
            _this._resumable.started();
            _this._emitter.emit('started');
            log('Resumable state: started');
        })
            .on('data', function (data) {
            _this._totalDownloaded += data.length;
        })
            .on('error', function (err) {
            if (!_this._response) {
                throw err;
            }
            else {
                _this.onError(err);
            }
        });
    };
    DownloadHandle.prototype.start = function () {
        log('Starting resumable');
        this._resumable.start({ cb: this.onStarting, context: this });
    };
    DownloadHandle.prototype.onStarting = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log('Resumable state: starting');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.prepareFS()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.generateUrl()];
                    case 3:
                        _a.sent();
                        this.download();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        log(err_1.message + "\n" + err_1.stack);
                        this.onError(err_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DownloadHandle.prototype.onStarted = function (cb) {
        this._emitter.once('started', cb);
        return this;
    };
    DownloadHandle.prototype.stop = function () {
        log('Stopping resumable');
        this._resumable.stop({ cb: this.onStopping, context: this });
    };
    DownloadHandle.prototype.onStopping = function () {
        log('Resumable state: stopping');
        if (this._streamSpeed) {
            this._streamSpeed.stop();
            this._streamSpeed = null;
        }
        if (this._response) {
            this._response.removeAllListeners();
        }
        if (this._destStream) {
            this._destStream.removeAllListeners();
        }
        if (this._response) {
            this._response.unpipe(this._destStream);
            this._response = null;
        }
        if (this._destStream) {
            this._destStream.close();
            this._destStream = null;
        }
        if (this._request) {
            this._request.abort();
            this._request = null;
        }
        this._resumable.stopped();
        this._emitter.emit('stopped');
        log('Resumable state: stopped');
    };
    DownloadHandle.prototype.onStopped = function (cb) {
        this._emitter.once('stopped', cb);
        return this;
    };
    DownloadHandle.prototype.onProgress = function (unit, fn) {
        this._emitter.addListener('progress', function (progress) {
            progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
            fn(progress);
        });
        return this;
    };
    DownloadHandle.prototype.emitProgress = function (progress) {
        this._emitter.emit('progress', progress);
    };
    DownloadHandle.prototype.onError = function (err) {
        log(err.message + '\n' + err.stack);
        if (this._resumable.state === Resumable.State.STARTING) {
            log('Forced to stop before started. Marking as started first. ');
            this._resumable.started();
            this._emitter.emit('started');
            log('Resumable state: started');
        }
        this._resumable.stop({ cb: this.onErrorStopping, args: [err], context: this }, true);
    };
    DownloadHandle.prototype.onErrorStopping = function (err) {
        log('Error');
        this.onStopping();
        this._resumable.finished();
        this._rejector(err);
    };
    DownloadHandle.prototype.onFinished = function () {
        log('Finished');
        if (this._resumable.state === Resumable.State.STARTING) {
            log('Forced to stop before started. Marking as started first. ');
            this._resumable.started();
            this._emitter.emit('started');
            log('Resumable state: started');
        }
        this.onStopping();
        this._resumable.finished();
        this._resolver();
    };
    return DownloadHandle;
}());
exports.DownloadHandle = DownloadHandle;
//# sourceMappingURL=index.js.map