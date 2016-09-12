const MUTEX_NAME = 'game-jolt-client';

export abstract class Application
{
	private static mutex: any | undefined = undefined;

	static start()
	{
		console.log( 'Acquiring le mutex' );

		const Mutex = require( 'windows-mutex' );
		try {
			this.mutex = new Mutex( MUTEX_NAME );
		}
		catch ( e ) {
			// noop
		}

		process.on( 'exit', () => this.stop() );
	}

	static stop()
	{
		console.log( 'Releasing le mutex' );

		if ( this.mutex ) {
			this.mutex.release();
			this.mutex = undefined;
		}
	}
}
