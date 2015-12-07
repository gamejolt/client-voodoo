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
var decompressStream = require('iltorb').decompressStream;
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
            brotli: true,
            overwrite: false
        });
        this._promise = this.start();
    }

    (0, _createClass3.default)(ExtractHandle, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var _this = this;

                var destStat, filesInDest, files, result, unlinked;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return fsExists(this._to);

                            case 2:
                                if (!_context.sent) {
                                    _context.next = 16;
                                    break;
                                }

                                _context.next = 5;
                                return fsStat(this._to);

                            case 5:
                                destStat = _context.sent;

                                if (destStat.isDirectory()) {
                                    _context.next = 8;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because its not a valid directory');

                            case 8:
                                _context.next = 10;
                                return fsReadDir(this._to);

                            case 10:
                                filesInDest = _context.sent;

                                if (!(filesInDest && filesInDest.length > 0)) {
                                    _context.next = 14;
                                    break;
                                }

                                if (this._options.overwrite) {
                                    _context.next = 14;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because it isnt empty');

                            case 14:
                                _context.next = 20;
                                break;

                            case 16:
                                _context.next = 18;
                                return mkdirp(this._to);

                            case 18:
                                if (_context.sent) {
                                    _context.next = 20;
                                    break;
                                }

                                throw new Error('Couldn\'t create destination folder path');

                            case 20:
                                files = [];
                                _context.next = 23;
                                return new _promise2.default(function (resolve, reject) {
                                    var stream = fs.createReadStream(_this._from);
                                    var optionsMap = _this._options.map;
                                    var extractStream = tarFS.extract(_this._to, _.assign(_this._options, {
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
                                    stream.on('error', function (err) {
                                        return reject(err);
                                    });
                                    if (_this._options.brotli) {
                                        stream.pipe(decompressStream()).pipe(extractStream);
                                    } else {
                                        stream.pipe(extractStream);
                                    }
                                });

                            case 23:
                                result = _context.sent;

                                if (!(result && this._options.deleteSource)) {
                                    _context.next = 35;
                                    break;
                                }

                                _context.next = 27;
                                return fsUnlink(this._from);

                            case 27:
                                unlinked = _context.sent;
                                _context.t0 = unlinked;

                                if (!_context.t0) {
                                    _context.next = 33;
                                    break;
                                }

                                _context.next = 32;
                                return fsExists(this._from);

                            case 32:
                                _context.t0 = _context.sent;

                            case 33:
                                if (!_context.t0) {
                                    _context.next = 35;
                                    break;
                                }

                                throw unlinked;

                            case 35:
                                return _context.abrupt("return", {
                                    success: result,
                                    files: files
                                });

                            case 36:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
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
