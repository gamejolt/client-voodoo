import * as childProcess from 'child_process';

export abstract class PidFinder
{
	static isWindows()
	{
		return process.platform === 'win32';
	}

	static find( pid: number, expectedCmd?: string )
	{
		return this.isWindows() ? this.findWindows( pid, expectedCmd ) : this.findNonWindows( pid, expectedCmd );
	}

	static findWindows( pid: number, expectedCmd?: string )
	{
		return new Promise<string>( ( resolve, reject ) =>
		{
			let cmd = childProcess.exec( 'tasklist.exe /FI:"PID eq ' + pid.toString() + ( expectedCmd ? '" /FI:"IMAGENAME eq ' + expectedCmd + '"' : '' ) +  '/FO:CSV', ( err, stdout, stderr ) =>
			{
				if ( err ) {
					return reject( err );
				}

				let data = stdout.toString().split( '\n' ).filter( ( value ) => { return !!value } );
				if ( data.length < 2 ) {
					return resolve( '' );
				}

				let imageName = expectedCmd ? ( /^\"(.*?)\",/.exec( data[1] ) ) : null;
				resolve( ( imageName && imageName.length ) ? imageName[1] : '' );
			} );
		} );
	}

	static findNonWindows( pid: number, expectedCmd?: string )
	{
		return new Promise<string>( ( resolve, reject ) =>
		{
			let cmd = childProcess.exec( 'ps -p ' + pid.toString() + ' -o cmd', ( err, stdout, stderr ) =>
			{
				if ( err ) {

					// Have to resolve to '' instead of rejecting even on error cases.
					// This is because on no processes found stupid ps also returns a failed signal code.
					// return reject( err );
					return resolve( '' );
				}

				console.log( stdout );
				let data = stdout.toString().split( '\n' );
				if ( data.length < 2 ) {
					return resolve( '' );
				}

				if ( expectedCmd && data.indexOf( expectedCmd ) === -1 ) {
					return resolve( '' );
				}

				resolve( expectedCmd ? expectedCmd : data[1] );
			} );
		} );
	}
}