// import * as config from 'config';
import { Controller, Events } from './controller';
import * as util from './util';
import * as data from './data';
import * as config from './config';
import { ControllerWrapper } from './controller-wrapper';
import { Queue } from './queue';

export interface IPatchOptions
{
	authToken?: string;
	runLater?: boolean;
}

export abstract class Patcher
{
	static async patch( localPackage: GameJolt.IGamePackage, options?: IPatchOptions )
	{
		options = options || {};
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const gameUid = localPackage.id + '-' + localPackage.build.id;
		const args: string[] = [
			'--port', port.toString(),
			'--dir', dir,
			'--game', gameUid,
			'--platform-url', config.domain + '/x/updater/check-for-updates',
			'--wait-for-connection', '2',
			'--symbiote',
			'--no-loader',
		];
		if ( options.authToken ) {
			args.push( '--auth-token', options.authToken );
		}
		if ( options.runLater ) {
			args.push( '--launch' );
		}
		args.push( 'install' );

		return this.manageInstanceInQueue( new PatchInstance( await Controller.launchNew( args ) ) );
	}

	static async patchReattach( port: number, pid: number )
	{
		return this.manageInstanceInQueue( new PatchInstance( new Controller( port, pid ) ) );
	}

	private static manageInstanceInQueue( instance: PatchInstance )
	{
		Queue.manage( instance );
		instance.on( 'resumed', () =>
		{
			Queue.manage( instance );
		} );
		return instance;
	}
}

export enum State
{
	Starting = 0,
	Downloading = 1,
	Patching = 2,
	Finished = 3,
}

export type PatchEvents = {
	'state': ( state: State ) => void;
	'done': ( errMessage?: string ) => void;
}

export class PatchInstance extends ControllerWrapper<PatchEvents & Events>
{
	private _state: State;
	private _isPaused: boolean;

	constructor( controller: Controller )
	{
		super( controller );
		this
			.on( 'patcherState', ( state: data.PatcherState ) =>
			{
				console.log( 'patcher got state: ' + state );
				this._state = this._getState( state );
				console.log( 'patcher emitting state: ' + this._state );
				this.controller.emit( 'state', this._state );
			} )
			.on( 'updateFailed', function( reason )
			{
				// If the update was canceled the 'context canceled' will be emitted as the updateFailed reason.
				if ( reason === 'context canceled' ) {
					return;
				}
				this.controller.emit( 'done', reason );
			} )
			.on( 'updateFinished', function()
			{
				this.emit( 'done' );
			} );

		this._state = State.Starting;
		this._isPaused = false;

		this.getState()
			.then( () =>
			{
				if ( this._isPaused ) {
					this.controller.sendResume();
				}
			} );
	}

	private async getState()
	{
		const state = await this.controller.sendGetState(false);
		this._isPaused = state.isPaused;

		this._state = this._getState( state.patcherState );
	}

	private _getState( state: number )
	{
		switch ( state ) {
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
				throw new Error( 'Invalid state received: ' + state );
		}
	}

	get state()
	{
		return this._state;
	}

	isDownloading()
	{
		return this._state === State.Starting || this._state === State.Downloading;
	}

	isPatching()
	{
		return this._state === State.Patching;
	}

	isFinished()
	{
		return this._state === State.Finished;
	}

	isRunning()
	{
		return !this._isPaused;
	}

	async resume( queue?: boolean )
	{
		const result = await this.controller.sendResume( { queue: !!queue } );
		if ( result.success ) {
			this._isPaused = false;
		}
		return result;
	}

	async pause( queue?: boolean )
	{
		const result = await this.controller.sendPause( { queue: !!queue } );
		if ( result.success ) {
			this._isPaused = true;
		}
		return result;
	}

	async cancel()
	{
		const result = await this.controller.sendCancel();
		return result;
	}
}
