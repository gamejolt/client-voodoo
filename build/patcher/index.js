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
    PatchHandleState[PatchHandleState["PATCHING"] = 1] = "PATCHING";
    PatchHandleState[PatchHandleState["FINISHED"] = 2] = "FINISHED";
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
        var _this = this;

        (0, _classCallCheck3.default)(this, PatchHandle);

        this._from = _from;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            brotli: true
        });
        this._state = PatchHandleState.STOPPED;
        this._emitter = new events_1.EventEmitter();
        this._promise = this.promise;
        this.patch().then(function () {
            return _this.onFinished();
        }).catch(function (err) {
            return _this.onError(err);
        });
    }

    (0, _createClass3.default)(PatchHandle, [{
        key: "patch",
        value: function patch() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this2 = this;

                var currentFiles, exists, stat, archiveListFileDir, dirStat, oldBuildFiles, extractResult, newBuildFiles, createdByOldBuild, filesToRemove, unlinks;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                // TODO: restrict operations to the given directories.
                                this._state = PatchHandleState.PATCHING;
                                currentFiles = undefined;
                                _context.next = 4;
                                return fsExists(this._to);

                            case 4:
                                _context.t0 = !_context.sent;

                                if (_context.t0) {
                                    _context.next = 9;
                                    break;
                                }

                                _context.next = 8;
                                return fsStat(this._to);

                            case 8:
                                _context.t0 = !_context.sent.isDirectory();

                            case 9:
                                if (!_context.t0) {
                                    _context.next = 13;
                                    break;
                                }

                                currentFiles = [];
                                _context.next = 17;
                                break;

                            case 13:
                                _context.next = 15;
                                return fsReadDirRecursively(this._to);

                            case 15:
                                _context.t1 = function (file) {
                                    return './' + path.relative(_this2._to, file);
                                };

                                currentFiles = _context.sent.map(_context.t1);

                            case 17:
                                _context.next = 19;
                                return fsExists(this._options.archiveListFile);

                            case 19:
                                exists = _context.sent;
                                _context.next = 22;
                                return fsExists(this._options.archiveListFile);

                            case 22:
                                if (!_context.sent) {
                                    _context.next = 30;
                                    break;
                                }

                                _context.next = 25;
                                return fsStat(this._options.archiveListFile);

                            case 25:
                                stat = _context.sent;

                                if (stat.isFile()) {
                                    _context.next = 28;
                                    break;
                                }

                                throw new Error('Can\'t patch because the archive file list isn\'t a file.');

                            case 28:
                                _context.next = 45;
                                break;

                            case 30:
                                archiveListFileDir = path.dirname(this._options.archiveListFile);
                                _context.next = 33;
                                return fsExists(archiveListFileDir);

                            case 33:
                                if (!_context.sent) {
                                    _context.next = 41;
                                    break;
                                }

                                _context.next = 36;
                                return fsStat(archiveListFileDir);

                            case 36:
                                dirStat = _context.sent;

                                if (dirStat.isDirectory()) {
                                    _context.next = 39;
                                    break;
                                }

                                throw new Error('Can\'t patch because the path to the archive file list is invalid.');

                            case 39:
                                _context.next = 45;
                                break;

                            case 41:
                                _context.next = 43;
                                return mkdirp(archiveListFileDir);

                            case 43:
                                if (_context.sent) {
                                    _context.next = 45;
                                    break;
                                }

                                throw new Error('Couldn\'t create the patch archive file list folder path');

                            case 45:
                                oldBuildFiles = undefined;
                                _context.next = 48;
                                return fsExists(this._options.archiveListFile);

                            case 48:
                                if (_context.sent) {
                                    _context.next = 52;
                                    break;
                                }

                                oldBuildFiles = currentFiles;
                                _context.next = 55;
                                break;

                            case 52:
                                _context.next = 54;
                                return fsReadFile(this._options.archiveListFile, 'utf8');

                            case 54:
                                oldBuildFiles = _context.sent.split("\n");

                            case 55:
                                _context.next = 57;
                                return extractor_1.Extractor.extract(this._from, this._to, {
                                    brotli: this._options.brotli,
                                    overwrite: true,
                                    deleteSource: true
                                }).promise;

                            case 57:
                                extractResult = _context.sent;

                                if (extractResult.success) {
                                    _context.next = 60;
                                    break;
                                }

                                throw new Error('Failed to extract patch file');

                            case 60:
                                newBuildFiles = extractResult.files;
                                // Files that the old build created are files in the file system that are not listed in the old build files

                                createdByOldBuild = _.difference(currentFiles, oldBuildFiles);
                                // Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build

                                filesToRemove = _.difference(currentFiles, newBuildFiles, createdByOldBuild);
                                // TODO: use del lib

                                _context.next = 65;
                                return _promise2.default.all(filesToRemove.map(function (file) {
                                    return fsUnlink(path.resolve(_this2._to, file)).then(function (err) {
                                        if (err) {
                                            throw err;
                                        }
                                        return true;
                                    });
                                }));

                            case 65:
                                unlinks = _context.sent;
                                _context.next = 68;
                                return fsWriteFile(this._options.archiveListFile, newBuildFiles.join("\n"));

                            case 68:
                                return _context.abrupt("return", true);

                            case 69:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
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
