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
var _ = require("lodash");
var path = require("path");
var events_1 = require("events");
var StreamSpeed = require("../downloader/stream-speed");
var downloader_1 = require("../downloader");
var extractor_1 = require("../extractor");
var Resumable = require("../common/resumable");
var queue_1 = require("../queue");
var common_1 = require("../common");
(function (PatchOperation) {
    PatchOperation[PatchOperation["STOPPED"] = 0] = "STOPPED";
    PatchOperation[PatchOperation["DOWNLOADING"] = 1] = "DOWNLOADING";
    PatchOperation[PatchOperation["PATCHING"] = 2] = "PATCHING";
    PatchOperation[PatchOperation["FINISHED"] = 3] = "FINISHED";
})(exports.PatchOperation || (exports.PatchOperation = {}));
var PatchOperation = exports.PatchOperation;
var Patcher = (function () {
    function Patcher() {
    }
    Patcher.patch = function (generateUrl, localPackage, options) {
        return new PatchHandle(generateUrl, localPackage, options);
    };
    return Patcher;
}());
exports.Patcher = Patcher;
function log(message) {
    console.log('Patcher: ' + message);
}
function difference(arr1, arr2, caseInsensitive) {
    if (!caseInsensitive) {
        return _.difference(arr1, arr2);
    }
    var result = [];
    for (var _i = 0, arr1_1 = arr1; _i < arr1_1.length; _i++) {
        var e1 = arr1_1[_i];
        var lcE1 = e1.toLowerCase();
        var found = false;
        for (var _a = 0, arr2_1 = arr2; _a < arr2_1.length; _a++) {
            var e2 = arr2_1[_a];
            if (lcE1 == e2.toLowerCase()) {
                found = true;
                break;
            }
        }
        if (!found) {
            result.push(e1);
        }
    }
    return result;
}
var PatchHandle = (function () {
    function PatchHandle(_generateUrl, _localPackage, _options) {
        var _this = this;
        this._generateUrl = _generateUrl;
        this._localPackage = _localPackage;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            overwrite: false,
            decompressInDownload: false,
        });
        this._state = PatchOperation.STOPPED;
        this._firstRun = true;
        this._downloadHandle = null;
        this._extractHandle = null;
        this._onProgressFuncMapping = new Map();
        this._onExtractProgressFuncMapping = new Map();
        this._emitter = new events_1.EventEmitter();
        this._resumable = new Resumable.Resumable();
        this._tempFile = path.join(this._localPackage.install_dir, '.gj-tempDownload');
        this._archiveListFile = path.join(this._localPackage.install_dir, '.gj-archive-file-list');
        this._patchListFile = path.join(this._localPackage.install_dir, '.gj-patch-file');
        this._to = this._localPackage.install_dir;
        this._promise = new Promise(function (resolve, reject) {
            _this._resolver = resolve;
            _this._rejector = reject;
        });
    }
    Object.defineProperty(PatchHandle.prototype, "promise", {
        get: function () {
            return this._promise;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PatchHandle.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    PatchHandle.prototype.isDownloading = function () {
        return this._state === PatchOperation.DOWNLOADING || this._state === PatchOperation.STOPPED;
    };
    PatchHandle.prototype.isPatching = function () {
        return this._state === PatchOperation.PATCHING;
    };
    PatchHandle.prototype.isFinished = function () {
        return this._state === PatchOperation.FINISHED;
    };
    PatchHandle.prototype.isRunning = function () {
        switch (this._state) {
            case PatchOperation.DOWNLOADING:
                return this._downloadHandle.state === Resumable.State.STARTING || this._downloadHandle.state === Resumable.State.STARTED;
            case PatchOperation.PATCHING:
                return this._extractHandle.state === Resumable.State.STARTING || this._extractHandle.state === Resumable.State.STARTED;
            default:
                return false;
        }
    };
    PatchHandle.prototype._getDecompressStream = function () {
        if (!this._localPackage.build.archive_type) {
            return null;
        }
        switch (this._localPackage.build.archive_type) {
            case 'tar.xz':
                return require('lzma-native').createDecompressor();
            case 'tar.gz':
                return require('gunzip-maybe')();
            case 'brotli':
                throw new Error('Not supporting brotli anymore.');
            default:
                throw new Error('No decompression given');
        }
    };
    PatchHandle.prototype.download = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this._state = PatchOperation.DOWNLOADING;
            _this._downloadHandle = downloader_1.Downloader.download(_this._generateUrl, _this._tempFile, {
                overwrite: _this._options.overwrite,
                decompressStream: _this._options.decompressInDownload ? _this._getDecompressStream() : null,
            });
            _this._downloadHandle
                .onProgress(StreamSpeed.SampleUnit.Bps, function (progress) { return _this.emitProgress(progress); })
                .onStarted(function () { return resolve({ promise: _this._downloadHandle.promise }); })
                .start();
        });
    };
    PatchHandle.prototype.patchPrepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var createdByOldBuild, currentFiles, stat, oldBuildFiles, stat, archiveListFileDir, dirStat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._state = PatchOperation.PATCHING;
                        return [4 /*yield*/, common_1.default.fsReadDirRecursively(this._to)];
                    case 1:
                        currentFiles = (_a.sent())
                            .filter(function (file) {
                            return !path.basename(file).startsWith('.gj-');
                        })
                            .map(function (file) {
                            return './' + path.relative(_this._to, file).replace(/\\/g, '/');
                        });
                        log("Current files: " + JSON.stringify(currentFiles));
                        return [4 /*yield*/, common_1.default.fsExists(this._patchListFile)];
                    case 2:
                        if (!_a.sent())
                            return [3 /*break*/, 5];
                        return [4 /*yield*/, common_1.default.fsStat(this._patchListFile)];
                    case 3:
                        stat = _a.sent();
                        if (!stat.isFile()) {
                            throw new Error("Can't patch because the patch file isn't a file.");
                        }
                        return [4 /*yield*/, common_1.default.fsReadFile(this._patchListFile, 'utf8')];
                    case 4:
                        createdByOldBuild = (_a.sent()).split('\n');
                        log("Created by old build files: " + JSON.stringify(createdByOldBuild));
                        return [3 /*break*/, 17];
                    case 5:
                        oldBuildFiles = void 0;
                        return [4 /*yield*/, common_1.default.fsExists(this._archiveListFile)];
                    case 6:
                        if (!_a.sent())
                            return [3 /*break*/, 9];
                        return [4 /*yield*/, common_1.default.fsStat(this._archiveListFile)];
                    case 7:
                        stat = _a.sent();
                        if (!stat.isFile()) {
                            throw new Error("Can't patch because the archive file list isn't a file.");
                        }
                        return [4 /*yield*/, common_1.default.fsReadFile(this._archiveListFile, 'utf8')];
                    case 8:
                        oldBuildFiles = (_a.sent()).split('\n');
                        return [3 /*break*/, 15];
                    case 9:
                        archiveListFileDir = path.dirname(this._archiveListFile);
                        return [4 /*yield*/, common_1.default.fsExists(archiveListFileDir)];
                    case 10:
                        if (!_a.sent())
                            return [3 /*break*/, 12];
                        return [4 /*yield*/, common_1.default.fsStat(archiveListFileDir)];
                    case 11:
                        dirStat = _a.sent();
                        if (!dirStat.isDirectory()) {
                            throw new Error("Can't patch because the path to the archive file list is invalid.");
                        }
                        return [3 /*break*/, 14];
                    case 12: return [4 /*yield*/, common_1.default.mkdirp(archiveListFileDir)];
                    case 13:
                        if (!(_a.sent())) {
                            throw new Error("Couldn't create the patch archive file list folder path");
                        }
                        _a.label = 14;
                    case 14:
                        oldBuildFiles = currentFiles;
                        _a.label = 15;
                    case 15:
                        log("Old build files: " + JSON.stringify(oldBuildFiles));
                        // Files that the old build created are files in the file system that are not listed in the old build files
                        // In Windows we need to compare the files case insensitively.
                        createdByOldBuild = difference(currentFiles, oldBuildFiles, process.platform !== 'linux');
                        log("Created by old build files: " + JSON.stringify(createdByOldBuild));
                        return [4 /*yield*/, common_1.default.fsWriteFile(this._patchListFile, createdByOldBuild.join('\n'))];
                    case 16:
                        _a.sent();
                        _a.label = 17;
                    case 17: return [2 /*return*/, {
                            createdByOldBuild: createdByOldBuild,
                            currentFiles: currentFiles,
                        }];
                }
            });
        });
    };
    PatchHandle.prototype.finalizePatch = function (prepareResult, extractResult) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var newBuildFiles, filesToRemove;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newBuildFiles = extractResult.files;
                        log("New build files: " + JSON.stringify(newBuildFiles));
                        filesToRemove = difference(prepareResult.currentFiles, newBuildFiles.concat(prepareResult.createdByOldBuild), process.platform !== 'linux');
                        log("Files to remove: " + JSON.stringify(filesToRemove));
                        // TODO: use del lib
                        return [4 /*yield*/, Promise.all(filesToRemove.map(function (file) {
                                return common_1.default.fsUnlink(path.resolve(_this._to, file));
                            }))];
                    case 1:
                        // TODO: use del lib
                        _a.sent();
                        return [4 /*yield*/, common_1.default.fsWriteFile(this._archiveListFile, newBuildFiles.join('\n'))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, common_1.default.fsUnlink(this._patchListFile)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PatchHandle.prototype.patch = function () {
        // TODO: restrict operations to the given directories.
        var _this = this;
        return new Promise(function (resolve) {
            _this._extractHandle = extractor_1.Extractor.extract(_this._tempFile, _this._to, {
                overwrite: true,
                deleteSource: true,
                decompressStream: _this._options.decompressInDownload ? null : _this._getDecompressStream(),
            });
            _this._extractHandle
                .onProgress(StreamSpeed.SampleUnit.Bps, function (progress) { return _this.emitExtractProgress(progress); })
                .onFile(function (file) { return _this.emitFile(file); })
                .onStarted(function () { return resolve({ promise: _this._extractHandle.promise }); })
                .start();
        });
    };
    PatchHandle.prototype.start = function (options) {
        log('Starting resumable');
        this._resumable.start({ cb: this.onStarting, args: [options], context: this });
    };
    PatchHandle.prototype.onStarting = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var waitForDownload, prepareResult, waitForPatch, unpackResult, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log('Resumable state: starting');
                        if (!this._firstRun)
                            return [3 /*break*/, 10];
                        this._firstRun = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        queue_1.VoodooQueue.manage(this);
                        return [4 /*yield*/, this.download()];
                    case 2:
                        waitForDownload = _a.sent();
                        this._emitter.emit('downloading');
                        this._resumable.started();
                        return [4 /*yield*/, waitForDownload.promise];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.patchPrepare()];
                    case 4:
                        prepareResult = _a.sent();
                        return [4 /*yield*/, this.patch()];
                    case 5:
                        waitForPatch = _a.sent();
                        this._emitter.emit('patching');
                        return [4 /*yield*/, waitForPatch.promise];
                    case 6:
                        unpackResult = _a.sent();
                        return [4 /*yield*/, this.finalizePatch(prepareResult, unpackResult)];
                    case 7:
                        _a.sent();
                        this.onFinished();
                        return [3 /*break*/, 9];
                    case 8:
                        err_1 = _a.sent();
                        log(err_1.message + "\n" + err_1.stack);
                        this.onError(err_1);
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (this._state === PatchOperation.DOWNLOADING) {
                            this._downloadHandle.onStarted(function () {
                                _this._resumable.started();
                                _this._emitter.emit('resumed', options && options.voodooQueue);
                                log('Resumable state: started');
                                queue_1.VoodooQueue.manage(_this);
                            }).start();
                        }
                        else if (this._state === PatchOperation.PATCHING) {
                            this._extractHandle.onStarted(function () {
                                _this._resumable.started();
                                _this._emitter.emit('resumed', options && options.voodooQueue);
                                log('Resumable state: started');
                                queue_1.VoodooQueue.manage(_this);
                            }).start();
                        }
                        _a.label = 11;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    PatchHandle.prototype._stop = function (options) {
        log('Stopping resumable');
        this._resumable.stop({
            cb: this.onStopping,
            args: [options],
            context: this
        });
    };
    PatchHandle.prototype.onStopping = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this._state === PatchOperation.DOWNLOADING) {
                    this._downloadHandle.onStopped(function () {
                        _this._resumable.stopped();
                        _this._emitter.emit(options.terminate ? 'canceled' : 'stopped', options && options.voodooQueue);
                        log('Resumable state: stopped');
                    }).stop();
                }
                else if (this._state === PatchOperation.PATCHING) {
                    this._extractHandle.onStopped(function () {
                        _this._resumable.stopped();
                        _this._emitter.emit(options.terminate ? 'canceled' : 'stopped', options && options.voodooQueue);
                        log('Resumable state: stopped');
                    }).stop(options.terminate);
                }
                return [2 /*return*/];
            });
        });
    };
    PatchHandle.prototype.stop = function (options) {
        var stopOptions = _.assign(options || { voodooQueue: false }, {
            terminate: false,
        });
        return this._stop(stopOptions);
    };
    PatchHandle.prototype.cancel = function (options) {
        var stopOptions = _.assign(options || { voodooQueue: false }, {
            terminate: true,
        });
        if (this._state === PatchOperation.STOPPED || this._state === PatchOperation.FINISHED ||
            (this._state === PatchOperation.DOWNLOADING && this._downloadHandle.state === Resumable.State.STOPPED) ||
            (this._state === PatchOperation.PATCHING && this._extractHandle.state === Resumable.State.STOPPED)) {
            this._emitter.emit('canceled', options && options.voodooQueue);
            log('Resumable state: stopped');
            return;
        }
        return this._stop(stopOptions);
    };
    PatchHandle.prototype.onDownloading = function (fn) {
        this._emitter.addListener('downloading', fn);
        return this;
    };
    PatchHandle.prototype.deregisterOnDownloading = function (fn) {
        this._emitter.removeListener('downloading', fn);
        return this;
    };
    PatchHandle.prototype.onProgress = function (unit, fn) {
        var func = function (progress) {
            progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
            fn(progress);
        };
        this._onProgressFuncMapping.set(fn, func);
        this._emitter.addListener('progress', func);
        return this;
    };
    PatchHandle.prototype.deregisterOnProgress = function (fn) {
        var func = this._onProgressFuncMapping.get(fn);
        if (func) {
            this._emitter.removeListener('progress', func);
            this._onProgressFuncMapping.delete(fn);
        }
        return this;
    };
    PatchHandle.prototype.onPatching = function (fn) {
        this._emitter.addListener('patching', fn);
        return this;
    };
    PatchHandle.prototype.deregisterOnPatching = function (fn) {
        this._emitter.removeListener('patching', fn);
        return this;
    };
    PatchHandle.prototype.onExtractProgress = function (unit, fn) {
        var func = function (progress) {
            progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
            fn(progress);
        };
        this._onExtractProgressFuncMapping.set(fn, func);
        this._emitter.addListener('extract-progress', func);
        return this;
    };
    PatchHandle.prototype.deregisterOnExtractProgress = function (fn) {
        var func = this._onExtractProgressFuncMapping.get(fn);
        if (func) {
            this._emitter.removeListener('extract-progress', func);
            this._onExtractProgressFuncMapping.delete(fn);
        }
        return this;
    };
    PatchHandle.prototype.onFile = function (fn) {
        this._emitter.addListener('file', fn);
        return this;
    };
    PatchHandle.prototype.deregisterOnFile = function (fn) {
        this._emitter.removeListener('file', fn);
        return this;
    };
    PatchHandle.prototype.onPaused = function (fn) {
        this._emitter.addListener('stopped', fn);
        return this;
    };
    PatchHandle.prototype.deregisterOnPaused = function (fn) {
        this._emitter.removeListener('stopped', fn);
        return this;
    };
    PatchHandle.prototype.onResumed = function (fn) {
        this._emitter.addListener('resumed', fn);
        return this;
    };
    PatchHandle.prototype.deregisterOnResumed = function (fn) {
        this._emitter.removeListener('resumed', fn);
        return this;
    };
    PatchHandle.prototype.onCanceled = function (fn) {
        this._emitter.addListener('canceled', fn);
        return this;
    };
    PatchHandle.prototype.deregisterOnCanceled = function (fn) {
        this._emitter.removeListener('canceled', fn);
        return this;
    };
    PatchHandle.prototype.emitProgress = function (progress) {
        this._emitter.emit('progress', progress);
    };
    PatchHandle.prototype.emitExtractProgress = function (progress) {
        this._emitter.emit('extract-progress', progress);
    };
    PatchHandle.prototype.emitFile = function (file) {
        this._emitter.emit('file', file);
    };
    PatchHandle.prototype.onError = function (err) {
        log(err.message + '\n' + err.stack);
        if (this._resumable.state === Resumable.State.STARTING) {
            log('Forced to stop before started. Marking as started first. ');
            this._resumable.started();
            this._emitter.emit('started');
            log('Resumable state: started');
        }
        this._resumable.stop({ cb: this.onErrorStopping, args: [err], context: this }, true);
    };
    PatchHandle.prototype.onErrorStopping = function (err) {
        this._resumable.finished();
        this._rejector(err);
    };
    PatchHandle.prototype.onFinished = function () {
        if (this._resumable.state === Resumable.State.STARTING) {
            log('Forced to stop before started. Marking as started first. ');
            this._resumable.started();
            this._emitter.emit('started');
            log('Resumable state: started');
        }
        this._resumable.finished();
        this._resolver();
    };
    return PatchHandle;
}());
exports.PatchHandle = PatchHandle;
//# sourceMappingURL=index.js.map