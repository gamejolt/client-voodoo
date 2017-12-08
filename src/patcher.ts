// import * as config from 'config';
import { Controller, Events } from './controller';
import * as util from './util';
import * as data from './data';
import { Config } from './config';
import { ControllerWrapper } from './controller-wrapper';
import { Queue } from './queue';
import * as GameJolt from './gamejolt';

export interface IPatchOptions {
	authToken?: string;
	runLater?: boolean;
}

export type AuthTokenGetter = () => Promise<string>;
export abstract class Patcher {
	/**
	 * Starts a new installation/update, or resumes the operation if it was closed prematurely.
	 * If the game is already managed by another joltron instance, joltron will send back an abort message and terminate itself.
	 * client voodoo will re-emit this as a fatal error.
	 *
	 * This function returns immediately after launching the joltron executable.
	 *
	 * @param localPackage
	 * @param getAuthToken a callback that joltron will use to fetch a new game api token for the package it's patching.
	 * @param options
	 */
	static async patch(
		localPackage: GameJolt.IGamePackage,
		getAuthToken: AuthTokenGetter,
		options?: IPatchOptions
	) {
		options = options || {};
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const gameUid = localPackage.update
			? `${localPackage.update.id}-${localPackage.update.build.id}`
			: `${localPackage.id}-${localPackage.build.id}`;

		const args: string[] = [
			'--port',
			port.toString(),
			'--dir',
			dir,
			'--game',
			gameUid,
			'--platform-url',
			Config.domain + '/x/updater/check-for-updates',
			'--wait-for-connection',
			'5',
			'--symbiote',
			'--no-loader',
		];
		if (options.authToken) {
			args.push('--auth-token', options.authToken);
		}
		if (options.runLater) {
			args.push('--launch');
		}
		args.push('install');

		// As far as joltron is concerned, an installation can also be an update, therefore it might need the migration file.
		await Controller.ensureMigrationFile(localPackage);

		const controller = await Controller.launchNew(args);
		return this.manageInstanceInQueue(
			new PatchInstance(controller, getAuthToken)
		);
	}

	static async patchReattach(
		port: number,
		pid: number,
		authTokenGetter: AuthTokenGetter
	) {
		return this.manageInstanceInQueue(
			new PatchInstance(new Controller(port, pid), authTokenGetter)
		);
	}

	private static manageInstanceInQueue(instance: PatchInstance) {
		// Queue.manage(instance);
		instance.on('resumed', () => {
			Queue.manage(instance);
		});
		return instance;
	}
}

export enum State {
	Starting = 0,
	Downloading = 1,
	Patching = 2,
	Finished = 3,
}

export type PatchEvents = Events & {
	'state': (state: State) => void;
	'done': (errMessage?: string) => void;
};

export class PatchInstance extends ControllerWrapper<PatchEvents> {
	private _state: State;
	private _isPaused: boolean;

	constructor(
		controller: Controller,
		private authTokenGetter: AuthTokenGetter
	) {
		super(controller);
		this.on('patcherState', (state: data.PatcherState) => {
			console.log('patcher got state: ' + state);
			const oldState = this._state;
			this._state = this._getState(state);

			// Only emit state if it's changed
			if (oldState !== this._state) {
				console.log('patcher emitting state: ' + this._state);
				this.controller.emit('state', this._state);
			}
		})
			.on('updateFailed', reason => {
				// If the update was canceled the 'context canceled' will be emitted as the updateFailed reason.
				if (reason === 'context canceled') {
					return;
				}
				this.controller.emit('done', reason);
			})
			.on('updateFinished', () => {
				this.controller.emit('done');
			});

		this._state = State.Starting;
		this._isPaused = false;

		this.getState().then(() => {
			Queue.manage(this);
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
				return State.Starting;

			case data.PatcherState.Download:
			case data.PatcherState.UpdateReady: // not really considered downloading, but it is the step right before extracting.
				return State.Downloading;

			case data.PatcherState.PrepareExtract:
			case data.PatcherState.Extract:
			case data.PatcherState.Cleanup:
				return State.Patching;

			case data.PatcherState.Finished:
				return State.Finished;

			default:
				throw new Error('Invalid state received: ' + state);
		}
	}

	get state() {
		return this._state;
	}

	isDownloading() {
		return this._state === State.Starting || this._state === State.Downloading;
	}

	isPatching() {
		return this._state === State.Patching;
	}

	isFinished() {
		return this._state === State.Finished;
	}

	isRunning() {
		return !this._isPaused;
	}

	getAuthToken() {
		return this.authTokenGetter();
	}

	async resume(options?: {
		queue?: boolean;
		authToken?: string;
		extraMetadata?: string;
	}) {
		options = options || {};
		if (
			!options.authToken &&
			(this._state === State.Starting || this._state === State.Downloading)
		) {
			options.authToken = await this.authTokenGetter();
		}

		const result = await this.controller.sendResume(options);
		if (result.success) {
			this._isPaused = false;
		}
		return result;
	}

	async pause(queue?: boolean) {
		const result = await this.controller.sendPause({ queue: !!queue });
		if (result.success) {
			this._isPaused = true;
		}
		return result;
	}

	cancel(waitOnlyForSend?: boolean) {
		return this.controller.sendCancel(undefined, waitOnlyForSend);
	}
}
