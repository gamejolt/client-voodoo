import Common from '../common';

// const MUTEX_NAME = 'game-jolt-client';

export abstract class Application
{
	// private static mutex;
	private static _pidDir: string;

	static get PID_DIR(): string
	{
		return this._pidDir;
	}

	static ensurePidDir()
	{
		return Common.mkdirp( this._pidDir );
	}

	static setPidDir( pidDir: string )
	{
		if ( !this._pidDir ) {
			this._pidDir = pidDir;
			return true;
		}
		return false;
	}

	static start()
	{
		console.log( 'Acquiring le mutex' );

		// let Mutex = require( 'windows-mutex' );
		// this.mutex = null;
		// try {
		// 	this.mutex = new Mutex( MUTEX_NAME );
		// }
		// catch (e) {
		// 	// noop
		// }

		process.on( 'exit', () => this.stop() );
	}

	static stop()
	{
		console.log( 'Releasing le mutex' );

		// if ( this.mutex ) {
		// 	this.mutex.release();
		// 	this.mutex = null;
		// }
	}
}
