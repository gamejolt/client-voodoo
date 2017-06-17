"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("./events");
var ControllerWrapper = (function (_super) {
    __extends(ControllerWrapper, _super);
    function ControllerWrapper(controller) {
        var _this = _super.call(this) || this;
        _this.controller = controller;
        return _this;
    }
    ControllerWrapper.prototype.addListener = function (event, listener) {
        this.controller.addListener(event, listener);
        return this;
    };
    ControllerWrapper.prototype.listeners = function (event) {
        return this.controller.listeners(event);
    };
    ControllerWrapper.prototype.on = function (event, listener) {
        this.controller.on(event, listener);
        return this;
    };
    ControllerWrapper.prototype.once = function (event, listener) {
        this.controller.once(event, listener);
        return this;
    };
    ControllerWrapper.prototype.removeAllListeners = function (event) {
        this.controller.removeAllListeners(event);
        return this;
    };
    ControllerWrapper.prototype.removeListener = function (event, listener) {
        this.controller.removeListener(event, listener);
        return this;
    };
    return ControllerWrapper;
}(events_1.TSEventEmitter));
exports.ControllerWrapper = ControllerWrapper;
//# sourceMappingURL=controller-wrapper.js.map