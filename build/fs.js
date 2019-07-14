"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var FsAsync = /** @class */ (function () {
    function FsAsync() {
    }
    FsAsync.writeFile = function (filename, data, options) {
        return new Promise(function (resolve, reject) {
            if (options) {
                fs.writeFile(filename, data, options, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            }
            else {
                fs.writeFile(filename, data, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            }
        });
    };
    FsAsync.unlink = function (filename) {
        return new Promise(function (resolve, reject) {
            fs.unlink(filename, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    };
    FsAsync.exists = function (filename) {
        return new Promise(function (resolve, reject) {
            fs.exists(filename, function (exists) {
                return resolve(exists);
            });
        });
    };
    FsAsync.readFile = function (filename, encoding) {
        return new Promise(function (resolve, reject) {
            fs.readFile(filename, encoding, function (err, data) {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    };
    FsAsync.chmod = function (path, mode) {
        return new Promise(function (resolve, reject) {
            return fs.chmod(path, mode, function (err) {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    };
    return FsAsync;
}());
exports.default = FsAsync;
