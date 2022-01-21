export declare abstract class Config {
    static env: 'development' | 'production' | null;
    static readonly mutex_name = "game-jolt-client";
    private static pidDir;
    private static clientMutexPromise;
    private static clientMutex;
    static get domain(): "http://development.gamejolt.com" | "https://gamejolt.com";
    static get pid_dir(): string;
    static ensurePidDir(): Promise<unknown>;
    static setPidDir(pidDir: string): boolean;
    static issetClientMutex(): boolean;
    static setClientMutex(): Promise<void>;
    static releaseClientMutex(): Promise<Error | null>;
}
