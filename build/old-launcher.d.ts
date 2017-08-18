import { TSEventEmitter } from './events';
import { IParsedWrapper } from './launcher';
import { Events } from './controller';
export declare class OldLauncher {
    static attach(wrapperId: string): Promise<OldLaunchInstance>;
}
export declare type OldLauncherEvents = Events & {
    'gameLaunched': () => void;
    'gameOver': () => void;
};
export declare class OldLaunchInstance extends TSEventEmitter<OldLauncherEvents> {
    private _wrapperId;
    private _interval;
    private _wrapperPort;
    private _stable;
    constructor(_wrapperId: string);
    readonly pid: IParsedWrapper;
    tick(): Promise<boolean>;
    abort(): void;
}
