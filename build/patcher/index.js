"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

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
var queue_1 = require('../queue');
var common_1 = require('../common');
(function (PatchHandleState) {
    PatchHandleState[PatchHandleState["STOPPED_DOWNLOAD"] = 0] = "STOPPED_DOWNLOAD";
    PatchHandleState[PatchHandleState["STOPPING_DOWNLOAD"] = 1] = "STOPPING_DOWNLOAD";
    PatchHandleState[PatchHandleState["STARTING_DOWNLOAD"] = 2] = "STARTING_DOWNLOAD";
    PatchHandleState[PatchHandleState["DOWNLOADING"] = 3] = "DOWNLOADING";
    PatchHandleState[PatchHandleState["STOPPED_PATCH"] = 4] = "STOPPED_PATCH";
    PatchHandleState[PatchHandleState["STOPPING_PATCH"] = 5] = "STOPPING_PATCH";
    PatchHandleState[PatchHandleState["STARTING_PATCH"] = 6] = "STARTING_PATCH";
    PatchHandleState[PatchHandleState["PATCHING"] = 7] = "PATCHING";
    PatchHandleState[PatchHandleState["FINISHING"] = 8] = "FINISHING";
    PatchHandleState[PatchHandleState["FINISHED"] = 9] = "FINISHED";
})(exports.PatchHandleState || (exports.PatchHandleState = {}));
var PatchHandleState = exports.PatchHandleState;
var DOWNLOADING_STATES = [PatchHandleState.STOPPED_DOWNLOAD, PatchHandleState.STOPPING_DOWNLOAD, PatchHandleState.STARTING_DOWNLOAD, PatchHandleState.DOWNLOADING];
var PATCHING_STATES = [PatchHandleState.STOPPED_PATCH, PatchHandleState.STOPPING_PATCH, PatchHandleState.STARTING_PATCH, PatchHandleState.PATCHING];
var FINISHED_STATES = [PatchHandleState.FINISHING, PatchHandleState.FINISHED];

var Patcher = (function () {
    function Patcher() {
        (0, _classCallCheck3.default)(this, Patcher);
    }

    (0, _createClass3.default)(Patcher, null, [{
        key: "patch",
        value: function patch(url, build, options) {
            return new PatchHandle(url, build, options);
        }
    }]);
    return Patcher;
})();

exports.Patcher = Patcher;

var PatchHandle = (function () {
    function PatchHandle(_url, _build, _options) {
        (0, _classCallCheck3.default)(this, PatchHandle);

        this._url = _url;
        this._build = _build;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            overwrite: false,
            decompressInDownload: false
        });
        this._state = PatchHandleState.STOPPED_DOWNLOAD;
        this._downloadHandle = null;
        this._extractHandle = null;
        this._onProgressFuncMapping = new _map2.default();
        this._onExtractProgressFuncMapping = new _map2.default();
        this._emitter = new events_1.EventEmitter();
    }

    (0, _createClass3.default)(PatchHandle, [{
        key: "isDownloading",
        value: function isDownloading() {
            return DOWNLOADING_STATES.indexOf(this._state) !== -1;
        }
    }, {
        key: "isPatching",
        value: function isPatching() {
            return PATCHING_STATES.indexOf(this._state) !== -1;
        }
    }, {
        key: "isFinished",
        value: function isFinished() {
            return FINISHED_STATES.indexOf(this._state) !== -1;
        }
    }, {
        key: "_getDecompressStream",
        value: function _getDecompressStream() {
            if (!this._build.archive_type) {
                return null;
            }
            switch (this._build.archive_type) {
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
        key: "waitForStart",
        value: function waitForStart() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this = this;

                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(this._state !== PatchHandleState.STOPPED_DOWNLOAD && this._state !== PatchHandleState.STOPPED_PATCH)) {
                                    _context.next = 2;
                                    break;
                                }

                                return _context.abrupt("return", this._waitForStartPromise);

                            case 2:
                                if (!this._waitForStartPromise) {
                                    this._waitForStartPromise = new _promise2.default(function (resolve, reject) {
                                        _this._waitForStartResolver = resolve;
                                        _this._waitForStartRejector = reject;
                                    });
                                }
                                return _context.abrupt("return", this._waitForStartPromise);

                            case 4:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "start",
        value: function start(url) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                var _this2 = this;

                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                this._url = url || this._url;
                                this._promise = this.promise;

                                if (!(this._state === PatchHandleState.STOPPED_DOWNLOAD)) {
                                    _context3.next = 22;
                                    break;
                                }

                                this._state = PatchHandleState.STARTING_DOWNLOAD;
                                if (this._waitForStartPromise) {
                                    this._waitForStartResolver();
                                    this._waitForStartPromise = null;
                                }
                                this._tempFile = path.join(this._build.install_dir, '.gj-tempDownload');
                                this._archiveListFile = path.join(this._build.install_dir, '.gj-archive-file-list');
                                this._patchListFile = path.join(this._build.install_dir, '.gj-patch-file');
                                this._to = this._build.install_dir;

                                if (this._downloadHandle) {
                                    _context3.next = 15;
                                    break;
                                }

                                this._downloadHandle = downloader_1.Downloader.download(this._url, this._tempFile, {
                                    overwrite: this._options.overwrite,
                                    decompressStream: this._options.decompressInDownload ? this._getDecompressStream() : null
                                });
                                this._downloadHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                                    return _this2.emitProgress(progress);
                                }).start().then(function () {
                                    return __awaiter(_this2, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                                        var _this3 = this;

                                        return _regenerator2.default.wrap(function _callee2$(_context2) {
                                            while (1) {
                                                switch (_context2.prev = _context2.next) {
                                                    case 0:
                                                        this._state = PatchHandleState.DOWNLOADING;
                                                        if (!this._emittedDownloading) {
                                                            this._emitter.emit('downloading');
                                                            this._emittedDownloading = true;
                                                        }
                                                        if (this._wasStopped) {
                                                            this._emitter.emit('resumed');
                                                        }
                                                        // TODO consider putting this beofre emitting downloading event if we dont want to emit it for tasks that pend right away.
                                                        _context2.next = 5;
                                                        return queue_1.VoodooQueue.enqueue(this);

                                                    case 5:
                                                        return _context2.abrupt("return", this._downloadHandle.promise.then(function () {
                                                            return _this3.patch();
                                                        }).then(function () {
                                                            return _this3.onFinished();
                                                        }).catch(function (err) {
                                                            return _this3.onError(err);
                                                        }));

                                                    case 6:
                                                    case "end":
                                                        return _context2.stop();
                                                }
                                            }
                                        }, _callee2, this);
                                    }));
                                });
                                // Make sure to not remove the temp download file if we're resuming.
                                this._options.overwrite = false;
                                _context3.next = 19;
                                break;

                            case 15:
                                _context3.next = 17;
                                return this._downloadHandle.start();

                            case 17:
                                this._state = PatchHandleState.DOWNLOADING;
                                if (this._wasStopped) {
                                    this._emitter.emit('resumed');
                                }

                            case 19:
                                return _context3.abrupt("return", true);

                            case 22:
                                if (!(this._state === PatchHandleState.STOPPED_PATCH)) {
                                    _context3.next = 28;
                                    break;
                                }

                                this._state = PatchHandleState.PATCHING;
                                if (this._waitForStartPromise) {
                                    this._waitForStartResolver();
                                    this._waitForStartPromise = null;
                                }
                                this._emitter.emit('resumed');
                                this._extractHandle.start();
                                return _context3.abrupt("return", true);

                            case 28:
                                return _context3.abrupt("return", false);

                            case 29:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "_stop",
        value: function _stop(terminate) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                console.log('State: ' + this._state);

                                if (!(this._state === PatchHandleState.DOWNLOADING)) {
                                    _context4.next = 13;
                                    break;
                                }

                                console.log('Stopping download');
                                this._state = PatchHandleState.STOPPING_DOWNLOAD;
                                _context4.next = 6;
                                return this._downloadHandle.stop();

                            case 6:
                                if (_context4.sent) {
                                    _context4.next = 10;
                                    break;
                                }

                                console.log('Failed to stop download');
                                this._state = PatchHandleState.DOWNLOADING;
                                return _context4.abrupt("return", false);

                            case 10:
                                this._state = PatchHandleState.STOPPED_DOWNLOAD;
                                _context4.next = 29;
                                break;

                            case 13:
                                if (!(this._state === PatchHandleState.PATCHING)) {
                                    _context4.next = 28;
                                    break;
                                }

                                console.log('Stopping patch');
                                this._state = PatchHandleState.STOPPING_PATCH;
                                _context4.t0 = this._extractHandle;

                                if (!_context4.t0) {
                                    _context4.next = 21;
                                    break;
                                }

                                _context4.next = 20;
                                return this._extractHandle.stop(terminate);

                            case 20:
                                _context4.t0 = !_context4.sent;

                            case 21:
                                if (!_context4.t0) {
                                    _context4.next = 25;
                                    break;
                                }

                                console.log('Failed to stop patch');
                                this._state = PatchHandleState.PATCHING;
                                return _context4.abrupt("return", false);

                            case 25:
                                this._state = PatchHandleState.STOPPED_PATCH;
                                _context4.next = 29;
                                break;

                            case 28:
                                return _context4.abrupt("return", false);

                            case 29:
                                console.log('Stopped');
                                console.log('State: ' + this._state);
                                this._wasStopped = true;
                                if (terminate) {
                                    this._emitter.emit('canceled');
                                } else {
                                    this._emitter.emit('stopped');
                                }
                                this.waitForStart();
                                return _context4.abrupt("return", true);

                            case 35:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "stop",
        value: function stop() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                return _context5.abrupt("return", this._stop(false));

                            case 1:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: "cancel",
        value: function cancel() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee6() {
                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                return _context6.abrupt("return", this._stop(true));

                            case 1:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));
        }
    }, {
        key: "patch",
        value: function patch() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee7() {
                var _this4 = this;

                var createdByOldBuild, currentFiles, stat, archiveListFileDir, dirStat, oldBuildFiles, _createdByOldBuild, extractResult, newBuildFiles, filesToRemove, unlinks;

                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                // TODO: restrict operations to the given directories.
                                this._state = PatchHandleState.STARTING_PATCH;
                                console.log('Changing state to patching. State is ' + this._state);
                                createdByOldBuild = undefined;
                                // TODO: check if ./ is valid on windows platforms as well.

                                _context7.next = 5;
                                return common_1.default.fsReadDirRecursively(this._to);

                            case 5:
                                _context7.t0 = function (file) {
                                    return !path.basename(file).startsWith('.gj-');
                                };

                                _context7.t1 = function (file) {
                                    return './' + path.relative(_this4._to, file);
                                };

                                currentFiles = _context7.sent.filter(_context7.t0).map(_context7.t1);
                                _context7.next = 10;
                                return common_1.default.fsExists(this._patchListFile);

                            case 10:
                                if (!_context7.sent) {
                                    _context7.next = 21;
                                    break;
                                }

                                _context7.next = 13;
                                return common_1.default.fsStat(this._patchListFile);

                            case 13:
                                stat = _context7.sent;

                                if (stat.isFile()) {
                                    _context7.next = 16;
                                    break;
                                }

                                throw new Error('Can\'t patch because the patch file isn\'t a file.');

                            case 16:
                                _context7.next = 18;
                                return common_1.default.fsReadFile(this._patchListFile, 'utf8');

                            case 18:
                                createdByOldBuild = _context7.sent.split("\n");
                                _context7.next = 59;
                                break;

                            case 21:
                                _context7.next = 23;
                                return common_1.default.fsExists(this._archiveListFile);

                            case 23:
                                if (!_context7.sent) {
                                    _context7.next = 31;
                                    break;
                                }

                                _context7.next = 26;
                                return common_1.default.fsStat(this._archiveListFile);

                            case 26:
                                stat = _context7.sent;

                                if (stat.isFile()) {
                                    _context7.next = 29;
                                    break;
                                }

                                throw new Error('Can\'t patch because the archive file list isn\'t a file.');

                            case 29:
                                _context7.next = 46;
                                break;

                            case 31:
                                archiveListFileDir = path.dirname(this._archiveListFile);
                                _context7.next = 34;
                                return common_1.default.fsExists(archiveListFileDir);

                            case 34:
                                if (!_context7.sent) {
                                    _context7.next = 42;
                                    break;
                                }

                                _context7.next = 37;
                                return common_1.default.fsStat(archiveListFileDir);

                            case 37:
                                dirStat = _context7.sent;

                                if (dirStat.isDirectory()) {
                                    _context7.next = 40;
                                    break;
                                }

                                throw new Error('Can\'t patch because the path to the archive file list is invalid.');

                            case 40:
                                _context7.next = 46;
                                break;

                            case 42:
                                _context7.next = 44;
                                return common_1.default.mkdirp(archiveListFileDir);

                            case 44:
                                if (_context7.sent) {
                                    _context7.next = 46;
                                    break;
                                }

                                throw new Error('Couldn\'t create the patch archive file list folder path');

                            case 46:
                                oldBuildFiles = undefined;
                                _context7.next = 49;
                                return common_1.default.fsExists(this._archiveListFile);

                            case 49:
                                if (_context7.sent) {
                                    _context7.next = 53;
                                    break;
                                }

                                oldBuildFiles = currentFiles;
                                _context7.next = 56;
                                break;

                            case 53:
                                _context7.next = 55;
                                return common_1.default.fsReadFile(this._archiveListFile, 'utf8');

                            case 55:
                                oldBuildFiles = _context7.sent.split("\n");

                            case 56:
                                // Files that the old build created are files in the file system that are not listed in the old build files
                                _createdByOldBuild = _.difference(currentFiles, oldBuildFiles);
                                _context7.next = 59;
                                return common_1.default.fsWriteFile(this._patchListFile, _createdByOldBuild.join("\n"));

                            case 59:
                                console.log('State when starting patch: ' + this._state);
                                console.log('Waiting for start');
                                _context7.next = 63;
                                return this.waitForStart();

                            case 63:
                                console.log('Waited');
                                this._extractHandle = extractor_1.Extractor.extract(this._tempFile, this._to, {
                                    overwrite: true,
                                    deleteSource: true,
                                    decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream()
                                });
                                this._extractHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                                    return _this4.emitExtractProgress(progress);
                                }).onFile(function (file) {
                                    return _this4.emitFile(file);
                                });
                                //  Wait for start before emitting the patching state to be sure everything's initialized properly.
                                _context7.next = 68;
                                return this._extractHandle.start();

                            case 68:
                                // TODO might need manual extractor start here
                                this._state = PatchHandleState.PATCHING;
                                if (!this._emittedPatching) {
                                    console.log('State when patching: ' + this._state);
                                    this._emitter.emit('patching');
                                    this._emittedPatching = true;
                                }
                                if (this._wasStopped) {
                                    this._emitter.emit('resumed');
                                }
                                _context7.next = 73;
                                return this._extractHandle.promise;

                            case 73:
                                extractResult = _context7.sent;

                                if (extractResult.success) {
                                    _context7.next = 76;
                                    break;
                                }

                                throw new Error('Failed to extract patch file');

                            case 76:
                                this._state = PatchHandleState.FINISHING;
                                newBuildFiles = extractResult.files;
                                // Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build

                                filesToRemove = _.difference(currentFiles, newBuildFiles, createdByOldBuild);
                                // TODO: use del lib

                                _context7.next = 81;
                                return _promise2.default.all(filesToRemove.map(function (file) {
                                    return common_1.default.fsUnlink(path.resolve(_this4._to, file)).then(function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                        return true;
                                    });
                                }));

                            case 81:
                                unlinks = _context7.sent;
                                _context7.next = 84;
                                return common_1.default.fsWriteFile(this._archiveListFile, newBuildFiles.join("\n"));

                            case 84:
                                return _context7.abrupt("return", true);

                            case 85:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));
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
            this._state = PatchHandleState.STOPPED_DOWNLOAD;
            this._rejector(err);
            this._promise = null;
        }
    }, {
        key: "onFinished",
        value: function onFinished() {
            this._state = PatchHandleState.FINISHED;
            this._resolver();
        }
    }, {
        key: "promise",
        get: function get() {
            var _this5 = this;

            if (!this._promise) {
                this._promise = new _promise2.default(function (resolve, reject) {
                    _this5._resolver = resolve;
                    _this5._rejector = reject;
                });
            }
            return this._promise;
        }
    }, {
        key: "state",
        get: function get() {
            return this._state;
        }
    }, {
        key: "_state",
        get: function get() {
            return this.__state;
        },
        set: function set(state) {
            console.log('Setting state to ' + state + ' ' + new Error().stack.split('\n')[2]);
            this.__state = state;
        }
    }]);
    return PatchHandle;
})();

exports.PatchHandle = PatchHandle;
//# sourceMappingURL=index.js.map
