import { Controller } from './controller';
export declare abstract class Mutex {
    static create(name: string): Promise<MutexInstance>;
}
export declare class MutexInstance {
    private controller;
    private releasePromise;
    constructor(controller: Controller);
    release(): Promise<Error>;
    get onReleased(): Promise<Error>;
}
