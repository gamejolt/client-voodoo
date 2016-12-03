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
var _ = require("lodash");
var tarFS = require("tar-fs");
var events_1 = require("events");
var StreamSpeed = require("../downloader/stream-speed");
var Resumable = require("../common/resumable");
var common_1 = require("../common");
var through2 = require("through2");
var Extractor = (function () {
    function Extractor() {
    }
    Extractor.extract = function (from, to, options) {
        return new ExtractHandle(from, to, options);
    };
    return Extractor;
}());
exports.Extractor = Extractor;
function log(message) {
    console.log('Extractor: ' + message);
}
var ExtractHandle = (function () {
    function ExtractHandle(_from, _to, _options) {
        var _this = this;
        this._from = _from;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            deleteSource: false,
            overwrite: false,
        });
        this._firstRun = true;
        this._promise = new Promise(function (resolve, reject) {
            _this._resolver = resolve;
            _this._rejector = reject;
        });
        this._emitter = new events_1.EventEmitter();
        this._resumable = new Resumable.Resumable();
        this._extractedFiles = [];
        this._totalSize = 0;
        this._totalProcessed = 0;
    }
    Object.defineProperty(ExtractHandle.prototype, "from", {
        get: function () {
            return this._from;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExtractHandle.prototype, "to", {
        get: function () {
            return this._to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExtractHandle.prototype, "state", {
        get: function () {
            return this._resumable.state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ExtractHandle.prototype, "promise", {
        get: function () {
            return this._promise;
        },
        enumerable: true,
        configurable: true
    });
    ExtractHandle.prototype.prepareFS = function () {
        return __awaiter(this, void 0, void 0, function () {
            var srcStat, destStat, filesInDest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log('Preparing fs');
                        return [4 /*yield*/, common_1.default.fsExists(this._from)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new Error("Can't unpack to destination because the source does not exist");
                        }
                        return [4 /*yield*/, common_1.default.fsStat(this._from)];
                    case 2:
                        srcStat = _a.sent();
                        if (!srcStat.isFile()) {
                            throw new Error("Can't unpack to destination because the source is not a valid file");
                        }
                        this._totalSize = srcStat.size;
                        this._totalProcessed = 0;
                        return [4 /*yield*/, common_1.default.fsExists(this._to)];
                    case 3:
                        if (!_a.sent())
                            return [3 /*break*/, 6];
                        return [4 /*yield*/, common_1.default.fsStat(this._to)];
                    case 4:
                        destStat = _a.sent();
                        if (!destStat.isDirectory()) {
                            throw new Error("Can't unpack to destination because its not a valid directory");
                        }
                        return [4 /*yield*/, common_1.default.fsReadDir(this._to)];
                    case 5:
                        filesInDest = _a.sent();
                        if (filesInDest && filesInDest.length > 0) {
                            // Allow unpacking to a non empty directory only if the overwrite option is set.
                            if (!this._options.overwrite) {
                                throw new Error("Can't unpack to destination because it isnt empty");
                            }
                        }
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, common_1.default.mkdirp(this._to)];
                    case 7:
                        if (!(_a.sent())) {
                            throw new Error("Couldn't create destination folder path");
                        }
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    ExtractHandle.prototype.unpack = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                log("Unpacking from " + this._from + " to " + this._to);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this._readStream = fs.createReadStream(_this._from);
                        _this._readStream.on('error', function (err) { return _this._rejector(err); });
                        var optionsMap = _this._options.map;
                        _this._extractStream = tarFS.extract(_this._to, _.assign(_this._options, {
                            map: function (header) {
                                if (optionsMap) {
                                    header = optionsMap(header);
                                }
                                if (header && (header.type === 'file' || header.type === 'symlink')) {
                                    _this._extractedFiles.push(header.name);
                                    _this.emitFile(header);
                                }
                                return header;
                            },
                        }));
                        _this._extractStream.on('finish', function () { return resolve(); });
                        _this._extractStream.on('error', function (err) { return reject(err); });
                        _this._streamSpeed = new StreamSpeed.StreamSpeed(_this._options);
                        _this._streamSpeed.stop(); //  Dont auto start. resume() will take care of that
                        _this._streamSpeed.onSample(function (sample) { return _this.emitProgress({
                            progress: _this._totalProcessed / _this._totalSize,
                            timeLeft: Math.round((_this._totalSize - _this._totalProcessed) / sample.currentAverage),
                            sample: sample,
                        }); });
                        if (_this._options.decompressStream) {
                            _this._streamSpeed.stream
                                .pipe(_this._options.decompressStream)
                                .pipe(_this._extractStream);
                        }
                        else {
                            _this._streamSpeed.stream.pipe(_this._extractStream);
                        }
                        _this.resume();
                        _this._resumable.started();
                        _this._emitter.emit('started');
                        log('Resumable state: started');
                    })];
            });
        });
    };
    ExtractHandle.prototype.start = function () {
        log('Starting resumable');
        this._resumable.start({ cb: this.onStarting, context: this });
    };
    ExtractHandle.prototype.onStarting = function () {
        return __awaiter(this, void 0, void 0, function () {
            var err_1, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log('Resumable state: starting');
                        if (!this._firstRun)
                            return [3 /*break*/, 11];
                        this._firstRun = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.prepareFS()];
                    case 2:
                        _a.sent();
                        // Somewhere in here the task will be marked as started, allowing it to pause and resume.
                        // This will return only after the archive has been fully extracted.
                        return [4 /*yield*/, this.unpack()];
                    case 3:
                        // Somewhere in here the task will be marked as started, allowing it to pause and resume.
                        // This will return only after the archive has been fully extracted.
                        _a.sent();
                        if (!this._options.deleteSource)
                            return [3 /*break*/, 8];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 8]);
                        return [4 /*yield*/, common_1.default.fsUnlink(this._from)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        err_1 = _a.sent();
                        return [4 /*yield*/, common_1.default.fsExists(this._from)];
                    case 7:
                        if (_a.sent()) {
                            throw err_1;
                        }
                        return [3 /*break*/, 8];
                    case 8:
                        this.onFinished();
                        return [3 /*break*/, 10];
                    case 9:
                        err_2 = _a.sent();
                        console.log(err_2);
                        log(err_2.message + "\n" + JSON.stringify(err_2.stack));
                        this.onError(err_2);
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        this.resume();
                        this._resumable.started();
                        this._emitter.emit('started');
                        log('Resumable state: started');
                        _a.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    ExtractHandle.prototype.onStarted = function (cb) {
        this._emitter.once('started', cb);
        return this;
    };
    ExtractHandle.prototype.stop = function (terminate) {
        log('Stopping resumable');
        this._resumable.stop({ cb: terminate ? this.onTerminating : this.onStopping, context: this });
    };
    ExtractHandle.prototype.onStopping = function () {
        log('Resumable state: stopping');
        this.pause();
        this._resumable.stopped();
        this._emitter.emit('stopped');
        log('Resumable state: stopped');
    };
    ExtractHandle.prototype.onStopped = function (cb) {
        this._emitter.once('stopped', cb);
        return this;
    };
    ExtractHandle.prototype.onTerminating = function () {
        return __awaiter(this, void 0, void 0, function () {
            var readStreamHack, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log('Resumable state: stopping');
                        readStreamHack = this._readStream;
                        readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams
                        if (!this._options.deleteSource)
                            return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, common_1.default.fsUnlink(this._from)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_3 = _a.sent();
                        return [4 /*yield*/, common_1.default.fsExists(this._from)];
                    case 4:
                        if (_a.sent()) {
                            throw err_3;
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        this._resumable.stopped();
                        this._emitter.emit('stopped');
                        log('Resumable state: stopped');
                        return [2 /*return*/];
                }
            });
        });
    };
    ExtractHandle.prototype.onProgress = function (unit, fn) {
        this._emitter.addListener('progress', function (progress) {
            progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
            fn(progress);
        });
        return this;
    };
    ExtractHandle.prototype.emitProgress = function (progress) {
        this._emitter.emit('progress', progress);
    };
    ExtractHandle.prototype.onFile = function (fn) {
        this._emitter.addListener('file', fn);
        return this;
    };
    ExtractHandle.prototype.emitFile = function (file) {
        this._emitter.emit('file', file);
    };
    ExtractHandle.prototype.resume = function () {
        var _this = this;
        this._readStream
            .pipe(through2(function (chunk, enc, cb) {
            _this._totalProcessed += chunk.length;
            cb(null, chunk);
        }))
            .pipe(this._streamSpeed.stream);
        this._streamSpeed.start();
    };
    ExtractHandle.prototype.pause = function () {
        if (this._readStream) {
            this._readStream.unpipe();
        }
        if (this._streamSpeed) {
            this._streamSpeed.stop();
        }
    };
    ExtractHandle.prototype.onError = function (err) {
        log(err.message + '\n' + err.stack);
        if (this._resumable.state === Resumable.State.STARTING) {
            log('Forced to stop before started. Marking as started first. ');
            this._resumable.started();
            this._emitter.emit('started');
            log('Resumable state: started');
        }
        this._resumable.stop({ cb: this.onErrorStopping, args: [err], context: this }, true);
    };
    ExtractHandle.prototype.onErrorStopping = function (err) {
        this.pause();
        this._resumable.finished();
        this._rejector(err);
    };
    ExtractHandle.prototype.onFinished = function () {
        if (this._resumable.state === Resumable.State.STARTING) {
            log('Forced to stop before started. Marking as started first. ');
            this._resumable.started();
            this._emitter.emit('started');
            log('Resumable state: started');
        }
        this.pause();
        this._resumable.finished();
        this._resolver({
            files: this._extractedFiles,
        });
    };
    return ExtractHandle;
}());
exports.ExtractHandle = ExtractHandle;
//# sourceMappingURL=index.js.map