/// <reference types="node" />
import * as net from 'net';
import { TSEventEmitter } from './events';
export declare type Events = {
    'attempt': (n: number) => void;
    'connected': (conn: net.Socket) => void;
};
export declare type ReconnectorOptions = {
    /**
     * How long to wait between each reconnection attempt, in milliseconds.
     */
    interval: number;
    /**
     * How long to keep trying to establish a connection, in milliseconds.
     * This applies to both the initial connection and restoring a connection after
     * it was lost.
     */
    timeout: number;
    /**
     * True if to attempt to reconnect after a connection was lost.
     */
    reconnect: boolean;
};
export declare enum ReconnectorState {
    IDLE = 0,
    CONNECTING = 1,
    CONNECTED = 2,
    RECONNECTING = 3,
    DISCONNECTING = 4
}
export declare class Reconnector extends TSEventEmitter<Events> {
    private _interval;
    private _timeout;
    private _reconnect;
    private _wantsConnection;
    private _state;
    private _connected;
    private _connectPromise;
    private _connectAborter;
    private _connectAttemptPromise;
    private _disconnectPromise;
    private _conn;
    constructor(options?: Partial<ReconnectorOptions>);
    get connected(): boolean;
    get wantsConnection(): boolean;
    /**
     * Performs a connection.
     *
     * Connection attempt will be queued up if the reconnector
     * is in the middle of disconnecting, even if the current connection
     * has not been disposed yet.
     *
     * Resolves to `net.Socket` on successful connection, or if already connected.
     * Resolves to `null` when the connection attempt was explicitly aborted.
     * Rejects when the reconnector timed out while connecting.
     *
     * @param options - The options to pass to net.connect.
     * These options will also be used for reconnections.
     */
    connect(options: net.TcpNetConnectOpts): Promise<net.Socket | null>;
    private _connect;
    private _connectLoop;
    private _attempt;
    disconnect(): Promise<Error | null>;
    private _closeConnection;
}
