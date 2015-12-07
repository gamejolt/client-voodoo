"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var express = require('express');
var stream_speed_1 = require('../downloader/stream-speed');
var index_1 = require('./index');
var path = require('path');
describe('Patcher', function () {
    var _this = this;

    var app = undefined;
    var server = undefined;
    before(function (done) {
        app = express();
        app.use(express.static('../../test-files'));
        server = app.listen(1337, function () {
            done();
        });
    });
    after(function (done) {
        server.close(function () {
            done();
        });
        app = null;
        server = null;
    });
    it('Should work', function () {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
            var build, patchHandle;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            build = {
                                id: 1,
                                game_id: 1,
                                folder: 'test',
                                type: 'downloadable',
                                package: {
                                    id: 1,
                                    title: 'test',
                                    description: 'test'
                                },
                                release: {
                                    id: 1,
                                    version_number: '1.0.0'
                                },
                                file: {
                                    id: 1,
                                    filename: 'Bug_Bash.zip',
                                    filesize: 1,
                                    archive_type: 'brotli'
                                },
                                launch_options: [{
                                    id: 1,
                                    os: 'linux',
                                    executable_path: 'Bug_Bash.exe'
                                }],
                                os_windows: false,
                                os_windows_64: false,
                                os_mac: false,
                                os_mac_64: false,
                                os_linux: true,
                                os_linux_64: false,
                                os_other: false,
                                modified_on: 1,
                                install_dir: path.resolve(process.cwd(), path.join('test-files', 'games', 'game-test-1', 'build-1'))
                            };
                            patchHandle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', build, {
                                decompressInDownload: false
                            });

                            patchHandle.onDownloading(function () {
                                console.log('Downloading...');
                            }).onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + 'kbps');
                            }).onPatching(function () {
                                console.log('Patching...');
                            }).start();
                            return _context.abrupt("return", patchHandle.promise);

                        case 4:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));
    });
});
//# sourceMappingURL=index-spec.js.map
