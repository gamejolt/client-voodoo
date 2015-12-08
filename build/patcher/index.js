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
var brotliDecompress = require('iltorb').decompressStream;
var gzipDecompress = require('gunzip-maybe');
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
    PatchHandleState[PatchHandleState["STOPPED"] = 0] = "STOPPED";
    PatchHandleState[PatchHandleState["STOPPING"] = 1] = "STOPPING";
    PatchHandleState[PatchHandleState["DOWNLOADING"] = 2] = "DOWNLOADING";
    PatchHandleState[PatchHandleState["PATCHING"] = 3] = "PATCHING";
    PatchHandleState[PatchHandleState["FINISHED"] = 4] = "FINISHED";
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
            decompressInDownload: true
        });
        this._state = PatchHandleState.STOPPED;
        this._downloadHandle = null;
        this._emitter = new events_1.EventEmitter();
    }

    (0, _createClass3.default)(PatchHandle, [{
        key: "_getDecompressStream",
        value: function _getDecompressStream() {
            if (!this._build.archive_type) {
                return null;
            }
            switch (this._build.archive_type) {
                case 'tar.gz':
                    return gzipDecompress();
                case 'brotli':
                    return brotliDecompress();
                default:
                    return null;
            }
        }
    }, {
        key: "start",
        value: function start() {
            var _this = this;

            if (this._state !== PatchHandleState.STOPPED) {
                return this;
            }
            this._promise = this.promise;
            this._state = PatchHandleState.DOWNLOADING;
            this._emitter.emit('downloading');
            this._tempFile = path.join(this._build.install_dir, 'tempDownload');
            this._archiveListFile = path.join(this._build.install_dir, 'archive-file-list');
            this._to = path.join(this._build.install_dir, 'game');
            if (!this._downloadHandle) {
                this._downloadHandle = downloader_1.Downloader.download(this._url, this._tempFile, {
                    decompressStream: this._options.decompressInDownload ? this._getDecompressStream() : null
                });
            }
            this._downloadHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                return _this.emitProgress(progress);
            }).promise.then(function () {
                return _this.patch();
            }).then(function () {
                return _this.onFinished();
            }).catch(function (err) {
                return _this.onError(err);
            });
            return this;
        }
    }, {
        key: "stop",
        value: function stop() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!(this._state !== PatchHandleState.DOWNLOADING)) {
                                    _context.next = 2;
                                    break;
                                }

                                return _context.abrupt("return", false);

                            case 2:
                                this._state = PatchHandleState.STOPPING;
                                _context.next = 5;
                                return this._downloadHandle.stop();

                            case 5:
                                if (_context.sent) {
                                    _context.next = 8;
                                    break;
                                }

                                this._state = PatchHandleState.DOWNLOADING;
                                return _context.abrupt("return", false);

                            case 8:
                                this._state = PatchHandleState.STOPPED;
                                return _context.abrupt("return", true);

                            case 10:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "patch",
        value: function patch() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var _this2 = this;

                var currentFiles, stat, archiveListFileDir, dirStat, oldBuildFiles, extractResult, newBuildFiles, createdByOldBuild, filesToRemove, unlinks;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                // TODO: restrict operations to the given directories.
                                this._state = PatchHandleState.PATCHING;
                                this._emitter.emit('patching');
                                currentFiles = undefined;
                                _context2.next = 5;
                                return fsExists(this._to);

                            case 5:
                                _context2.t0 = !_context2.sent;

                                if (_context2.t0) {
                                    _context2.next = 10;
                                    break;
                                }

                                _context2.next = 9;
                                return fsStat(this._to);

                            case 9:
                                _context2.t0 = !_context2.sent.isDirectory();

                            case 10:
                                if (!_context2.t0) {
                                    _context2.next = 14;
                                    break;
                                }

                                currentFiles = [];
                                _context2.next = 18;
                                break;

                            case 14:
                                _context2.next = 16;
                                return fsReadDirRecursively(this._to);

                            case 16:
                                _context2.t1 = function (file) {
                                    return './' + path.relative(_this2._to, file);
                                };

                                currentFiles = _context2.sent.map(_context2.t1);

                            case 18:
                                _context2.next = 20;
                                return fsExists(this._archiveListFile);

                            case 20:
                                if (!_context2.sent) {
                                    _context2.next = 28;
                                    break;
                                }

                                _context2.next = 23;
                                return fsStat(this._archiveListFile);

                            case 23:
                                stat = _context2.sent;

                                if (stat.isFile()) {
                                    _context2.next = 26;
                                    break;
                                }

                                throw new Error('Can\'t patch because the archive file list isn\'t a file.');

                            case 26:
                                _context2.next = 43;
                                break;

                            case 28:
                                archiveListFileDir = path.dirname(this._archiveListFile);
                                _context2.next = 31;
                                return fsExists(archiveListFileDir);

                            case 31:
                                if (!_context2.sent) {
                                    _context2.next = 39;
                                    break;
                                }

                                _context2.next = 34;
                                return fsStat(archiveListFileDir);

                            case 34:
                                dirStat = _context2.sent;

                                if (dirStat.isDirectory()) {
                                    _context2.next = 37;
                                    break;
                                }

                                throw new Error('Can\'t patch because the path to the archive file list is invalid.');

                            case 37:
                                _context2.next = 43;
                                break;

                            case 39:
                                _context2.next = 41;
                                return mkdirp(archiveListFileDir);

                            case 41:
                                if (_context2.sent) {
                                    _context2.next = 43;
                                    break;
                                }

                                throw new Error('Couldn\'t create the patch archive file list folder path');

                            case 43:
                                oldBuildFiles = undefined;
                                _context2.next = 46;
                                return fsExists(this._archiveListFile);

                            case 46:
                                if (_context2.sent) {
                                    _context2.next = 50;
                                    break;
                                }

                                oldBuildFiles = currentFiles;
                                _context2.next = 53;
                                break;

                            case 50:
                                _context2.next = 52;
                                return fsReadFile(this._archiveListFile, 'utf8');

                            case 52:
                                oldBuildFiles = _context2.sent.split("\n");

                            case 53:
                                _context2.next = 55;
                                return extractor_1.Extractor.extract(this._tempFile, this._to, {
                                    overwrite: true,
                                    deleteSource: true,
                                    decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream()
                                }).promise;

                            case 55:
                                extractResult = _context2.sent;

                                if (extractResult.success) {
                                    _context2.next = 58;
                                    break;
                                }

                                throw new Error('Failed to extract patch file');

                            case 58:
                                newBuildFiles = extractResult.files;
                                // Files that the old build created are files in the file system that are not listed in the old build files

                                createdByOldBuild = _.difference(currentFiles, oldBuildFiles);
                                // Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build

                                filesToRemove = _.difference(currentFiles, newBuildFiles, createdByOldBuild);
                                // TODO: use del lib

                                _context2.next = 63;
                                return _promise2.default.all(filesToRemove.map(function (file) {
                                    return fsUnlink(path.resolve(_this2._to, file)).then(function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                        return true;
                                    });
                                }));

                            case 63:
                                unlinks = _context2.sent;
                                _context2.next = 66;
                                return fsWriteFile(this._archiveListFile, newBuildFiles.join("\n"));

                            case 66:
                                return _context2.abrupt("return", true);

                            case 67:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
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
            this._state = PatchHandleState.STOPPED;
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
            var _this3 = this;

            if (!this._promise) {
                this._promise = new _promise2.default(function (resolve, reject) {
                    _this3._resolver = resolve;
                    _this3._rejector = reject;
                });
            }
            return this._promise;
        }
    }]);
    return PatchHandle;
})();

exports.PatchHandle = PatchHandle;
//# sourceMappingURL=index.js.map
