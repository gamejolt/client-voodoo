import express = require( 'express' );
import http = require( 'http' );
import { Downloader } from '../downloader';
import { Patcher, PatchHandle } from '../patcher';
import { Launcher, IParsedPid } from './index';
import { SampleUnit } from '../downloader/stream-speed';
import path = require( 'path' );
import * as del from 'del';

describe( 'Launcher', function()
{
	let app: express.Express;
	let server: http.Server;

	let localPackage: GameJolt.IGamePackage = {
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
			os_mac: true,
			os_mac_64: false,
			os_linux: false,
			os_linux_64: false,
			os_other: false,
			modified_on: 1,
		},
		file: {
			id: 1,
			filename: process.platform === 'darwin' ? 'supercrateboxosx.zip.tar.xz' : 'GJGas.exe.tar.xz',
			filesize: 1,
		},
		launch_options: [ {
			id: 1,
			os: process.platform === 'win32' ? 'windows' : ( process.platform === 'darwin' ? 'mac' : 'linux' ),
			executable_path: process.platform === 'darwin' ? 'Super Crate Box.app/' : 'GJGas.exe',
		} ],
		install_dir: path.resolve( process.cwd(), path.join( 'test-files', 'games', 'game-test-1', 'build-1' ) ),
	};

	let os;
	switch ( process.platform ) {
		case 'win32':
			os = 'windows';
			break;

		case 'linux':
			os = 'linux';
			break;

		case 'darwin':
			os = 'mac';
			break;
	}

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

	async function patch()
	{
		let patchHandle: PatchHandle = Patcher.patch(
			process.platform === 'darwin' ?
				'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/1/168/82418/files/5674a12dc66a7/supercrateboxosx.zip.tar.xz' :
				'https://s3-us-west-2.amazonaws.com/ylivay-gj-test-oregon/data/games/0/0/52250/files/566973cb4684c/GJGas.exe.tar.xz'
			, localPackage, {
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
	}

	it( 'Should work', async ( done ) =>
	{
		try {
			await patch();

			let launchHandle = Launcher.launch( localPackage, os, '32' );
			let launchInstance = await launchHandle.promise;
			await new Promise( ( resolve ) =>
			{
				launchInstance.on( 'end', () => {
					console.log( 'Finished launching' );
					resolve();
				} );
			} );
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );

	it( 'Should work when reattacahing', async ( done ) =>
	{
		try {
			await patch();

			let launchHandle = Launcher.launch( localPackage, os, '32' );
			let launchInstance = await launchHandle.promise;
			await Launcher.detach( launchInstance.pid );

			launchInstance = await Launcher.attach( launchInstance.pid );
			await new Promise( ( resolve ) =>
			{
				launchInstance.on( 'end', () => {
					console.log( 'Finished launching' );
					resolve();
				} );
			} );
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );

	it( 'Should work when reattacahing as instance', async ( done ) =>
	{
		try {
			await patch();

			let launchHandle = Launcher.launch( localPackage, os, '32' );
			let launchInstance = await launchHandle.promise;
			await Launcher.detach( launchInstance.pid );

			launchInstance = await Launcher.attach( launchInstance );
			await new Promise( ( resolve ) =>
			{
				launchInstance.on( 'end', () => {
					console.log( 'Finished launching' );
					resolve();
				} );
			} );
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );

	it( 'Should work when reattacahing as json pid', async ( done ) =>
	{
		try {
			await patch();

			let launchHandle = Launcher.launch( localPackage, os, '32' );
			let launchInstance = await launchHandle.promise;
			await Launcher.detach( launchInstance.pid );

			let expectedCmds:string[] = [];
			for ( let expectedCmd of launchInstance.cmd.values() ) {
				expectedCmds.push( expectedCmd );
			}
			let jsonPid: IParsedPid = {
				pid: launchInstance.pid,
				expectedCmds: expectedCmds,
			}

			launchInstance = await Launcher.attach( JSON.stringify( jsonPid ) );
			await new Promise( ( resolve ) =>
			{
				launchInstance.on( 'end', () => {
					console.log( 'Finished launching' );
					resolve();
				} );
			} );
			done();
		}
		catch ( err ) {
			done( err );
		}
	} );
} );
