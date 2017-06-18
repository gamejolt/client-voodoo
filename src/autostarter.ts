import * as path from 'path';
import * as fs from 'mz/fs';
import * as xdgBasedir from 'xdg-basedir';
import * as Winreg from 'winreg';

let applescript: (script: string) => Promise<any> = null;

if (process.platform === 'darwin') {
	const applescriptExecString = require('applescript').execString;
	applescript = function(script: string) {
		return new Promise<any>((resolve, reject) => {
			applescriptExecString(script, (err, result) => {
				if (err) {
					return reject(err);
				}
				resolve(result);
			});
		});
	};
}
const shellEscape: (args: string[]) => string = require('shell-escape');

const autostartId = 'GameJoltClient';
class WindowsAutostarter implements IAutostarter {
	private static getKey() {
		return new Winreg({
			hive: Winreg.HKCU,
			key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
		});
	}

	set(program: string, args: string[]) {
		return new Promise<void>((resolve, reject) => {
			const autoStartCommand = `"${program}"${args && args.length
				? ` ${args.join(' ')}`
				: ''}`;
			WindowsAutostarter.getKey().set(
				autostartId,
				Winreg.REG_SZ,
				autoStartCommand,
				err => {
					if (err) {
						return reject(err);
					}
					resolve();
				}
			);
		});
	}

	unset() {
		return new Promise<void>((resolve, reject) => {
			WindowsAutostarter.getKey().remove(autostartId, err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}

	isset() {
		return new Promise<boolean>(resolve => {
			WindowsAutostarter.getKey().get(autostartId, (err, item) => {
				resolve(!!item);
			});
		});
	}
}

class LinuxAutostarter implements IAutostarter {
	private static desktopFilePath = path.join(
		xdgBasedir.config,
		'autostart',
		`${autostartId}.desktop`
	);

	private async createRunner(program: string, runner: string, args?: string[]) {
		let runnerScript = `#!/bin/bash
if [ -e "${program}" ]; then
	${shellEscape([program].concat(args || []))}
fi`;

		await fs.writeFile(runner, runnerScript, { mode: '0755' });
	}

	async set(program: string, args?: string[], runner?: string) {
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

		await fs.writeFile(LinuxAutostarter.desktopFilePath, desktopContents, {
			mode: '0755',
		});
	}

	unset() {
		return fs.unlink(LinuxAutostarter.desktopFilePath);
	}

	isset() {
		return fs.exists(LinuxAutostarter.desktopFilePath);
	}
}

class MacAutostarter implements IAutostarter {
	private async createRunner(program: string, runner: string, args?: string[]) {
		let runnerScript = `#!/bin/bash
if [ -e "${program}" ]; then
	${shellEscape([program].concat(args || []))}
fi`;

		await fs.writeFile(runner, runnerScript, { mode: '0755' });
	}

	async set(program: string, args?: string[], runner?: string) {
		await this.createRunner(program, runner, args);

		// tslint:disable-next-line:max-line-length
		return applescript(
			`tell application "System Events" to make login item at end with properties {path:"${runner}", hidden:false, name:"${autostartId}"}`
		);
	}

	unset(runner?: string) {
		return applescript(
			`tell application "System Events" to delete every login item whose name is "${autostartId}"`
		);
	}

	isset() {
		return applescript(
			'tell application "System Events" to get the name of every login item'
		).then((loginItems: string) => {
			return loginItems && loginItems.indexOf(autostartId) !== -1;
		});
	}
}

interface IAutostarter {
	set: (path: string, args?: string[], runner?: string) => Promise<void>;
	unset: (runner?: string) => Promise<void>;
	isset: () => Promise<boolean>;
}

export abstract class Autostarter {
	private static winAutostarter: WindowsAutostarter = new WindowsAutostarter();
	private static linuxAutostarter: LinuxAutostarter = new LinuxAutostarter();
	private static macAutostarter: MacAutostarter = new MacAutostarter();

	private static get autostarter(): IAutostarter {
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

	static set(path: string, args?: string[], runner?: string): Promise<void> {
		return this.unset(path).then(() =>
			this.autostarter.set(path, args, runner)
		);
	}

	static unset(runner?: string): Promise<void> {
		return this.isset().then(isset => {
			if (isset) {
				return this.autostarter.unset(runner);
			}
			return undefined;
		});
	}

	static isset(): Promise<boolean> {
		return this.autostarter.isset();
	}
}
