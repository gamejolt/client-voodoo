import { Controller, Events } from './controller';
import * as util from './util';
import { ControllerWrapper } from './controller-wrapper';
import { Launcher as OldLauncher } from './old-launcher';

export interface IParsedWrapper
{
	wrapperId: string;
}

export abstract class Launcher
{
	// TODO(ylivay): Should set the credentials file for now.
	static async launch( localPackage: GameJolt.IGamePackage, ...executableArgs: string[] )
	{
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		const gameUid = localPackage.id + '-' + localPackage.build.id;
		const args: string[] = [
			'--port', port.toString(),
			'--dir', dir,
			'--game', gameUid,
			'run',
		];
		args.push( ...executableArgs );

		const controller = await Controller.launchNew( args );
		return new Promise<LaunchInstance>( ( resolve, reject ) =>
		{
			// tslint:disable-next-line:no-unused-expression
			new LaunchInstance( controller, ( err, inst ) =>
			{
				if ( err ) {
					return reject( err );
				}
				resolve( inst );
			} );
		} );
	}

	static async attach( runningPid: string | IParsedWrapper )
	{
		if ( typeof runningPid !== 'string' ) {
			return OldLauncher.attach( runningPid.wrapperId );
		}

		const index = runningPid.indexOf( ':' );
		if ( index === -1 ) {
			throw new Error( 'Invalid or unsupported running pid: ' + runningPid );
		}

		const pidVersion = parseInt( runningPid.substring( 0, index ), 10 );
		const pidStr = runningPid.substring( index + 1 );
		if ( pidVersion !== 1 ) {
			throw new Error( 'Invalid or unsupported running pid: ' + runningPid );
		}

		const parsedPid = JSON.parse( pidStr );
		const controller = new Controller( parsedPid.port, parsedPid.pid );
		controller.connect();

		return new Promise<LaunchInstance>( ( resolve, reject ) =>
		{
			// tslint:disable-next-line:no-unused-expression
			new LaunchInstance( controller, ( err, inst ) =>
			{
				if ( err ) {
					return reject( err );
				}
				resolve( inst );
			} );
		} );
	}
}

type LaunchEvents = {
	'gameOver': () => void;
};

class LaunchInstance extends ControllerWrapper<LaunchEvents & Events>
{
	private _pid: number;

	constructor( controller: Controller, onReady: ( err: Error | null, instance: LaunchInstance ) => void )
	{
		super( controller );
		this
			.on( 'gameClosed', () =>
			{
				this.controller.emit( 'gameOver' );
			} )
			.on( 'gameCrashed', ( err ) =>
			{
				this.controller.emit( 'gameOver' );
			} );

		this.controller.sendGetState( false, 2000 )
			.then( ( state ) =>
			{
				this._pid = state.pid;
				onReady( null, this );
			} )
			.catch( ( err ) => onReady( err, this ) );
	}

	get pid()
	{
		return '1:' + JSON.stringify( { port: this.controller.port, pid: this._pid } );
	}

	kill()
	{
		return this.controller.sendKillGame();
	}
}
