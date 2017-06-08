"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var Runner = require("./runner");
var util = require("./util");
var Launch = (function () {
    function Launch() {
    }
    Launch.launch = function (localPackage) {
        var executableArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            executableArgs[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var dir, port, gameUid, args, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dir = localPackage.install_dir;
                        return [4 /*yield*/, util.findFreePort()];
                    case 1:
                        port = _b.sent();
                        console.log('port: ' + port);
                        gameUid = localPackage.id + '-' + localPackage.build.id;
                        args = [
                            '--port', port.toString(),
                            '--dir', dir,
                            '--game', gameUid,
                            'launch',
                        ];
                        args.push.apply(args, executableArgs);
                        _a = LaunchInstance.bind;
                        return [4 /*yield*/, Runner.Instance.launchNew(args)];
                    case 2: return [2 /*return*/, new (_a.apply(LaunchInstance, [void 0, _b.sent()]))()];
                }
            });
        });
    };
    Launch.launchReattach = function (port, pid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new LaunchInstance(new Runner.Instance(port, pid))];
            });
        });
    };
    return Launch;
}());
exports.Launch = Launch;
var LaunchInstance = (function () {
    function LaunchInstance(runner) {
        this.runner = runner;
    }
    LaunchInstance.prototype.kill = function () {
        return this.runner.sendKillGame();
    };
    return LaunchInstance;
}());
//# sourceMappingURL=launcher.js.map