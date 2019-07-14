import * as data from './data';
import { PatchInstance, State as PatcherState } from './patcher';
export interface IQueueState {
    queued: boolean;
    timeLeft: number;
    managed: boolean;
    events: {
        progress?: (progress: data.MsgProgress) => void;
        state?: (state: PatcherState) => void;
        paused?: () => void;
        resumed?: () => void;
        canceled?: () => void;
        done?: (errMessage?: string) => void;
        fatal?: (err: Error) => void;
    };
}
export interface IQueueProfile {
    downloads: number;
    extractions: number;
}
export declare abstract class Queue {
    private static _isFast;
    private static _fastProfile;
    private static _slowProfile;
    private static _maxDownloads;
    private static _maxExtractions;
    private static _settingDownloads;
    private static _settingExtractions;
    private static _patches;
    private static log;
    static fetch(running: boolean, isDownloading?: boolean): {
        patch: PatchInstance;
        state: IQueueState;
    }[];
    private static applyProfile;
    static faster: IQueueProfile;
    static setFaster(): void;
    static slower: IQueueProfile;
    static setSlower(): void;
    private static onProgress;
    private static onState;
    private static onPaused;
    private static onResumed;
    private static onCanceled;
    private static onDone;
    private static onFatalError;
    static canResume(patch: PatchInstance): boolean;
    static manage(patch: PatchInstance): Promise<IQueueState>;
    static unmanage(patch: PatchInstance, noTick?: boolean): void;
    private static resumePatch;
    private static pausePatch;
    static tick(downloads?: boolean): void;
    static readonly maxDownloads: number;
    static readonly maxExtractions: number;
    static setMaxDownloads(newMaxDownloads: number): Promise<boolean>;
    static setMaxExtractions(newMaxExtractions: number): Promise<boolean>;
}
