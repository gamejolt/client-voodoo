import * as childProcess from 'child_process';

export abstract class PidFinder
{
	static isWindows()
	{
		return process.platform === 'win32';
	}

	static find( pid: number )
	{
		return this.isWindows() ? this.findWindows( pid ) : this.findNonWindows( pid );
	}

	static findWindows( pid: number )
	{
		return new Promise<boolean>( ( resolve, reject ) =>
		{
			let cmd = childProcess.exec( 'tasklist.exe /FI:"PID eq ' + pid.toString() + '" /FO:CSV', ( err, stdout, stderr ) =>
			{
				if ( err ) {
					return reject( err );
				}

				let data = stdout.toString().split( '\n' ).filter( ( value ) => { return !!value } );
				resolve( data.length >= 2 );
			} );
		} );
	}

	static findNonWindows( pid: number )
	{
		return new Promise<boolean>( ( resolve, reject ) =>
		{
			let cmd = childProcess.exec( 'ps -p ' + pid.toString(), ( err, stdout, stderr ) =>
			{
				if ( err ) {
					return reject( err );
				}

				let data = stdout.toString().split( '\n' );
				resolve( data.length >= 2 );
			} );
		} );
	}
}