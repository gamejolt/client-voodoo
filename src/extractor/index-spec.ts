import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { Extractor } from './index';
import { SampleUnit } from '../downloader/stream-speed';
import path = require( 'path' );

describe( 'Extractor', function()
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

	it( 'Should work', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', downloadDir, {
			brotli: true,
			overwrite: true,
		} );

		handle.onProgress( SampleUnit.KBps, function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
		} );

		await handle.promise;

		return Extractor.extract( handle.toFullpath, path.join( 'test-files', 'extracted', handle.toFilename ), {
			brotli: false,
			deleteSource: true,
			overwrite: true,
		} ).promise;
	} );
} );