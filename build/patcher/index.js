"use strict";

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

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
var decompressStream = require('iltorb').decompressStream;
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
        value: function patch(from, to, options) {
            return new PatchHandle(from, to, options);
        }
    }]);
    return Patcher;
})();

exports.Patcher = Patcher;

var PatchHandle = (function () {
    function PatchHandle(_from, _to, _options) {
        (0, _classCallCheck3.default)(this, PatchHandle);

        this._from = _from;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            brotli: true
        });
        this._state = PatchHandleState.STOPPED;
        this._downloadHandle = null;
        this._emitter = new events_1.EventEmitter();
        this.start();
    }

    (0, _createClass3.default)(PatchHandle, [{
        key: "start",
        value: function start() {
            var _this = this;

            if (this._state !== PatchHandleState.STOPPED) {
                return false;
            }
            this._promise = this.promise;
            this._state = PatchHandleState.DOWNLOADING;
            this._downloadHandle = this._downloadHandle || downloader_1.Downloader.download(this._from, this._options.tempDir, {
                brotli: this._options.brotli
            });
            this._downloadHandle.onProgress(StreamSpeed.SampleUnit.Bps, function (progress) {
                return _this.emitProgress(progress);
            }).promise.then(function () {
                return _this.patch();
            }).then(function () {
                return _this.onFinished();
            }).catch(function (err) {
                return _this.onError(err);
            });
            return true;
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

                var currentFiles, oldBuildFiles, extractResult, newBuildFiles, createdByOldBuild, filesToRemove, unlinks;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                // TODO: restrict operations to the given directories.
                                this._state = PatchHandleState.PATCHING;
                                currentFiles = undefined;
                                _context2.next = 4;
                                return fsExists(this._to);

                            case 4:
                                _context2.t0 = !_context2.sent;

                                if (_context2.t0) {
                                    _context2.next = 9;
                                    break;
                                }

                                _context2.next = 8;
                                return fsStat(this._to);

                            case 8:
                                _context2.t0 = !_context2.sent.isDirectory();

                            case 9:
                                if (!_context2.t0) {
                                    _context2.next = 13;
                                    break;
                                }

                                currentFiles = [];
                                _context2.next = 17;
                                break;

                            case 13:
                                _context2.next = 15;
                                return fsReadDirRecursively(this._to);

                            case 15:
                                _context2.t1 = function (file) {
                                    return './' + path.relative(_this2._to, file);
                                };

                                currentFiles = _context2.sent.map(_context2.t1);

                            case 17:
                                console.log('Current files: ' + (0, _stringify2.default)(currentFiles));
                                oldBuildFiles = undefined;
                                _context2.next = 21;
                                return fsExists(this._options.archiveListFile);

                            case 21:
                                if (_context2.sent) {
                                    _context2.next = 25;
                                    break;
                                }

                                oldBuildFiles = currentFiles;
                                _context2.next = 28;
                                break;

                            case 25:
                                _context2.next = 27;
                                return fsReadFile(this._options.archiveListFile, 'utf8');

                            case 27:
                                oldBuildFiles = _context2.sent.split("\n");

                            case 28:
                                console.log('Old files: ' + (0, _stringify2.default)(oldBuildFiles));
                                _context2.next = 31;
                                return extractor_1.Extractor.extract(this._downloadHandle.toFullpath, this._to, {
                                    brotli: false,
                                    overwrite: true
                                });

                            case 31:
                                extractResult = _context2.sent;

                                if (extractResult.success) {
                                    _context2.next = 34;
                                    break;
                                }

                                throw new Error('Failed to extract patch file');

                            case 34:
                                newBuildFiles = extractResult.files;

                                console.log('New files: ' + (0, _stringify2.default)(newBuildFiles));
                                // Files that the old build created are files in the file system that are not listed in the old build files
                                createdByOldBuild = _.difference(currentFiles, oldBuildFiles);

                                console.log('Created by old files: ' + (0, _stringify2.default)(createdByOldBuild));
                                // Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build
                                filesToRemove = _.difference(currentFiles, newBuildFiles, createdByOldBuild);

                                console.log('Removing ' + (0, _stringify2.default)(filesToRemove));
                                _context2.next = 42;
                                return _promise2.default.all(filesToRemove.map(function (file) {
                                    return fsUnlink(path.resolve(_this2._to, file)).then(function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                        return true;
                                    });
                                }));

                            case 42:
                                unlinks = _context2.sent;
                                _context2.next = 45;
                                return fsWriteFile(this._options.archiveListFile, newBuildFiles.join("\n"));

                            case 45:
                                return _context2.abrupt("return", true);

                            case 46:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "onProgress",
        value: function onProgress(unit, fn) {
            var _this3 = this;

            this._emitter.addListener('progress', function (progress) {
                progress.sample = StreamSpeed.StreamSpeed.convertSample(progress.sample, unit);
                fn(_this3._state, progress);
            });
            return this;
        }
    }, {
        key: "emitProgress",
        value: function emitProgress(progress) {
            this._emitter.emit('progress', this._state, progress);
        }
    }, {
        key: "onError",
        value: function onError(err) {
            var _this4 = this;

            this.stop().then(function () {
                _this4._state = PatchHandleState.STOPPED;
                _this4._rejector(err);
                _this4._promise = null;
            });
        }
    }, {
        key: "onFinished",
        value: function onFinished() {
            var _this5 = this;

            this.stop().then(function () {
                _this5._state = PatchHandleState.FINISHED;
                _this5._resolver();
            });
        }
    }, {
        key: "promise",
        get: function get() {
            var _this6 = this;

            if (!this._promise) {
                this._promise = new _promise2.default(function (resolve, reject) {
                    _this6._resolver = resolve;
                    _this6._rejector = reject;
                });
            }
            return this._promise;
        }
    }]);
    return PatchHandle;
})();

exports.PatchHandle = PatchHandle;
//# sourceMappingURL=index.js.map
