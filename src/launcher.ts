import { Controller } from './controller';
import * as util from './util';

export abstract class Launcher
{
	// TODO(ylivay): Should set the credentials file for now.
	static async launch( localPackage: GameJolt.IGamePackage, ...executableArgs: string[] )
	{
		const dir = localPackage.install_dir;
		const port = await util.findFreePort();
		console.log( 'port: ' + port );
		const gameUid = localPackage.id + '-' + localPackage.build.id;
		const args: string[] = [
			'--port', port.toString(),
			'--dir', dir,
			'--game', gameUid,
			'run',
		];
		args.push( ...executableArgs );

		return new LaunchInstance( await Controller.launchNew( args ) );
	}

	// TODO(ylivay): Should return a promise of the launch instance on
	// successful attach, otherwise a promise rejection.
	static async attach( port: number, pid: number )
	{
		return new LaunchInstance( new Controller( port, pid ) );
	}
}

class LaunchInstance
{
	constructor( readonly controller: Controller )
	{
	}

	kill()
	{
		return this.controller.sendKillGame();
	}
}
