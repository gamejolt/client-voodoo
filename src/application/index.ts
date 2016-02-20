const MUTEX_NAME = 'game-jolt-client';
export abstract class Application
{
	private static mutex;

	static start()
	{
		let Mutex = require( 'windows-mutex' );
		console.log( 'Acquiring le mutex' );
		this.mutex = null;
		try {
			this.mutex = new Mutex( MUTEX_NAME );
		}
		catch (e) {
			// noop
		}

		process.on( 'exit', () => this.stop() );
	}

	static stop()
	{
		console.log( 'Releasing le mutex' );
		if ( this.mutex ) {
			this.mutex.release();
			this.mutex = null;
		}
	}
}