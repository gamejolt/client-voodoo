import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from './index';
import path = require( 'path' );
import { SampleUnit } from './stream-speed';

let decompressStream = require( 'iltorb' ).decompressStream;

describe( 'Downloader', function()
{
	let app: express.Express;
	let server: http.Server;
	let downloadFile = path.join( 'test-files', 'downloaded', 'Bug_Bash.zip' );

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

	it( 'Should download a resumable non-brotli file', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip', downloadFile, {
			overwrite: true,
		} );

		let waited = false;
		handle.onProgress( SampleUnit.KBps, async ( data ) =>
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
			if ( data.progress > 0.5 && !waited ) {
				console.log( 'Having a comic relief..' );

				await handle.stop();
				let wait = new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
				await wait;
				await handle.start();

				waited = true;
				console.log( 'Had a comic relief!' );
			}
		} );

		return handle.promise;
	} );

	it( 'Should download a non-resumable brotli file', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', downloadFile, {
			overwrite: true,
			decompressStream: decompressStream(),
		} );

		handle.onProgress( SampleUnit.KBps, function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
		} );

		return handle.promise;
	} );
} );