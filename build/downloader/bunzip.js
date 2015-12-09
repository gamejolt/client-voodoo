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
var stream_1 = require('stream');
var duplexer2 = require('duplexer2');
var WrappedBunzip = require('seek-bzip');
function stream(onChunk, resumeOptions) {
    var pass1 = new stream_1.PassThrough();
    var pass2 = new stream_1.PassThrough();
    WrappedBunzip.decodeStream(pass1, pass2, resumeOptions, onChunk);
    return duplexer2(pass1, pass2);
}
exports.default = stream;
//# sourceMappingURL=bunzip.js.map
