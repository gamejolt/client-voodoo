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
		return new Promise<boolean>( ( resolve ) =>
		{
			// Need spawn because for some odd reason sometimes you cant use tasklist directly..
			let cmd = childProcess.spawn( 'cmd' );

			let out = '';
			cmd.stdout.on( 'data', ( data: Buffer ) =>
			{
				out += data.toString();
			} );

			let err = '';
			cmd.stderr.on( 'data', ( data: Buffer ) =>
			{
				err += data.toString();
			} );

			cmd.on( 'exit', () =>
			{
				let data = out.split( '\r\n' );
				resolve( data.length >= 2 && data[0].startsWith( "Image Name" ) );
			} );

			cmd.stdin.write( 'tasklist /FI:"PID eq ' + pid.toString() + '" /FO:CSV\n' );
			cmd.stdin.end();
		} );
	}

	static findNonWindows( pid: number )
	{
		return new Promise<boolean>( ( resolve, reject ) =>
		{
			// Need spawn because for some odd reason sometimes you cant use tasklist directly..
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