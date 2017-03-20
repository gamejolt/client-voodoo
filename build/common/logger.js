"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var util = require("util");
var os = require("os");
var _ = require("lodash");
var fs = require("fs");
var index_1 = require("./index");
var LOG_LINES = 300;
var CONSOLE_LOG = console.log;
var CONSOLE_ERR = console.error;
var Logger = (function () {
    function Logger() {
    }
    Logger._flushFile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var str, logLineLength, logLineCount, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (this._file) {
                            this._file.close();
                        }
                        this._file = null;
                        return [4 /*yield*/, index_1.default.fsUnlink(this._filePath)];
                    case 1:
                        _a.sent();
                        str = this._logLines.join('\n') + '\n';
                        return [4 /*yield*/, index_1.default.fsWriteFile(this._filePath, str)];
                    case 2:
                        _a.sent();
                        logLineLength = this._logLines.join('\n').length, logLineCount = this._logLines.length;
                        CONSOLE_LOG.apply(console, ["Flushing log file of length " + logLineLength + " with " + logLineCount + " rows"]);
                        this._file = fs.createWriteStream(this._filePath, {
                            flags: 'a',
                            encoding: 'utf8',
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        CONSOLE_LOG.apply(console, [err_1.message + "\n" + err_1.stack]);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Logger._log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        CONSOLE_LOG.apply(console, args);
        var str = util.format.apply(console, args).split('\n');
        for (var _a = 0, str_1 = str; _a < str_1.length; _a++) {
            var strVal = str_1[_a];
            this._logLines.push(strVal);
        }
        if (this._file) {
            this._file.write(str + '\n');
        }
        if (this._logLines.length > LOG_LINES) {
            this._logLines = _.clone(this._logLines.slice(this._logLines.length - LOG_LINES));
        }
    };
    Logger._logErr = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        CONSOLE_ERR.apply(console, args);
        var str = util.format.apply(console, args).split('\n');
        for (var _a = 0, str_2 = str; _a < str_2.length; _a++) {
            var strVal = str_2[_a];
            this._logLines.push(strVal);
        }
        if (this._file) {
            this._file.write(str + '\n');
        }
        if (this._logLines.length > LOG_LINES) {
            this._logLines = this._logLines.slice(this._logLines.length - LOG_LINES);
        }
    };
    Logger.hijack = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var readLines, err_2, flushFunc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._hijacked) {
                            return [2 /*return*/];
                        }
                        this._filePath = file || 'client.log';
                        return [4 /*yield*/, index_1.default.fsExists(this._filePath)];
                    case 1:
                        if (!_a.sent())
                            return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, index_1.default.fsReadFile(this._filePath, 'utf8')];
                    case 3:
                        readLines = _a.sent();
                        console.log(typeof readLines);
                        this._logLines = readLines.split('\n');
                        if (this._logLines.length > LOG_LINES) {
                            this._logLines = this._logLines.slice(this._logLines.length - LOG_LINES);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_2 = _a.sent();
                        console.log(err_2.message + "\n" + err_2.stack);
                        return [3 /*break*/, 5];
                    case 5:
                        this._file = fs.createWriteStream(this._filePath, {
                            flags: 'a',
                            encoding: 'utf8',
                        });
                        flushFunc = this._flushFile.bind(this);
                        this._flushInterval = setInterval(flushFunc, 10000);
                        console.log = this._log.bind(this);
                        console.info = this._log.bind(this);
                        console.warn = this._logErr.bind(this);
                        console.error = this._logErr.bind(this);
                        this._hijacked = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    Logger.unhijack = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._hijacked) {
                            return [2 /*return*/];
                        }
                        clearInterval(this._flushInterval);
                        if (this._file) {
                            this._file.close();
                        }
                        return [4 /*yield*/, index_1.default.fsWriteFile(this._filePath, this._logLines.join('\n'))];
                    case 1:
                        _a.sent();
                        console.log = CONSOLE_LOG;
                        console.info = CONSOLE_LOG;
                        console.warn = CONSOLE_ERR;
                        console.error = CONSOLE_ERR;
                        this._hijacked = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    Logger.getClientLog = function () {
        return {
            logLines: _.clone(this._logLines),
            osInfo: {
                os: os.platform(),
                arch: os.arch(),
                release: os.release(),
                uptime: os.uptime(),
                freeMemory: os.freemem(),
                totalMemory: os.totalmem(),
                cpuCount: os.cpus().length,
            },
        };
    };
    return Logger;
}());
Logger._logLines = [];
Logger._hijacked = false;
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map