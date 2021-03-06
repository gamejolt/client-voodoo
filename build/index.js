"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./data"));
__export(require("./patcher"));
__export(require("./launcher"));
__export(require("./old-launcher"));
__export(require("./uninstaller"));
__export(require("./config"));
__export(require("./queue"));
__export(require("./autostarter"));
__export(require("./shortcut"));
__export(require("./rollbacker"));
__export(require("./mutex"));
__export(require("./selfupdater"));
__export(require("./logger"));
var controller_1 = require("./controller");
exports.getExecutable = controller_1.getExecutable;
