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
var tarFS = require('tar-fs');
var Bluebird = require('bluebird');
var mkdirp = Bluebird.promisify(require('mkdirp'));
var fsUnlink = Bluebird.promisify(fs.unlink);
var fsExists = function fsExists(path) {
    return new _promise2.default(function (resolve) {
        fs.exists(path, resolve);
    });
};
var fsStat = Bluebird.promisify(fs.stat);
var fsReadDir = Bluebird.promisify(fs.readdir);

var Extractor = (function () {
    function Extractor() {
        (0, _classCallCheck3.default)(this, Extractor);
    }

    (0, _createClass3.default)(Extractor, null, [{
        key: "extract",
        value: function extract(from, to, options) {
            return new ExtractHandle(from, to, options);
        }
    }]);
    return Extractor;
})();

exports.Extractor = Extractor;

var ExtractHandle = (function () {
    function ExtractHandle(_from, _to, _options) {
        (0, _classCallCheck3.default)(this, ExtractHandle);

        this._from = _from;
        this._to = _to;
        this._options = _options;
        this._options = _.defaults(this._options || {}, {
            deleteSource: false,
            overwrite: false
        });
        // Avoid fat arrow here because it causes an implicit return and will resolve the promise.
        var _this = this;
        this._promise = new _promise2.default(function (resolve, reject) {
            _this.start().then(function (result) {
                if (!_this._terminated) {
                    resolve(result);
                }
            });
        });
    }

    (0, _createClass3.default)(ExtractHandle, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this2 = this;

                var destStat, filesInDest, files, result, unlinked;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                console.log('Starting extraction');

                                if (!this._running) {
                                    _context.next = 5;
                                    break;
                                }

                                return _context.abrupt("return", this._promise);

                            case 5:
                                if (!this._readStream) {
                                    _context.next = 10;
                                    break;
                                }

                                console.log('Resuming extraction');
                                this._pipe();
                                this._readStream.resume();
                                return _context.abrupt("return", this._promise);

                            case 10:
                                this._running = true;
                                // If the destination already exists, make sure its valid.
                                _context.next = 13;
                                return fsExists(this._to);

                            case 13:
                                if (!_context.sent) {
                                    _context.next = 27;
                                    break;
                                }

                                _context.next = 16;
                                return fsStat(this._to);

                            case 16:
                                destStat = _context.sent;

                                if (destStat.isDirectory()) {
                                    _context.next = 19;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because its not a valid directory');

                            case 19:
                                _context.next = 21;
                                return fsReadDir(this._to);

                            case 21:
                                filesInDest = _context.sent;

                                if (!(filesInDest && filesInDest.length > 0)) {
                                    _context.next = 25;
                                    break;
                                }

                                if (this._options.overwrite) {
                                    _context.next = 25;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because it isnt empty');

                            case 25:
                                _context.next = 31;
                                break;

                            case 27:
                                _context.next = 29;
                                return mkdirp(this._to);

                            case 29:
                                if (_context.sent) {
                                    _context.next = 31;
                                    break;
                                }

                                throw new Error('Couldn\'t create destination folder path');

                            case 31:
                                if (!this._terminated) {
                                    _context.next = 33;
                                    break;
                                }

                                return _context.abrupt("return", {
                                    success: false,
                                    files: []
                                });

                            case 33:
                                files = [];
                                _context.next = 36;
                                return new _promise2.default(function (resolve, reject) {
                                    _this2._readStream = fs.createReadStream(_this2._from);
                                    _this2._resolver = resolve;
                                    _this2._rejector = reject;
                                    // If stopped between starting and here, the stop wouldn't have registered this read stream. So just do it now.
                                    if (!_this2._running) {
                                        _this2.stop(false);
                                    }
                                    var optionsMap = _this2._options.map;
                                    _this2._extractStream = tarFS.extract(_this2._to, _.assign(_this2._options, {
                                        map: function map(header) {
                                            // TODO: fuggin symlinks and the likes.
                                            if (header.type === 'file') {
                                                console.log('Extracting ' + header.name);
                                                files.push(header.name);
                                            }
                                            if (optionsMap) {
                                                return optionsMap(header);
                                            }
                                            return header;
                                        }
                                    }));
                                    _this2._extractStream.on('finish', function () {
                                        return _this2._resolver(true);
                                    });
                                    _this2._extractStream.on('error', function (err) {
                                        return _this2._rejector(err);
                                    });
                                    if (_this2._options.decompressStream) {
                                        _this2._options.decompressStream.pipe(_this2._extractStream);
                                    }
                                    _this2._pipe();
                                });

                            case 36:
                                result = _context.sent;

                                if (!(result && this._options.deleteSource)) {
                                    _context.next = 48;
                                    break;
                                }

                                _context.next = 40;
                                return fsUnlink(this._from);

                            case 40:
                                unlinked = _context.sent;
                                _context.t0 = unlinked;

                                if (!_context.t0) {
                                    _context.next = 46;
                                    break;
                                }

                                _context.next = 45;
                                return fsExists(this._from);

                            case 45:
                                _context.t0 = _context.sent;

                            case 46:
                                if (!_context.t0) {
                                    _context.next = 48;
                                    break;
                                }

                                throw unlinked;

                            case 48:
                                return _context.abrupt("return", {
                                    success: result,
                                    files: files
                                });

                            case 49:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "_pipe",
        value: function _pipe() {
            var _this3 = this;

            this._readStream.on('error', function (err) {
                return _this3._rejector(err);
            });
            if (this._options.decompressStream) {
                this._readStream.pipe(this._options.decompressStream);
            } else {
                this._readStream.pipe(this._extractStream);
            }
        }
    }, {
        key: "_unpipe",
        value: function _unpipe() {
            this._readStream.unpipe();
            this._readStream.removeAllListeners();
        }
    }, {
        key: "stop",
        value: function stop(terminate) {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                var readStreamHack;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                console.log('Extractor stopping');
                                this._running = false;
                                if (terminate) {
                                    this._terminated = true;
                                    readStreamHack = this._readStream;

                                    readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams
                                } else {
                                        console.log('Readable stream paused, should not read more files damnit!');
                                        this._readStream.pause();
                                        this._unpipe();
                                    }
                                console.log('Extractor stopped');
                                return _context2.abrupt("return", true);

                            case 5:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
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
        key: "promise",
        get: function get() {
            return this._promise;
        }
    }]);
    return ExtractHandle;
})();

exports.ExtractHandle = ExtractHandle;
//# sourceMappingURL=index.js.map
