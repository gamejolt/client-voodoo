import * as Runner from './runner';
import * as util from './util';
import * as data from './data';

export abstract class Uninstaller
{
	static async uninstall( dir: string )
	{
		const port = await util.findFreePort();
		console.log( 'port: ' + port );
		const args: string[] = [
			'--port', port.toString(),
			'--dir', dir,
			'uninstall'
		];

		return new UninstallInstance( await Runner.Instance.launchNew( args ) );
	}

	static async uninstallReattach( port: number, pid: number )
	{
		return new UninstallInstance( new Runner.Instance( port, pid ) );
	}
}

enum State
{
	Starting = 0,
	Uninstalling = 1,
	Finished = 2,
}

class UninstallInstance
{
	private _state: State;
	private _isPaused: boolean;

	constructor( readonly runner: Runner.Instance )
	{
		this._state = State.Starting;
		this._isPaused = false;
		this.start();
	}

	private async start()
	{
		await this.getState();

		this.runner
			.on( 'patcherState', ( state: number ) =>
			{
				console.log( state );
				this._state = this._getState( state );
			} );

		if ( this._isPaused ) {
			await this.runner.sendResume();
		}
	}

	private async getState()
	{
		const state = await this.runner.sendGetState(false);
		console.log( state );
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
		return this._state == State.Finished;
	}

	isRunning()
	{
		return !this._isPaused;
	}

	async resume()
	{
		const result = await this.runner.sendResume();
		if ( result.success ) {
			this._isPaused = false;
		}
		return result;
	}

	async pause()
	{
		const result = await this.runner.sendResume();
		if ( result.success ) {
			this._isPaused = true;
		}
		return result;
	}
}
