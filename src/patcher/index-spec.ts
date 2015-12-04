import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { SampleUnit } from '../downloader/stream-speed';
import { Patcher } from './index';
import path = require( 'path' );

describe( 'Patcher', function()
{
	let app: express.Express;
	let server: http.Server;
	let downloadFile = path.join( 'test-files', 'downloaded', 'Bug_Bash.zip' );
	let patchDir = path.join( 'test-files', 'patched' );
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

	it( 'Should work', async () =>
	{
		let downloadHandle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c737f389aa/Bug_Bash.zip.tar.bro', downloadFile, {
			brotli: false,
			overwrite: true,
			destIsFolder: false,
		} );

		downloadHandle.onProgress( SampleUnit.KBps, function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
		} );

		await downloadHandle.promise

		let patchHandle = Patcher.patch( downloadFile, patchDir, {
			brotli: true,
			tempDir: tempDir,
			archiveListFile: archiveListFile,
		} );

		return patchHandle.promise
			.then( () => {} )
	} );
} );