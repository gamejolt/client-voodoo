import { PatchHandle } from '../patcher';
import { IDownloadProgress } from '../downloader';
import { IExtractProgress } from '../extractor';
export interface IQueueState {
    queued: boolean;
    timeLeft: number;
    managed: boolean;
    events: {
        onProgress?: (progress: IDownloadProgress) => any;
        onPatching?: Function;
        onExtractProgress?: (progress: IExtractProgress) => any;
        onPaused?: (voodooQueue: boolean) => any;
        onResumed?: (voodooQueue: boolean) => any;
        onCanceled?: Function;
    };
}
export interface IQueueProfile {
    downloads: number;
    extractions: number;
}
export declare abstract class VoodooQueue {
    private static _isFast;
    private static _fastProfile;
    private static _slowProfile;
    private static _maxDownloads;
    private static _maxExtractions;
    private static _settingDownloads;
    private static _settingExtractions;
    private static _patches;
    private static log(message, patch?);
    static reset(cancel?: boolean): Promise<void[]>;
    static fetch(running: boolean, isDownloading?: boolean): {
        patch: PatchHandle;
        state: IQueueState;
    }[];
    private static applyProfile(profile);
    static faster: IQueueProfile;
    static setFaster(): void;
    static slower: IQueueProfile;
    static setSlower(): void;
    private static onProgress(patch, state, progress);
    private static onPatching(patch, state, progress);
    private static onExtractProgress(patch, state, progress);
    private static onPaused(patch, state, voodooQueue);
    private static onResumed(patch, state, voodooQueue);
    private static onCanceled(patch, state);
    static canResume(patch: PatchHandle): boolean;
    static manage(patch: PatchHandle): IQueueState;
    static unmanage(patch: PatchHandle, noTick?: boolean): void;
    private static resumePatch(patch, state);
    private static pausePatch(patch, state);
    static tick(downloads?: boolean): void;
    static readonly maxDownloads: number;
    static readonly maxExtractions: number;
    static setMaxDownloads(newMaxDownloads: number): Promise<boolean>;
    static setMaxExtractions(newMaxExtractions: number): Promise<boolean>;
}
