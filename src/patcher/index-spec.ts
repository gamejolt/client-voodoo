import express = require( 'express' );
import http = require( 'http' );
import { Patcher } from './index';
import path = require( 'path' );

describe( 'Extractor', function()
{
	let app: express.Express;
	let server: http.Server;
	let downloadDir = path.join( 'test-files', 'patched' );
	let tempDir = path.join( 'test-files', 'temp' );
	let archiveListFile = path.join( tempDir, 'archive-file-list' );

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
		let handle = Patcher.patch( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', downloadDir, {
			brotli: true,
			tempDir: tempDir,
			archiveListFile: archiveListFile,
		} );

		handle.promise
			.then( () =>
			{
				console.log( 'yay' );
				done();
			} )
			.catch( done );
	} );
} );