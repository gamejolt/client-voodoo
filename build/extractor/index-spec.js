"use strict";

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
var path = require('path');
describe('Extractor', function () {
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
    it('Should work', function (done) {
        var handle = downloader_1.Downloader.download('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c79c01300a/cabinvania.zip.tar.bro', downloadDir);
        handle.onProgress(function (data) {
            console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
            console.log('Current speed: ' + Math.floor(data.curKbps) + ' kbps, peak: ' + Math.floor(data.peakKbps) + ' kbps, low: ' + Math.floor(data.lowKbps) + ', average: ' + Math.floor(data.avgKbps) + ' kbps');
        });
        handle.promise.then(function () {
            return index_1.Extractor.extract(handle.toFullpath, path.join('test-files', 'extracted', handle.toFilename), {
                deleteSource: true,
                overwrite: true
            });
        }).then(function () {
            return done();
        }).catch(done);
    });
});
//# sourceMappingURL=index-spec.js.map
