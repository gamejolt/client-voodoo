"use strict";

function __export(m) {
    for (var p in m) {
        if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
}
if (process.platform === 'win32') {
    var Application = require('./application').Application;
    Application.start();
}
var logger_1 = require('./common/logger');
__export(require('./common/logger'));
logger_1.Logger.hijack();
__export(require('./application'));
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
