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
var tar = require('tar-fs');
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
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var destExists, destStat, filesInDest, result, unlinked;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                options = _.defaults(options || {}, {
                                    deleteSource: false,
                                    brotli: true,
                                    overwrite: false
                                });
                                // If the destination already exists, make sure its valid.
                                _context.next = 3;
                                return fsExists(to);

                            case 3:
                                destExists = _context.sent;

                                if (!destExists) {
                                    _context.next = 18;
                                    break;
                                }

                                _context.next = 7;
                                return fsStat(to);

                            case 7:
                                destStat = _context.sent;

                                if (destStat.isDirectory()) {
                                    _context.next = 10;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because its not a valid directory');

                            case 10:
                                _context.next = 12;
                                return fsReadDir(to);

                            case 12:
                                filesInDest = _context.sent;

                                if (!(filesInDest && filesInDest.length > 0)) {
                                    _context.next = 16;
                                    break;
                                }

                                if (options.overwrite) {
                                    _context.next = 16;
                                    break;
                                }

                                throw new Error('Can\'t extract to destination because it isnt empty');

                            case 16:
                                _context.next = 22;
                                break;

                            case 18:
                                _context.next = 20;
                                return mkdirp(to);

                            case 20:
                                if (_context.sent) {
                                    _context.next = 22;
                                    break;
                                }

                                throw new Error('Couldn\'t create destination folder path');

                            case 22:
                                _context.next = 24;
                                return new _promise2.default(function (resolve, reject) {
                                    var stream = fs.createReadStream(from);
                                    var extractStream = tar.extract(to);
                                    extractStream.on('finish', function () {
                                        return resolve(true);
                                    });
                                    extractStream.on('error', function (err) {
                                        return reject(err);
                                    });
                                    stream.on('error', function (err) {
                                        return reject(err);
                                    });
                                    stream.pipe(decompressStream()).pipe(extractStream);
                                });

                            case 24:
                                result = _context.sent;

                                if (!(result && options.deleteSource)) {
                                    _context.next = 36;
                                    break;
                                }

                                _context.next = 28;
                                return fsUnlink(from);

                            case 28:
                                unlinked = _context.sent;
                                _context.t0 = unlinked;

                                if (!_context.t0) {
                                    _context.next = 34;
                                    break;
                                }

                                _context.next = 33;
                                return fsExists(from);

                            case 33:
                                _context.t0 = _context.sent;

                            case 34:
                                if (!_context.t0) {
                                    _context.next = 36;
                                    break;
                                }

                                throw unlinked;

                            case 36:
                                return _context.abrupt("return", result);

                            case 37:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }]);
    return Extractor;
})();

exports.Extractor = Extractor;
//# sourceMappingURL=index.js.map
