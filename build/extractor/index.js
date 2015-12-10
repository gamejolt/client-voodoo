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
                                if (!this._running) {
                                    _context.next = 3;
                                    break;
                                }

                                if (this._readStream) {
                                    this._readStream.resume();
                                }
                                return _context.abrupt("return", this._promise);

                            case 3:
                                this._running = true;
                                // If the destination already exists, make sure its valid.
                                _context.next = 6;
                                return fsExists(this._to);

                            case 6:
                                if (!_context.sent) {
                                    _context.next = 20;
                                    break;
                                }

                                _context.next = 9;
                                return fsStat(this._to);

                            case 9:
                                destStat = _context.sent;

                                if (destStat.isDirectory()) {
                                    _context.next = 12;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because its not a valid directory');

                            case 12:
                                _context.next = 14;
                                return fsReadDir(this._to);

                            case 14:
                                filesInDest = _context.sent;

                                if (!(filesInDest && filesInDest.length > 0)) {
                                    _context.next = 18;
                                    break;
                                }

                                if (this._options.overwrite) {
                                    _context.next = 18;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because it isnt empty');

                            case 18:
                                _context.next = 24;
                                break;

                            case 20:
                                _context.next = 22;
                                return mkdirp(this._to);

                            case 22:
                                if (_context.sent) {
                                    _context.next = 24;
                                    break;
                                }

                                throw new Error('Couldn\'t create destination folder path');

                            case 24:
                                if (!this._terminated) {
                                    _context.next = 26;
                                    break;
                                }

                                return _context.abrupt("return", {
                                    success: false,
                                    files: []
                                });

                            case 26:
                                files = [];
                                _context.next = 29;
                                return new _promise2.default(function (resolve, reject) {
                                    _this2._readStream = fs.createReadStream(_this2._from);
                                    // If stopped between starting and here, the stop wouldn't have registered this read stream. So just do it now.
                                    if (!_this2._running) {
                                        _this2.stop(false);
                                    }
                                    var optionsMap = _this2._options.map;
                                    var extractStream = tarFS.extract(_this2._to, _.assign(_this2._options, {
                                        map: function map(header) {
                                            // TODO: fuggin symlinks and the likes.
                                            if (header.type === 'file') {
                                                files.push(header.name);
                                            }
                                            if (optionsMap) {
                                                return optionsMap(header);
                                            }
                                            return header;
                                        }
                                    }));
                                    extractStream.on('finish', function () {
                                        return resolve(true);
                                    });
                                    extractStream.on('error', function (err) {
                                        return reject(err);
                                    });
                                    _this2._readStream.on('error', function (err) {
                                        return reject(err);
                                    });
                                    if (_this2._options.decompressStream) {
                                        _this2._readStream.pipe(_this2._options.decompressStream).pipe(extractStream);
                                    } else {
                                        _this2._readStream.pipe(extractStream);
                                    }
                                });

                            case 29:
                                result = _context.sent;

                                if (!(result && this._options.deleteSource)) {
                                    _context.next = 41;
                                    break;
                                }

                                _context.next = 33;
                                return fsUnlink(this._from);

                            case 33:
                                unlinked = _context.sent;
                                _context.t0 = unlinked;

                                if (!_context.t0) {
                                    _context.next = 39;
                                    break;
                                }

                                _context.next = 38;
                                return fsExists(this._from);

                            case 38:
                                _context.t0 = _context.sent;

                            case 39:
                                if (!_context.t0) {
                                    _context.next = 41;
                                    break;
                                }

                                throw unlinked;

                            case 41:
                                return _context.abrupt("return", {
                                    success: result,
                                    files: files
                                });

                            case 42:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
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
                                this._running = false;
                                if (terminate) {
                                    this._terminated = true;
                                    readStreamHack = this._readStream;

                                    readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams
                                } else {
                                        this._readStream.pause();
                                    }
                                return _context2.abrupt("return", true);

                            case 3:
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
