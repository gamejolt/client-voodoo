import * as path from 'path';
import fs from './fs';
import * as xdgBasedir from 'xdg-basedir';

const shellEscape: (args: string[]) => string = require('shell-escape');

export abstract class Shortcut {
	static async create(program: string, icon: string) {
		if (process.platform === 'linux') {
			await this.removeLinux();
			return this.createLinux(program, icon);
		} else {
			throw new Error('Not supported');
		}
	}

	static remove() {
		if (process.platform === 'linux') {
			return this.removeLinux();
		} else {
			throw new Error('Not supported');
		}
	}

	private static async createLinux(program: string, icon: string) {
		if (!xdgBasedir.data) {
			throw new Error('Could not resolve desktop shortcut dir using XDG');
		}

		let desktopFile = path.join(
			xdgBasedir.data || '',
			'applications',
			'game-jolt-client.desktop'
		);

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

		await fs.writeFile(desktopFile, desktopContents, { mode: 0o755 });
	}

	private static removeLinux() {
		if (!xdgBasedir.data) {
			throw new Error('Could not resolve desktop shortcut dir using XDG');
		}

		let desktopFile = path.join(xdgBasedir.data, 'applications', 'game-jolt-client.desktop');
		let oldDesktopFile = path.join(xdgBasedir.data, 'applications', 'Game Jolt Client.desktop');
		return Promise.all([fs.unlink(desktopFile), fs.unlink(oldDesktopFile)])
			.then(() => true)
			.catch(err => false);
	}
}
