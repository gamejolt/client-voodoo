"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const tmp = require("tmp");
const os = require("os");
class FsAsync {
    static writeFile(filename, data, options) {
        return new Promise((resolve, reject) => {
            if (options) {
                fs.writeFile(filename, data, options, err => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            }
            else {
                fs.writeFile(filename, data, err => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            }
        });
    }
    static unlink(filename) {
        return new Promise((resolve, reject) => {
            fs.unlink(filename, err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    static exists(filename) {
        return new Promise((resolve, reject) => {
            fs.exists(filename, exists => {
                return resolve(exists);
            });
        });
    }
    static readFile(filename, encoding) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, encoding, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }
    static chmod(path, mode) {
        return new Promise((resolve, reject) => {
            return fs.chmod(path, mode, err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
    static createTempFile(prefix, ext) {
        return new Promise((resolve, reject) => {
            const opts = {
                dir: os.tmpdir(),
                prefix: prefix,
                postfix: `.${ext}`,
                // Makes the application not remove the file on end and return it's fd.
                detachDescriptor: true,
                keep: true,
            };
            tmp.file(opts, (err, name, fd) => {
                if (err) {
                    return reject(err);
                }
                return resolve({ name, fd });
            });
        });
    }
}
exports.default = FsAsync;
