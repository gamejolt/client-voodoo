import * as childProcess from 'child_process';

export abstract class PidFinder
{
	static isWindows()
	{
		return process.platform === 'win32';
	}

	static find( pid: number, expectedCmd?: Set<string> )
	{
		return this.isWindows() ? this.findWindows( pid, expectedCmd ) : this.findNonWindows( pid, expectedCmd );
	}

	static findWindows( pid: number, expectedCmd?: Set<string> )
	{
		return new Promise<Set<string>>( ( resolve, reject ) =>
		{
			let cmd = childProcess.exec( 'tasklist.exe /FI:"PID eq ' + pid.toString() + '" /FO:CSV', ( err, stdout, stderr ) =>
			{
				let result = new Set<string>();
				if ( err ) {
					return reject( err );
				}

				let data = stdout.toString().split( '\n' ).filter( ( value ) => { return !!value } );
				if ( data.length < 2 ) {
					return resolve( result );
				}

				let found = false;
				for ( let i = 1; i < data.length; i++ ) {
					let imageName = /^\"(.*?)\",/.exec( data[i] );
					if ( expectedCmd && expectedCmd.has( imageName[1] ) ) {
						found = true;
					}
					result.add( imageName[1] );
				}

				if ( expectedCmd && !found ) {
					result.clear();
					resolve( result );
				}

				resolve( result );
			} );
		} );
	}

	static findNonWindows( pid: number, expectedCmd?: Set<string> )
	{
		return new Promise<Set<string>>( ( resolve, reject ) =>
		{
			let cmd = childProcess.exec( 'ps -p ' + pid.toString() + ' -o cmd', ( err, stdout, stderr ) =>
			{
				let result = new Set<string>();
				if ( err ) {

					// Have to resolve to '' instead of rejecting even on error cases.
					// This is because on no processes found stupid ps also returns a failed signal code.
					// return reject( err );
					return resolve( result );
				}

				let data = stdout.toString().split( '\n' ).filter( ( value ) => { return !!value } );

				let found = false;
				for ( let i = 1; i < data.length; i++ ) {
					if ( expectedCmd && expectedCmd.has( data[i] ) ) {
						found = true;
					}
					result.add( data[i] );
				}

				if ( expectedCmd && !found ) {
					result.clear();
					resolve( result );
				}

				resolve( result );
			} );
		} );
	}
}