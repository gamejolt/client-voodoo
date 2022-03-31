import { Controller, Events } from './controller';
import { ControllerWrapper } from './controller-wrapper';
import { OldLaunchInstance } from './old-launcher';
import * as GameJolt from './gamejolt';
export interface IParsedWrapper {
    wrapperId: string;
}
export declare abstract class Launcher {
    static launch(localPackage: GameJolt.IGamePackage, credentials: GameJolt.IGameCredentials | null, ...executableArgs: string[]): Promise<LaunchInstance>;
    static attach(runningPid: string | IParsedWrapper): Promise<LaunchInstance | OldLaunchInstance>;
    private static ensureCredentials;
    private static manageInstanceInQueue;
}
export declare type LaunchEvents = Events & {
    'gameOver': (errMessage?: string) => void;
};
export declare class LaunchInstance extends ControllerWrapper<LaunchEvents> {
    private _pid;
    constructor(controller: Controller, onReady: (err: Error | null, instance: LaunchInstance) => void);
    get pid(): string;
    kill(): Promise<{
        success: boolean;
        err?: string;
    }>;
}
