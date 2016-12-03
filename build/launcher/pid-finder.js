"use strict";
var net = require("net");
var WrapperFinder = (function () {
    function WrapperFinder() {
    }
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
            });
        });
    };
    return WrapperFinder;
}());
exports.WrapperFinder = WrapperFinder;
//# sourceMappingURL=pid-finder.js.map