"use strict";

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
describe('Downloader', function () {
    var app = undefined;
    var server = undefined;
    var downloadDir = path.join('test-files', 'downloaded');
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
    it('Should download a resumable non-brotli file', function (done) {
        var handle = index_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip', downloadDir, {
            brotli: false,
            overwrite: true
        });
        var waited = false;
        handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
            console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
            console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
            if (data.progress > 0.5 && !waited) {
                console.log('Having a comic relief..');
                handle.stop().then(function () {
                    return new _promise2.default(function (resolve) {
                        return setTimeout(resolve, 1000);
                    });
                }).then(function () {
                    return handle.start();
                }).then(function () {
                    waited = true;console.log('Had a comic relief!');
                });
            }
        });
        handle.promise.then(done).catch(done);
    });
    it('Should download a non-resumable brotli file', function (done) {
        var handle = index_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', downloadDir, {
            brotli: true,
            overwrite: true
        });
        handle.onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
            console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
            console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + ' kbps');
        });
        handle.promise.then(done).catch(done);
    });
});
//# sourceMappingURL=index-spec.js.map
