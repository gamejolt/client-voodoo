/// <reference types="node" />
import * as fs from 'fs';
declare var _default: {
    mkdirp: (path: string, mode?: string) => Promise<boolean>;
    fsUnlink: (path: string) => Promise<void>;
    fsExists: (path: string) => Promise<boolean>;
    fsReadFile: (path: string, encoding?: string) => Promise<string>;
    fsWriteFile: (path: string, data: string) => Promise<string>;
    chmod: (path: string, mode: string | number) => Promise<void>;
    fsStat: (path: string) => Promise<fs.Stats>;
    fsCopy: (from: string, to: string) => Promise<boolean>;
    fsReadDir: (path: string) => Promise<string[]>;
    fsReadDirRecursively: (path: string) => Promise<string[]>;
    test: (fn: Function, done?: Function) => (_done: any) => void;
    wait: (millis: number) => Promise<void>;
};
export default _default;
