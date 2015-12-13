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
describe('Stream awaiter', function () {
    it('should complete simple function calls', function (done) {
        function test() {
            return 5;
        }
        for (var i = 0; i < 100000; i += 1) {
            test();
        }
        done();
    });
    it('should complete promise function calls', function (done) {
        function test() {
            return new _promise2.default(function (resolve) {
                return resolve(5);
            });
        }
        var promise = test();
        for (var i = 1; i < 100000; i += 1) {
            promise = promise.then(function () {
                return test();
            });
        }
        promise.then(function () {
            return done();
        });
    });
    it('should complete simple await function calls', function (done) {
        return __awaiter(undefined, void 0, _promise2.default, _regenerator2.default.mark(function _callee2() {
            var test, i;
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            test = function test() {
                                return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                                    return _regenerator2.default.wrap(function _callee$(_context) {
                                        while (1) {
                                            switch (_context.prev = _context.next) {
                                                case 0:
                                                    return _context.abrupt("return", 5);

                                                case 1:
                                                case "end":
                                                    return _context.stop();
                                            }
                                        }
                                    }, _callee, this);
                                }));
                            };

                            i = 0;

                        case 2:
                            if (!(i < 100000)) {
                                _context2.next = 8;
                                break;
                            }

                            _context2.next = 5;
                            return test();

                        case 5:
                            i += 1;
                            _context2.next = 2;
                            break;

                        case 8:
                            done();

                        case 9:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));
    });
    it('should complete promise await function calls', function (done) {
        return __awaiter(undefined, void 0, _promise2.default, _regenerator2.default.mark(function _callee4() {
            var test, _i;

            return _regenerator2.default.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            test = function test() {
                                return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee3() {
                                    return _regenerator2.default.wrap(function _callee3$(_context3) {
                                        while (1) {
                                            switch (_context3.prev = _context3.next) {
                                                case 0:
                                                    return _context3.abrupt("return", new _promise2.default(function (resolve) {
                                                        return resolve(5);
                                                    }));

                                                case 1:
                                                case "end":
                                                    return _context3.stop();
                                            }
                                        }
                                    }, _callee3, this);
                                }));
                            };

                            _i = 0;

                        case 2:
                            if (!(_i < 100000)) {
                                _context4.next = 8;
                                break;
                            }

                            _context4.next = 5;
                            return test();

                        case 5:
                            _i += 1;
                            _context4.next = 2;
                            break;

                        case 8:
                            done();

                        case 9:
                        case "end":
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));
    });
});
//# sourceMappingURL=stress-spec.js.map
