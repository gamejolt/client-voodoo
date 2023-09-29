import fs from './fs';
import * as path from 'path';
import { Controller, Events } from './controller';
import * as util from './util';
import { ControllerWrapper } from './controller-wrapper';
import { OldLauncher, OldLaunchInstance } from './old-launcher';
import { Queue } from './queue';
import { TSEventEmitter } from './events';
import { Manifest } from './data';
import * as GameJolt from './gamejolt';

export interface IParsedWrapper {
	wrapperId: string;
}

export abstract class Launcher {
	// TODO(ylivay): Should set the credentials file for now.
	static async launch(
		localPackage: GameJolt.IGamePackage,
		credentials: GameJolt.IGameCredentials | null,
		...executableArgs: string[]
	) {
		if (credentials) {
			await this.ensureCredentials(localPackage, credentials);
		}

		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const gameUid = localPackage.id + '-' + localPackage.build.id;
		const args: string[] = [
			'--port',
			port.toString(),
			'--dir',
			dir,
			'--game',
			gameUid,
			'--wait-for-connection',
			'20',
			'--no-self-update',
			'run',
		];
		args.push(...executableArgs);

		await Controller.ensureMigrationFile(localPackage);
		const controller = await Controller.launchNew(args);
		const instance = await new Promise<LaunchInstance>((resolve, reject) => {
			// tslint:disable-next-line:no-unused-expression
			new LaunchInstance(controller, (err, inst) => {
				if (err) {
					return reject(err);
				}
				resolve(inst);
			});
		});

		return this.manageInstanceInQueue(instance);
	}

	static async attach(
		runningPid: string | IParsedWrapper
	): Promise<LaunchInstance | OldLaunchInstance> {
		let instance: LaunchInstance | OldLaunchInstance | null = null;
		if (typeof runningPid !== 'string') {
			console.log('Attaching to wrapper id: ' + runningPid.wrapperId);
			instance = await OldLauncher.attach(runningPid.wrapperId);
		} else {
			const index = runningPid.indexOf(':');
			if (index === -1) {
				throw new Error('Invalid or unsupported running pid: ' + runningPid);
			}

			const pidVersion = parseInt(runningPid.substring(0, index), 10);
			const pidStr = runningPid.substring(index + 1);
			if (pidVersion !== 1) {
				throw new Error('Invalid or unsupported running pid: ' + runningPid);
			}

			const parsedPid = JSON.parse(pidStr);
			console.log('Attaching to parsed pid: ' + pidStr);
			const controller = new Controller(parsedPid.port, parsedPid.pid);
			controller.connect();

			instance = await new Promise<LaunchInstance>((resolve, reject) => {
				// tslint:disable-next-line:no-unused-expression
				new LaunchInstance(controller, (err, inst) => {
					if (err) {
						return reject(err);
					}
					resolve(inst);
				});
			});
		}

		return this.manageInstanceInQueue(instance);
	}

	private static async ensureCredentials(
		localPackage: GameJolt.IGamePackage,
		credentials: GameJolt.IGameCredentials
	) {
		let dir, executable: string;
		// We try getting the data dir and executable path from the manifest,
		// but the manifest might not exist if the package hasn't been migrated yet,
		// and since joltron does the migration itself we fall back to placing the credentials
		// in the old location - where the data dir doesn't exist and the game contents
		// are located directly inside the installation dir.
		try {
			const manifestStr = await fs.readFile(
				path.join(localPackage.install_dir, '.manifest'),
				'utf8'
			);
			const manifest: Manifest = JSON.parse(manifestStr);
			dir = manifest.gameInfo.dir;
			executable = manifest.launchOptions.executable;
		} catch (err) {
			dir = '.';
			executable = localPackage.executablePath;
		}

		const str = `0.2.1\n${credentials.username}\n${credentials.user_token}\n`;
		await Promise.all([
			fs.writeFile(path.join(localPackage.install_dir, '.gj-credentials'), str),
			fs.writeFile(
				path.join(localPackage.install_dir, dir, executable, '..', '.gj-credentials'),
				str
			),
		]);
	}

	private static manageInstanceInQueue<T extends TSEventEmitter<LaunchEvents>>(instance: T): T {
		Queue.setSlower();
		instance.once('gameOver', () => Queue.setFaster());
		return instance;
	}
}

export type LaunchEvents = Events & {
	'gameOver': (errMessage?: string) => void;
};

export class LaunchInstance extends ControllerWrapper<LaunchEvents> {
	private _pid: number;

	constructor(
		controller: Controller,
		onReady: (err: Error | null, instance: LaunchInstance) => void
	) {
		super(controller);

		this
			.on('gameClosed', () => {
				this.controller.emit('gameOver' as any);
			})
			.on('gameCrashed', err => {
				this.controller.emit('gameOver' as any, err);
			})
			.on('gameLaunchFinished', () => {
				this.controller.emit('gameOver' as any);
			})
			.on('gameLaunchFailed', err => {
				this.controller.emit('gameOver' as any, err);
			});

		this.controller
			// TODO: the timeout on initial messages sent to joltron has to be higher
			// than the time it takes joltron to give up making a connection to a previous
			// running instance of joltron. for some reason this takes around 3 seconds on Windows.
			.sendGetState(false, 4000)
			.then(state => {
				this._pid = state.pid;
				onReady(null, this);
			})
			.catch(err => onReady(err, this));
	}

	get pid() {
		return '1:' + JSON.stringify({ port: this.controller.port, pid: this._pid });
	}

	kill(): Promise<{ success: boolean; err?: string }> {
		return this.controller.sendKillGame();
	}
}
