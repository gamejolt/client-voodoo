import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { Patcher } from '../patcher';
import { Launcher } from './index';
import { SampleUnit } from '../downloader/stream-speed';
import path = require( 'path' );

describe( 'Launcher', function()
{
	let app: express.Express;
	let server: http.Server;
	let downloadFile = path.join( 'test-files', 'downloaded', 'UpSolom_Core.zip' );
	let patchDir = path.join( 'test-files', 'patched' );
	let tempDir = path.join( 'test-files', 'temp' );
	let archiveListFile = path.join( tempDir, 'archive-file-list' );
	let executableFile = path.join( 'test-files', 'patched', 'UpSolom_Core-Linux', 'UpSolom-Core.x86' );

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
		let downloadHandle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5664c7568fb3d/UpSolom_Core-Linux.zip.tar.bro', downloadFile, {
			brotli: false,
			overwrite: false,
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

		await patchHandle.promise;

		let launchHandle = Launcher.launch( executableFile );
		let pid = await launchHandle.promise;
	} );
} );