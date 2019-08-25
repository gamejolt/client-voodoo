/// <reference types="node" />
import * as EventEmitter from 'events';
declare type EventListener = (...args: any[]) => void;
export declare class TSEventEmitter<E extends {
    [event: string]: EventListener;
}> extends EventEmitter {
    constructor();
    addListener<T extends Extract<keyof E, string>>(event: T, listener: E[T]): this;
    listeners(event: Extract<keyof E, string>): Function[];
    on<T extends Extract<keyof E, string>>(event: T, listener: E[T]): this;
    once<T extends Extract<keyof E, string>>(event: T, listener: E[T]): this;
    removeAllListeners(event?: Extract<keyof E, string>): this;
    removeListener<T extends Extract<keyof E, string>>(event: T, listener: E[T]): this;
}
export {};
