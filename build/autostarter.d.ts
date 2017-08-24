export declare abstract class Autostarter {
    private static winAutostarter;
    private static linuxAutostarter;
    private static macAutostarter;
    private static readonly autostarter;
    static set(path_: string, args?: string[], runner?: string): Promise<void>;
    static unset(runner?: string): Promise<void>;
    static isset(): Promise<boolean>;
}
