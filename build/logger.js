"use strict";
var util = require("util");
var os = require("os");
var _ = require("lodash");
var fs = require("mz/fs");
var LOG_LINES = 300;
var CONSOLE_LOG = console.log;
var CONSOLE_ERR = console.error;
var Logger = (function () {
    function Logger() {
    }
    Logger._flushFile = function () {
        try {
            if (this._file) {
                this._file.close();
            }
            this._file = null;
            fs.unlinkSync(this._filePath);
            var str = this._logLines.join('\n') + '\n';
            fs.writeFileSync(this._filePath, str);
            var logLineLength = this._logLines.join('\n').length, logLineCount = this._logLines.length;
            CONSOLE_LOG.apply(console, ["Flushing log file of length " + logLineLength + " with " + logLineCount + " rows"]);
            this._file = fs.createWriteStream(this._filePath, {
                flags: 'a',
                encoding: 'utf8',
            });
        }
        catch (err) {
            CONSOLE_LOG.apply(console, [err.message + "\n" + err.stack]);
        }
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
        if (this._hijacked) {
            return;
        }
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
        console.log = CONSOLE_LOG;
        console.info = CONSOLE_LOG;
        console.warn = CONSOLE_ERR;
        console.error = CONSOLE_ERR;
        this._hijacked = false;
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