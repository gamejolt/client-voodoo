import { expect } from 'chai';
import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { SampleUnit } from '../downloader/stream-speed';
import { Patcher, IPatcherOptions, PatchOperation } from '../patcher';
import { VoodooQueue } from './index';
import path = require( 'path' );
import Common from '../common';
import * as del from 'del';

import { EventEmitter } from 'events';

describe( 'Voodoo queue', function()
{
	let app: express.Express;
	let server: http.Server;
	let localPackage1: GameJolt.IGamePackage = {
		id: 1,
		title: 'test',
		description: 'test',
		release: {
			id: 1,
			version_number: '1.0.0',
		},
		build: {
			id: 1,
			game_id: 1,
			folder: 'test',
			type: 'downloadable', // downloadable, html, flash, silverlight, unity, applet
			archive_type: 'tar.xz',
			os_windows: false,
			os_windows_64: false,
			os_mac: false,
			os_mac_64: false,
			os_linux: true,
			os_linux_64: false,
			os_other: false,
			modified_on: 1,
		},
		file: {
			id: 1,
			filename: 'GJGas.exe.tar.xz',
			filesize: 1,
		},
		launch_options: [ {
			id: 1,
			os: 'linux',
			executable_path: 'GJGas.exe',
		} ],
		install_dir: path.resolve( process.cwd(), path.join( 'test-files', 'games', 'game-test-1', 'build-1' ) ),
	}

	let localPackage2: GameJolt.IGamePackage = {
		id: 1,
		title: 'test',
		description: 'test',
		release: {
			id: 1,
			version_number: '1.0.0',
		},
		build: {
			id: 2,
			game_id: 1,
			folder: 'test',
			type: 'downloadable', // downloadable, html, flash, silverlight, unity, applet
			archive_type: 'tar.xz',
			os_windows: false,
			os_windows_64: false,
			os_mac: false,
			os_mac_64: false,
			os_linux: true,
			os_linux_64: false,
			os_other: false,
			modified_on: 1,
		},
		file: {
			id: 1,
			filename: 'GJGas.exe.tar.xz',
			filesize: 1,
		},
		launch_options: [ {
			id: 1,
			os: 'linux',
			executable_path: 'GJGas.exe',
		} ],
		install_dir: path.resolve( process.cwd(), path.join( 'test-files', 'games', 'game-test-1', 'build-2' ) ),
	}
	let patchUrl = 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz';

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

	afterEach( () =>
	{
		return VoodooQueue.reset( true );
	} );

	function getPatch( url?: string, options?: IPatcherOptions, localPackage?: GameJolt.IGamePackage )
	{
		let patchHandle = Patcher.patch( url || patchUrl, localPackage || localPackage1, options || {
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
			.onExtractProgress( SampleUnit.KBps, function( data )
			{
				console.log( 'Extraction progress: ' + Math.floor( data.progress * 100 ) + '%' );
				console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
			} )
			.onFile( function( file )
			{
				console.log( 'Extracted file: ' + file.name );
			} )
			.start();

		return patchHandle;
	}

	it( 'Should work', Common.test( async ( done ) =>
	{
		await getPatch().promise;
		done();
	} ) );

	it( 'Should pend a downloading task', Common.test( async ( done ) =>
	{
		await VoodooQueue.setMaxDownloads( 0 );
		let patch = getPatch();
		patch.onPaused( Common.test( () =>
		{
			expect( patch.state ).to.eq( PatchOperation.DOWNLOADING );
			expect( patch.isRunning() ).to.eq( false );
			done();
		}, done ) );
		await patch.promise;
	} ) );

	it( 'Should pend an extraction task', Common.test( async ( done ) =>
	{
		console.log( 'Preparing...' );
		await Common.mkdirp( localPackage1.install_dir );
		await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( localPackage1.install_dir, '.gj-tempDownload' ) );

		await VoodooQueue.setMaxExtractions( 0 );
		let patch = getPatch();
		patch.onPaused( Common.test( () =>
		{
			expect( patch.state ).to.eq( PatchOperation.PATCHING );
			expect( patch.isRunning() ).to.eq( false );
			done();
		}, done ) );
		await patch.promise;
	} ) );

	it( 'Should pend a second download task and resume it when the first finishes', Common.test( async ( done ) =>
	{
		await VoodooQueue.setMaxDownloads( 1 );

		let firstFinishedDownloading = false;
		let resumed = false;

		let patch = getPatch();
		patch
			.onDownloading( Common.test( () =>
			{
				let patch2 = getPatch( null, null, localPackage2 );
				patch2
					.onPaused( Common.test( () =>
					{
						console.log( 'PAUSED' );
						expect( patch2.state ).to.eq( PatchOperation.DOWNLOADING );
						expect( patch2.isRunning() ).to.eq( false );
						expect( firstFinishedDownloading ).to.eq( false );
					}, done ) )
					.onResumed( Common.test( () =>
					{
						console.log( 'RESUMED' );
						expect( patch2.state ).to.eq( PatchOperation.DOWNLOADING );
						expect( patch2.isRunning() ).to.eq( true );
						expect( firstFinishedDownloading ).to.eq( true );
						resumed = true;
					}, done ) )
					.onProgress( SampleUnit.KBps, Common.test( () =>
					{
						if ( resumed ) {
							done();
						}
					}, done ) );
			}, done ) )
			.onPatching( () => { firstFinishedDownloading = true } );
		await patch.promise;
	} ) );

	it( 'Should pend a second extraction task and resume it when the first finishes', Common.test( async ( done ) =>
	{
		console.log( 'Preparing...' );
		await Common.mkdirp( localPackage1.install_dir );
		await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( localPackage1.install_dir, '.gj-tempDownload' ) );
		await Common.mkdirp( localPackage2.install_dir );
		await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( localPackage2.install_dir, '.gj-tempDownload' ) );

		await VoodooQueue.setMaxExtractions( 1 );

		let firstFinished = false;
		let resumed = false;

		let patch = getPatch( null, {
			overwrite: false,
			decompressInDownload: false
		} );

		patch
			.onPatching( Common.test( async () =>
			{
				console.log( 'First patching' );
				let patch2 = getPatch( null, {
					overwrite: false,
					decompressInDownload: false
				}, localPackage2 );

				patch2
					.onPaused( Common.test( () =>
					{
						console.log( 'Second paused' );
						expect( patch2.state ).to.eq( PatchOperation.PATCHING );
						expect( patch2.isRunning() ).to.eq( false );
						expect( firstFinished ).to.eq( false );
					}, done ) )
					.onResumed( Common.test( () =>
					{
						console.log( 'Second resumed' );
						expect( patch2.state ).to.eq( PatchOperation.PATCHING );
						expect( patch2.isRunning() ).to.eq( true );
						expect( firstFinished ).to.eq( true );
						resumed = true;
					}, done ) )
					.onExtractProgress( SampleUnit.KBps, Common.test( () =>
					{
						expect( firstFinished ).to.eq( true );
						if ( resumed ) {
							done();
						}
					}, done ) );
				await patch2.promise;
				console.log( 'Second finished' );
			}, done ) );
		await patch.promise;
		console.log( 'First finished' );
		firstFinished = true;
	} ) );

	it( 'Should pend a downloading task and resume it upon increasing the limit', Common.test( async ( done ) =>
	{
		await VoodooQueue.setMaxDownloads( 0 );

		let patch = getPatch();
		patch
			.onPaused( Common.test( async () =>
			{
				expect( patch.state ).to.eq( PatchOperation.DOWNLOADING );
				expect( patch.isRunning() ).to.eq( false );
				await wait( 1000 );
				await VoodooQueue.setMaxDownloads( 1 );
			}, done ) )
			.onResumed( () => done() );

		await patch.promise;
	} ) );

	it( 'Should pend an extraction task and resume it upon increasing the limit', Common.test( async ( done ) =>
	{
		console.log( 'Preparing...' );
		await Common.mkdirp( localPackage1.install_dir );
		await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( localPackage1.install_dir, '.gj-tempDownload' ) );

		await VoodooQueue.setMaxExtractions( 0 );

		let patch = getPatch( null, {
			 overwrite: false,
			 decompressInDownload: false,
		} );
		patch
			.onPaused( Common.test( async () =>
			{
				expect( patch.state ).to.eq( PatchOperation.PATCHING );
				expect( patch.isRunning() ).to.eq( false );
				await wait( 1000 );
				await VoodooQueue.setMaxExtractions( 1 );
			}, done ) )
			.onResumed( () => done() );

		await patch.promise;
	} ) );

	it( 'Should pend a downloading task upon decreasing the limit', Common.test( async ( done ) =>
	{
		let patch = getPatch();
		patch
			.onDownloading( Common.test( async () =>
			{
				expect( patch.state ).to.eq( PatchOperation.DOWNLOADING );
				expect( patch.isRunning() ).to.eq( true );
				await VoodooQueue.setMaxDownloads( 0 );
			}, done ) )
			.onProgress( SampleUnit.KBps, Common.test( () =>
			{
				throw new Error( 'Unexpected any progress events' );
			}, done ) )
			.onPaused( () => done() );

		await patch.promise;
	} ) );

	it( 'Should pend an extraction task upon decreasing the limit', Common.test( async ( done ) =>
	{
		console.log( 'Preparing...' );
		await Common.mkdirp( localPackage1.install_dir );
		await Common.fsCopy( path.join( 'test-files', '.gj-bigTempDownload.tar.xz' ), path.join( localPackage1.install_dir, '.gj-tempDownload' ) );

		let patch = getPatch( null, {
			 overwrite: false,
			 decompressInDownload: false,
		} );

		patch
			.onPatching( Common.test( async () =>
			{
				expect( patch.state ).to.eq( PatchOperation.PATCHING );
				expect( patch.isRunning() ).to.eq( true );
				await VoodooQueue.setMaxExtractions( 0 );
			}, done ) )
			.onExtractProgress( SampleUnit.KBps, Common.test( () =>
			{
				throw new Error( 'Unexpected any progress events' );
			}, done ) )
			.onPaused( () => done() );

		await patch.promise;
	} ) );

	it( 'Should let two patch instances run concurrently without blocking each other', Common.test( async ( done ) =>
	{
		let patch = getPatch();
		patch
			.onPaused( Common.test( () =>
			{
				throw new Error( 'Patch 1 got paused' );
			}, done ) );

		let patch2 = getPatch( null, null, localPackage2 );
		patch2
			.onPaused( Common.test( () =>
			{
				throw new Error( 'Patch 2 got paused' );
			}, done ) );

		await Promise.all( [ patch.promise, patch2.promise ] );
		done();
	} ) );
} );
