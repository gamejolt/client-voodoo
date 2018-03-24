/// <reference types="node" />
import * as net from 'net';
import { TSEventEmitter } from './events';
export interface IConnectionOptions {
    port: number;
    host?: string;
    localAddress?: string;
    localPort?: string;
    family?: number;
    allowHalfOpen?: boolean;
}
export declare type Events = {
    'attempt': (n: number) => void;
};
export declare class Reconnector extends TSEventEmitter<Events> {
    private interval;
    private timeout;
    private keepConnected;
    private _connected;
    private conn;
    private connectPromise;
    private disconnectPromise;
    constructor(interval: number, timeout: number, keepConnected: boolean);
    readonly connected: boolean;
    connect(options: IConnectionOptions): Promise<net.Socket>;
    private attempt(options);
    disconnect(): Promise<Error | void>;
}
