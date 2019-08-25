/// <reference types="node" />
import * as net from 'net';
import { TSEventEmitter } from './events';
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
    connect(options: net.TcpNetConnectOpts): Promise<net.Socket>;
    private attempt;
    disconnect(): Promise<Error | void>;
}
