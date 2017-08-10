import { Controller, Events } from './controller';
import { ControllerWrapper } from './controller-wrapper';
import { TSEventEmitter } from './events';
import * as GameJolt from './gamejolt';
export interface IParsedWrapper {
    wrapperId: string;
}
export declare abstract class Launcher {
    static launch(localPackage: GameJolt.IGamePackage, credentials: GameJolt.IGameCredentials | null, ...executableArgs: string[]): Promise<TSEventEmitter<LaunchEvents>>;
    static attach(runningPid: string | IParsedWrapper): Promise<TSEventEmitter<LaunchEvents>>;
    private static ensureCredentials(localPackage, credentials);
    private static manageInstanceInQueue(instance);
}
export declare type LaunchEvents = Events & {
    'gameOver': (errMessage?: string) => void;
};
export declare class LaunchInstance extends ControllerWrapper<LaunchEvents> {
    private _pid;
    constructor(controller: Controller, onReady: (err: Error | null, instance: LaunchInstance) => void);
    readonly pid: string;
    kill(): Promise<{
        success: boolean;
        err?: string;
    }>;
}
