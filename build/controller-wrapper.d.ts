import { TSEventEmitter } from './events';
import { Controller, Events } from './controller';
export declare class ControllerWrapper<E extends Events> extends TSEventEmitter<E> {
    readonly controller: Controller;
    constructor(controller: Controller);
    addListener<T extends keyof E>(event: T, listener: E[T]): this;
    listeners(event: keyof E): Function[];
    on<T extends keyof E>(event: T, listener: E[T]): this;
    once<T extends keyof E>(event: T, listener: E[T]): this;
    removeAllListeners(event?: keyof E): this;
    removeListener<T extends keyof E>(event: T, listener: E[T]): this;
    dispose(): Promise<void>;
}
