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
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var patcher_1 = require("./patcher");
var path = require("path");
var launcher_1 = require("./launcher");
chai.use(chaiAsPromised);
// const expect = chai.expect;
describe('Patcher', function () {
    var _this = this;
    var mochaAsync = function (fn) {
        return function (done) { return __awaiter(_this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fn()];
                    case 1:
                        _a.sent();
                        done();
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        done(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    };
    // function wrapAll( promises: Promise<any>[] )
    // {
    // 	const result: Promise<{ success: boolean, value: any }>[] = [];
    // 	for ( let p of promises ) {
    // 		result.push( p
    // 			.then( ( value ) => { return { success: true, value: value } } )
    // 			.catch( ( err ) => { return { success: false, value: err } } )
    // 		);
    // 	}
    // 	return Promise.all( result );
    // }
    function sleep(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    }
    it('should do a patch', mochaAsync(function () { return __awaiter(_this, void 0, void 0, function () {
        var localPackage, launcher;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    localPackage = {
                        id: 119886,
                        title: 'test',
                        description: 'test',
                        release: {
                            id: 1,
                            version_number: '1.0.0',
                        },
                        build: {
                            id: 282275,
                            game_id: 42742,
                            folder: 'test',
                            type: 'downloadable',
                            archive_type: 'tar.xz',
                            os_windows: false,
                            os_windows_64: false,
                            os_mac: false,
                            os_mac_64: false,
                            os_linux: false,
                            os_linux_64: true,
                            os_other: false,
                            modified_on: 1,
                        },
                        file: {
                            id: 1,
                            filename: 'eggnoggplus-linux.tar.xz',
                            filesize: 1,
                        },
                        launch_options: [{
                                id: 1,
                                os: 'linux_64',
                                executable_path: 'eggnoggplus-linux/eggnoggplus',
                            }],
                        install_dir: path.resolve(process.cwd(), path.join('test-files', 'games', 'game-test-1', 'build-1')),
                    };
                    console.log('test');
                    return [4 /*yield*/, patcher_1.Patcher.patch(localPackage, {
                            runLater: true,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, sleep(5000)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, launcher_1.Launcher.launch(localPackage)];
                case 3:
                    launcher = _a.sent();
                    launcher.on('gameOver', function () {
                        console.log('eyyy');
                    });
                    return [4 /*yield*/, sleep(10000)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }));
});
//# sourceMappingURL=patcher.test.js.map