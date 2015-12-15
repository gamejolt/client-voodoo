import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { Extractor } from './index';
import { SampleUnit } from '../downloader/stream-speed';
import path = require( 'path' );
import * as del from 'del';

let gzip = require( 'gunzip-maybe' );
let xz:Function = require( 'lzma-native' ).createDecompressor.bind( this, {
	synchronous:  true,
} );

describe( 'Extractor', function()
{
	let app: express.Express;
	let server: http.Server;
	let downloadFile = path.join( 'test-files', 'downloaded', 'Bug_Bash.zip.tar' );

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

	it( 'Should work with tar.gz files', async () =>
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

		await handle.promise;

		let extractHandle = Extractor.extract( handle.to, path.join( 'test-files', 'extracted', path.basename( handle.to ) ), {
			deleteSource: true,
			overwrite: true,
		} );

		await extractHandle.start();
		return extractHandle.promise;
	} );

	it( 'Should work with tar.xz files', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
			overwrite: true,
			decompressStream: xz(),
		} );

		handle
			.onProgress( SampleUnit.KBps, function( data )
			{
				console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
				console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
			} )
			.start();

		await handle.promise;

		let extractHandle = Extractor.extract( handle.to, path.join( 'test-files', 'extracted', path.basename( handle.to ) ), {
			deleteSource: true,
			overwrite: true,
		} );

		await extractHandle.start();
		return extractHandle.promise;
	} );

	it( 'Should allow resumable extraction', async ( done ) =>
	{
		let extractionHandle = Extractor.extract( 'test-files/.gj-bigTempDownload.tar', path.join( 'test-files', 'extracted', path.basename( 'test' ) ), {
			deleteSource: false,
			overwrite: true,
		} );

		await extractionHandle.start();

		let waited = false;
		extractionHandle.promise.then( () =>
		{
			if ( !waited ) {
				done( new Error( 'Extraction finished too fast! Run again with a shorter delay.' ) );
				return;
			}
			done();
		} );

		// What a hacky way to catch the extraction in the middle. Don't judge me.
		// If resumes too fast it means the file is fully extracted or is fully contained in the readable stream's internal buffer.
		// Use a bigger file!
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

		await extractionHandle.stop();
		console.log( 'Stopping to smell the bees.' );
		await new Promise( ( resolve ) => setTimeout( resolve, 3000 ) );
		waited = true;
		console.log( 'I meant flowers.' );
		await extractionHandle.start();

		await extractionHandle.promise;
	} );
} );