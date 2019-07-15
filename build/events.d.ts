/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class TSEventEmitter<E extends {
    [event: string]: Function;
}> extends EventEmitter {
    constructor();
    addListener<T extends keyof E>(event: T, listener: E[T]): this;
    listeners(event: keyof E): Function[];
    on<T extends keyof E>(event: T, listener: E[T]): this;
    once<T extends keyof E>(event: T, listener: E[T]): this;
    removeAllListeners(event?: keyof E): this;
    removeListener<T extends keyof E>(event: T, listener: E[T]): this;
}
