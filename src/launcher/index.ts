import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as _ from 'lodash';

import { PidFinder } from './pid-finder';

let Bluebird = require( 'bluebird' );
let fsExists = function( path: string ): Promise<boolean>
{
	return new Promise<boolean>( function( resolve )
	{
		fs.exists( path, resolve );
	} );
}
let fsStat:( path: string ) => Promise<fs.Stats> = Bluebird.promisify( fs.stat );
let fsChmod:( path: string, mode: string | number ) => Promise<void> = Bluebird.promisify( fs.chmod );

export interface ILaunchOptions
{
	pollInterval: number;
}

export abstract class Launcher
{
	static launch( build: GameJolt.IGameBuild, os: string, arch: string, options?: ILaunchOptions ): LaunchHandle
	{
		return new LaunchHandle( build, os, arch, options );
	}

	static async attach( pid: number, pollInterval?: number )
	{
		return new LaunchInstanceHandle( pid, pollInterval );
	}
}

export class LaunchHandle
{
	private _promise: Promise<LaunchInstanceHandle>;
	private _file: string;

	constructor( private _build: GameJolt.IGameBuild, private _os: string, private _arch: string, options?: ILaunchOptions )
	{
		options = options || {
			pollInterval: 1000,
		};

		this._promise = this.start( options.pollInterval );
	}

	get build()
	{
		return this._build;
	}

	get file()
	{
		return this._file;
	}

	get promise()
	{
		return this._promise;
	}

	private findLaunchOption()
	{
		let result: GameJolt.IGameBuildLaunchOptions = null;
		for ( let launchOption of this._build.launch_options ) {
			let lOs = launchOption.os.split( '_' );
			if ( lOs.length === 1 ) {
				lOs.push( '32' );
			}
			if ( lOs[0] === this._os ) {
				if ( lOs[1] === this._arch ) {
					return launchOption;
				}
				result = launchOption;
			}
		}
		return result;
	}

	private async start( pollInterval: number )
	{
		let launchOption = this.findLaunchOption();
		if ( !launchOption ) {
			throw new Error( 'Can\'t find valid launch options for the given os/arch' );
		}

		var executablePath = launchOption.executable_path.replace( /\//, path.sep );
		this._file = path.join( this._build.install_dir, executablePath );

		// If the destination already exists, make sure its valid.
		if ( !(await fsExists( this._file ) ) ) {
			throw new Error( 'Can\'t launch because the file doesn\'t exist.' );
		}

		// Make sure the destination is a file.
		let stat = await fsStat( this._file );
		if ( !stat.isFile() ) {
			throw new Error( 'Can\'t launch because the file isn\'t valid.' );
		}

		// Make sure the file is executable
		if ( process.platform !== 'win32' ) { // We dont care about windows. Everything's executable. Have a good day virus makers.
			let mode = stat.mode;
			if ( !mode ) {
				throw new Error( 'Can\'t determine if the file is executable by the current user.' );
			}

			let uid = stat.uid;
			let gid = stat.gid;

			if ( !( mode & parseInt( '0001', 8 ) ) &&
					!( mode & parseInt( '0010', 8 ) ) && process.getgid && gid === process.getgid() &&
					!( mode & parseInt( '0100', 8 ) ) && process.getuid && uid === process.getuid() ) {

				// Ensure that the main launcher file is executable.
				await fsChmod( this._file, '0777' );
			}
		}

		let spawnCommand = ( process.platform === 'darwin' ? 'open ' : '' ) + this._file;
		let child = childProcess.spawn( spawnCommand, [], {
			cwd: path.dirname( this._file ),
			detached: true,
		} );

		let pid = child.pid;
		child.unref();

		return new LaunchInstanceHandle( pid, pollInterval );
	}
}

export class LaunchInstanceHandle extends EventEmitter
{
	private _interval: NodeJS.Timer;

	constructor( private _pid: number, pollInterval?: number )
	{
		super();
		this._interval = setInterval( () => this.tick(), pollInterval || 1000 );
	}

	get pid()
	{
		return this._pid;
	}

	tick()
	{
		PidFinder.find( this._pid )
			.then( ( result ) =>
			{
				if ( !result ) {
					throw new Error( 'Process doesn\'t exist anymore' );
				}
			} )
			.catch( ( err ) =>
			{
				clearInterval( this._interval );
				this.emit( 'end', err );
			} );
	}
}
