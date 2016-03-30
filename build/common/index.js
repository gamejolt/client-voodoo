"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

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
var chmod = Bluebird.promisify(fs.chmod);
var fsStat = Bluebird.promisify(fs.stat);
var fsCopy = function fsCopy(from, to) {
    return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        return _context.abrupt("return", new _promise2.default(function (resolve, reject) {
                            var destStream = fs.createWriteStream(to);
                            destStream.on('finish', resolve).on('error', reject);
                            fs.createReadStream(from).pipe(destStream);
                        }));

                    case 1:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));
};
var fsReadDir = Bluebird.promisify(fs.readdir);
var fsReadDirRecursively = Bluebird.promisify(require('recursive-readdir'));
var wait = function wait(millis) {
    return new _promise2.default(function (resolve) {
        setTimeout(resolve, millis);
    });
};
var test = function test(fn, done) {
    var func = function func(_done) {
        try {
            var result = fn(_done);
            if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
                result.catch(function (err) {
                    return _done(err);
                });
            }
        } catch (err) {
            _done(err);
        }
    };
    if (done) {
        func = func.bind(this, done);
    }
    return func;
};
exports.default = {
    mkdirp: mkdirp,
    fsUnlink: fsUnlink,
    fsExists: fsExists,
    fsReadFile: fsReadFile,
    fsWriteFile: fsWriteFile,
    chmod: chmod,
    fsStat: fsStat,
    fsCopy: fsCopy,
    fsReadDir: fsReadDir,
    fsReadDirRecursively: fsReadDirRecursively,
    test: test,
    wait: wait
};
//# sourceMappingURL=index.js.map
