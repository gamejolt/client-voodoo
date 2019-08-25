import { Controller, Events } from './controller';
import { ControllerWrapper } from './controller-wrapper';
import * as GameJolt from './gamejolt';
export declare abstract class Rollbacker {
    static rollback(localPackage: GameJolt.IGamePackage): Promise<RollbackInstance>;
    static rollbackReattach(port: number, pid: number): Promise<RollbackInstance>;
}
export declare enum RollbackState {
    Starting = 0,
    Rollback = 1,
    Finished = 2
}
export declare type RollbackEvents = Events & {
    'state': (state: RollbackState) => void;
};
export declare class RollbackInstance extends ControllerWrapper<RollbackEvents> {
    private _state;
    private _isPaused;
    constructor(controller: Controller);
    private getState;
    private _getState;
    readonly state: RollbackState;
    isFinished(): boolean;
    isRunning(): boolean;
}
