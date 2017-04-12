export declare abstract class Application {
    private static mutex;
    private static _pidDir;
    static readonly PID_DIR: string;
    static ensurePidDir(): Promise<boolean>;
    static setPidDir(pidDir: string): boolean;
    static start(): void;
    static stop(): void;
}
