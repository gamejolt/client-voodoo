import * as net from 'net';

export abstract class WrapperFinder
{
	static find( id: string, port: number )
	{
		return new Promise<void>( ( resolve, reject ) =>
		{
			let conn = net.connect( { port: port, host: '127.0.0.1' } );
			conn
				.on( 'data', ( data ) =>
				{
					let parsedData: string[] = data.toString().split( ':' );
					switch ( parsedData[0] ) {
						case 'v0.0.1':
							if ( parsedData[2] === id ) {
								resolve();
							}
							else {
								reject( new Error( `Expecting wrapper id ${id}, received ${parsedData[2]}` ) );
							}
							break;
					}
					conn.end();
				} )
				.on( 'end', () =>
				{
					reject( new Error( 'Connection to wrapper ended before we got any info' ) );
				} )
				.on( 'error', ( err: NodeJS.ErrnoException ) =>
				{
					reject( new Error( 'Got an error in the connection: ' + err.message ) );
				} );
		} );
	}
}
