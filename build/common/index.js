'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var Bluebird = require('bluebird');
var mkdirp = Bluebird.promisify(require('mkdirp'));
var fsUnlink = Bluebird.promisify(fs.unlink);
var fsExists = function fsExists(path) {
    return new _promise2.default(function (resolve) {
        fs.exists(path, resolve);
    });
};
var fsReadFile = Bluebird.promisify(fs.readFile);
var fsWriteFile = Bluebird.promisify(fs.writeFile);
var chmod = Bluebird.promisify(fs.chmod);
var fsStat = Bluebird.promisify(fs.stat);
var fsReadDir = Bluebird.promisify(fs.readdir);
var fsReadDirRecursively = Bluebird.promisify(require('recursive-readdir'));
exports.default = {
    mkdirp: mkdirp,
    fsUnlink: fsUnlink,
    fsExists: fsExists,
    fsReadFile: fsReadFile,
    fsWriteFile: fsWriteFile,
    chmod: chmod,
    fsStat: fsStat,
    fsReadDir: fsReadDir,
    fsReadDirRecursively: fsReadDirRecursively
};
//# sourceMappingURL=index.js.map
