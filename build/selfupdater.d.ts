import { Controller, Events } from './controller';
import { ControllerWrapper } from './controller-wrapper';
export declare abstract class SelfUpdater {
    static attach(manifestFile: string): Promise<SelfUpdaterInstance>;
}
export declare type SelfUpdaterEvents = Events;
export declare class SelfUpdaterInstance extends ControllerWrapper<SelfUpdaterEvents> {
    constructor(controller: Controller);
    checkForUpdates(options?: {
        authToken?: string;
        metadata?: string;
    }): Promise<import("client-voodoo/src/data").MsgResultResponse>;
    updateBegin(): Promise<import("client-voodoo/src/data").MsgResultResponse>;
    updateApply(): Promise<import("client-voodoo/src/data").MsgResultResponse>;
}
