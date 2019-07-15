export default class FsAsync {
    static writeFile(filename: string, data: any, options?: {
        encoding?: string;
        mode?: number;
        flag?: string;
    }): Promise<void>;
    static unlink(filename: string): Promise<void>;
    static exists(filename: string): Promise<boolean>;
    static readFile(filename: string, encoding: string): Promise<string>;
    static chmod(path: string, mode: number | string): Promise<void>;
    static tmpFile(prefix: string, ext: string): Promise<{
        name: string;
        fd: number;
    }>;
}
