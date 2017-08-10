import { Controller, Events } from './controller';
import * as data from './data';
import { ControllerWrapper } from './controller-wrapper';
import * as GameJolt from './gamejolt';
export interface IPatchOptions {
    authToken?: string;
    runLater?: boolean;
}
export declare type AuthTokenGetter = () => Promise<string>;
export declare abstract class Patcher {
    static patch(localPackage: GameJolt.IGamePackage, getAuthToken: AuthTokenGetter, options?: IPatchOptions): Promise<PatchInstance>;
    static patchReattach(port: number, pid: number, authTokenGetter: AuthTokenGetter): Promise<PatchInstance>;
    private static manageInstanceInQueue(instance);
}
export declare enum State {
    Starting = 0,
    Downloading = 1,
    Patching = 2,
    Finished = 3,
}
export declare type PatchEvents = Events & {
    'state': (state: State) => void;
    'done': (errMessage?: string) => void;
};
export declare class PatchInstance extends ControllerWrapper<PatchEvents> {
    private authTokenGetter;
    private _state;
    private _isPaused;
    constructor(controller: Controller, authTokenGetter: AuthTokenGetter);
    private getState();
    private _getState(state);
    readonly state: State;
    isDownloading(): boolean;
    isPatching(): boolean;
    isFinished(): boolean;
    isRunning(): boolean;
    getAuthToken(): Promise<string>;
    resume(options?: {
        queue?: boolean;
        authToken?: string;
        extraMetadata?: string;
    }): Promise<data.MsgResultResponse>;
    pause(queue?: boolean): Promise<data.MsgResultResponse>;
    cancel(): Promise<data.MsgResultResponse>;
}
