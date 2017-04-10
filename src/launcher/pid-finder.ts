import * as net from 'net';
import * as path from 'path';
import { Application } from '../application';
import Common from '../common';

export abstract class WrapperFinder
{
	static find( id: string ): Promise<number>
	{
		let pidPath = path.join( Application.PID_DIR, id );
		return Common.fsReadFile( pidPath, 'utf8' )
			.then( ( port ) => {
				return new Promise<number>( ( resolve, reject ) =>
				{

					let conn = net.connect( { port: parseInt( port ), host: '127.0.0.1' } );
					conn
						.on( 'data', ( data ) =>
						{
							let parsedData: string[] = data.toString().split( ':' );
							switch ( parsedData[0] ) {
								case 'v0.0.1':
								case 'v0.1.0':
								case 'v0.2.0':
									if ( parsedData[2] === id ) {
										resolve( parseInt( port ) );
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
			} );
	}
}
