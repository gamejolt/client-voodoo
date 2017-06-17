import * as fs from  'mz/fs';
import * as path from 'path';
import { Controller, Events } from './controller';
import * as util from './util';
import { ControllerWrapper } from './controller-wrapper';
import { Launcher as OldLauncher } from './old-launcher';
import { Queue } from './queue';
import { TSEventEmitter } from './events';
import { Manifest } from  './data';

export interface IParsedWrapper
{
	wrapperId: string;
}

export abstract class Launcher
{
	// TODO(ylivay): Should set the credentials file for now.
	static async launch( localPackage: GameJolt.IGamePackage, credentials: GameJolt.IGameCredentials | null, ...executableArgs: string[] )
	{
		if ( credentials ) {
			await this.ensureCredentials( localPackage, credentials );
		}

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
		const instance = await new Promise<LaunchInstance>( ( resolve, reject ) =>
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

		return this.manageInstanceInQueue( instance );
	}

	static async attach( runningPid: string | IParsedWrapper ): Promise<TSEventEmitter<LaunchEvents>>
	{
		let instance: TSEventEmitter<LaunchEvents> = null;
		if ( typeof runningPid !== 'string' ) {
			instance = await OldLauncher.attach( runningPid.wrapperId );
		}
		else {
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

			instance = await new Promise<LaunchInstance>( ( resolve, reject ) =>
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

		return this.manageInstanceInQueue( instance );
	}

	private static async ensureCredentials( localPackage: GameJolt.IGamePackage, credentials: GameJolt.IGameCredentials )
	{
		const manifestStr = await fs.readFile( path.join( localPackage.install_dir, '.manifest' ), 'utf8' );
		const manifest: Manifest = JSON.parse( manifestStr );

		const str = `0.2.1\n${credentials.username}\n${credentials.user_token}\n`;
		await Promise.all( [
			fs.writeFile( path.join( localPackage.install_dir, '.gj-credentials' ), str ),
			fs.writeFile(
				path.join(
					localPackage.install_dir,
					manifest.gameInfo.dir,
					manifest.launchOptions.executable,
					'..',
					'.gj-credentials'
				), str ),
		] );
	}

	private static manageInstanceInQueue( instance: TSEventEmitter<LaunchEvents> )
	{
		Queue.setSlower();
		instance.once( 'gameOver', () => Queue.setFaster() );
		return instance;
	}
}

type LaunchEvents = {
	'gameOver': ( errMessage?: string ) => void;
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
				this.controller.emit( 'gameOver', err );
			} )
			.on( 'gameLaunchFinished', () =>
			{
				this.controller.emit( 'gameOver' );
			} )
			.on( 'gameLaunchFailed', ( err ) =>
			{
				this.controller.emit( 'gameOver', err );
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
