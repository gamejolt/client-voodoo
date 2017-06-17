import { Controller, Events } from './controller';
import * as util from './util';
import * as data from './data';
import { ControllerWrapper } from './controller-wrapper';

export abstract class Uninstaller
{
	static async uninstall( localPackage: GameJolt.IGamePackage )
	{
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const args: string[] = [
			'--port', port.toString(),
			'--dir', dir,
			'--paused',
			'uninstall'
		];

		return new UninstallInstance( await Controller.launchNew( args ) );
	}

	static async uninstallReattach( port: number, pid: number )
	{
		return new UninstallInstance( new Controller( port, pid ) );
	}
}

enum State
{
	Starting = 0,
	Uninstalling = 1,
	Finished = 2,
}

type UninstallEvents = {
	'state': ( state: State ) => void;
}

class UninstallInstance extends ControllerWrapper<UninstallEvents & Events>
{
	private _state: State;
	private _isPaused: boolean;

	constructor( controller: Controller )
	{
		super( controller );

		this.on( 'patcherState', ( state: number ) =>
		{
			this._state = this._getState( state );
			this.controller.emit( 'state', this._state );
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

			case data.PatcherState.Uninstall:
				return State.Uninstalling;

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

	isFinished()
	{
		return this._state === State.Finished;
	}

	isRunning()
	{
		return !this._isPaused;
	}
}
