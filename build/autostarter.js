"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Autostarter = void 0;
const path = require("path");
const xdgBasedir = require("xdg-basedir");
const Winreg = require("winreg");
const fs_1 = require("./fs");
let applescript = null;
if (process.platform === 'darwin') {
    const applescriptExecString = require('applescript').execString;
    applescript = function (script) {
        return new Promise((resolve, reject) => {
            applescriptExecString(script, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    };
}
const shellEscape = require('shell-escape');
const autostartId = 'GameJoltClient';
class WindowsAutostarter {
    static getKey() {
        return new Winreg({
            hive: Winreg.HKCU,
            key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        });
    }
    set(program, args) {
        return new Promise((resolve, reject) => {
            const autoStartCommand = `"${program}"${args && args.length
                ? ` ${args.join(' ')}`
                : ''}`;
            WindowsAutostarter.getKey().set(autostartId, Winreg.REG_SZ, autoStartCommand, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    unset() {
        return new Promise((resolve, reject) => {
            WindowsAutostarter.getKey().remove(autostartId, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    isset() {
        return new Promise(resolve => {
            WindowsAutostarter.getKey().get(autostartId, (err, item) => {
                resolve(!!item);
            });
        });
    }
}
class LinuxAutostarter {
    async createRunner(program, runner, args) {
        let runnerScript = `#!/bin/bash
if [ -e "${program}" ]; then
	${shellEscape([program].concat(args || []))}
fi`;
        await fs_1.default.writeFile(runner, runnerScript, { mode: 0o755 });
    }
    async set(program, args, runner) {
        if (!runner) {
            throw new Error(`'runner' argument must be provided for LinuxAutostarter.set`);
        }
        await this.createRunner(program, runner, args);
        let desktopContents = `[Desktop Entry]
Version=1.0
Type=Application
Name=Game Jolt Client
GenericName=Game Client
Comment=The power of Game Jolt website in your desktop
Exec=${shellEscape([runner])}
Terminal=false
Categories=Game;
Keywords=Play;GJ;GameJolt;
Hidden=false
Name[en_US]=Game Jolt Client
TX-GNOME-Autostart-enabled=true`;
        await fs_1.default.writeFile(LinuxAutostarter.desktopFilePath, desktopContents, {
            mode: 0o755,
        });
    }
    unset() {
        return fs_1.default.unlink(LinuxAutostarter.desktopFilePath);
    }
    isset() {
        return fs_1.default.exists(LinuxAutostarter.desktopFilePath);
    }
}
LinuxAutostarter.desktopFilePath = path.join(xdgBasedir.config || '', 'autostart', `${autostartId}.desktop`);
class MacAutostarter {
    async createRunner(program, runner, args) {
        let runnerScript = `#!/bin/bash
if [ -e "${program}" ]; then
	${shellEscape([program].concat(args || []))}
fi`;
        await fs_1.default.writeFile(runner, runnerScript, { mode: 0o755 });
    }
    async set(program, args, runner) {
        if (!runner) {
            throw new Error(`'runner' argument must be provided for MacAutostarter.set`);
        }
        await this.createRunner(program, runner, args);
        // tslint:disable-next-line:max-line-length
        return applescript(`tell application "System Events" to make login item at end with properties {path:"${runner}", hidden:false, name:"${autostartId}"}`);
    }
    unset(runner) {
        return applescript(`tell application "System Events" to delete every login item whose name is "${autostartId}"`);
    }
    async isset() {
        const loginItems = await applescript('tell application "System Events" to get the name of every login item');
        return !!loginItems && loginItems.indexOf(autostartId) !== -1;
    }
}
class Autostarter {
    static get autostarter() {
        switch (process.platform) {
            case 'win32':
                return this.winAutostarter;
            case 'linux':
                return this.linuxAutostarter;
            case 'darwin':
                return this.macAutostarter;
        }
        throw new Error('Invalid OS');
    }
    static async set(path_, args, runner) {
        await this.unset(path_);
        this.autostarter.set(path_, args, runner);
    }
    static async unset(runner) {
        const isset = await this.isset();
        if (isset) {
            return this.autostarter.unset(runner);
        }
        return;
    }
    static isset() {
        return this.autostarter.isset();
    }
}
exports.Autostarter = Autostarter;
Autostarter.winAutostarter = new WindowsAutostarter();
Autostarter.linuxAutostarter = new LinuxAutostarter();
Autostarter.macAutostarter = new MacAutostarter();
