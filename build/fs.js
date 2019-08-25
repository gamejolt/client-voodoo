"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var tmp = require("tmp");
var os = require("os");
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
    FsAsync.createTempFile = function (prefix, ext) {
        return new Promise(function (resolve, reject) {
            var opts = {
                dir: os.tmpdir(),
                prefix: prefix,
                postfix: "." + ext,
                // Makes the application not remove the file on end and return it's fd.
                detachDescriptor: true,
                keep: true,
            };
            tmp.file(opts, function (err, name, fd) {
                if (err) {
                    return reject(err);
                }
                return resolve({ name: name, fd: fd });
            });
        });
    };
    return FsAsync;
}());
exports.default = FsAsync;
