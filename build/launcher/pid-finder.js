"use strict";

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

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
var net = require('net');
function log(message) {
    console.log('Pid Finder: ' + message);
}
function debug(message) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Pid Finder: ' + message);
    }
}

var WrapperFinder = (function () {
    function WrapperFinder() {
        (0, _classCallCheck3.default)(this, WrapperFinder);
    }

    (0, _createClass3.default)(WrapperFinder, null, [{
        key: "find",
        value: function find(id, port) {
            return new _promise2.default(function (resolve, reject) {
                var conn = net.connect({ port: port, host: '127.0.0.1' });
                conn.on('data', function (data) {
                    var parsedData = data.toString().split(':');
                    switch (parsedData[0]) {
                        case 'v0.0.1':
                            if (parsedData[2] === id) {
                                resolve();
                            } else {
                                reject(new Error("Expecting wrapper id " + id + ", received " + parsedData[2]));
                            }
                            break;
                    }
                    conn.end();
                }).on('end', function () {
                    reject(new Error('Connection to wrapper ended before we got any info'));
                }).on('error', function (err) {
                    reject(new Error('Got an error in the connection: ' + err.message));
                });
            });
        }
    }]);
    return WrapperFinder;
})();

exports.WrapperFinder = WrapperFinder;
//# sourceMappingURL=pid-finder.js.map
