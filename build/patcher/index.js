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
var _ = require('lodash');
var path = require('path');
var events_1 = require('events');
var StreamSpeed = require('../downloader/stream-speed');
var downloader_1 = require('../downloader');
var extractor_1 = require('../extractor');
var Bluebird = require('bluebird');
var mkdirp = Bluebird.promisify(require('mkdirp'));
var fsUnlink = Bluebird.promisify(fs.unlink);
var fsExists = function fsExists(path) {
    return new _promise2.default(function (resolve) {
        fs.exists(path, resolve);
    });
};
var fsReadFile = Bluebird.promisify(fs.readFile);
var fsWriteFile = Bluebird.promisify(fs.writeFile);
var fsStat = Bluebird.promisify(fs.stat);
var fsReadDir = Bluebird.promisify(fs.readdir);
var fsReadDirRecursively = Bluebird.promisify(require('recursive-readdir'));
(function (PatchHandleState) {
    PatchHandleState[PatchHandleState["STOPPED_DOWNLOAD"] = 0] = "STOPPED_DOWNLOAD";
    PatchHandleState[PatchHandleState["STOPPING_DOWNLOAD"] = 1] = "STOPPING_DOWNLOAD";
    PatchHandleState[PatchHandleState["DOWNLOADING"] = 2] = "DOWNLOADING";
    PatchHandleState[PatchHandleState["STOPPED_PATCH"] = 3] = "STOPPED_PATCH";
    PatchHandleState[PatchHandleState["STOPPING_PATCH"] = 4] = "STOPPING_PATCH";
    PatchHandleState[PatchHandleState["PATCHING"] = 5] = "PATCHING";
    PatchHandleState[PatchHandleState["FINISHING"] = 6] = "FINISHING";
    PatchHandleState[PatchHandleState["FINISHED"] = 7] = "FINISHED";
})(exports.PatchHandleState || (exports.PatchHandleState = {}));
var PatchHandleState = exports.PatchHandleState;

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
        this._emitter = new events_1.EventEmitter();
    }

    (0, _createClass3.default)(PatchHandle, [{
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
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _this2 = this;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                this._url = url || this._url;
                                this._promise = this.promise;

                                if (!(this._state === PatchHandleState.STOPPED_DOWNLOAD)) {
                                    _context2.next = 15;
                                    break;
                                }

                                if (this._waitForStartPromise) {
                                    this._waitForStartResolver();
                                    this._waitForStartPromise = null;
                                }
                                this._state = PatchHandleState.DOWNLOADING;
                                if (!this._emittedDownloading) {
                                    this._emitter.emit('downloading');
                                    this._emittedDownloading = true;
                                }
                                this._tempFile = path.join(this._build.install_dir, '.gj-tempDownload');
                                this._archiveListFile = path.join(this._build.install_dir, '.gj-archive-file-list');
                                this._patchListFile = path.join(this._build.install_dir, '.gj-patch-file');
                                this._to = this._build.install_dir;
                                if (!this._downloadHandle) {
                                    this._downloadHandle = downloader_1.Downloader.download(this._url, this._tempFile, {
                                        overwrite: this._options.overwrite,
                                        decompressStream: this._options.decompressInDownload ? this._getDecompressStream() : null
                                    });
                                    this._downloadHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                                        return _this2.emitProgress(progress);
                                    }).promise.then(function () {
                                        return _this2.patch();
                                    }).then(function () {
                                        return _this2.onFinished();
                                    }).catch(function (err) {
                                        return _this2.onError(err);
                                    });
                                    // Make sure to not remove the temp download file if we're resuming.
                                    this._options.overwrite = false;
                                }
                                // This resumes if it already existed.
                                this._downloadHandle.start();
                                return _context2.abrupt("return", true);

                            case 15:
                                if (!(this._state === PatchHandleState.STOPPED_PATCH)) {
                                    _context2.next = 21;
                                    break;
                                }

                                console.log('Resuming patching');
                                if (this._waitForStartPromise) {
                                    this._waitForStartResolver();
                                    this._waitForStartPromise = null;
                                }
                                this._state = PatchHandleState.PATCHING;
                                this._extractHandle.start();
                                return _context2.abrupt("return", true);

                            case 21:
                                return _context2.abrupt("return", false);

                            case 22:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "_stop",
        value: function _stop(terminate) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (!(this._state === PatchHandleState.DOWNLOADING)) {
                                    _context3.next = 10;
                                    break;
                                }

                                this._state = PatchHandleState.STOPPING_DOWNLOAD;
                                _context3.next = 4;
                                return this._downloadHandle.stop();

                            case 4:
                                if (_context3.sent) {
                                    _context3.next = 7;
                                    break;
                                }

                                this._state = PatchHandleState.DOWNLOADING;
                                return _context3.abrupt("return", false);

                            case 7:
                                this._state = PatchHandleState.STOPPED_DOWNLOAD;
                                _context3.next = 27;
                                break;

                            case 10:
                                if (!(this._state === PatchHandleState.PATCHING)) {
                                    _context3.next = 26;
                                    break;
                                }

                                this._state = PatchHandleState.STOPPING_PATCH;
                                console.log('Stopping extraction');
                                _context3.t0 = this._extractHandle;

                                if (!_context3.t0) {
                                    _context3.next = 18;
                                    break;
                                }

                                _context3.next = 17;
                                return this._extractHandle.stop(terminate);

                            case 17:
                                _context3.t0 = !_context3.sent;

                            case 18:
                                if (!_context3.t0) {
                                    _context3.next = 22;
                                    break;
                                }

                                console.log('Failed to stop extraction');
                                this._state = PatchHandleState.PATCHING;
                                return _context3.abrupt("return", false);

                            case 22:
                                console.log('Stopped extraction');
                                this._state = PatchHandleState.STOPPED_PATCH;
                                _context3.next = 27;
                                break;

                            case 26:
                                return _context3.abrupt("return", false);

                            case 27:
                                if (terminate) {
                                    this._emitter.emit('canceled');
                                } else {
                                    this._emitter.emit('stopped');
                                }
                                this.waitForStart();
                                return _context3.abrupt("return", true);

                            case 30:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "stop",
        value: function stop() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                return _context4.abrupt("return", this._stop(false));

                            case 1:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));
        }
    }, {
        key: "cancel",
        value: function cancel() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                return _context5.abrupt("return", this._stop(true));

                            case 1:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));
        }
    }, {
        key: "patch",
        value: function patch() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee6() {
                var _this3 = this;

                var createdByOldBuild, currentFiles, stat, archiveListFileDir, dirStat, oldBuildFiles, _createdByOldBuild, extractResult, newBuildFiles, filesToRemove, unlinks;

                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                // TODO: restrict operations to the given directories.
                                this._state = PatchHandleState.PATCHING;
                                if (!this._emittedPatching) {
                                    this._emitter.emit('patching');
                                    this._emittedPatching = true;
                                }
                                createdByOldBuild = undefined;
                                // TODO: check if ./ is valid on windows platforms as well.

                                _context6.next = 5;
                                return fsReadDirRecursively(this._to);

                            case 5:
                                _context6.t0 = function (file) {
                                    return !path.basename(file).startsWith('.gj-');
                                };

                                _context6.t1 = function (file) {
                                    return './' + path.relative(_this3._to, file);
                                };

                                currentFiles = _context6.sent.filter(_context6.t0).map(_context6.t1);
                                _context6.next = 10;
                                return fsExists(this._patchListFile);

                            case 10:
                                if (!_context6.sent) {
                                    _context6.next = 21;
                                    break;
                                }

                                _context6.next = 13;
                                return fsStat(this._patchListFile);

                            case 13:
                                stat = _context6.sent;

                                if (stat.isFile()) {
                                    _context6.next = 16;
                                    break;
                                }

                                throw new Error('Can\'t patch because the patch file isn\'t a file.');

                            case 16:
                                _context6.next = 18;
                                return fsReadFile(this._patchListFile, 'utf8');

                            case 18:
                                createdByOldBuild = _context6.sent.split("\n");
                                _context6.next = 59;
                                break;

                            case 21:
                                _context6.next = 23;
                                return fsExists(this._archiveListFile);

                            case 23:
                                if (!_context6.sent) {
                                    _context6.next = 31;
                                    break;
                                }

                                _context6.next = 26;
                                return fsStat(this._archiveListFile);

                            case 26:
                                stat = _context6.sent;

                                if (stat.isFile()) {
                                    _context6.next = 29;
                                    break;
                                }

                                throw new Error('Can\'t patch because the archive file list isn\'t a file.');

                            case 29:
                                _context6.next = 46;
                                break;

                            case 31:
                                archiveListFileDir = path.dirname(this._archiveListFile);
                                _context6.next = 34;
                                return fsExists(archiveListFileDir);

                            case 34:
                                if (!_context6.sent) {
                                    _context6.next = 42;
                                    break;
                                }

                                _context6.next = 37;
                                return fsStat(archiveListFileDir);

                            case 37:
                                dirStat = _context6.sent;

                                if (dirStat.isDirectory()) {
                                    _context6.next = 40;
                                    break;
                                }

                                throw new Error('Can\'t patch because the path to the archive file list is invalid.');

                            case 40:
                                _context6.next = 46;
                                break;

                            case 42:
                                _context6.next = 44;
                                return mkdirp(archiveListFileDir);

                            case 44:
                                if (_context6.sent) {
                                    _context6.next = 46;
                                    break;
                                }

                                throw new Error('Couldn\'t create the patch archive file list folder path');

                            case 46:
                                oldBuildFiles = undefined;
                                _context6.next = 49;
                                return fsExists(this._archiveListFile);

                            case 49:
                                if (_context6.sent) {
                                    _context6.next = 53;
                                    break;
                                }

                                oldBuildFiles = currentFiles;
                                _context6.next = 56;
                                break;

                            case 53:
                                _context6.next = 55;
                                return fsReadFile(this._archiveListFile, 'utf8');

                            case 55:
                                oldBuildFiles = _context6.sent.split("\n");

                            case 56:
                                // Files that the old build created are files in the file system that are not listed in the old build files
                                _createdByOldBuild = _.difference(currentFiles, oldBuildFiles);
                                _context6.next = 59;
                                return fsWriteFile(this._patchListFile, _createdByOldBuild.join("\n"));

                            case 59:
                                console.log('Extracting');
                                _context6.next = 62;
                                return this.waitForStart();

                            case 62:
                                this._extractHandle = extractor_1.Extractor.extract(this._tempFile, this._to, {
                                    overwrite: true,
                                    deleteSource: true,
                                    decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream()
                                });
                                _context6.next = 65;
                                return this._extractHandle.promise;

                            case 65:
                                extractResult = _context6.sent;

                                if (extractResult.success) {
                                    _context6.next = 68;
                                    break;
                                }

                                throw new Error('Failed to extract patch file');

                            case 68:
                                this._state = PatchHandleState.FINISHING;
                                newBuildFiles = extractResult.files;
                                // Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build

                                filesToRemove = _.difference(currentFiles, newBuildFiles, createdByOldBuild);
                                // TODO: use del lib

                                _context6.next = 73;
                                return _promise2.default.all(filesToRemove.map(function (file) {
                                    return fsUnlink(path.resolve(_this3._to, file)).then(function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                        return true;
                                    });
                                }));

                            case 73:
                                unlinks = _context6.sent;
                                _context6.next = 76;
                                return fsWriteFile(this._archiveListFile, newBuildFiles.join("\n"));

                            case 76:
                                return _context6.abrupt("return", true);

                            case 77:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));
        }
    }, {
        key: "onDownloading",
        value: function onDownloading(fn) {
            this._emitter.addListener('downloading', fn);
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
        key: "onPatching",
        value: function onPatching(fn) {
            this._emitter.addListener('patching', fn);
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
            var _this4 = this;

            if (!this._promise) {
                this._promise = new _promise2.default(function (resolve, reject) {
                    _this4._resolver = resolve;
                    _this4._rejector = reject;
                });
            }
            return this._promise;
        }
    }]);
    return PatchHandle;
})();

exports.PatchHandle = PatchHandle;
//# sourceMappingURL=index.js.map
