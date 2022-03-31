"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const os = require("os");
const winston = require("winston");
const util = require("util");
const fs = require("fs");
const tail_1 = require("tail");
const MY_CONSOLE = console;
class Logger {
    static get console() {
        return this.hijacked ? this.oldConsole : MY_CONSOLE;
    }
    static get consoleLog() {
        return this.hijacked ? this.oldConsoleLog : MY_CONSOLE.log;
    }
    static get consoleInfo() {
        return this.hijacked ? this.oldConsoleInfo : MY_CONSOLE.info;
    }
    static get consoleWarn() {
        return this.hijacked ? this.oldConsoleWarn : MY_CONSOLE.warn;
    }
    static get consoleError() {
        return this.hijacked ? this.oldConsoleError : MY_CONSOLE.error;
    }
    static _log(level, args) {
        if (!this.hijacked) {
            return;
        }
        let str = util.format.apply(this.console, args).split('\n');
        this.logger.log(level, str);
    }
    static log(...args) {
        this.consoleLog.apply(this.console, args);
        this._log('info', args);
    }
    static info(...args) {
        this.consoleInfo.apply(this.console, args);
        this._log('info', args);
    }
    static warn(...args) {
        this.consoleWarn.apply(this.console, args);
        this._log('warn', args);
    }
    static error(...args) {
        this.consoleError.apply(this.console, args);
        this._log('error', args);
    }
    static createLoggerFromFile(file, tag, level) {
        const tail = new tail_1.Tail(file, {
            encoding: "utf8",
            fromBeginning: true,
            separator: os.EOL,
        });
        tail.on('line', line => {
            this.consoleLog.apply(this.console, [`[${tag}] [${level}] ${line}`]);
            this._log(level, [`[${tag}] ${line}`]);
        });
        tail.on('error', err => {
            this.consoleError.apply(this.console, [err]);
            this._log('error', [`[${tag}] Error while tailing file: `, err]);
        });
        return tail;
    }
    static hijack(c, file) {
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
            format: winston.format.combine(winston.format.timestamp(), winston.format.printf((info) => {
                // Not sure if this a bug in winston or me misusing it.
                // For some reason the message is populated on key 0 for the info object.
                info.message = info[0];
                return `[${info.timestamp}] ${info.level}: ${info.message}`;
            })),
            transports: [new winston.transports.File({
                    filename: this.file,
                    maxsize: 500 * 1024,
                    maxFiles: 2,
                    tailable: true,
                })],
        });
    }
    static unhijack() {
        if (!this.hijacked) {
            return;
        }
        this.hijacked = false;
        console = MY_CONSOLE;
        const c = this.oldConsole;
        c.log = this.oldConsoleLog;
        c.info = this.oldConsoleInfo;
        c.warn = this.oldConsoleWarn;
        c.error = this.oldConsoleError;
        c.log('Unhijacked console log');
    }
    static getClientLog() {
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
    }
}
exports.Logger = Logger;
Logger.hijacked = false;
