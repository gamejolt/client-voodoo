"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerWrapper = void 0;
const events_1 = require("./events");
class ControllerWrapper extends events_1.TSEventEmitter {
    constructor(controller) {
        super();
        this.controller = controller;
    }
    addListener(event, listener) {
        this.controller.addListener(event, listener);
        return this;
    }
    listeners(event) {
        return this.controller.listeners(event);
    }
    on(event, listener) {
        this.controller.on(event, listener);
        return this;
    }
    once(event, listener) {
        this.controller.once(event, listener);
        return this;
    }
    removeAllListeners(event) {
        this.controller.removeAllListeners(event);
        return this;
    }
    removeListener(event, listener) {
        this.controller.removeListener(event, listener);
        return this;
    }
}
exports.ControllerWrapper = ControllerWrapper;
