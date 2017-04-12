/// <reference types="tar-stream" />
import * as tar from 'tar-stream';
import * as tarFS from 'tar-fs';
import * as StreamSpeed from '../downloader/stream-speed';
import * as Resumable from '../common/resumable';
export interface IExtractOptions extends tarFS.IExtractOptions {
    deleteSource?: boolean;
    overwrite?: boolean;
    decompressStream?: any;
}
export interface IExtractProgress {
    progress: number;
    timeLeft: number;
    sample: StreamSpeed.ISampleData;
}
export interface IExtractResult {
    files: string[];
}
export declare abstract class Extractor {
    static extract(from: string, to: string, options?: IExtractOptions): ExtractHandle;
}
export declare class ExtractHandle {
    private _from;
    private _to;
    private _options;
    private _promise;
    private _resolver;
    private _rejector;
    private _resumable;
    private _firstRun;
    private _streamSpeed;
    private _readStream;
    private _extractStream;
    private _extractedFiles;
    private _totalProcessed;
    private _totalSize;
    private _emitter;
    constructor(_from: string, _to: string, _options?: IExtractOptions);
    readonly from: string;
    readonly to: string;
    readonly state: Resumable.State;
    readonly promise: Promise<IExtractResult>;
    private prepareFS();
    private unpack();
    start(): void;
    private onStarting();
    onStarted(cb: Function): this;
    stop(terminate?: boolean): void;
    private onStopping();
    onStopped(cb: Function): this;
    private onTerminating();
    onProgress(unit: StreamSpeed.SampleUnit, fn: (progress: IExtractProgress) => void): this;
    private emitProgress(progress);
    onFile(fn: (file: tar.IEntryHeader) => void): this;
    private emitFile(file);
    private resume();
    private pause();
    private onError(err);
    private onErrorStopping(err);
    private onFinished();
}
