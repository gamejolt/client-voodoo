"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var winston = require("winston");
var util = require("util");
var fs = require("fs");
var tail_1 = require("tail");
var MY_CONSOLE = console;
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Object.defineProperty(Logger, "console", {
        get: function () {
            return this.hijacked ? this.oldConsole : MY_CONSOLE;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Logger, "consoleLog", {
        get: function () {
            return this.hijacked ? this.oldConsoleLog : MY_CONSOLE.log;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Logger, "consoleInfo", {
        get: function () {
            return this.hijacked ? this.oldConsoleInfo : MY_CONSOLE.info;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Logger, "consoleWarn", {
        get: function () {
            return this.hijacked ? this.oldConsoleWarn : MY_CONSOLE.warn;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Logger, "consoleError", {
        get: function () {
            return this.hijacked ? this.oldConsoleError : MY_CONSOLE.error;
        },
        enumerable: true,
        configurable: true
    });
    Logger._log = function (level, args) {
        if (!this.hijacked) {
            return;
        }
        var str = util.format.apply(this.console, args).split('\n');
        this.logger.log(level, str);
    };
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.consoleLog.apply(this.console, args);
        this._log('info', args);
    };
    Logger.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.consoleInfo.apply(this.console, args);
        this._log('info', args);
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.consoleWarn.apply(this.console, args);
        this._log('warn', args);
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.consoleError.apply(this.console, args);
        this._log('error', args);
    };
    Logger.createLoggerFromFile = function (file, tag, level) {
        var _this = this;
        var tail = new tail_1.Tail(file, {
            encoding: "utf8",
            fromBeginning: true,
            separator: os.EOL,
        });
        tail.on('line', function (line) {
            _this.consoleLog.apply(_this.console, ["[" + tag + "] [" + level + "] " + line]);
            _this._log(level, ["[" + tag + "] " + line]);
        });
        tail.on('error', function (err) {
            _this.consoleError.apply(_this.console, [err]);
            _this._log('error', ["[" + tag + "] Error while tailing file: ", err]);
        });
        return tail;
    };
    Logger.hijack = function (c, file) {
        if (this.hijacked) {
            return;
        }
        console = c;
        c.log('Hijacking console log');
        this.hijacked = true;
        this.oldConsole = c;
        this.oldConsoleLog = c.log;
        this.oldConsoleInfo = c.info;
        this.oldConsoleWarn = c.warn;
        this.oldConsoleError = c.error;
        c.log = this.log.bind(this);
        c.info = this.info.bind(this);
        c.warn = this.warn.bind(this);
        c.error = this.error.bind(this);
        this.file = file || 'client.log';
        this.logger = winston.createLogger({
            transports: [new winston.transports.File({
                    filename: this.file,
                    maxsize: 1024 * 1024,
                    maxFiles: 2,
                    tailable: true,
                })],
        });
    };
    Logger.unhijack = function () {
        if (!this.hijacked) {
            return;
        }
        this.hijacked = false;
        console = MY_CONSOLE;
        var c = this.oldConsole;
        c.log = this.oldConsoleLog;
        c.info = this.oldConsoleInfo;
        c.warn = this.oldConsoleWarn;
        c.error = this.oldConsoleError;
        c.log('Unhijacked console log');
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
