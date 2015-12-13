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
var downloader_1 = require('../downloader');
var index_1 = require('./index');
var stream_speed_1 = require('../downloader/stream-speed');
var path = require('path');
var del = require('del');
var gzip = require('gunzip-maybe');
var xz = require('lzma-native').createDecompressor.bind(undefined, {
    synchronous: true
});
describe('Extractor', function () {
    var _this = this;

    var app = undefined;
    var server = undefined;
    var downloadFile = path.join('test-files', 'downloaded', 'Bug_Bash.zip.tar');
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
    beforeEach(function () {
        return del('test-files/!(.gj-*)');
    });
    it('Should work with tar.gz files', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
            var handle;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            handle = downloader_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5666cfe4c69d9/Bug_Bash.exe.tar.gz', downloadFile, {
                                overwrite: true,
                                decompressStream: gzip()
                            });

                            handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
                            });
                            _context.next = 4;
                            return handle.promise;

                        case 4:
                            return _context.abrupt("return", index_1.Extractor.extract(handle.to, path.join('test-files', 'extracted', path.basename(handle.to)), {
                                deleteSource: true,
                                overwrite: true
                            }).promise);

                        case 5:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));
    });
    it('Should work with tar.xz files', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
            var handle;
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            handle = downloader_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
                                overwrite: true,
                                decompressStream: xz()
                            });

                            handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
                            });
                            _context2.next = 4;
                            return handle.promise;

                        case 4:
                            return _context2.abrupt("return", index_1.Extractor.extract(handle.to, path.join('test-files', 'extracted', path.basename(handle.to)), {
                                deleteSource: true,
                                overwrite: true
                            }).promise);

                        case 5:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));
    });
    it('Should allow resumable extraction', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
            var extractionHandle, waited;
            return _regenerator2.default.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            extractionHandle = index_1.Extractor.extract('test-files/.gj-bigTempDownload.tar', path.join('test-files', 'extracted', path.basename('test')), {
                                deleteSource: false,
                                overwrite: true
                            });
                            waited = false;

                            extractionHandle.promise.then(function () {
                                if (!waited) {
                                    done(new Error('Extraction finished too fast! Run again with a shorter delay.'));
                                    return;
                                }
                                done();
                            });
                            // What a hacky way to catch the extraction in the middle. Don't judge me.
                            // If resumes too fast it means the file is fully extracted or is fully contained in the readable stream's internal buffer.
                            // Use a bigger file!
                            _context3.next = 5;
                            return new _promise2.default(function (resolve) {
                                return setTimeout(resolve, 100);
                            });

                        case 5:
                            _context3.next = 7;
                            return extractionHandle.stop();

                        case 7:
                            console.log('Stopping to smell the bees.');
                            _context3.next = 10;
                            return new _promise2.default(function (resolve) {
                                return setTimeout(resolve, 3000);
                            });

                        case 10:
                            waited = true;
                            console.log('I meant flowers.');
                            _context3.next = 14;
                            return extractionHandle.start();

                        case 14:
                            _context3.next = 16;
                            return extractionHandle.promise;

                        case 16:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        }));
    });
});
//# sourceMappingURL=index-spec.js.map
