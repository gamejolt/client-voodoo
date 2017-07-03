"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var net = require("net");
var events_1 = require("./events");
var util_1 = require("./util");
var Reconnector = (function (_super) {
    __extends(Reconnector, _super);
    function Reconnector(interval, timeout) {
        var _this = _super.call(this) || this;
        _this.interval = interval;
        _this.timeout = timeout;
        _this._connected = false;
        return _this;
    }
    Object.defineProperty(Reconnector.prototype, "connected", {
        get: function () {
            return this._connected;
        },
        enumerable: true,
        configurable: true
    });
    Reconnector.prototype.connect = function (options) {
        var _this = this;
        // If already connected return the current connection.
        // Note: This will also return if we're in the process of disconnecting.
        if (this._connected) {
            return Promise.resolve(this.conn);
        }
        // If we're in the process of connecting, return
        if (this.connectPromise) {
            return this.connectPromise;
        }
        this.connectPromise = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var startTime, i, _a, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        i = 1;
                        _b.label = 1;
                    case 1:
                        if (!true)
                            return [3 /*break*/, 8];
                        this.emit('attempt', i);
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        _a = this;
                        return [4 /*yield*/, this.attempt(options)];
                    case 3:
                        _a.conn = _b.sent();
                        this._connected = true;
                        this.connectPromise = null;
                        return [2 /*return*/, resolve(this.conn)];
                    case 4:
                        err_1 = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        if (Date.now() - startTime + this.interval > this.timeout) {
                            return [2 /*return*/, reject(new Error("Couldn't connect in time"))];
                        }
                        return [4 /*yield*/, util_1.sleep(this.interval)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 1];
                    case 8: return [2 /*return*/];
                }
            });
        }); });
        return this.connectPromise;
    };
    Reconnector.prototype.attempt = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var lastErr = null;
            var conn = net
                .connect(options)
                .on('connect', function () {
                conn.removeAllListeners();
                conn.on('close', function () {
                    _this.conn = null;
                    _this._connected = false;
                });
                resolve(conn);
            })
                .on('error', function (err) { return (lastErr = err); })
                .on('close', function (hasError) {
                conn.removeAllListeners();
                if (hasError) {
                    reject(lastErr);
                }
            });
        });
    };
    Reconnector.prototype.disconnect = function () {
        var _this = this;
        if (!this._connected) {
            return Promise.resolve();
        }
        if (this.disconnectPromise) {
            return this.disconnectPromise;
        }
        this.disconnectPromise = new Promise(function (resolve) {
            var lastErr = null;
            _this.conn
                .on('error', function (err) { return (lastErr = err); })
                .on('close', function (hasError) {
                _this.conn = null;
                _this._connected = false;
                _this.disconnectPromise = null;
                if (hasError) {
                    return resolve(lastErr);
                }
                return resolve();
            })
                .end();
        });
        return this.disconnectPromise;
    };
    return Reconnector;
}(events_1.TSEventEmitter));
exports.Reconnector = Reconnector;
//# sourceMappingURL=reconnector.js.map