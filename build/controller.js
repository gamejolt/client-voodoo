"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = exports.getExecutable = void 0;
const cp = require("child_process");
const path = require("path");
const events_1 = require("./events");
const reconnector2_1 = require("./reconnector2");
const fs_1 = require("./fs");
const logger_1 = require("./logger");
const JSONStream = require('JSONStream');
const ps = require('ps-node');
function getExecutable() {
    let executable = 'GameJoltRunner';
    if (process.platform === 'win32') {
        executable += '.exe';
    }
    return path.resolve(__dirname, '..', 'bin', executable);
}
exports.getExecutable = getExecutable;
class SentMessage {
    constructor(msg, timeout) {
        this.msg = JSON.stringify(msg);
        this.msgId = msg.msgId;
        // Initialize the result promise
        this._resultResolved = false;
        this.resultPromise = new Promise((resolve, reject) => {
            this.resultResolver = resolve;
            this.resultRejector = reject;
            if (timeout && timeout !== Infinity) {
                setTimeout(() => {
                    this._resultResolved = true;
                    reject(new Error('Message was not handled in time'));
                }, timeout);
            }
        });
        // Initialize the request promise
        this._requestResolved = false;
        this.requestPromise = new Promise((resolve, reject) => {
            this.requestResolver = resolve;
            this.requestRejector = reject;
            if (timeout && timeout !== Infinity) {
                setTimeout(() => {
                    this._requestResolved = true;
                    reject(new Error('Message was not sent in time'));
                }, timeout);
            }
        });
    }
    get resolved() {
        return this._resultResolved;
    }
    resolve(data_) {
        this._resultResolved = true;
        this.resultResolver(data_);
    }
    reject(reason) {
        this._resultResolved = true;
        this.resultRejector(reason);
    }
    get sent() {
        return this._requestResolved;
    }
    resolveSend() {
        this._requestResolved = true;
        this.requestResolver();
    }
    rejectSend(reason) {
        this.reject(reason);
        this._requestResolved = true;
        this.requestRejector(reason);
    }
}
class Controller extends events_1.TSEventEmitter {
    constructor(port, options) {
        super();
        this.conn = null;
        this._nextMessageId = -1;
        this.sequentialMessageId = false;
        this.sendQueue = [];
        this.sentMessage = null;
        this.consumingQueue = false;
        this.expectingQueuePauseIds = [];
        this.expectingQueueResumeIds = [];
        this.expectingQueuePause = 0;
        this.expectingQueueResume = 0;
        this.port = port;
        options = options || {};
        if (options.process) {
            this.process = options.process;
        }
        if (options.sequentialMessageId) {
            this.sequentialMessageId = true;
        }
        this.reconnector = new reconnector2_1.Reconnector({ interval: 100, timeout: 3000, reconnect: !!options.keepConnected });
        this.reconnector.on('connected', conn => {
            this.conn = conn;
            // Its possible the connection was aborted. If this is the case, do nothing.
            // TODO: add unit tests?
            if (!conn) {
                console.log('controller.connect connection aborted.');
                return;
            }
            conn.setKeepAlive(true, 1000);
            conn.setEncoding('utf8');
            conn.setNoDelay(true);
            let lastError = null;
            conn
                .on('error', (err) => lastError = err)
                .on('close', (hasError) => {
                var _a;
                // Avoid managing the connection if it is not the current connection.
                if (this.conn !== conn && this.conn !== null) {
                    return;
                }
                this.conn = null;
                if (this.sentMessage) {
                    this.sentMessage.reject(new Error(`Disconnected before receiving message response` +
                        (hasError ? `: ${(_a = lastError === null || lastError === void 0 ? void 0 : lastError.message) !== null && _a !== void 0 ? _a : 'Unknown error'}` : '')));
                }
                console.log(`Disconnected from runner` + (hasError ? `: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}` : ''));
                if (hasError) {
                    console.log(lastError);
                }
                if (this.reconnector.wantsConnection) {
                    this.emit('fatal', hasError
                        ? (lastError || new Error('Unknown error while receiving unexpected disconnection'))
                        : new Error(`Unexpected disconnection from joltron`));
                }
                this.emit('close');
            })
                .pipe(this.newJsonStream());
        });
    }
    nextMessageId() {
        if (this.sequentialMessageId) {
            this._nextMessageId++;
        }
        else {
            this._nextMessageId = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
        }
        return this._nextMessageId.toString();
    }
    newJsonStream() {
        return JSONStream.parse()
            .on('data', data_ => {
            console.log('Received json: ' + JSON.stringify(data_));
            let payload, type;
            if (data_.msgId && this.sentMessage && data_.msgId === this.sentMessage.msgId) {
                let idx = this.expectingQueuePauseIds.indexOf(this.sentMessage.msgId);
                if (idx !== -1) {
                    this.expectingQueuePauseIds.splice(idx);
                    this.expectingQueuePause++;
                }
                idx = this.expectingQueueResumeIds.indexOf(this.sentMessage.msgId);
                if (idx !== -1) {
                    this.expectingQueueResumeIds.splice(idx);
                    this.expectingQueueResume++;
                }
                payload = data_.payload;
                if (!payload) {
                    return this.sentMessage.reject(new Error('Missing `payload` field in response' +
                        ' in ' +
                        JSON.stringify(data_)));
                }
                type = data_.type;
                if (!type) {
                    return this.sentMessage.reject(new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data_)));
                }
                switch (type) {
                    case 'state':
                        return this.sentMessage.resolve(payload);
                    case 'result':
                        if (payload.success) {
                            return this.sentMessage.resolve(payload);
                        }
                        return this.sentMessage.reject(new Error(payload.err));
                    default:
                        return this.sentMessage.reject(new Error('Unexpected `type` value: ' +
                            type +
                            ' in ' +
                            JSON.stringify(data_)));
                }
            }
            type = data_.type;
            if (!type) {
                return this.emit('err', new Error('Missing `type` field in response' + ' in ' + JSON.stringify(data_)));
            }
            payload = data_.payload;
            if (!payload) {
                return this.emit('err', new Error('Missing `payload` field in response' + ' in ' + JSON.stringify(data_)));
            }
            switch (type) {
                case 'update':
                    const message = payload.message;
                    payload = payload.payload; // lol
                    switch (message) {
                        case 'gameLaunchBegin':
                            return this.emit(message, payload.dir, ...payload.args);
                        case 'gameLaunchFinished':
                            return this.emit(message);
                        case 'gameLaunchFailed':
                            return this.emit(message, payload);
                        case 'gameCrashed':
                            return this.emit(message, payload);
                        case 'gameClosed':
                            return this.emit(message);
                        case 'gameKilled':
                            return this.emit(message);
                        case 'gameRelaunchBegin':
                            return this.emit(message, payload.dir, ...payload.args);
                        case 'gameRelaunchFailed':
                            return this.emit(message, payload);
                        case 'noUpdateAvailable':
                            return this.emit(message);
                        case 'updateAvailable':
                            return this.emit(message, payload);
                        case 'updateBegin':
                            return this.emit(message, payload.dir, payload.metadata);
                        case 'updateFinished':
                            return this.emit(message);
                        case 'updateReady':
                            return this.emit(message);
                        case 'updateApply':
                            return this.emit(message, ...payload.args);
                        case 'updateFailed':
                            return this.emit(message, payload);
                        case 'paused':
                            if (this.expectingQueuePause > 0) {
                                this.expectingQueuePause--;
                                return this.emit(message, true);
                            }
                            return this.emit(message, false);
                        case 'resumed':
                            if (this.expectingQueueResume > 0) {
                                this.expectingQueueResume--;
                                return this.emit(message, true);
                            }
                            return this.emit(message, false);
                        case 'canceled':
                            return this.emit(message);
                        case 'openRequested':
                            return this.emit(message);
                        case 'uninstallBegin':
                            return this.emit(message, payload);
                        case 'uninstallFailed':
                            return this.emit(message, payload);
                        case 'uninstallFinished':
                            return this.emit(message);
                        case 'rollbackBegin':
                            return this.emit(message, payload);
                        case 'rollbackFailed':
                            return this.emit(message, payload);
                        case 'rollbackFinished':
                            return this.emit(message);
                        case 'patcherState':
                            return this.emit(message, payload);
                        case 'log':
                            let logLevel = payload.level;
                            switch (logLevel) {
                                case 'fatal':
                                    logLevel = 'error';
                                // tslint:disable-next-line:no-switch-case-fall-through
                                case 'error':
                                case 'warn':
                                case 'info':
                                case 'debug':
                                case 'trace':
                                    console[logLevel](`[joltron - ${payload.level}] ${payload.message}`);
                                    return;
                                default:
                                    console.log(`[joltron - info] ${payload.message}`);
                                    return;
                            }
                        case 'abort':
                            return this.emit('fatal', new Error(payload));
                        case 'error':
                            return this.emit('err', new Error(payload));
                        default:
                            return this.emit('err', new Error('Unexpected update `message` value: ' +
                                message +
                                ' in ' +
                                JSON.stringify(data_)));
                    }
                case 'progress':
                    return this.emit('progress', payload);
                default:
                    return this.emit('err', new Error('Unexpected `type` value: ' + type + ' in ' + JSON.stringify(data_)));
            }
        })
            .on('error', err => {
            console.error('json stream encountered an error: ' + err.message);
            console.error(err);
            this.emit('fatal', err);
            this.dispose();
        });
    }
    static async ensureMigrationFile(localPackage) {
        const migration = {
            version0: {
                packageId: localPackage.id,
                buildId: localPackage.build.id,
                executablePath: localPackage.executablePath,
            },
        };
        if (localPackage.update) {
            migration.version0.updateId = localPackage.update.id;
            migration.version0.updateBuildId = localPackage.update.build.id;
        }
        try {
            await fs_1.default.writeFile(path.join(localPackage.install_dir, '..', '.migration-' + path.basename(localPackage.install_dir)), JSON.stringify(migration));
        }
        catch (err) {
            // We don't care if this fails because if the game directory doesn't exist we don't need a .migration file.
        }
    }
    static async launchNew(args, options) {
        let joltronLogs = true;
        let joltronOut = null;
        let joltronErr = null;
        let joltronOutLogger = null;
        let joltronErrLogger = null;
        try {
            joltronOut = await fs_1.default.createTempFile('joltron-', 'out');
            joltronErr = await fs_1.default.createTempFile('joltron-', 'err');
            joltronOutLogger = logger_1.Logger.createLoggerFromFile(joltronOut.name, 'joltron', 'info');
            joltronErrLogger = logger_1.Logger.createLoggerFromFile(joltronErr.name, 'joltron', 'error');
            console.log(`Logging joltron output to "${joltronOut.name}" and "${joltronErr.name}"`);
        }
        catch (e) {
            console.warn('Failed to make temp log files for joltron. Logs from joltron will be disabled:', e);
            joltronLogs = false;
        }
        try {
            options = options || {
                detached: true,
                env: process.env,
                stdio: joltronLogs ? ['ignore', joltronOut.fd, joltronErr.fd] : 'ignore',
            };
            let runnerExecutable = getExecutable();
            // Ensure that the runner is executable.
            await fs_1.default.chmod(runnerExecutable, '0755');
            const portArg = args.indexOf('--port');
            if (portArg === -1) {
                throw new Error(`Can't launch a new instance without specifying a port number`);
            }
            const port = parseInt(args[portArg + 1], 10);
            console.log('Spawning ' + runnerExecutable + ' "' + args.join('" "') + '"');
            const runnerProc = cp.spawn(runnerExecutable, args, options);
            runnerProc.unref();
            const runnerInstance = new Controller(port, {
                process: runnerProc.pid,
                keepConnected: !!options.keepConnected,
            });
            runnerInstance.connect();
            runnerInstance.on('close', () => {
                if (joltronLogs) {
                    joltronOutLogger.unwatch();
                    joltronErrLogger.unwatch();
                    joltronLogs = false;
                }
            });
            return runnerInstance;
        }
        catch (e) {
            if (joltronLogs) {
                joltronOutLogger.unwatch();
                joltronErrLogger.unwatch();
                joltronLogs = false;
            }
            throw e;
        }
    }
    get connected() {
        return this.reconnector.connected;
    }
    async connect() {
        try {
            console.log('controller.connect waiting for reconnector.connect');
            await this.reconnector.connect({ port: this.port });
            console.log('controller.connect is connected');
            this.consumeSendQueue();
        }
        catch (err) {
            console.log('Failed to connect in reconnector: ' + err.message);
            this.emit('fatal', err);
            this.emit('close');
            throw err;
        }
    }
    disconnect() {
        console.log('doing reconnector.disconnect');
        return this.reconnector.disconnect();
    }
    async dispose() {
        console.log('waiting for disconnect');
        await this.disconnect();
        this.reconnector.removeAllListeners();
    }
    async consumeSendQueue() {
        var _a;
        if (this.consumingQueue) {
            return;
        }
        this.consumingQueue = true;
        while ((this.sentMessage = (_a = this.sendQueue.shift()) !== null && _a !== void 0 ? _a : null)) {
            if (this.sentMessage.resolved) {
                this.sentMessage = null;
                continue;
            }
            // TODO: original code was checking connectionLock. why?
            // if (!this.connected || this.connectionLock) {
            if (!this.connected) {
                this.sentMessage.reject(new Error('Not connected'));
                this.sentMessage = null;
                continue;
            }
            await new Promise((resolve, reject) => {
                if (!this.conn) {
                    throw new Error('Connection closed before we could consume the send queue');
                }
                this.conn.write(this.sentMessage.msg, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            }).catch(err => {
                this.sentMessage.rejectSend(err);
            });
            this.sentMessage.resolveSend();
            try {
                await this.sentMessage.resultPromise;
            }
            catch (err) { }
            this.sentMessage = null;
        }
        this.consumingQueue = false;
    }
    send(type, payload, timeout) {
        const msgData = {
            type: type,
            msgId: this.nextMessageId(),
            payload: payload,
        };
        console.log('Sending ' + JSON.stringify(msgData));
        const msg = new SentMessage(msgData, timeout);
        this.sendQueue.push(msg);
        if (this.connected) {
            this.consumeSendQueue();
        }
        return msg;
    }
    sendControl(command, extraData, timeout) {
        const msg = { command };
        if (extraData && Object.keys(extraData).length !== 0) {
            msg.extraData = extraData;
        }
        return this.send('control', msg, timeout);
    }
    sendKillGame(timeout) {
        return this.sendControl('kill', undefined, timeout).resultPromise;
    }
    async sendPause(options) {
        options = options || {};
        const msg = this.sendControl('pause', undefined, options.timeout);
        if (options.queue) {
            this.expectingQueuePauseIds.push(msg.msgId);
        }
        return msg.resultPromise;
    }
    async sendResume(options) {
        options = options || {};
        let extraData = {};
        if (options.authToken) {
            extraData.authToken = options.authToken;
        }
        if (options.extraMetadata) {
            extraData.extraMetadata = options.extraMetadata;
        }
        const msg = this.sendControl('resume', extraData, options.timeout);
        if (options.queue) {
            this.expectingQueueResumeIds.push(msg.msgId);
        }
        return msg.resultPromise;
    }
    sendCancel(timeout, waitOnlyForSend) {
        const msg = this.sendControl('cancel', undefined, timeout);
        return waitOnlyForSend ? msg.requestPromise : msg.resultPromise;
    }
    sendGetState(includePatchInfo, timeout) {
        return this.send('state', { includePatchInfo }, timeout)
            .resultPromise;
    }
    sendCheckForUpdates(gameUID, platformURL, authToken, metadata, timeout) {
        let payload = { gameUID, platformURL };
        if (authToken) {
            payload.authToken = authToken;
        }
        if (metadata) {
            payload.metadata = metadata;
        }
        return this.send('checkForUpdates', payload, timeout).resultPromise;
    }
    sendUpdateAvailable(updateMetadata, timeout) {
        return this.send('updateAvailable', updateMetadata, timeout).resultPromise;
    }
    sendUpdateBegin(timeout) {
        return this.send('updateBegin', {}, timeout).resultPromise;
    }
    sendUpdateApply(env, args, timeout) {
        return this.send('updateApply', { env, args }, timeout)
            .resultPromise;
    }
    kill() {
        if (this.process) {
            return new Promise((resolve, reject) => {
                if (typeof this.process === 'number') {
                    ps.kill(this.process, err => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                }
                else {
                    this.process.once('close', resolve).once('error', reject);
                    this.process.kill();
                }
            });
        }
        return Promise.resolve();
    }
}
exports.Controller = Controller;
