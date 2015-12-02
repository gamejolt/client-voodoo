import express = require( 'express' );
import http = require( 'http' );

describe( 'Downloader', function()
{
	let app: express.Express;
	let server: http.Server;
	
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

	it( 'should work', function( done )
	{
		console.log( 'yay' );
		done();
	} );
} );