import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { Extractor } from './index';
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

	it( 'Should work', function( done )
	{
		let handle = Downloader.download( 'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/565c79c01300a/cabinvania.zip.tar.bro', downloadDir );

		handle.onProgress( function( data )
		{
			console.log( 'Download progress: ' + Math.floor( data.progress * 100 ) + '%' );
			console.log( 'Current speed: ' + Math.floor( data.curKbps ) + ' kbps, peak: ' + Math.floor( data.peakKbps ) + ' kbps, low: ' + Math.floor( data.lowKbps ) + ', average: ' + Math.floor( data.avgKbps ) + ' kbps' );
		} );

		handle.promise
			.then( () => Extractor.extract( handle.toFullpath, path.join( 'test-files', 'extracted', handle.toFilename ), {
				deleteSource: true,
				overwrite: true,
			} ) )
			.then( () => done() )
			.catch( done );
	} );
} );