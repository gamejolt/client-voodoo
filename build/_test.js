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
var downloader_1 = require('./downloader');
var handle = downloader_1.default.download('https://az764295.vo.msecnd.net/public/0.10.3/VSCode-linux64.zip', 'VSCode-linux64.zip');
var waited = false;
handle.onProgress(function (progress, curKbps, peakKbps, lowKbps, avgKbps) {
    console.log('Download progress: ' + Math.floor(progress * 100) + '%');
    console.log('Current speed: ' + Math.floor(curKbps) + ' kbps, peak: ' + Math.floor(peakKbps) + ' kbps, low: ' + Math.floor(lowKbps) + ', average: ' + Math.floor(avgKbps) + ' kbps');
    if (progress > 0.5 && !waited) {
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
handle.promise.then(function () {
    console.log('Happy day!');
}).catch(function (err) {
    console.log('You fuggin druggah: ' + err.message);
});
//# sourceMappingURL=_test.js.map
