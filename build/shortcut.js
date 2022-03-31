"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shortcut = void 0;
const path = require("path");
const fs_1 = require("./fs");
const xdgBasedir = require("xdg-basedir");
const shellEscape = require('shell-escape');
class Shortcut {
    static async create(program, icon) {
        if (process.platform === 'linux') {
            await this.removeLinux();
            return this.createLinux(program, icon);
        }
        else {
            throw new Error('Not supported');
        }
    }
    static remove() {
        if (process.platform === 'linux') {
            return this.removeLinux();
        }
        else {
            throw new Error('Not supported');
        }
    }
    static async createLinux(program, icon) {
        if (!xdgBasedir.data) {
            throw new Error('Could not resolve desktop shortcut dir using XDG');
        }
        let desktopFile = path.join(xdgBasedir.data || '', 'applications', 'game-jolt-client.desktop');
        let desktopContents = `[Desktop Entry]
Version=1.0
Type=Application
Name=Game Jolt Client
GenericName=Game Client
Comment=The power of Game Jolt website in your desktop
Exec=${shellEscape([program])}
Terminal=false
Icon=${icon}
Categories=Game;
Keywords=Play;Games;GJ;GameJolt;Indie;
Hidden=false
Name[en_US]=Game Jolt Client`;
        await fs_1.default.writeFile(desktopFile, desktopContents, { mode: 0o755 });
    }
    static removeLinux() {
        if (!xdgBasedir.data) {
            throw new Error('Could not resolve desktop shortcut dir using XDG');
        }
        let desktopFile = path.join(xdgBasedir.data, 'applications', 'game-jolt-client.desktop');
        let oldDesktopFile = path.join(xdgBasedir.data, 'applications', 'Game Jolt Client.desktop');
        return Promise.all([fs_1.default.unlink(desktopFile), fs_1.default.unlink(oldDesktopFile)])
            .then(() => true)
            .catch(err => false);
    }
}
exports.Shortcut = Shortcut;
