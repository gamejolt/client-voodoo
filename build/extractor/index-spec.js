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
var gzip = require('gunzip-maybe');
var xz = require('lzma-native').createDecompressor;
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
    // it( 'Should work with tar.gz files', async () =>
    // {
    // 	let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5666cfe4c69d9/Bug_Bash.exe.tar.gz', downloadFile, {
    // 		overwrite: true,
    // 		decompressStream: gzip(),
    // 	} );
    // 	handle.onProgress( SampleUnit.KBps, function( data )
    // 	{
    // 		console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
    // 		console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
    // 	} );
    // 	await handle.promise;
    // 	return Extractor.extract( handle.to, path.join( 'test-files', 'extracted', path.basename( handle.to ) ), {
    // 		deleteSource: true,
    // 		overwrite: true,
    // 	} ).promise;
    // } );
    // it( 'Should work with tar.xz files', async () =>
    // {
    // 	let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
    // 		overwrite: true,
    // 		decompressStream: xz(),
    // 	} );
    // 	handle.onProgress( SampleUnit.KBps, function( data )
    // 	{
    // 		console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
    // 		console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
    // 	} );
    // 	await handle.promise;
    // 	return Extractor.extract( handle.to, path.join( 'test-files', 'extracted', path.basename( handle.to ) ), {
    // 		deleteSource: true,
    // 		overwrite: true,
    // 	} ).promise;
    // } );
    it('Should allow resumable extraction', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
            var handle, extractionHandle, waited;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            handle = downloader_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
                                overwrite: true,
                                decompressStream: xz()
                            });

                            handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
                            });
                            _context.next = 4;
                            return handle.promise;

                        case 4:
                            extractionHandle = index_1.Extractor.extract('test-files/Downloads.tar', path.join('test-files', 'extracted', path.basename('test')), {
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
                            _context.next = 9;
                            return new _promise2.default(function (resolve) {
                                return setTimeout(resolve, 100);
                            });

                        case 9:
                            _context.next = 11;
                            return extractionHandle.stop();

                        case 11:
                            console.log('Stopping to smell the bees.');
                            _context.next = 14;
                            return new _promise2.default(function (resolve) {
                                return setTimeout(resolve, 3000);
                            });

                        case 14:
                            waited = true;
                            console.log('I meant flowers.');
                            _context.next = 18;
                            return extractionHandle.start();

                        case 18:
                            _context.next = 20;
                            return extractionHandle.promise;

                        case 20:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));
    });
});
//# sourceMappingURL=index-spec.js.map
