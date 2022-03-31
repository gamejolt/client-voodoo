"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSEventEmitter = void 0;
const EventEmitter = require("events");
class TSEventEmitter extends EventEmitter {
    constructor() {
        super();
    }
    addListener(event, listener) {
        return super.addListener(event + '', listener);
    }
    listeners(event) {
        return super.listeners(event + '');
    }
    on(event, listener) {
        return super.on(event + '', listener);
    }
    once(event, listener) {
        return super.once(event + '', listener);
    }
    removeAllListeners(event) {
        return super.removeAllListeners(event + '');
    }
    removeListener(event, listener) {
        return super.removeListener(event + '', listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
}
exports.TSEventEmitter = TSEventEmitter;
