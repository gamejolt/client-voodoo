/// <reference types="node" />
import * as fs_ from 'fs';
declare const fs: typeof fs_ & {
    writeFileAsync(filename: string, data: any, options?: {
        encoding?: string;
        mode?: number;
        flag?: string;
    }): Promise<void>;
    unlinkAsync(filename: string): Promise<void>;
    existsAsync(filename: string): Promise<boolean>;
    readFileAsync(filename: string, encoding: string): Promise<string>;
};
export = fs;
