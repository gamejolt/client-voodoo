import { Controller, Events } from './controller';
import * as util from './util';
import * as data from './data';
import { ControllerWrapper } from './controller-wrapper';
import * as GameJolt from './gamejolt';

export abstract class Uninstaller {
	static async uninstall(localPackage: GameJolt.IGamePackage) {
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const args: string[] = [
			'--port',
			port.toString(),
			'--dir',
			dir,
			'--wait-for-connection',
			'20',
			'--symbiote',
			'--no-self-update',
			'uninstall',
		];

		await Controller.ensureMigrationFile(localPackage);
		const controller = await Controller.launchNew(args);
		return new UninstallInstance(controller);
	}

	static async uninstallReattach(port: number, pid: number) {
		return new UninstallInstance(new Controller(port, { process: pid }));
	}
}

export enum UninstallState {
	Starting = 0,
	Uninstalling = 1,
	Finished = 2,
}

export type UninstallEvents = Events & {
	'state': (state: UninstallState) => void;
};

export class UninstallInstance extends ControllerWrapper<UninstallEvents> {
	private _state: UninstallState;
	private _isPaused: boolean;

	constructor(controller: Controller) {
		super(controller);

		this.on('patcherState', (state: number) => {
			const oldState = this._state;
			this._state = this._getState(state);

			// Only emit state if it's changed
			if (oldState !== this._state) {
				this.controller.emit('state' as any, this._state);
			}
		});

		this._state = UninstallState.Starting;
		this._isPaused = false;

		this.getState().then(() => {
			if (this._isPaused) {
				this.controller.sendResume();
			}
		});
	}

	private async getState() {
		const state = await this.controller.sendGetState(false);
		this._isPaused = state.isPaused;

		this._state = this._getState(state.patcherState);
	}

	private _getState(state: number) {
		switch (state) {
			case data.PatcherState.Start:
			case data.PatcherState.Preparing:
				return UninstallState.Starting;

			case data.PatcherState.Uninstall:
				return UninstallState.Uninstalling;

			case data.PatcherState.Finished:
				return UninstallState.Finished;

			default:
				throw new Error('Invalid state received: ' + state);
		}
	}

	get state() {
		return this._state;
	}

	isFinished() {
		return this._state === UninstallState.Finished;
	}

	isRunning() {
		return !this._isPaused;
	}
}
