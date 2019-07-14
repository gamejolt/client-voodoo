import * as os from 'os';
import * as winston from 'winston';
import * as util from 'util';
import * as fs from 'fs';

export interface IClientLog {
	logLines: string[];
	osInfo: IClientOSInfo;
}

export interface IClientOSInfo {
	os: string;
	arch: string;
	release: string;
	uptime: number;
	freeMemory: number;
	totalMemory: number;
	cpuCount: number;
}

export class Logger {
	private static hijacked = false;
	private static file: string;
	private static logger: winston.Logger;

	private static oldConsole: Console;
	private static oldConsoleLog: typeof Console.prototype.log;
	private static oldConsoleInfo: typeof Console.prototype.info;
	private static oldConsoleWarn: typeof Console.prototype.warn;
	private static oldConsoleError: typeof Console.prototype.error;

	private static _log(level: string, args: any[]) {
		let str = util.format.apply(console, args).split('\n');
		this.logger.log(level, str);
	}

	static log(...args: any[]) {
		this.oldConsoleLog.apply(console, args);
		this._log('info', args);
	}

	static info(...args: any[]) {
		this.oldConsoleInfo.apply(console, args);
		this._log('info', args);
	}

	static warn(...args: any[]) {
		this.oldConsoleWarn.apply(console, args);
		this._log('warn', args);
	}

	static error(...args: any[]) {
		this.oldConsoleError.apply(console, args);
		this._log('error', args);
	}

	static hijack(file?: string) {
		if (this.hijacked) {
			return;
		}

		this.hijacked = true;

		this.file = file || 'client.log';
		this.logger = winston.createLogger({
			transports: [new winston.transports.File({
				filename: this.file,
				maxsize: 1024 * 1024, // 1 MB
				maxFiles: 2,
				tailable: true,
			})],
		});

		const c = console;
		this.oldConsole = c;
		this.oldConsoleLog = c.log;
		this.oldConsoleInfo = c.info;
		this.oldConsoleWarn = c.warn;
		this.oldConsoleError = c.error;

		c.log = this.log;
		c.info = this.info;
		c.warn = this.warn;
		c.error = this.error;
	}

	static unhijack() {
		if (!this.hijacked) {
			return;
		}

		this.hijacked = false;

		const c = this.oldConsole;
		this.oldConsoleLog = c.log;
		this.oldConsoleInfo = c.info;
		this.oldConsoleWarn = c.warn;
		this.oldConsoleError = c.error;

		c.log = this.oldConsoleLog;
		c.info = this.oldConsoleInfo;
		c.warn = this.oldConsoleWarn;
		c.error = this.oldConsoleError;
	}

	static getClientLog(): IClientLog {
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
