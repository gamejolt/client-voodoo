/// <reference types="gamejolt" />
/// <reference types="tar-stream" />
import { IEntryHeader } from 'tar-stream';
import * as StreamSpeed from '../downloader/stream-speed';
import { IDownloadProgress } from '../downloader';
export interface IPatcherOptions {
    overwrite?: boolean;
    decompressInDownload?: boolean;
}
export interface IPatcherStartOptions {
    voodooQueue?: boolean;
}
export interface IPatcherStopOptions {
    voodooQueue?: boolean;
}
export declare enum PatchOperation {
    STOPPED = 0,
    DOWNLOADING = 1,
    PATCHING = 2,
    FINISHED = 3,
}
export declare abstract class Patcher {
    static patch(generateUrl: (() => Promise<string>) | string, localPackage: GameJolt.IGamePackage, options?: IPatcherOptions): PatchHandle;
}
export declare class PatchHandle {
    private _generateUrl;
    private _localPackage;
    private _options;
    private _state;
    private _to;
    private _tempFile;
    private _archiveListFile;
    private _patchListFile;
    private _downloadHandle;
    private _extractHandle;
    private _onProgressFuncMapping;
    private _onExtractProgressFuncMapping;
    private _promise;
    private _resolver;
    private _rejector;
    private _emitter;
    private _resumable;
    private _firstRun;
    constructor(_generateUrl: (() => Promise<string>) | string, _localPackage: GameJolt.IGamePackage, _options?: IPatcherOptions);
    readonly promise: Promise<void>;
    readonly state: PatchOperation;
    isDownloading(): boolean;
    isPatching(): boolean;
    isFinished(): boolean;
    isRunning(): boolean;
    private _getDecompressStream();
    private download();
    private patchPrepare();
    private finalizePatch(prepareResult, extractResult);
    private patch();
    start(options?: IPatcherStartOptions): void;
    private onStarting(options?);
    private _stop(options);
    private onStopping(options);
    stop(options?: IPatcherStopOptions): void;
    cancel(options?: IPatcherStopOptions): void;
    onDownloading(fn: Function): this;
    deregisterOnDownloading(fn: Function): this;
    onProgress(unit: StreamSpeed.SampleUnit, fn: (progress: IDownloadProgress) => any): this;
    deregisterOnProgress(fn: Function): this;
    onPatching(fn: Function): this;
    deregisterOnPatching(fn: Function): this;
    onExtractProgress(unit: StreamSpeed.SampleUnit, fn: (progress: IDownloadProgress) => any): this;
    deregisterOnExtractProgress(fn: Function): this;
    onFile(fn: (file: IEntryHeader) => any): this;
    deregisterOnFile(fn: (file: IEntryHeader) => any): this;
    onPaused(fn: (voodooQueue: boolean) => any): this;
    deregisterOnPaused(fn: (voodooQueue: boolean) => any): this;
    onResumed(fn: (voodooQueue: boolean) => any): this;
    deregisterOnResumed(fn: (voodooQueue: boolean) => any): this;
    onCanceled(fn: Function): this;
    deregisterOnCanceled(fn: Function): this;
    private emitProgress(progress);
    private emitExtractProgress(progress);
    private emitFile(file);
    private onError(err);
    private onErrorStopping(err);
    private onFinished();
}
