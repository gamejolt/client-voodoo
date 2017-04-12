export declare enum State {
    STARTED = 0,
    STARTING = 1,
    STOPPED = 2,
    STOPPING = 3,
    FINISHED = 4,
}
export interface ICallback {
    cb: Function;
    args?: any[];
    context?: any;
}
export declare class Resumable {
    private _currentState;
    private _wantsStart;
    private _waitForStart;
    private _waitForStartResolver;
    private _startCbs;
    private _waitForStop;
    private _waitForStopResolver;
    private _stopCbs;
    constructor();
    readonly state: State;
    start(cb: ICallback, force?: boolean): Promise<void>;
    started(): void;
    stop(cb: ICallback, force?: boolean): Promise<void>;
    stopped(): void;
    finished(): void;
    checkContinue(cb: ICallback, running: boolean): Promise<void>;
}
