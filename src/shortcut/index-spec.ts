import { Shortcut } from './index';
import Common from '../common';

let clientPath = '/path/to/client';
let iconPath = '/path/to/client-icon';

describe( 'Shortcut', function()
{
	it( 'should work', Common.test( async ( done ) =>
	{
		function wait( millis: number )
		{
			return new Promise<void>( ( resolve ) => setTimeout( resolve, millis ) );
		}

		console.log( 'Setting' );
		await Shortcut.create( clientPath, iconPath );
		console.log( 'Waiting' );
		await wait( 5000 );
		console.log( 'Unsetting' );
		await Shortcut.remove();
		done();
	} ) );
} );