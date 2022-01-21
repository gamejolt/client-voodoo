"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const controller_1 = require("./controller");
const packageJson = require('../package.json');
const joltronVersion = packageJson.joltronVersion;
const https = require('follow-redirects').https;
async function doTheThing() {
    const executable = (0, controller_1.getExecutable)();
    const binDir = path.dirname(executable);
    await new Promise((resolve, reject) => {
        mkdirp(binDir, err => {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
    const file = fs.createWriteStream(executable, { mode: 0o755 });
    let remoteExecutable;
    switch (process.platform) {
        case 'win32':
            remoteExecutable = 'joltron_win32.exe';
            break;
        case 'linux':
            remoteExecutable = 'joltron_linux';
            break;
        case 'darwin':
            remoteExecutable = 'joltron_osx';
            break;
        default:
            throw new Error('Unsupported platform');
    }
    const options = {
        host: 'github.com',
        path: `/gamejolt/joltron-builds/releases/download/${joltronVersion}/${remoteExecutable}`,
    };
    await new Promise((resolve, reject) => {
        https
            .get(options, res => {
            if (res.statusCode !== 200) {
                throw new Error(`Invalid status code. Expected 200 got ${res.statusCode}`);
            }
            res.pipe(file);
        })
            .on('error', reject)
            .on('end', () => resolve)
            .end();
    });
}
doTheThing();
