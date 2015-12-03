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
    it('Should work', function (done) {
        var handle = index_1.Downloader.download('https://az764295.vo.msecnd.net/public/0.10.3/VSCode-linux64.zip', downloadDir);
        var waited = false;
        handle.onProgress(function (data) {
            console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
            console.log('Current speed: ' + Math.floor(data.curKbps) + ' kbps, peak: ' + Math.floor(data.peakKbps) + ' kbps, low: ' + Math.floor(data.lowKbps) + ', average: ' + Math.floor(data.avgKbps) + ' kbps');
            if (data.progress > 0.5 && !waited) {
                console.log('Having a comic relief..');
                handle.stop().then(function () {
                    return new _promise2.default(function (resolve) {
                        return setTimeout(resolve, 5000);
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
});
//# sourceMappingURL=index-spec.js.map
