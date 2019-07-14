export declare abstract class Shortcut {
    static create(program: string, icon: string): Promise<void>;
    static remove(): Promise<boolean>;
    private static createLinux;
    private static removeLinux;
}
