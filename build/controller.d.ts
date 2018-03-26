/// <reference types="node" />
import * as cp from 'child_process';
import * as data from './data';
import { TSEventEmitter } from './events';
import * as GameJolt from './gamejolt';
export declare function getExecutable(): string;
export declare type Events = {
    'fatal': (err: Error) => void;
    'err': (err: Error) => void;
    'gameLaunchBegin': (dir: string, ...args: string[]) => void;
    'gameLaunchFinished': () => void;
    'gameLaunchFailed': (reason: string) => void;
    'gameCrashed': (reason: string) => void;
    'gameClosed': () => void;
    'gameKilled': () => void;
    'gameRelaunchBegin': (dir: string, ...args: string[]) => void;
    'gameRelaunchFailed': (reason: string) => void;
    'noUpdateAvailable': () => void;
    'updateAvailable': (metadata: data.UpdateMetadata) => void;
    'updateBegin': (dir: string, metadata: data.UpdateMetadata) => void;
    'updateFinished': () => void;
    'updateReady': () => void;
    'updateApply': (...args: string[]) => void;
    'updateFailed': (reason: string) => void;
    'paused': (queue: boolean) => void;
    'resumed': (unqueue: boolean) => void;
    'canceled': () => void;
    'uninstallBegin': (dir: string) => void;
    'uninstallFailed': (reason: string) => void;
    'uninstallFinished': () => void;
    'rollbackBegin': (dir: string) => void;
    'rollbackFailed': (reason: string) => void;
    'rollbackFinished': () => void;
    'patcherState': (state: data.PatcherState) => void;
    'progress': (progress: data.MsgProgress) => void;
};
export declare type Options = {
    process?: cp.ChildProcess | number;
    keepConnected?: boolean;
};
export declare type LaunchOptions = cp.SpawnOptions & {
    keepConnected?: boolean;
};
export declare class Controller extends TSEventEmitter<Events> {
    readonly port: number;
    private process;
    private reconnector;
    private connectionLock;
    private conn;
    private nextMessageId;
    private sendQueue;
    private sentMessage;
    private consumingQueue;
    private expectingQueuePauseIds;
    private expectingQueueResumeIds;
    private expectingQueuePause;
    private expectingQueueResume;
    constructor(port: number, options?: Options);
    private newJsonStream();
    static ensureMigrationFile(localPackage: GameJolt.IGamePackage): Promise<void>;
    static launchNew(args: string[], options?: LaunchOptions): Promise<Controller>;
    readonly connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    dispose(): Promise<void>;
    private consumeSendQueue();
    private send<T>(type, payload, timeout?);
    private sendControl(command, extraData?, timeout?);
    sendKillGame(timeout?: number): Promise<data.MsgResultResponse>;
    sendPause(options?: {
        queue?: boolean;
        timeout?: number;
    }): Promise<data.MsgResultResponse>;
    sendResume(options?: {
        queue?: boolean;
        authToken?: string;
        extraMetadata?: string;
        timeout?: number;
    }): Promise<data.MsgResultResponse>;
    sendCancel(timeout?: number, waitOnlyForSend?: boolean): Promise<void> | Promise<data.MsgResultResponse>;
    sendGetState(includePatchInfo: boolean, timeout?: number): Promise<data.MsgStateResponse>;
    sendCheckForUpdates(gameUID: string, platformURL: string, authToken?: string, metadata?: string, timeout?: number): Promise<data.MsgResultResponse>;
    sendUpdateAvailable(updateMetadata: data.UpdateMetadata, timeout?: number): Promise<{}>;
    sendUpdateBegin(timeout?: number): Promise<data.MsgResultResponse>;
    sendUpdateApply(env: Object, args: string[], timeout?: number): Promise<data.MsgResultResponse>;
    kill(): Promise<void>;
}
