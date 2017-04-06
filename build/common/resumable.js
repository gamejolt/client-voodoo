"use strict";
(function (State) {
    State[State["STARTED"] = 0] = "STARTED";
    State[State["STARTING"] = 1] = "STARTING";
    State[State["STOPPED"] = 2] = "STOPPED";
    State[State["STOPPING"] = 3] = "STOPPING";
    State[State["FINISHED"] = 4] = "FINISHED";
})(exports.State || (exports.State = {}));
var State = exports.State;
var Resumable = (function () {
    function Resumable() {
        this._currentState = State.STOPPED;
        this._wantsStart = false;
        this._startCbs = new Set();
        this._stopCbs = new Set();
    }
    Object.defineProperty(Resumable.prototype, "state", {
        get: function () {
            return this._currentState;
        },
        enumerable: true,
        configurable: true
    });
    Resumable.prototype.start = function (cb, force) {
        var _this = this;
        this._wantsStart = true;
        if (this._currentState === State.STARTING || this._currentState === State.STARTED) {
            this._stopCbs.clear();
            return undefined;
        }
        this._startCbs.add(cb);
        if (!this._waitForStop) {
            this._waitForStop = new Promise(function (resolve) {
                _this._waitForStopResolver = resolve;
            }).then(function () {
                if (_this._currentState === State.FINISHED) {
                    return;
                }
                _this._currentState = State.STARTING;
                _this._waitForStop = null;
                _this._waitForStopResolver = null;
                var cbCount = _this._startCbs.size;
                var values = [];
                _this._startCbs.forEach(function (_cb) { return values.push(_cb); });
                for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                    var _cb = values_1[_i];
                    _this._startCbs.delete(_cb);
                    _cb.cb.apply(_cb.context || _this, _cb.args);
                    cbCount -= 1;
                    if (!cbCount) {
                        break;
                    }
                }
            });
        }
        if (this._currentState === State.STOPPED || force) {
            this._waitForStopResolver();
        }
        return this._waitForStop;
    };
    Resumable.prototype.started = function () {
        if (this._waitForStart) {
            this._waitForStartResolver();
        }
        this._currentState = State.STARTED;
    };
    Resumable.prototype.stop = function (cb, force) {
        var _this = this;
        this._wantsStart = false;
        if (this._currentState === State.STOPPING || this._currentState === State.STOPPED) {
            this._startCbs.clear();
            return undefined;
        }
        this._stopCbs.add(cb);
        if (!this._waitForStart) {
            this._waitForStart = new Promise(function (resolve) {
                _this._waitForStartResolver = resolve;
            }).then(function () {
                if (_this._currentState === State.FINISHED) {
                    return;
                }
                _this._currentState = State.STOPPING;
                _this._waitForStart = null;
                _this._waitForStartResolver = null;
                var cbCount = _this._stopCbs.size;
                var values = [];
                _this._stopCbs.forEach(function (_cb) { return values.push(_cb); });
                for (var _i = 0, values_2 = values; _i < values_2.length; _i++) {
                    var _cb = values_2[_i];
                    _this._stopCbs.delete(_cb);
                    _cb.cb.apply(_cb.context || _this, _cb.args);
                    cbCount -= 1;
                    if (!cbCount) {
                        break;
                    }
                }
            });
        }
        if (this._currentState === State.STARTED || force) {
            this._waitForStartResolver();
        }
        return this._waitForStart;
    };
    Resumable.prototype.stopped = function () {
        if (this._waitForStop) {
            this._waitForStopResolver();
        }
        this._currentState = State.STOPPED;
    };
    Resumable.prototype.finished = function () {
        this._startCbs.clear();
        this._stopCbs.clear();
        this._currentState = State.FINISHED;
    };
    Resumable.prototype.checkContinue = function (cb, running) {
        var _this = this;
        if (this._wantsStart === running) {
            return Promise.resolve();
        }
        if (running) {
            return this.stop({ cb: function () { return _this.start(cb); } }, true);
        }
        else {
            return this.start({ cb: function () { return _this.stop(cb); } }, true);
        }
    };
    return Resumable;
}());
exports.Resumable = Resumable;
//# sourceMappingURL=resumable.js.map