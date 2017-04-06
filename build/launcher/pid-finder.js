"use strict";
<<<<<<< HEAD

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var net = require('net');
var path = require('path');
var application_1 = require('../application');
var common_1 = require('../common');
function log(message) {
    console.log('Pid Finder: ' + message);
}
function debug(message) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Pid Finder: ' + message);
    }
}

var WrapperFinder = function () {
=======
var net = require("net");
var WrapperFinder = (function () {
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
    function WrapperFinder() {
    }
<<<<<<< HEAD

    (0, _createClass3.default)(WrapperFinder, null, [{
        key: 'find',
        value: function find(id) {
            var pidPath = path.join(application_1.Application.PID_DIR, id);
            return common_1.default.fsReadFile(pidPath, 'utf8').then(function (port) {
                return new _promise2.default(function (resolve, reject) {
                    var conn = net.connect({ port: parseInt(port), host: '127.0.0.1' });
                    conn.on('data', function (data) {
                        var parsedData = data.toString().split(':');
                        switch (parsedData[0]) {
                            case 'v0.0.1':
                            case 'v0.1.0':
                                if (parsedData[2] === id) {
                                    resolve(parseInt(port));
                                } else {
                                    reject(new Error('Expecting wrapper id ' + id + ', received ' + parsedData[2]));
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
=======
    WrapperFinder.find = function (id, port) {
        return new Promise(function (resolve, reject) {
            var conn = net.connect({ port: port, host: '127.0.0.1' });
            conn
                .on('data', function (data) {
                var parsedData = data.toString().split(':');
                switch (parsedData[0]) {
                    case 'v0.0.1':
                        if (parsedData[2] === id) {
                            resolve();
                        }
                        else {
                            reject(new Error("Expecting wrapper id " + id + ", received " + parsedData[2]));
                        }
                        break;
                }
                conn.end();
            })
                .on('end', function () {
                reject(new Error('Connection to wrapper ended before we got any info'));
            })
                .on('error', function (err) {
                reject(new Error('Got an error in the connection: ' + err.message));
>>>>>>> d9f4826c34cf350328d33cf7c25b2ed87c77b383
            });
        });
    };
    return WrapperFinder;
}());
exports.WrapperFinder = WrapperFinder;
//# sourceMappingURL=pid-finder.js.map