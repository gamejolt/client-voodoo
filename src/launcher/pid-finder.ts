import * as childProcess from 'child_process';

function log( message: string )
{
	console.log( 'Pid Finder: ' + message );
}

function debug( message: string )
{
	if ( process.env.NODE_ENV === 'development' ) {
		console.log( 'Pid Finder: ' + message );
	}
}

export abstract class PidFinder
{
	static isWindows()
	{
		return process.platform === 'win32';
	}

	static find( pid: number, expectedCmd?: Set<string> )
	{
		return PidFinder.isWindows() ? PidFinder.findWindows( pid, expectedCmd ) : PidFinder.findNonWindows( pid, expectedCmd );
	}

	static findWindows( pid: number, expectedCmd?: Set<string> )
	{
		return new Promise<Set<string>>( ( resolve, reject ) =>
		{
			let expectedCmdArray: string[] = [];
			if ( expectedCmd && expectedCmd.size ) {
				for ( let expectedCmdValue of expectedCmd.values() ) {
					expectedCmdArray.push( expectedCmdValue );
				}
				debug( 'Finding pid on windows. pid: ' + pid + ', expected cmds: ' + JSON.stringify( expectedCmdArray ) );
			}
			else {
				debug( 'Finding pid on windows. pid: ' + pid + ', no expected cmd' );
			}

			debug( 'Running cmd: "tasklist.exe /FI"pid eq ' + pid + '" /FO:CSV"' );
			let cmd = childProcess.exec( 'tasklist.exe /FI:"PID eq ' + pid.toString() + '" /FO:CSV', ( err, stdout, stderr ) =>
			{
				let result = new Set<string>();
				if ( err ) {
					log( 'Error: ' + err.message );
					return reject( err );
				}

				let dataStr = stdout.toString();
				debug( 'Result: ' + dataStr );
				let data = dataStr.split( '\n' ).filter( ( value ) => { return !!value } );
				if ( data.length < 2 ) {
					return resolve( result );
				}

				let found = false;
				for ( let i = 1; i < data.length; i++ ) {
					let imageName = /^\"(.*?)\",/.exec( data[i] );
					if ( expectedCmd && expectedCmd.has( imageName[1] ) ) {
						debug( 'Bingo, we\'re still running' );
						found = true;
					}
					debug( 'Found matching process: ' + imageName[1] );
					result.add( imageName[1] );
				}

				if ( expectedCmd && expectedCmd.size && !found ) {
					log( 'Expected to match with a cmd name but none did.' );
					log( 'Returning empty set' );
					result.clear();
					resolve( result );
				}

				debug( 'Returning' );
				resolve( result );
			} );
		} );
	}

	static findNonWindows( pid: number, expectedCmd?: Set<string> )
	{
		return new Promise<Set<string>>( ( resolve, reject ) =>
		{
			let expectedCmdArray: string[] = [];
			if ( expectedCmd && expectedCmd.size ) {
				for ( let expectedCmdValue of expectedCmd.values() ) {
					expectedCmdArray.push( expectedCmdValue );
				}
				debug( 'Finding pid on non windows. pid: ' + pid + ', expected cmds: ' + JSON.stringify( expectedCmdArray ) );
			}
			else {
				debug( 'Finding pid on non windows. pid: ' + pid + ', no expected cmd' );
			}

			let cmdFormat = process.platform === 'linux' ? 'cmd' : 'command';
			debug( 'Running cmd: "ps -p ' + pid + ' -o ' + cmdFormat + '"' );
			let cmd = childProcess.exec( 'ps -p ' + pid.toString() + ' -o ' + cmdFormat, ( err, stdout, stderr ) =>
			{
				let result = new Set<string>();
				if ( err ) {
					debug( 'Error: ' + err.message );
					debug( 'Suppressing, returning empty set' );
					// Have to resolve to '' instead of rejecting even on error cases.
					// This is because on no processes found stupid ps also returns a failed signal code.
					// return reject( err );
					return resolve( result );
				}

				let dataStr = stdout.toString();
				debug( 'Result: ' + dataStr );
				let data = dataStr.split( /[\r\n]/ ).filter( ( value ) => { return !!value } );

				let found = false;
				for ( let i = 1; i < data.length; i++ ) {
					if ( expectedCmd && expectedCmd.has( data[i] ) ) {
						debug( 'Bingo, we\'re still running' );
						found = true;
					}
					debug( 'Found matching process: ' + data[i] );
					result.add( data[i] );
				}

				if ( expectedCmd && expectedCmd.size && !found ) {
					log( 'Expected to match with a cmd name but none did.' );
					log( 'Returning empty set' );
					result.clear();
					resolve( result );
				}

				debug( 'Returning' );
				resolve( result );
			} );
		} );
	}
}