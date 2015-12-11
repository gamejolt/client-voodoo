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
    var build = {
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
    var wait = function wait(millis) {
        return new _promise2.default(function (resolve) {
            return setTimeout(resolve, millis);
        });
    };
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
            var patchHandle;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            patchHandle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
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
                            return _context.abrupt("return", patchHandle.promise);

                        case 3:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));
    });
    it('Should be resumable after pausing right away', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
            var _this2 = this;

            return _regenerator2.default.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            _context4.prev = 0;
                            return _context4.delegateYield(_regenerator2.default.mark(function _callee3() {
                                var patchHandle;
                                return _regenerator2.default.wrap(function _callee3$(_context3) {
                                    while (1) {
                                        switch (_context3.prev = _context3.next) {
                                            case 0:
                                                patchHandle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
                                                    overwrite: true,
                                                    decompressInDownload: false
                                                });

                                                patchHandle.onDownloading(function () {
                                                    return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
                                                        return _regenerator2.default.wrap(function _callee2$(_context2) {
                                                            while (1) {
                                                                switch (_context2.prev = _context2.next) {
                                                                    case 0:
                                                                        console.log('Downloading...');
                                                                        console.log('Pausing...');
                                                                        _context2.next = 4;
                                                                        return patchHandle.stop();

                                                                    case 4:
                                                                        _context2.next = 6;
                                                                        return wait(5000);

                                                                    case 6:
                                                                        console.log('Resuming...');
                                                                        _context2.next = 9;
                                                                        return patchHandle.start();

                                                                    case 9:
                                                                    case "end":
                                                                        return _context2.stop();
                                                                }
                                                            }
                                                        }, _callee2, this);
                                                    }));
                                                }).onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                                    console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                                    console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + 'kbps');
                                                }).onPatching(function () {
                                                    console.log('Patching...');
                                                }).start('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz');
                                                _context3.next = 4;
                                                return patchHandle.promise;

                                            case 4:
                                                done();

                                            case 5:
                                            case "end":
                                                return _context3.stop();
                                        }
                                    }
                                }, _callee3, _this2);
                            })(), "t0", 2);

                        case 2:
                            _context4.next = 7;
                            break;

                        case 4:
                            _context4.prev = 4;
                            _context4.t1 = _context4["catch"](0);

                            done(_context4.t1);

                        case 7:
                        case "end":
                            return _context4.stop();
                    }
                }
            }, _callee4, this, [[0, 4]]);
        }));
    });
    it('Should be resumable after pausing while downloading', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee7() {
            var _this3 = this;

            return _regenerator2.default.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            _context7.prev = 0;
                            return _context7.delegateYield(_regenerator2.default.mark(function _callee6() {
                                var patchHandle;
                                return _regenerator2.default.wrap(function _callee6$(_context6) {
                                    while (1) {
                                        switch (_context6.prev = _context6.next) {
                                            case 0:
                                                patchHandle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
                                                    overwrite: true,
                                                    decompressInDownload: false
                                                });

                                                patchHandle.onDownloading(function () {
                                                    return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee5() {
                                                        return _regenerator2.default.wrap(function _callee5$(_context5) {
                                                            while (1) {
                                                                switch (_context5.prev = _context5.next) {
                                                                    case 0:
                                                                        console.log('Downloading...');
                                                                        _context5.next = 3;
                                                                        return wait(3000);

                                                                    case 3:
                                                                        console.log('Pausing...');
                                                                        _context5.next = 6;
                                                                        return patchHandle.stop();

                                                                    case 6:
                                                                        _context5.next = 8;
                                                                        return wait(5000);

                                                                    case 8:
                                                                        console.log('Resuming...');
                                                                        _context5.next = 11;
                                                                        return patchHandle.start();

                                                                    case 11:
                                                                    case "end":
                                                                        return _context5.stop();
                                                                }
                                                            }
                                                        }, _callee5, this);
                                                    }));
                                                }).onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                                    console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                                    console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + 'kbps');
                                                }).onPatching(function () {
                                                    console.log('Patching...');
                                                }).start('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz');
                                                _context6.next = 4;
                                                return patchHandle.promise;

                                            case 4:
                                                done();

                                            case 5:
                                            case "end":
                                                return _context6.stop();
                                        }
                                    }
                                }, _callee6, _this3);
                            })(), "t0", 2);

                        case 2:
                            _context7.next = 7;
                            break;

                        case 4:
                            _context7.prev = 4;
                            _context7.t1 = _context7["catch"](0);

                            done(_context7.t1);

                        case 7:
                        case "end":
                            return _context7.stop();
                    }
                }
            }, _callee7, this, [[0, 4]]);
        }));
    });
    it('Should be resumable after pausing right after downloading', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee10() {
            var _this4 = this;

            return _regenerator2.default.wrap(function _callee10$(_context10) {
                while (1) {
                    switch (_context10.prev = _context10.next) {
                        case 0:
                            _context10.prev = 0;
                            return _context10.delegateYield(_regenerator2.default.mark(function _callee9() {
                                var patchHandle;
                                return _regenerator2.default.wrap(function _callee9$(_context9) {
                                    while (1) {
                                        switch (_context9.prev = _context9.next) {
                                            case 0:
                                                patchHandle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
                                                    overwrite: false,
                                                    decompressInDownload: false
                                                });

                                                patchHandle.onDownloading(function () {
                                                    console.log('Downloading...');
                                                }).onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                                    console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                                    console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + 'kbps');
                                                }).onPatching(function () {
                                                    return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee8() {
                                                        return _regenerator2.default.wrap(function _callee8$(_context8) {
                                                            while (1) {
                                                                switch (_context8.prev = _context8.next) {
                                                                    case 0:
                                                                        console.log('Patching...');
                                                                        console.log('Pausing...');
                                                                        _context8.next = 4;
                                                                        return patchHandle.stop();

                                                                    case 4:
                                                                        console.log('Paused');
                                                                        _context8.next = 7;
                                                                        return wait(5000);

                                                                    case 7:
                                                                        console.log('Resuming...');
                                                                        _context8.next = 10;
                                                                        return patchHandle.start();

                                                                    case 10:
                                                                    case "end":
                                                                        return _context8.stop();
                                                                }
                                                            }
                                                        }, _callee8, this);
                                                    }));
                                                }).start('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz');
                                                _context9.next = 4;
                                                return patchHandle.promise;

                                            case 4:
                                                done();

                                            case 5:
                                            case "end":
                                                return _context9.stop();
                                        }
                                    }
                                }, _callee9, _this4);
                            })(), "t0", 2);

                        case 2:
                            _context10.next = 7;
                            break;

                        case 4:
                            _context10.prev = 4;
                            _context10.t1 = _context10["catch"](0);

                            done(_context10.t1);

                        case 7:
                        case "end":
                            return _context10.stop();
                    }
                }
            }, _callee10, this, [[0, 4]]);
        }));
    });
    it('Should be resumable after pausing in the middle of extracting', function (done) {
        return __awaiter(_this, void 0, _promise2.default, _regenerator2.default.mark(function _callee13() {
            var _this5 = this;

            return _regenerator2.default.wrap(function _callee13$(_context13) {
                while (1) {
                    switch (_context13.prev = _context13.next) {
                        case 0:
                            _context13.prev = 0;
                            return _context13.delegateYield(_regenerator2.default.mark(function _callee12() {
                                var patchHandle;
                                return _regenerator2.default.wrap(function _callee12$(_context12) {
                                    while (1) {
                                        switch (_context12.prev = _context12.next) {
                                            case 0:
                                                patchHandle = index_1.Patcher.patch('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
                                                    overwrite: false,
                                                    decompressInDownload: false
                                                });

                                                patchHandle.onDownloading(function () {
                                                    console.log('Downloading...');
                                                }).onProgress(stream_speed_1.SampleUnit.KBps, function (data) {
                                                    console.log('Download progress: ' + Math.floor(data.progress * 100) + '%');
                                                    console.log('Current speed: ' + Math.floor(data.sample.current) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor(data.sample.peak) + ' kbps, low: ' + Math.floor(data.sample.low) + ', average: ' + Math.floor(data.sample.average) + 'kbps');
                                                }).onPatching(function () {
                                                    return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee11() {
                                                        return _regenerator2.default.wrap(function _callee11$(_context11) {
                                                            while (1) {
                                                                switch (_context11.prev = _context11.next) {
                                                                    case 0:
                                                                        console.log('Patching...');
                                                                        _context11.next = 3;
                                                                        return wait(3000);

                                                                    case 3:
                                                                        // Might fail if the extraction finishes really fast. HMMM.
                                                                        console.log('Pausing...');
                                                                        _context11.next = 6;
                                                                        return patchHandle.stop();

                                                                    case 6:
                                                                        console.log('Paused');
                                                                        _context11.next = 9;
                                                                        return wait(5000);

                                                                    case 9:
                                                                        console.log('Resuming...');
                                                                        /* await */patchHandle.start(); // Dont await here before that makes you wait for the whole extraction to finish.

                                                                    case 11:
                                                                    case "end":
                                                                        return _context11.stop();
                                                                }
                                                            }
                                                        }, _callee11, this);
                                                    }));
                                                }).start('https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz');
                                                _context12.next = 4;
                                                return patchHandle.promise;

                                            case 4:
                                                done();

                                            case 5:
                                            case "end":
                                                return _context12.stop();
                                        }
                                    }
                                }, _callee12, _this5);
                            })(), "t0", 2);

                        case 2:
                            _context13.next = 7;
                            break;

                        case 4:
                            _context13.prev = 4;
                            _context13.t1 = _context13["catch"](0);

                            done(_context13.t1);

                        case 7:
                        case "end":
                            return _context13.stop();
                    }
                }
            }, _callee13, this, [[0, 4]]);
        }));
    });
});
//# sourceMappingURL=index-spec.js.map
