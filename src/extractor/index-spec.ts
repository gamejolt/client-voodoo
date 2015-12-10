import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { Extractor } from './index';
import { SampleUnit } from '../downloader/stream-speed';
import path = require( 'path' );

let gzip = require( 'gunzip-maybe' );
let xz = require( 'lzma-native' ).createDecompressor;

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

	it( 'Should work with tar.gz files', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5666cfe4c69d9/Bug_Bash.exe.tar.gz', downloadFile, {
			overwrite: true,
			decompressStream: gzip(),
		} );

		handle.onProgress( SampleUnit.KBps, function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
		} );

		await handle.promise;

		return Extractor.extract( handle.to, path.join( 'test-files', 'extracted', path.basename( handle.to ) ), {
			deleteSource: true,
			overwrite: true,
		} ).promise;
	} );

	it( 'Should work with tar.xz files', async () =>
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz', downloadFile, {
			overwrite: true,
			decompressStream: xz(),
		} );

		handle.onProgress( SampleUnit.KBps, function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.sample.current ) + ' kbps (' + data.sample.currentAverage + ' kbps current average), peak: ' + Math.floor( data.sample.peak ) + ' kbps, low: ' + Math.floor( data.sample.low ) + ', average: ' + Math.floor( data.sample.average ) + ' kbps' );
		} );

		await handle.promise;

		return Extractor.extract( handle.to, path.join( 'test-files', 'extracted', path.basename( handle.to ) ), {
			deleteSource: true,
			overwrite: true,
		} ).promise;
	} );
} );