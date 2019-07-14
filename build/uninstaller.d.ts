import { Controller, Events } from './controller';
import { ControllerWrapper } from './controller-wrapper';
import * as GameJolt from './gamejolt';
export declare abstract class Uninstaller {
    static uninstall(localPackage: GameJolt.IGamePackage): Promise<UninstallInstance>;
    static uninstallReattach(port: number, pid: number): Promise<UninstallInstance>;
}
export declare enum UninstallState {
    Starting = 0,
    Uninstalling = 1,
    Finished = 2
}
export declare type UninstallEvents = Events & {
    'state': (state: UninstallState) => void;
};
export declare class UninstallInstance extends ControllerWrapper<UninstallEvents> {
    private _state;
    private _isPaused;
    constructor(controller: Controller);
    private getState;
    private _getState;
    readonly state: UninstallState;
    isFinished(): boolean;
    isRunning(): boolean;
}
