import { Controller, Events } from './controller';
import * as util from './util';
import * as data from './data';
import { ControllerWrapper } from './controller-wrapper';
import * as GameJolt from './gamejolt';

export abstract class Rollbacker {
	static async rollback(localPackage: GameJolt.IGamePackage) {
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const args: string[] = [
			'--port',
			port.toString(),
			'--dir',
			dir,
			'--wait-for-connection',
			'2',
			'--symbiote',
			'--no-self-update',
			'rollback',
		];

		const controller = await Controller.launchNew(args);
		return new RollbackInstance(controller);
	}

	static async rollbackReattach(port: number, pid: number) {
		return new RollbackInstance(new Controller(port, { process: pid }));
	}
}

export enum RollbackState {
	Starting = 0,
	Rollback = 1,
	Finished = 2,
}

export type RollbackEvents = Events & {
	'state': (state: RollbackState) => void;
};

export class RollbackInstance extends ControllerWrapper<RollbackEvents> {
	private _state: RollbackState;
	private _isPaused: boolean;

	constructor(controller: Controller) {
		super(controller);

		this.on('patcherState', (state: number) => {
			const oldState = this._state;
			this._state = this._getState(state);

			// Only emit state if it's changed
			if (oldState !== this._state) {
				this.controller.emit('state', this._state);
			}
		});

		this._state = RollbackState.Starting;
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
				return RollbackState.Starting;

			case data.PatcherState.Rollback:
				return RollbackState.Rollback;

			case data.PatcherState.Finished:
				return RollbackState.Finished;

			default:
				throw new Error('Invalid state received: ' + state);
		}
	}

	get state() {
		return this._state;
	}

	isFinished() {
		return this._state === RollbackState.Finished;
	}

	isRunning() {
		return !this._isPaused;
	}
}
