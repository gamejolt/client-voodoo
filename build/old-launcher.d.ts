import { TSEventEmitter } from './events';
import { IParsedWrapper } from './launcher';
export declare class Launcher {
    static attach(wrapperId: string): Promise<LaunchInstance>;
}
export declare type LaunchEvents = {
    'gameLaunched': () => void;
    'gameOver': () => void;
};
export declare class LaunchInstance extends TSEventEmitter<LaunchEvents> {
    private _wrapperId;
    private _interval;
    private _wrapperPort;
    private _stable;
    constructor(_wrapperId: string);
    readonly pid: IParsedWrapper;
    tick(): Promise<boolean>;
    abort(): void;
}
