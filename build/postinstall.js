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
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var controller_1 = require("./controller");
var joltronVersion = 'v2.2.2-beta';
var https = require('follow-redirects').https;
function doTheThing() {
    return __awaiter(this, void 0, void 0, function () {
        var executable, binDir, file, remoteExecutable, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    executable = controller_1.getExecutable();
                    binDir = path.dirname(executable);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            mkdirp(binDir, function (err) {
                                if (err) {
                                    return reject(err);
                                }
                                return resolve();
                            });
                        })];
                case 1:
                    _a.sent();
                    file = fs.createWriteStream(executable, { mode: 493 });
                    switch (process.platform) {
                        case 'win32':
                            remoteExecutable = 'joltron_win32.exe';
                            break;
                        case 'linux':
                            remoteExecutable = 'joltron_linux';
                            break;
                        case 'darwin':
                            remoteExecutable = 'joltron_osx';
                            break;
                    }
                    options = {
                        host: 'github.com',
                        path: "/gamejolt/joltron/releases/download/" + joltronVersion + "/" + remoteExecutable,
                    };
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            https
                                .get(options, function (res) {
                                if (res.statusCode !== 200) {
                                    throw new Error("Invalid status code. Expected 200 got " + res.statusCode);
                                }
                                res.pipe(file);
                            })
                                .on('error', reject)
                                .on('end', function () { return resolve; })
                                .end();
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
doTheThing();
