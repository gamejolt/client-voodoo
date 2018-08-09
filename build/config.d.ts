export declare abstract class Config {
    static env: 'development' | 'production' | null;
    static readonly mutex_name: string;
    private static pidDir;
    private static clientMutexPromise;
    private static clientMutex;
    static readonly domain: string;
    static readonly pid_dir: string;
    static ensurePidDir(): Promise<{}>;
    static setPidDir(pidDir: string): boolean;
    static issetClientMutex(): boolean;
    static setClientMutex(): Promise<void>;
    static releaseClientMutex(): Promise<Error>;
}
