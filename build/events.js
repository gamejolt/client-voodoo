"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var TSEventEmitter = (function (_super) {
    __extends(TSEventEmitter, _super);
    function TSEventEmitter() {
        return _super.call(this) || this;
    }
    TSEventEmitter.prototype.addListener = function (event, listener) {
        return _super.prototype.addListener.call(this, event, listener);
    };
    TSEventEmitter.prototype.listeners = function (event) {
        return _super.prototype.listeners.call(this, event);
    };
    TSEventEmitter.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    TSEventEmitter.prototype.once = function (event, listener) {
        return _super.prototype.once.call(this, event, listener);
    };
    TSEventEmitter.prototype.removeAllListeners = function (event) {
        return _super.prototype.removeAllListeners.call(this, event);
    };
    TSEventEmitter.prototype.removeListener = function (event, listener) {
        return _super.prototype.removeListener.call(this, event, listener);
    };
    return TSEventEmitter;
}(events_1.EventEmitter));
exports.TSEventEmitter = TSEventEmitter;
//# sourceMappingURL=events.js.map