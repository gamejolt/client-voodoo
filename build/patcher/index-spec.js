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
var index_1 = require('./index');
var path = require('path');
describe('Extractor', function () {
    var app = undefined;
    var server = undefined;
    var downloadDir = path.join('test-files', 'patched');
    var tempDir = path.join('test-files', 'temp');
    var archiveListFile = path.join(tempDir, 'archive-file-list');
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
        var handle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', downloadDir, {
            brotli: true,
            tempDir: tempDir,
            archiveListFile: archiveListFile
        });
        handle.promise.then(function () {
            console.log('yay');
            done();
        }).catch(done);
    });
});
//# sourceMappingURL=index-spec.js.map
