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
var express = require('express');
var index_1 = require('./index');
var path = require('path');
var stream_speed_1 = require('./stream-speed');
var gzip = require('gunzip-maybe');
var xz = require('lzma-native').createDecompressor;
describe('Downloader', function () {
    var _this = this;

    var app = undefined;
    var server = undefined;
    var downloadFile = path.join('test-files', 'downloaded', 'Bug_Bash.zip');
    before(function (done) {
        app = express();
        app.use(express.static('../../test-files'));
        server = app.listen(1337, function () {
            done();
        });
    });
    after(function (done) {
        server.close(function () {
            done();
        });
        app = null;
        server = null;
    });
    it('Should download a resumable file', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
            var _this2 = this;

            var handle, waited;
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            handle = index_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
                                overwrite: true
                            });
                            waited = false;

                            handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                return __awaiter(_this2, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                                    var wait;
                                    return _regenerator2.default.wrap(function _callee$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                                    console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');

                                                    if (!(data.progress > 0.5 && !waited)) {
                                                        _context.next = 13;
                                                        break;
                                                    }

                                                    console.log('Having a comic relief..');
                                                    _context.next = 6;
                                                    return handle.stop();

                                                case 6:
                                                    wait = new _promise2.default(function (resolve) {
                                                        return setTimeout(resolve, 1000);
                                                    });
                                                    _context.next = 9;
                                                    return wait;

                                                case 9:
                                                    _context.next = 11;
                                                    return handle.start();

                                                case 11:
                                                    waited = true;
                                                    console.log('Had a comic relief!');

                                                case 13:
                                                case "end":
                                                    return _context.stop();
                                            }
                                        }
                                    }, _callee, this);
                                }));
                            });
                            return _context2.abrupt("return", handle.promise);

                        case 4:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));
    });
    it('Should download a gzip file', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
            var handle;
            return _regenerator2.default.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            handle = index_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5666cfe4c69d9/Bug_Bash.exe.tar.gz', downloadFile, {
                                overwrite: true,
                                decompressStream: gzip()
                            });

                            handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
                            });
                            return _context3.abrupt("return", handle.promise);

                        case 3:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        }));
    });
    it('Should download a xz file', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
            var handle;
            return _regenerator2.default.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            handle = index_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
                                overwrite: true,
                                decompressStream: xz()
                            });

                            handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
                            });
                            return _context4.abrupt("return", handle.promise);

                        case 3:
                        case "end":
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));
    });
});
//# sourceMappingURL=index-spec.js.map
