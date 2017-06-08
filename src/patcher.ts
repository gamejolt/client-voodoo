import * as config from 'config';
import * as Runner from './runner';
import * as util from './util';
import * as data from './data';

export interface IPatchOptions
{
	authToken?: string;
	runLater?: boolean;
}

export abstract class Patcher
{
	static readonly PLATFORM_URL = config.get( 'domain' ) + '/x/updater/check_for_updates';

	static async patch( localPackage: GameJolt.IGamePackage, options?: IPatchOptions )
	{
		options = options || {};
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		console.log( 'port: ' + port );
		const gameUid = localPackage.id + '-' + localPackage.build.id;
		const args: string[] = [
			'--port', port.toString(),
			'--dir', dir,
			'--game', gameUid,
			'--platform-url', this.PLATFORM_URL,
			'--paused',
			'--no-loader' ];
		if ( options.authToken ) {
			args.push( '--auth-token', options.authToken );
		}
		if ( options.runLater ) {
			args.push( '--launch' );
		}
		args.push( 'install' );

		return new PatchInstance( await Runner.Instance.launchNew( args ) );
	}

	static async patchReattach( port: number, pid: number )
	{
		return new PatchInstance( new Runner.Instance( port, pid ) );
	}
}

enum State
{
	Starting = 0,
	Downloading = 1,
	Patching = 2,
	Finishing = 3,
	Finished = 4,
}

class PatchInstance
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

			case data.PatcherState.Download:
			case data.PatcherState.UpdateReady: // not really considered downloading, but it is the step right before extracting.
				return State.Downloading;

			case data.PatcherState.PrepareExtract:
			case data.PatcherState.Extract:
				return State.Patching;

			case data.PatcherState.Cleanup:
				return State.Finishing;

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
		return this._state == State.Starting || this._state == State.Downloading;
	}

	isPatching()
	{
		return this._state == State.Patching || this._state == State.Finishing;
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

	async cancel()
	{
		const result = await this.runner.sendResume();
		return result;
	}
}
