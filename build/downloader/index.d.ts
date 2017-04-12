import * as StreamSpeed from './stream-speed';
import * as Resumable from '../common/resumable';
export interface IDownloadOptions extends StreamSpeed.ISampleOptions {
    overwrite?: boolean;
    decompressStream?: any;
}
export declare abstract class Downloader {
    static download(generateUrl: (() => Promise<string>) | string, to: string, options?: IDownloadOptions): DownloadHandle;
}
export interface IDownloadProgress {
    progress: number;
    timeLeft: number;
    sample: StreamSpeed.ISampleData;
}
export declare class DownloadHandle {
    private _generateUrl;
    private _to;
    private _options;
    private _promise;
    private _resolver;
    private _rejector;
    private _emitter;
    private _resumable;
    private _url;
    private _totalSize;
    private _totalDownloaded;
    private _streamSpeed;
    private _destStream;
    private _request;
    private _response;
    constructor(_generateUrl: (() => Promise<string>) | string, _to: string, _options: IDownloadOptions);
    readonly url: string;
    readonly to: string;
    readonly state: Resumable.State;
    readonly totalSize: number;
    readonly totalDownloaded: number;
    readonly promise: Promise<void>;
    private prepareFS();
    private generateUrl();
    private download();
    start(): void;
    private onStarting();
    onStarted(cb: Function): this;
    stop(): void;
    private onStopping();
    onStopped(cb: Function): this;
    onProgress(unit: StreamSpeed.SampleUnit, fn: (progress: IDownloadProgress) => void): DownloadHandle;
    private emitProgress(progress);
    private onError(err);
    private onErrorStopping(err);
    private onFinished();
}
