import { Tail } from 'tail';
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
export declare class Logger {
    private static hijacked;
    private static file;
    private static logger;
    private static oldConsole;
    private static oldConsoleLog;
    private static oldConsoleInfo;
    private static oldConsoleWarn;
    private static oldConsoleError;
    private static get console();
    private static get consoleLog();
    private static get consoleInfo();
    private static get consoleWarn();
    private static get consoleError();
    private static _log;
    static log(...args: any[]): void;
    static info(...args: any[]): void;
    static warn(...args: any[]): void;
    static error(...args: any[]): void;
    static createLoggerFromFile(file: string, tag: string, level: string): Tail;
    static hijack(c: Console, file?: string): void;
    static unhijack(): void;
    static getClientLog(): IClientLog;
}
