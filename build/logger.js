"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var winston = require("winston");
var util = require("util");
var fs = require("fs");
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger._log = function (level, args) {
        var str = util.format.apply(console, args).split('\n');
        this.logger.log(level, str);
    };
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.oldConsoleLog.apply(console, args);
        this._log('info', args);
    };
    Logger.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.oldConsoleInfo.apply(console, args);
        this._log('info', args);
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.oldConsoleWarn.apply(console, args);
        this._log('warn', args);
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.oldConsoleError.apply(console, args);
        this._log('error', args);
    };
    Logger.hijack = function (file) {
        if (this.hijacked) {
            return;
        }
        this.hijacked = true;
        this.file = file || 'client.log';
        this.logger = winston.createLogger({
            transports: [new winston.transports.File({
                    filename: this.file,
                    maxsize: 1024 * 1024,
                    maxFiles: 2,
                    tailable: true,
                })],
        });
        var c = console;
        this.oldConsole = c;
        this.oldConsoleLog = c.log;
        this.oldConsoleInfo = c.info;
        this.oldConsoleWarn = c.warn;
        this.oldConsoleError = c.error;
        c.log = this.log;
        c.info = this.info;
        c.warn = this.warn;
        c.error = this.error;
    };
    Logger.unhijack = function () {
        if (!this.hijacked) {
            return;
        }
        this.hijacked = false;
        var c = this.oldConsole;
        this.oldConsoleLog = c.log;
        this.oldConsoleInfo = c.info;
        this.oldConsoleWarn = c.warn;
        this.oldConsoleError = c.error;
        c.log = this.oldConsoleLog;
        c.info = this.oldConsoleInfo;
        c.warn = this.oldConsoleWarn;
        c.error = this.oldConsoleError;
    };
    Logger.getClientLog = function () {
        return {
            logLines: fs.readFileSync(this.file, { encoding: 'utf8' }).toString().split(os.EOL),
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
    Logger.hijacked = false;
    return Logger;
}());
exports.Logger = Logger;
