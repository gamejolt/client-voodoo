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
var patcher_1 = require('../patcher');
var index_1 = require('./index');
var stream_speed_1 = require('../downloader/stream-speed');
var path = require('path');
var del = require('del');
describe('Launcher', function () {
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
    beforeEach(function () {
        return del('test-files/!(.gj-*)');
    });
    it('Should work', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
            var _this2 = this;

            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            _context2.prev = 0;
                            return _context2.delegateYield(_regenerator2.default.mark(function _callee() {
                                var build, patchHandle, launchHandle, launchInstance;
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
                                                        filename: 'GJGas.exe.tar.xz',
                                                        filesize: 1
                                                    },
                                                    archive_type: 'tar.xz',
                                                    launch_options: [{
                                                        id: 1,
                                                        os: 'linux',
                                                        executable_path: 'GJGas.exe'
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
                                                patchHandle = patcher_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
                                                    overwrite: true,
                                                    decompressInDownload: false
                                                });

                                                patchHandle.onDownloading(function () {
                                                    console.log('Downloading...');
                                                }).onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                                    console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                                    console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + 'kbps');
                                                }).onPatching(function () {
                                                    console.log('Patching...');
                                                }).start('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz');
                                                _context.next = 5;
                                                return patchHandle.promise;

                                            case 5:
                                                launchHandle = index_1.Launcher.launch(build, 'linux', '32');
                                                _context.next = 8;
                                                return launchHandle.promise;

                                            case 8:
                                                launchInstance = _context.sent;
                                                _context.next = 11;
                                                return new _promise2.default(function (resolve) {
                                                    return launchInstance.on('end', resolve);
                                                });

                                            case 11:
                                                done();

                                            case 12:
                                            case "end":
                                                return _context.stop();
                                        }
                                    }
                                }, _callee, _this2);
                            })(), "t0", 2);

                        case 2:
                            _context2.next = 7;
                            break;

                        case 4:
                            _context2.prev = 4;
                            _context2.t1 = _context2["catch"](0);

                            done(_context2.t1);

                        case 7:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this, [[0, 4]]);
        }));
    });
});
//# sourceMappingURL=index-spec.js.map
