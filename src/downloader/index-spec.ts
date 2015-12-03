import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from './index';
import path = require( 'path' );
import { SampleUnit } from './stream-speed';

describe( 'Downloader', function()
{
	let app: express.Express;
	let server: http.Server;
	let downloadDir = path.join( 'test-files', 'downloaded' );

	before( function( done )
	{
		app = express();
		app.use( express.static( '../../test-files' ) );
		server = app.listen( 1337, function()
		{
			done();
		} );
	} );

	after( function( done )
	{
		server.close( function()
		{
			done();
		} );

		app = null;
		server = null;
	} );

	it( 'Should work', function( done )
	{
		let handle = Downloader.download( 'https://az764295.vo.msecnd.net/public/0.10.3/VSCode-linux64.zip', downloadDir );

		let waited = false;
		handle.onProgress( SampleUnit.KBps, function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
			if ( data.progress > 0.5 && !waited ) {
				console.log( 'Having a comic relief..' );
				handle.stop()
					.then( () => new Promise( ( resolve ) => setTimeout( resolve, 5000 ) ) )
					.then( () => handle.start() )
					.then( function() { waited = true; console.log( 'Had a comic relief!' ) } );
			}
		} );

		handle.promise
			.then( done )
			.catch( done );
	} );
} );