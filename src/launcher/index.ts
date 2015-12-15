import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as _ from 'lodash';
import Common from '../common';
import { PidFinder } from './pid-finder';
let plist = require( 'plist' );

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

	private async ensureExecutable( file: string, stat?: fs.Stats )
	{
		if ( !stat ) {
			stat = await Common.fsStat( file );
		}
		// Make sure the file is executable
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
			await Common.chmod( file, '0777' );
		}
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
		if ( !(await Common.fsExists( this._file ) ) ) {
			throw new Error( 'Can\'t launch because the file doesn\'t exist.' );
		}

		// Make sure the destination is a file
		// On mac it can be a folder as long as its a bundle..
		let stat = await Common.fsStat( this._file );

		switch ( process.platform ) {
			case 'win32':
				return this.startWindows( stat, pollInterval );

			case 'linux':
				return this.startLinux( stat, pollInterval );

			case 'darwin':
				return this.startMac( stat, pollInterval );

			default:
				throw new Error( 'What potato are you running on? Detected platform: ' + process.platform );
		}
	}

	private async startWindows( stat: fs.Stats, pollInterval: number )
	{
		if ( !stat.isFile() ) {
			throw new Error( 'Can\'t launch because the file isn\'t valid.' );
		}

		let child = childProcess.spawn( this._file, [], {
			cwd: path.dirname( this._file ),
			detached: true,
		} );

		let pid = child.pid;
		child.unref();

		return new LaunchInstanceHandle( pid, pollInterval );
	}

	private async startLinux( stat: fs.Stats, pollInterval: number )
	{
		if ( !stat.isFile() ) {
			throw new Error( 'Can\'t launch because the file isn\'t valid.' );
		}

		await this.ensureExecutable( this._file, stat );

		let child = childProcess.spawn( this._file, [], {
			cwd: path.dirname( this._file ),
			detached: true,
		} );

		let pid = child.pid;
		child.unref();

		return new LaunchInstanceHandle( pid, pollInterval );
	}

	private async startMac( stat: fs.Stats, pollInterval: number )
	{
		let pid;
		if ( stat.isFile() ) {

			await this.ensureExecutable( this._file, stat );

			let child = childProcess.spawn( this._file, [], {
				cwd: path.dirname( this._file ),
				detached: true,
			} );

			pid = child.pid;
			child.unref();
		}
		else {
			if ( !this._file.toLowerCase().endsWith( '.app' ) ) {
				throw new Error( 'That doesn\'t look like a valid Mac OS X bundle. Expecting .app folder' );
			}

			let plistPath = path.join( this._file, 'Contents', 'Info.plist' );
			if ( !( await Common.fsExists( plistPath ) ) ) {
				throw new Error( 'That doesn\'t look like a valid Mac OS X bundle. Missing Info.plist file.' );
			}

			let plistStat = await Common.fsStat( plistPath );
			if ( !plistStat.isFile() ) {
				throw new Error( 'That doesn\'t look like a valid Mac OS X bundle. Info.plist isn\'t a valid file.' );
			}

			let parsedPlist = plist.parse( await Common.fsReadFile( plistPath, 'utf8' ) );
			if ( !parsedPlist ) {
				throw new Error( 'That doesn\'t look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.' );
			}

			let macosPath = path.join( this._file, 'Contents', 'MacOS' );
			if ( !( await Common.fsExists( macosPath ) ) ) {
				throw new Error( 'That doesn\'t look like a valid Mac OS X bundle. Missing MacOS directory.' );
			}

			let macosStat = await Common.fsStat( macosPath );
			if ( !macosStat.isDirectory() ) {
				throw new Error( 'That doesn\'t look like a valid Mac OS X bundle. MacOS isn\'t a valid directory.' );
			}

			let baseName = path.basename( this._file );
			let executableName = parsedPlist.CFBundleExecutable || baseName.substr( 0, baseName.length - '.app'.length );

			await this.ensureExecutable( path.join( macosPath, executableName ) );

			let child = childProcess.spawn( 'open ' + this._file, [], {
				cwd: path.dirname( this._file ),
				detached: true,
			} );

			pid = child.pid;
			child.unref();
		}

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
