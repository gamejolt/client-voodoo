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
export declare abstract class Logger {
    private static _logLines;
    private static _hijacked;
    private static _file;
    private static _filePath;
    private static _flushInterval;
    private static _flushFile();
    private static _log(...args);
    private static _logErr(...args);
    static hijack(file?: string): Promise<void>;
    static unhijack(): Promise<void>;
    static getClientLog(): IClientLog;
}
