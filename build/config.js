"use strict";
var mkdirp = require("mkdirp");
exports.domain = process.env.NODE_ENV === 'development'
    ? 'http://development.gamejolt.com'
    : 'https://gamejolt.com';
var _pidDir = '';
function PID_DIR() {
    return _pidDir;
}
exports.PID_DIR = PID_DIR;
function ensurePidDir() {
    return new Promise(function (resolve, reject) {
        mkdirp(_pidDir, function (err, made) {
            if (err) {
                return reject(err);
            }
            return resolve(made);
        });
    });
}
exports.ensurePidDir = ensurePidDir;
function setPidDir(pidDir) {
    if (!_pidDir) {
        _pidDir = pidDir;
        return true;
    }
    return false;
}
exports.setPidDir = setPidDir;
//# sourceMappingURL=config.js.map