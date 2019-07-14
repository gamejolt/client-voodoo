"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var os = require("os");
var fs = require("fs");
var LOG_LINES = 300;
var CONSOLE = console;
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger._flushFile = function () {
        try {
            if (this._file) {
                this._file.close();
            }
            this._file = null;
            if (fs.existsSync(this._filePath)) {
                fs.unlinkSync(this._filePath);
            }
            var str = this._logLines.join('\n') + '\n';
            fs.writeFileSync(this._filePath, str);
            var logLineLength = this._logLines.join('\n').length, logLineCount = this._logLines.length;
            this._consoleLog.apply(this._console, [
                "Flushing log file of length " + logLineLength + " with " + logLineCount + " rows",
            ]);
            this._file = fs.createWriteStream(this._filePath, {
                flags: 'a',
                encoding: 'utf8',
            });
        }
        catch (err) {
            this._consoleLog.apply(this._console, [err.message + "\n" + err.stack]);
        }
    };
    Logger._log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this._consoleLog.apply(this._console, args);
        var str = util.format.apply(this._console, args).split('\n');
        for (var _a = 0, str_1 = str; _a < str_1.length; _a++) {
            var strVal = str_1[_a];
            this._logLines.push(strVal);
        }
        if (this._file) {
            this._file.write(str + '\n');
        }
        if (this._logLines.length > LOG_LINES) {
            this._logLines = this._logLines.slice(this._logLines.length - LOG_LINES);
        }
    };
    Logger._logErr = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this._consoleErr.apply(this._console, args);
        var str = util.format.apply(this._console, args).split('\n');
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
    Logger.hijack = function (newConsole, file) {
        if (this._hijacked) {
            return;
        }
        this._console = newConsole;
        this._consoleLog = newConsole.log;
        this._consoleErr = newConsole.error;
        console = this._console;
        this._filePath = file || 'client.log';
        if (fs.existsSync(this._filePath)) {
            try {
                var readLines = fs.readFileSync(this._filePath, 'utf8');
                console.log(typeof readLines);
                this._logLines = readLines.split('\n');
                if (this._logLines.length > LOG_LINES) {
                    this._logLines = this._logLines.slice(this._logLines.length - LOG_LINES);
                }
            }
            catch (err) {
                console.log(err.message + "\n" + err.stack);
            }
        }
        this._file = fs.createWriteStream(this._filePath, {
            flags: 'a',
            encoding: 'utf8',
        });
        var flushFunc = this._flushFile.bind(this);
        this._flushInterval = setInterval(flushFunc, 10000);
        console.log = this._log.bind(this);
        console.info = this._log.bind(this);
        console.warn = this._logErr.bind(this);
        console.error = this._logErr.bind(this);
        this._hijacked = true;
    };
    Logger.unhijack = function () {
        if (!this._hijacked) {
            return;
        }
        clearInterval(this._flushInterval);
        if (this._file) {
            this._file.close();
        }
        fs.writeFileSync(this._filePath, this._logLines.join('\n'));
        console.log = this._consoleLog;
        console.info = this._consoleLog;
        console.warn = this._consoleErr;
        console.error = this._consoleErr;
        console = CONSOLE;
        this._console = console;
        this._consoleLog = console.log;
        this._consoleErr = console.error;
        this._hijacked = false;
    };
    Logger.getClientLog = function () {
        return {
            logLines: this._logLines.slice(),
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
    Logger._console = CONSOLE;
    Logger._consoleLog = CONSOLE.log;
    Logger._consoleErr = CONSOLE.error;
    Logger._logLines = [];
    Logger._hijacked = false;
    return Logger;
}());
exports.Logger = Logger;
