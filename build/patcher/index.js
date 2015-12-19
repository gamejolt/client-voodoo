"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

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
var _ = require('lodash');
var path = require('path');
var events_1 = require('events');
var StreamSpeed = require('../downloader/stream-speed');
var downloader_1 = require('../downloader');
var extractor_1 = require('../extractor');
var Resumable = require('../common/resumable');
var queue_1 = require('../queue');
var common_1 = require('../common');
(function (PatchOperation) {
    PatchOperation[PatchOperation["STOPPED"] = 0] = "STOPPED";
    PatchOperation[PatchOperation["DOWNLOADING"] = 1] = "DOWNLOADING";
    PatchOperation[PatchOperation["PATCHING"] = 2] = "PATCHING";
    PatchOperation[PatchOperation["FINISHED"] = 3] = "FINISHED";
})(exports.PatchOperation || (exports.PatchOperation = {}));
var PatchOperation = exports.PatchOperation;

var Patcher = (function () {
    function Patcher() {
        (0, _classCallCheck3.default)(this, Patcher);
    }

    (0, _createClass3.default)(Patcher, null, [{
        key: "patch",
        value: function patch(generateUrl, localPackage, options) {
            return new PatchHandle(generateUrl, localPackage, options);
        }
    }]);
    return Patcher;
})();

exports.Patcher = Patcher;
function log(message) {
    console.log('Patcher: ' + message);
}

var PatchHandle = (function () {
    function PatchHandle(_generateUrl, _localPackage, _options) {
        var _this = this;

        (0, _classCallCheck3.default)(this, PatchHandle);

        this._generateUrl = _generateUrl;
        this._localPackage = _localPackage;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            overwrite: false,
            decompressInDownload: false
        });
        this._state = PatchOperation.STOPPED;
        this._firstRun = true;
        this._downloadHandle = null;
        this._extractHandle = null;
        this._onProgressFuncMapping = new _map2.default();
        this._onExtractProgressFuncMapping = new _map2.default();
        this._emitter = new events_1.EventEmitter();
        this._resumable = new Resumable.Resumable();
        this._tempFile = path.join(this._localPackage.install_dir, '.gj-tempDownload');
        this._archiveListFile = path.join(this._localPackage.install_dir, '.gj-archive-file-list');
        this._patchListFile = path.join(this._localPackage.install_dir, '.gj-patch-file');
        this._to = this._localPackage.install_dir;
        this._promise = new _promise2.default(function (resolve, reject) {
            _this._resolver = resolve;
            _this._rejector = reject;
        });
    }

    (0, _createClass3.default)(PatchHandle, [{
        key: "isDownloading",
        value: function isDownloading() {
            return this._state === PatchOperation.DOWNLOADING || this._state === PatchOperation.STOPPED;
        }
    }, {
        key: "isPatching",
        value: function isPatching() {
            return this._state === PatchOperation.PATCHING;
        }
    }, {
        key: "isFinished",
        value: function isFinished() {
            return this._state === PatchOperation.FINISHED;
        }
    }, {
        key: "isRunning",
        value: function isRunning() {
            switch (this._state) {
                case PatchOperation.DOWNLOADING:
                    return this._downloadHandle.state === Resumable.State.STARTING || this._downloadHandle.state === Resumable.State.STARTED;
                case PatchOperation.PATCHING:
                    return this._extractHandle.state === Resumable.State.STARTING || this._extractHandle.state === Resumable.State.STARTED;
                default:
                    return false;
            }
        }
    }, {
        key: "_getDecompressStream",
        value: function _getDecompressStream() {
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
        }
    }, {
        key: "download",
        value: function download() {
            var _this2 = this;

            return new _promise2.default(function (resolve) {
                _this2._state = PatchOperation.DOWNLOADING;
                _this2._downloadHandle = downloader_1.Downloader.download(_this2._generateUrl, _this2._tempFile, {
                    overwrite: _this2._options.overwrite,
                    decompressStream: _this2._options.decompressInDownload ? _this2._getDecompressStream() : null
                });
                _this2._downloadHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                    return _this2.emitProgress(progress);
                }).onStarted(function () {
                    return resolve({ promise: _this2._downloadHandle.promise });
                }).start();
            });
        }
    }, {
        key: "patchPrepare",
        value: function patchPrepare() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this3 = this;

                var createdByOldBuild, currentFiles, stat, archiveListFileDir, dirStat, oldBuildFiles;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                this._state = PatchOperation.PATCHING;
                                createdByOldBuild = undefined;
                                // TODO: check if ./ is valid on windows platforms as well.

                                _context.next = 4;
                                return common_1.default.fsReadDirRecursively(this._to);

                            case 4:
                                _context.t0 = function (file) {
                                    return !path.basename(file).startsWith('.gj-');
                                };

                                _context.t1 = function (file) {
                                    return './' + path.relative(_this3._to, file);
                                };

                                currentFiles = _context.sent.filter(_context.t0).map(_context.t1);

                                log('Current files: ' + (0, _stringify2.default)(currentFiles));
                                // If the patch file already exists, make sure its valid.
                                _context.next = 10;
                                return common_1.default.fsExists(this._patchListFile);

                            case 10:
                                if (!_context.sent) {
                                    _context.next = 22;
                                    break;
                                }

                                _context.next = 13;
                                return common_1.default.fsStat(this._patchListFile);

                            case 13:
                                stat = _context.sent;

                                if (stat.isFile()) {
                                    _context.next = 16;
                                    break;
                                }

                                throw new Error('Can\'t patch because the patch file isn\'t a file.');

                            case 16:
                                _context.next = 18;
                                return common_1.default.fsReadFile(this._patchListFile, 'utf8');

                            case 18:
                                createdByOldBuild = _context.sent.split("\n");

                                log('Created by old build files: ' + (0, _stringify2.default)(createdByOldBuild));
                                _context.next = 62;
                                break;

                            case 22:
                                _context.next = 24;
                                return common_1.default.fsExists(this._archiveListFile);

                            case 24:
                                if (!_context.sent) {
                                    _context.next = 32;
                                    break;
                                }

                                _context.next = 27;
                                return common_1.default.fsStat(this._archiveListFile);

                            case 27:
                                stat = _context.sent;

                                if (stat.isFile()) {
                                    _context.next = 30;
                                    break;
                                }

                                throw new Error('Can\'t patch because the archive file list isn\'t a file.');

                            case 30:
                                _context.next = 47;
                                break;

                            case 32:
                                archiveListFileDir = path.dirname(this._archiveListFile);
                                _context.next = 35;
                                return common_1.default.fsExists(archiveListFileDir);

                            case 35:
                                if (!_context.sent) {
                                    _context.next = 43;
                                    break;
                                }

                                _context.next = 38;
                                return common_1.default.fsStat(archiveListFileDir);

                            case 38:
                                dirStat = _context.sent;

                                if (dirStat.isDirectory()) {
                                    _context.next = 41;
                                    break;
                                }

                                throw new Error('Can\'t patch because the path to the archive file list is invalid.');

                            case 41:
                                _context.next = 47;
                                break;

                            case 43:
                                _context.next = 45;
                                return common_1.default.mkdirp(archiveListFileDir);

                            case 45:
                                if (_context.sent) {
                                    _context.next = 47;
                                    break;
                                }

                                throw new Error('Couldn\'t create the patch archive file list folder path');

                            case 47:
                                oldBuildFiles = undefined;
                                _context.next = 50;
                                return common_1.default.fsExists(this._archiveListFile);

                            case 50:
                                if (_context.sent) {
                                    _context.next = 54;
                                    break;
                                }

                                oldBuildFiles = currentFiles;
                                _context.next = 57;
                                break;

                            case 54:
                                _context.next = 56;
                                return common_1.default.fsReadFile(this._archiveListFile, 'utf8');

                            case 56:
                                oldBuildFiles = _context.sent.split("\n");

                            case 57:
                                log('Old build files: ' + (0, _stringify2.default)(oldBuildFiles));
                                // Files that the old build created are files in the file system that are not listed in the old build files
                                createdByOldBuild = _.difference(currentFiles, oldBuildFiles);
                                log('Created by old build files: ' + (0, _stringify2.default)(createdByOldBuild));
                                _context.next = 62;
                                return common_1.default.fsWriteFile(this._patchListFile, createdByOldBuild.join("\n"));

                            case 62:
                                return _context.abrupt("return", {
                                    createdByOldBuild: createdByOldBuild,
                                    currentFiles: currentFiles
                                });

                            case 63:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "finalizePatch",
        value: function finalizePatch(prepareResult, extractResult) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _this4 = this;

                var newBuildFiles, filesToRemove, unlinks;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                newBuildFiles = extractResult.files;

                                log('New build files: ' + (0, _stringify2.default)(newBuildFiles));
                                // Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build
                                filesToRemove = _.difference(prepareResult.currentFiles, newBuildFiles, prepareResult.createdByOldBuild);

                                log('Files to remove: ' + (0, _stringify2.default)(filesToRemove));
                                // TODO: use del lib
                                _context2.next = 6;
                                return _promise2.default.all(filesToRemove.map(function (file) {
                                    return common_1.default.fsUnlink(path.resolve(_this4._to, file)).then(function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                    });
                                }));

                            case 6:
                                unlinks = _context2.sent;
                                _context2.next = 9;
                                return common_1.default.fsWriteFile(this._archiveListFile, newBuildFiles.join("\n"));

                            case 9:
                                _context2.next = 11;
                                return common_1.default.fsUnlink(this._patchListFile);

                            case 11:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "patch",
        value: function patch() {
            var _this5 = this;

            // TODO: restrict operations to the given directories.
            return new _promise2.default(function (resolve) {
                _this5._extractHandle = extractor_1.Extractor.extract(_this5._tempFile, _this5._to, {
                    overwrite: true,
                    deleteSource: true,
                    decompressStream: _this5._options.decompressInDownload ? null : _this5._getDecompressStream()
                });
                _this5._extractHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                    return _this5.emitExtractProgress(progress);
                }).onFile(function (file) {
                    return _this5.emitFile(file);
                }).onStarted(function () {
                    return resolve({ promise: _this5._extractHandle.promise });
                }).start();
            });
        }
    }, {
        key: "start",
        value: function start(options) {
            log('Starting resumable');
            this._resumable.start({ cb: this.onStarting, args: [options], context: this });
        }
    }, {
        key: "onStarting",
        value: function onStarting(options) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var _this6 = this;

                var waitForDownload, prepareResult, waitForPatch, unpackResult;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                log('Resumable state: starting');

                                if (!this._firstRun) {
                                    _context3.next = 33;
                                    break;
                                }

                                this._firstRun = false;
                                _context3.prev = 3;

                                queue_1.VoodooQueue.manage(this);
                                _context3.next = 7;
                                return this.download();

                            case 7:
                                waitForDownload = _context3.sent;

                                this._emitter.emit('downloading');
                                this._resumable.started();
                                _context3.next = 12;
                                return waitForDownload.promise;

                            case 12:
                                _context3.next = 14;
                                return this.patchPrepare();

                            case 14:
                                prepareResult = _context3.sent;
                                _context3.next = 17;
                                return this.patch();

                            case 17:
                                waitForPatch = _context3.sent;

                                this._emitter.emit('patching');
                                _context3.next = 21;
                                return waitForPatch.promise;

                            case 21:
                                unpackResult = _context3.sent;
                                _context3.next = 24;
                                return this.finalizePatch(prepareResult, unpackResult);

                            case 24:
                                this.onFinished();
                                _context3.next = 31;
                                break;

                            case 27:
                                _context3.prev = 27;
                                _context3.t0 = _context3["catch"](3);

                                log('I really really hate you babel: ' + _context3.t0.message + '\n' + _context3.t0.stack);
                                this.onError(_context3.t0);

                            case 31:
                                _context3.next = 34;
                                break;

                            case 33:
                                if (this._state === PatchOperation.DOWNLOADING) {
                                    this._downloadHandle.onStarted(function () {
                                        _this6._resumable.started();
                                        _this6._emitter.emit('resumed', options && options.voodooQueue);
                                        log('Resumable state: started');
                                    }).start();
                                } else if (this._state === PatchOperation.PATCHING) {
                                    this._extractHandle.onStarted(function () {
                                        _this6._resumable.started();
                                        _this6._emitter.emit('resumed', options && options.voodooQueue);
                                        log('Resumable state: started');
                                    }).start();
                                }

                            case 34:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[3, 27]]);
            }));
        }
    }, {
        key: "_stop",
        value: function _stop(options) {
            log('Stopping resumable');
            this._resumable.stop({
                cb: this.onStopping,
                args: [options],
                context: this
            });
        }
    }, {
        key: "onStopping",
        value: function onStopping(options) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                var _this7 = this;

                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                if (this._state === PatchOperation.DOWNLOADING) {
                                    this._downloadHandle.onStopped(function () {
                                        _this7._resumable.stopped();
                                        _this7._emitter.emit(options.terminate ? 'canceled' : 'stopped', options && options.voodooQueue);
                                        log('Resumable state: stopped');
                                    }).stop();
                                } else if (this._state === PatchOperation.PATCHING) {
                                    this._extractHandle.onStopped(function () {
                                        _this7._resumable.stopped();
                                        _this7._emitter.emit(options.terminate ? 'canceled' : 'stopped', options && options.voodooQueue);
                                        log('Resumable state: stopped');
                                    }).stop(options.terminate);
                                }

                            case 1:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "stop",
        value: function stop(options) {
            var stopOptions = _.assign(options || { voodooQueue: false }, {
                terminate: false
            });
            return this._stop(stopOptions);
        }
    }, {
        key: "cancel",
        value: function cancel(options) {
            var stopOptions = _.assign(options || { voodooQueue: false }, {
                terminate: true
            });
            return this._stop(stopOptions);
        }
    }, {
        key: "onDownloading",
        value: function onDownloading(fn) {
            this._emitter.addListener('downloading', fn);
            return this;
        }
    }, {
        key: "deregisterOnDownloading",
        value: function deregisterOnDownloading(fn) {
            this._emitter.removeListener('downloading', fn);
            return this;
        }
    }, {
        key: "onProgress",
        value: function onProgress(unit, fn) {
            var func = function func(progress) {
                progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
                progress.timeLeft;
                fn(progress);
            };
            this._onProgressFuncMapping.set(fn, func);
            this._emitter.addListener('progress', func);
            return this;
        }
    }, {
        key: "deregisterOnProgress",
        value: function deregisterOnProgress(fn) {
            var func = this._onProgressFuncMapping.get(fn);
            if (func) {
                this._emitter.removeListener('progress', func);
                this._onProgressFuncMapping.delete(fn);
            }
            return this;
        }
    }, {
        key: "onPatching",
        value: function onPatching(fn) {
            this._emitter.addListener('patching', fn);
            return this;
        }
    }, {
        key: "deregisterOnPatching",
        value: function deregisterOnPatching(fn) {
            this._emitter.removeListener('patching', fn);
            return this;
        }
    }, {
        key: "onExtractProgress",
        value: function onExtractProgress(unit, fn) {
            var func = function func(progress) {
                progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
                progress.timeLeft;
                fn(progress);
            };
            this._onExtractProgressFuncMapping.set(fn, func);
            this._emitter.addListener('extract-progress', func);
            return this;
        }
    }, {
        key: "deregisterOnExtractProgress",
        value: function deregisterOnExtractProgress(fn) {
            var func = this._onExtractProgressFuncMapping.get(fn);
            if (func) {
                this._emitter.removeListener('extract-progress', func);
                this._onExtractProgressFuncMapping.delete(fn);
            }
            return this;
        }
    }, {
        key: "onFile",
        value: function onFile(fn) {
            this._emitter.addListener('file', fn);
            return this;
        }
    }, {
        key: "deregisterOnFile",
        value: function deregisterOnFile(fn) {
            this._emitter.removeListener('file', fn);
            return this;
        }
    }, {
        key: "onPaused",
        value: function onPaused(fn) {
            this._emitter.addListener('stopped', fn);
            return this;
        }
    }, {
        key: "deregisterOnPaused",
        value: function deregisterOnPaused(fn) {
            this._emitter.removeListener('stopped', fn);
            return this;
        }
    }, {
        key: "onResumed",
        value: function onResumed(fn) {
            this._emitter.addListener('resumed', fn);
            return this;
        }
    }, {
        key: "deregisterOnResumed",
        value: function deregisterOnResumed(fn) {
            this._emitter.removeListener('resumed', fn);
            return this;
        }
    }, {
        key: "onCanceled",
        value: function onCanceled(fn) {
            this._emitter.addListener('canceled', fn);
            return this;
        }
    }, {
        key: "deregisterOnCanceled",
        value: function deregisterOnCanceled(fn) {
            this._emitter.removeListener('canceled', fn);
            return this;
        }
    }, {
        key: "emitProgress",
        value: function emitProgress(progress) {
            this._emitter.emit('progress', progress);
        }
    }, {
        key: "emitExtractProgress",
        value: function emitExtractProgress(progress) {
            this._emitter.emit('extract-progress', progress);
        }
    }, {
        key: "emitFile",
        value: function emitFile(file) {
            this._emitter.emit('file', file);
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
            this._resumable.finished();
            this._resolver();
        }
    }, {
        key: "promise",
        get: function get() {
            return this._promise;
        }
    }, {
        key: "state",
        get: function get() {
            return this._state;
        }
    }]);
    return PatchHandle;
})();

exports.PatchHandle = PatchHandle;
//# sourceMappingURL=index.js.map
