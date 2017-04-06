"use strict";
var net = require("net");
var path = require("path");
var application_1 = require("../application");
var common_1 = require("../common");
var WrapperFinder = (function () {
    function WrapperFinder() {
    }
    WrapperFinder.find = function (id) {
        var pidPath = path.join(application_1.Application.PID_DIR, id);
        return common_1.default.fsReadFile(pidPath, 'utf8')
            .then(function (port) {
            return new Promise(function (resolve, reject) {
                var conn = net.connect({ port: parseInt(port), host: '127.0.0.1' });
                conn
                    .on('data', function (data) {
                    var parsedData = data.toString().split(':');
                    switch (parsedData[0]) {
                        case 'v0.0.1':
                        case 'v0.1.0':
                            if (parsedData[2] === id) {
                                resolve(parseInt(port));
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
                });
            });
        });
    };
    return WrapperFinder;
}());
exports.WrapperFinder = WrapperFinder;
//# sourceMappingURL=pid-finder.js.map