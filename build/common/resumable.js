"use strict";

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
        (0, _classCallCheck3.default)(this, Resumable);

        this._currentState = State.STOPPED;
        this._wantsStart = false;
        this._startCbs = new _set2.default();
        this._stopCbs = new _set2.default();
    }

    (0, _createClass3.default)(Resumable, [{
        key: "start",
        value: function start(cb, force) {
            var _this = this;

            this._wantsStart = true;
            if (this._currentState === State.STARTING || this._currentState === State.STARTED) {
                this._stopCbs.clear();
                return;
            }
            this._startCbs.add(cb);
            if (!this._waitForStop) {
                this._waitForStop = new _promise2.default(function (resolve) {
                    _this._waitForStopResolver = resolve;
                }).then(function () {
                    if (_this._currentState === State.FINISHED) {
                        return;
                    }
                    _this._currentState = State.STARTING;
                    _this._waitForStop = null;
                    _this._waitForStopResolver = null;
                    var cbCount = _this._startCbs.size;
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = (0, _getIterator3.default)(_this._startCbs.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var _cb = _step.value;

                            _this._startCbs.delete(_cb);
                            _cb.cb.apply(_cb.context || _this, _cb.args);
                            cbCount -= 1;
                            if (!cbCount) {
                                break;
                            }
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                });
            }
            if (this._currentState === State.STOPPED || force) {
                this._waitForStopResolver();
            }
            return this._waitForStop;
        }
    }, {
        key: "started",
        value: function started() {
            if (this._waitForStart) {
                this._waitForStartResolver();
            }
            this._currentState = State.STARTED;
        }
    }, {
        key: "stop",
        value: function stop(cb, force) {
            var _this2 = this;

            this._wantsStart = false;
            if (this._currentState === State.STOPPING || this._currentState === State.STOPPED) {
                this._startCbs.clear();
                return;
            }
            this._stopCbs.add(cb);
            if (!this._waitForStart) {
                this._waitForStart = new _promise2.default(function (resolve) {
                    _this2._waitForStartResolver = resolve;
                }).then(function () {
                    if (_this2._currentState === State.FINISHED) {
                        return;
                    }
                    _this2._currentState = State.STOPPING;
                    _this2._waitForStart = null;
                    _this2._waitForStartResolver = null;
                    var cbCount = _this2._stopCbs.size;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = (0, _getIterator3.default)(_this2._stopCbs.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var _cb = _step2.value;

                            _this2._stopCbs.delete(_cb);
                            _cb.cb.apply(_cb.context || _this2, _cb.args);
                            cbCount -= 1;
                            if (!cbCount) {
                                break;
                            }
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                });
            }
            if (this._currentState === State.STARTED || force) {
                this._waitForStartResolver();
            }
            return this._waitForStart;
        }
    }, {
        key: "stopped",
        value: function stopped() {
            if (this._waitForStop) {
                this._waitForStopResolver();
            }
            this._currentState = State.STOPPED;
        }
    }, {
        key: "finished",
        value: function finished() {
            this._startCbs.clear();
            this._stopCbs.clear();
            this._currentState = State.FINISHED;
        }
    }, {
        key: "checkContinue",
        value: function checkContinue(_cb2, running) {
            var _this3 = this;

            if (this._wantsStart === running) {
                return _promise2.default.resolve();
            }
            if (running) {
                return this.stop({ cb: function cb() {
                        _this3.start(_cb2);
                    } }, true);
            } else {
                return this.start({ cb: function cb() {
                        _this3.stop(_cb2);
                    } }, true);
            }
        }
    }, {
        key: "state",
        get: function get() {
            return this._currentState;
        }
    }]);
    return Resumable;
})();

exports.Resumable = Resumable;
//# sourceMappingURL=resumable.js.map
