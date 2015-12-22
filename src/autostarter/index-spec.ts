import { Autostarter } from './index';
import Common from '../common';

let clientPath = '/path/to/client';
let runnerPath = '/path/to/client-runner';

describe( 'Autostarter', function()
{
	it( 'should work', Common.test( async ( done ) =>
	{
		function wait( millis: number )
		{
			return new Promise<void>( ( resolve ) => setTimeout( resolve, millis ) );
		}

		console.log( 'Setting' );
		await Autostarter.set( clientPath, [ '--silent-start' ], runnerPath );
		console.log( 'Waiting' );
		await wait( 5000 );
		console.log( 'Unsetting' );
		await Autostarter.unset( runnerPath );
		done();
	} ) );
} );