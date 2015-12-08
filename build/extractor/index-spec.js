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
var decompressStream = require('gunzip-maybe');
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
    it('Should work', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
            var handle;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            handle = downloader_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5666cfe4c69d9/Bug_Bash.exe.tar.gz', downloadFile, {
                                overwrite: true,
                                decompressStream: decompressStream()
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
});
//# sourceMappingURL=index-spec.js.map
