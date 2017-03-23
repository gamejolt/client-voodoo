"use strict";
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
var path = require("path");
var common_1 = require("../common");
var xdgBasedir = require('xdg-basedir');
var Winreg = require('winreg');
var Bluebird = require('bluebird');
var applescript = Bluebird.promisify(require('applescript').execString);
var shellEscape = require('shell-escape');
var autostartId = 'GameJoltClient';
var WindowsAutostarter = (function () {
    function WindowsAutostarter() {
    }
    WindowsAutostarter.getKey = function () {
        return new Winreg({
            hive: Winreg.HKCU,
            key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        });
    };
    WindowsAutostarter.prototype.set = function (program, args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        WindowsAutostarter.getKey().set(autostartId, Winreg.REG_SZ, "\"" + program + "\"" + ((args && args.length) ? " " + args.join(' ') : ''), resolve);
                    })];
            });
        });
    };
    WindowsAutostarter.prototype.unset = function () {
        return new Promise(function (resolve) {
            WindowsAutostarter.getKey().remove(autostartId, resolve);
        });
    };
    WindowsAutostarter.prototype.isset = function () {
        return new Promise(function (resolve) {
            WindowsAutostarter.getKey().get(autostartId, function (err, item) {
                resolve(!!item);
            });
        });
    };
    return WindowsAutostarter;
}());
var LinuxAutostarter = (function () {
    function LinuxAutostarter() {
    }
    LinuxAutostarter.prototype.createRunner = function (program, runner, args) {
        return __awaiter(this, void 0, void 0, function () {
            var runnerScript;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runnerScript = "#!/bin/bash\nif [ -e \"" + program + "\" ]; then\n\t" + shellEscape([program].concat(args || [])) + "\nfi";
                        return [4 /*yield*/, common_1.default.fsWriteFile(runner, runnerScript)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, common_1.default.chmod(runner, '0755')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LinuxAutostarter.prototype.set = function (program, args, runner) {
        return __awaiter(this, void 0, void 0, function () {
            var desktopContents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createRunner(program, runner, args)];
                    case 1:
                        _a.sent();
                        desktopContents = "[Desktop Entry]\nVersion=1.0\nType=Application\nName=Game Jolt Client\nGenericName=Game Client\nComment=The power of Game Jolt website in your desktop\nExec=" + shellEscape([runner]) + "\nTerminal=false\nCategories=Game;\nKeywords=Play;GJ;GameJolt;\nHidden=false\nName[en_US]=Game Jolt Client\nTX-GNOME-Autostart-enabled=true";
                        return [4 /*yield*/, common_1.default.fsWriteFile(LinuxAutostarter.desktopFilePath, desktopContents)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, common_1.default.chmod(LinuxAutostarter.desktopFilePath, '0755')];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LinuxAutostarter.prototype.unset = function () {
        return common_1.default.fsUnlink(LinuxAutostarter.desktopFilePath);
    };
    LinuxAutostarter.prototype.isset = function () {
        return common_1.default.fsExists(LinuxAutostarter.desktopFilePath);
    };
    return LinuxAutostarter;
}());
LinuxAutostarter.desktopFilePath = path.join(xdgBasedir.config, 'autostart', autostartId + ".desktop");
var MacAutostarter = (function () {
    function MacAutostarter() {
    }
    MacAutostarter.prototype.createRunner = function (program, runner, args) {
        return __awaiter(this, void 0, void 0, function () {
            var runnerScript;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runnerScript = "#!/bin/bash\nif [ -e \"" + program + "\" ]; then\n\t" + shellEscape([program].concat(args || [])) + "\nfi";
                        return [4 /*yield*/, common_1.default.fsWriteFile(runner, runnerScript)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, common_1.default.chmod(runner, '0755')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MacAutostarter.prototype.set = function (program, args, runner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createRunner(program, runner, args)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, applescript("tell application \"System Events\" to make login item at end with properties {path:\"" + runner + "\", hidden:false, name:\"" + autostartId + "\"}")];
                }
            });
        });
    };
    MacAutostarter.prototype.unset = function (runner) {
        return applescript("tell application \"System Events\" to delete every login item whose name is \"" + autostartId + "\"");
    };
    MacAutostarter.prototype.isset = function () {
        return applescript('tell application "System Events" to get the name of every login item').then(function (loginItems) {
            return (loginItems && loginItems.indexOf(autostartId) !== -1);
        });
    };
    return MacAutostarter;
}());
var Autostarter = (function () {
    function Autostarter() {
    }
    Object.defineProperty(Autostarter, "autostarter", {
        get: function () {
            switch (process.platform) {
                case 'win32':
                    return this.winAutostarter;
                case 'linux':
                    return this.linuxAutostarter;
                case 'darwin':
                    return this.macAutostarter;
            }
            throw new Error('Invalid OS');
        },
        enumerable: true,
        configurable: true
    });
    Autostarter.set = function (path, args, runner) {
        var _this = this;
        return this.unset(path)
            .then(function () { return _this.autostarter.set(path, args, runner); });
    };
    Autostarter.unset = function (runner) {
        var _this = this;
        return this.isset()
            .then(function (isset) {
            if (isset) {
                return _this.autostarter.unset(runner);
            }
            return undefined;
        });
    };
    Autostarter.isset = function () {
        return this.autostarter.isset();
    };
    return Autostarter;
}());
exports.Autostarter = Autostarter;
Autostarter.winAutostarter = new WindowsAutostarter();
Autostarter.linuxAutostarter = new LinuxAutostarter();
Autostarter.macAutostarter = new MacAutostarter();
//# sourceMappingURL=index.js.map