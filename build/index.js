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
function __export(m) {
    for (var p in m) {
        if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
}
if (process.platform === 'win32') {
    var Application = require('./application');
    Application.start();
}
var logger_1 = require('./common/logger');
__export(require('./common/logger'));
logger_1.Logger.hijack();
__export(require('./autostarter'));
__export(require('./downloader'));
__export(require('./downloader/stream-speed'));
__export(require('./extractor'));
__export(require('./launcher'));
__export(require('./patcher'));
__export(require('./uninstaller'));
__export(require('./queue'));
__export(require('./shortcut'));
//# sourceMappingURL=index.js.map
