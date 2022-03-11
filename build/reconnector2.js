"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reconnector = exports.ReconnectorState = void 0;
const net = require("net");
const events_1 = require("./events");
const util_1 = require("./util");
var ReconnectorState;
(function (ReconnectorState) {
    ReconnectorState[ReconnectorState["IDLE"] = 0] = "IDLE";
    ReconnectorState[ReconnectorState["CONNECTING"] = 1] = "CONNECTING";
    ReconnectorState[ReconnectorState["CONNECTED"] = 2] = "CONNECTED";
    ReconnectorState[ReconnectorState["RECONNECTING"] = 3] = "RECONNECTING";
    ReconnectorState[ReconnectorState["DISCONNECTING"] = 4] = "DISCONNECTING";
})(ReconnectorState = exports.ReconnectorState || (exports.ReconnectorState = {}));
class Reconnector extends events_1.TSEventEmitter {
    constructor(options) {
        var _a, _b, _c;
        super();
        this._wantsConnection = false;
        this._state = ReconnectorState.IDLE;
        this._connected = false;
        this._connectPromise = null;
        this._connectAborter = null;
        this._connectAttemptPromise = null;
        this._disconnectPromise = null;
        this._conn = null;
        const defaultOpts = {
            interval: 100,
            timeout: 3000,
            reconnect: true,
        };
        this._interval = (_a = options === null || options === void 0 ? void 0 : options.interval) !== null && _a !== void 0 ? _a : defaultOpts.interval;
        this._timeout = (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : defaultOpts.timeout;
        this._reconnect = (_c = options === null || options === void 0 ? void 0 : options.reconnect) !== null && _c !== void 0 ? _c : defaultOpts.reconnect;
    }
    get connected() {
        return this._connected;
    }
    get wantsConnection() {
        return this._wantsConnection;
    }
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
    connect(options) {
        this._wantsConnection = true;
        return this._connect(options, false);
    }
    async _connect(options, isReconnect) {
        var _a;
        const curState = this._state;
        console.log('reconnector.connect');
        console.log('reconnector cur state: ' + curState);
        // TODO: deal with options changing. We want to accept changes
        // only if we are either IDLE or DISCONNECTING.
        // How to implement this check?
        if (curState === ReconnectorState.CONNECTED) {
            return Promise.resolve(this._conn);
        }
        if (curState === ReconnectorState.CONNECTING || curState === ReconnectorState.RECONNECTING) {
            if (!this._connectPromise) {
                // This should never happen.
                // It is likely a race condition with reconnector implementation.
                const curStateName = curState === ReconnectorState.CONNECTING ? 'CONNECTING' : 'RECONNECTING';
                throw new Error(`Reconnector state is '${curStateName}' but connect promise was not set`);
            }
            return this._connectPromise;
        }
        if (curState === ReconnectorState.DISCONNECTING) {
            if (isReconnect) {
                // This should never happen.
                // Automatic reconnections are only done for unexpected connection losses.
                // Unexpected connection losses do NOT change the state to DISCONNECTED.
                // Instead, they transition into RECONNECTING state immediately.
                throw new Error(`Unexpected reconnector state 'DISCONNECTING' while attempting an automated reconnection`);
            }
            if (this._disconnectPromise === null) {
                // This should never happen.
                // It is likely a race condition with reconnector implementation.
                throw new Error(`Reconnector state is 'DISCONNECTING' but disconnect promise was not set`);
            }
            await this._disconnectPromise;
            return this._connect(options, false);
        }
        this._state = isReconnect ? ReconnectorState.RECONNECTING : ReconnectorState.CONNECTING;
        (_a = this._connectAborter) === null || _a === void 0 ? void 0 : _a.abort();
        this._connectAborter = new AbortController();
        const abortSignal = this._connectAborter.signal;
        this._connectPromise = (async () => {
            try {
                console.log('reconnector.connect waiting for connectLoop');
                const conn = await this._connectLoop(options, abortSignal);
                console.log('reconnector.connect connectLoop resolved');
                return conn;
            }
            finally {
                if (!abortSignal.aborted) {
                    console.log('unsetting connect promise');
                    this._connectPromise = null;
                }
                else {
                    console.log('not unsetting connect promise because we were aborted. the connect promise is managed by a differenet connect flow now');
                }
            }
        })();
        return this._connectPromise;
    }
    async _connectLoop(options, abortSignal) {
        const startTime = Date.now();
        let attemptNo = 0;
        let lastError;
        do {
            if (attemptNo !== 0) {
                console.log('reconnector interval sleeping');
                await (0, util_1.sleep)(this._interval);
                // Abort if we no longer want to make a connection,
                // or if theres a different connection going through.
                if (!this._wantsConnection || abortSignal.aborted) {
                    // Changing the state is done in the disconnect function.
                    // this._state = ReconnectorState.IDLE;
                    return null;
                }
            }
            attemptNo++;
            this.emit('attempt', attemptNo);
            try {
                console.log('reconnector connect waiting for attempt');
                const conn = await this._attempt(options);
                console.log('reconnector connect attempt resolved');
                return conn;
            }
            catch (err) {
                // A single attempt has failed, we'll retry if we have enough time.
                lastError = err;
            }
        } while (Date.now() - startTime + this._interval < this._timeout);
        console.warn(`Couldn't connect in time. Last error: ` + lastError.message);
        throw new Error(`Couldn't connect in time`);
    }
    async _attempt(options) {
        this._connectAttemptPromise = new Promise((resolve, reject) => {
            let lastError = null;
            // These are event handlers for the first connection event.
            // If we couldn't even establish the first connection, we don't bother retrying
            // since we only care about re-establishing a lost connection.
            // We save them as functions instead of using them inline so that we could
            // clear them specifically once a connection is made instead of removing all listeners for the socket.
            const onError = (err) => lastError = err;
            const onClose = (hasError) => {
                console.log('socket.close', lastError);
                conn.removeListener('error', onError);
                conn.removeListener('close', onClose);
                if (hasError) {
                    reject(lastError || new Error('Unknown error while connecting'));
                }
            };
            const conn = net
                .connect(options)
                .on('connect', () => {
                console.log('socket.connect.open');
                conn.removeListener('error', onError);
                conn.removeListener('close', onClose);
                conn.on('close', () => {
                    console.log('socket.connect.close');
                    this._conn = null;
                    this._connected = false;
                    this._state = ReconnectorState.IDLE;
                    // Only attempt to reconnect if this isn't a manual disconnection.
                    if (this._reconnect && this._wantsConnection) {
                        console.log('attempting reconnect');
                        this._connect(options, true);
                    }
                });
                console.log('socket.connect.ready');
                try {
                    this._conn = conn;
                    this._connected = true;
                    this._state = ReconnectorState.CONNECTED;
                    this.emit('connected', conn);
                }
                finally {
                    console.log('socket.connect resolved');
                    resolve(conn);
                }
            })
                // These events handle the first reconnection.
                // After a connection is made, we want to remove them.
                .once('error', onError)
                .once('close', onClose);
        });
        try {
            const conn = await this._connectAttemptPromise;
            return conn;
        }
        finally {
            this._connectAttemptPromise = null;
        }
    }
    async disconnect() {
        this._wantsConnection = false;
        console.log('reconnector.disconnect');
        const curState = this._state;
        console.log('reconnector state: ' + curState);
        if (curState === ReconnectorState.IDLE) {
            return Promise.resolve(null);
        }
        if (curState === ReconnectorState.DISCONNECTING) {
            if (this._disconnectPromise === null) {
                // This should never happen.
                // It is likely a race condition with reconnector implementation.
                throw new Error(`Reconnector state is 'DISCONNECTING' but disconnect promise was not set`);
            }
            return this._disconnectPromise;
        }
        if (curState === ReconnectorState.CONNECTING || curState === ReconnectorState.RECONNECTING) {
            // We try not distrupting an ongoing network connection attempt.
            // If one is ongoing, wait until its finished before disconnecting.
            if (this._connectAttemptPromise) {
                console.log('waiting for ongoing connection attempt');
                await this._connectAttemptPromise;
                console.log('attempting disconnect again');
                return this.disconnect();
            }
            // If we were not in the middle of an ongoing network connection attempt,
            // we can simply set the state and exit immediately.
            // After the connection function finishes sleeping it'll see that
            // it is no longer valid and return.
            this._state = ReconnectorState.IDLE;
            return null;
        }
        this._state = ReconnectorState.DISCONNECTING;
        console.log('disconnecting');
        this._disconnectPromise = (async () => {
            try {
                console.log('reconnector waiting for closeConnection');
                const lastError = await this._closeConnection();
                console.log('reconnector closeConnection resolved');
                return lastError;
            }
            finally {
                this._disconnectPromise = null;
            }
        })();
        return this._disconnectPromise;
    }
    _closeConnection() {
        const conn = this._conn;
        if (!conn) {
            // This should never happen.
            throw new Error(`Expected to have a connection to close`);
        }
        return new Promise(resolve => {
            let lastError = null;
            conn
                .on('error', (err) => lastError = err)
                .on('close', (hasError) => {
                // If by the time our connection is closed this._conn changed to a
                // different net.Socket instance we have a race condition somewhere.
                // Ignore if the connection changed to null since this can happen when
                // the connection drops unexpectedly. We should tolerate this change.
                if (this._conn !== conn && this._conn !== null) {
                    // This should never happen.
                    throw new Error(`Reconnector's connection changed while disconnecting`);
                }
                console.log('disconnect.close');
                this._conn = null;
                this._connected = false;
                this._state = ReconnectorState.IDLE;
                const result = hasError
                    ? (lastError || new Error('Unknown error while disconnecting'))
                    : null;
                resolve(result);
            })
                .end();
        });
    }
}
exports.Reconnector = Reconnector;
