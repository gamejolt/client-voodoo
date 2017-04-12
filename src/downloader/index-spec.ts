import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from './index';
import path = require( 'path' );
import { SampleUnit } from './stream-speed';
import * as del from 'del';
import Common from '../common';

let gzip = require( 'gunzip-maybe' );
// let xz = require( 'lzma-native' ).createDecompressor;

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

	beforeEach( () =>
	{
		return del( 'test-files/!(.gj-*)' );
	} );

	it( 'Should download a resumable file', Common.test( async ( done ) =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
			overwrite: true,
		} );

		let waited = false;
		let paused = false;

		handle
			.onProgress( SampleUnit.KBps, ( data ) =>
			{
				Common.test( async () =>
				{
					console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
					console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
					if ( data.progress > 0.5 && !waited ) {
						if ( paused ) {
							throw new Error( 'Got onProgress event while paused' );
						}
						console.log( 'Having a comic relief..' );

						await handle.stop();
						paused = true;
						let wait = new Promise( ( resolve ) => setTimeout( resolve, 3000 ) );
						await wait;
						await handle.start();

						waited = true;
						paused = false;
						console.log( 'Had a comic relief!' );
					}
				}, done ).apply( this );
			} )
			.start();

		await handle.promise;
		done();
	} ) );

	it( 'Should handle pausing right away', Common.test( async ( done ) =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
			overwrite: true,
		} );

		let waited = false;
		let paused = false;

		handle
			.onProgress( SampleUnit.KBps, ( data ) =>
			{
				Common.test( async () =>
				{
					console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
					console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
					if ( paused ) {
						throw new Error( 'Got onProgress event while paused' );
					}
				}, done ).apply( this );
			} )
			.start();

		// Waiting for one tick to allow .start() to take effect (happens on next tick due to delayed promise resolving)
		let wait = new Promise( ( resolve ) => setTimeout( resolve, 1 ) );
		await wait;

		console.log( 'Having a comic relief..' );
		await handle.stop();
		paused = true;
		wait = new Promise( ( resolve ) => setTimeout( resolve, 2000 ) );
		await wait;
		await handle.start();

		waited = true;
		paused = false;
		console.log( 'Had a comic relief!' );

		await handle.promise;
		done();
	} ) );

	it( 'Should continue normally when state is stopped and started during startup', Common.test( async ( done ) =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
			overwrite: true,
		} );

		handle
			.onProgress( SampleUnit.KBps, ( data ) =>
			{
				Common.test( async () =>
				{
					console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
					console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
				}, done ).apply( this );
			} )
			.start();

		// Waiting for one tick to allow .start() to take effect (happens on next tick due to delayed promise resolving)
		let wait = new Promise( ( resolve ) => setTimeout( resolve, 1 ) );
		await wait;

		console.log( 'Stopping..' );
		handle.stop();

		wait = new Promise( ( resolve ) => setTimeout( resolve, 1 ) );
		await wait;

		console.log( 'Starting again...' );
		handle.start();

		await handle.promise;
		done();
	} ) );

	it( 'Should download a gzip file', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5666cfe4c69d9/Bug_Bash.exe.tar.gz', downloadFile, {
			overwrite: true,
			decompressStream: gzip(),
		} );

		handle
			.onProgress( SampleUnit.KBps, function( data )
			{
				console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
				console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
			} )
			.start();

		return handle.promise;
	} );

	it( 'Should download a xz file', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
			overwrite: true,
			// decompressStream: xz(),
		} );

		handle
			.onProgress( SampleUnit.KBps, function( data )
			{
				console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
				console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
			} )
			.start();

		return handle.promise;
	} );
} );
