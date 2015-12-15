import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { SampleUnit } from '../downloader/stream-speed';
import { Patcher } from './index';
import path = require( 'path' );
import Common from '../common';
import * as del from 'del';

describe( 'Patcher', function()
{
	let app: express.Express;
	let server: http.Server;
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

	let wait = function( millis: number )
	{
		return new Promise<void>( ( resolve ) => setTimeout( resolve, millis ) );
	};

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

	beforeEach( () =>
	{
		return del( 'test-files/!(.gj-*)' );
	} );

	it( 'Should work', async () =>
	{
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
			.start( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz' );

		return patchHandle.promise;
	} );

	it( 'Should be resumable after pausing right away', async ( done ) =>
	{
		try {
			let patchHandle = Patcher.patch( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
				overwrite: true,
				decompressInDownload: false,
			} );

			patchHandle
				.onDownloading( async function()
				{
					try {
					console.log( 'Downloading...' );
					console.log( 'Pausing...' );
					await patchHandle.stop();
					await wait( 5000 );
					console.log( 'Resuming...' );
					await patchHandle.start();
					}
					catch ( err ) {
						console.error( err );
						console.log( err.stack );
					}
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
				.start( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz' );

			await patchHandle.promise;
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );

	it( 'Should be resumable after pausing while downloading', async ( done ) =>
	{
		try {
			let patchHandle = Patcher.patch( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
				overwrite: true,
				decompressInDownload: false,
			} );

			patchHandle
				.onDownloading( async function()
				{
					console.log( 'Downloading...' );
					await wait( 3000 );
					console.log( 'Pausing...' );
					await patchHandle.stop();
					await wait( 5000 );
					console.log( 'Resuming...' );
					await patchHandle.start();
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
				.start( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz' );

			await patchHandle.promise;
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );

	it( 'Should be resumable after pausing right after downloading', async ( done ) =>
	{
		try {
			console.log( 'Preparing...' );
			await Common.mkdirp( build.install_dir );
			await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( build.install_dir, '.gj-tempDownload' ) );

			let patchHandle = Patcher.patch( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
				overwrite: false, // false because im tricking patcher into thinking it already downloaded a hugeass file.
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
				.onPatching( async function()
				{
					console.log( 'Patching...' );
					console.log( 'Pausing...' );
					await patchHandle.stop();
					await wait( 5000 );
					console.log( 'Resuming...' );
					await patchHandle.start();
				} )
				.start( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz' );

			await patchHandle.promise;
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );

	it( 'Should be resumable after pausing in the middle of extracting', async ( done ) =>
	{
		try {
			console.log( 'Preparing...' );
			await Common.mkdirp( build.install_dir );
			await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( build.install_dir, '.gj-tempDownload' ) );

			let patchHandle = Patcher.patch( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', build, {
				overwrite: false, // false because im tricking patcher into thinking it already downloaded a hugeass file.
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
				.onPatching( async function()
				{
					console.log( 'Patching...' );
					await wait( 1000 ); // Might fail if the extraction finishes really fast. HMMM.
					console.log( 'Pausing...' );
					await patchHandle.stop();
					await wait( 5000 );
					console.log( 'Resuming...' );
					/* await */ patchHandle.start(); // Dont await here before that makes you wait for the whole extraction to finish.
				} )
				.start( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz' );

			await patchHandle.promise;
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );
} );