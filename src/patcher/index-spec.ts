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
		let build: GameJolt.IGameBuild = {
			id: 1,
			game_id: 1,
			folder: 'test',
			type: 'downloadable', // downloadable, html, flash, silverlight, unity, applet
			package: {
				id: 1,
				title: 'test',
				description: 'test',
			},
			release: {
				id: 1,
				version_number: '1.0.0',
			},
			file: {
				id: 1,
				filename: 'GJGas.exe.tar.xz',
				filesize: 1,
			},
			archive_type: 'tar.xz',
			launch_options: [ {
				id: 1,
				os: 'linux',
				executable_path: 'GJGas.exe',
			} ],
			os_windows: false,
			os_windows_64: false,
			os_mac: false,
			os_mac_64: false,
			os_linux: true,
			os_linux_64: false,
			os_other: false,
			modified_on: 1,
			install_dir: path.resolve( process.cwd(), path.join( 'test-files', 'games', 'game-test-1', 'build-1' ) ),
		}

		let patchHandle = Patcher.patch( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
			overwrite: true,
			decompressInDownload: false,
		} );

		patchHandle
			.onDownloading( function()
			{
				console.log( 'Downloading...' );
			} )
			.onProgress( SampleUnit.KBps, function( data )
			{
				console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
				console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + 'kbps' );
			} )
			.onPatching( function()
			{
				console.log( 'Patching...' );
			} )
			.start();

		return patchHandle.promise;
	} );
} );