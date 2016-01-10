import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as _ from 'lodash';
import Common from '../common';
import { PidFinder } from './pid-finder';
import { VoodooQueue } from '../queue';

let plist = require( 'plist' );
let shellEscape = require( 'shell-escape' );
let spawnShellEscape = function( cmd: string )
{
	return '"' + cmd.replace( /(["\s'$`\\])/g, '\\$1' ) + '"';
};

export interface ILaunchOptions
{
	pollInterval: number;
}

function log( message ) {
	console.log( 'Launcher: ' + message );
}

export abstract class Launcher
{
	private static _runningInstances: Map<number, LaunchInstanceHandle> = new Map<number, LaunchInstanceHandle>();

	// Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
	static launch( localPackage: GameJolt.IGamePackage, os: string, arch: string, options?: ILaunchOptions ): LaunchHandle
	{
		return new LaunchHandle( localPackage, os, arch, options );
	}

	static async attach( pidOrLaunchInstance: number | LaunchInstanceHandle, expectedCmd?: string[], pollInterval?: number )
	{
		let pid: number;
		let instance: LaunchInstanceHandle;
		let _expectedCmd: Set<string> = null;
		if ( expectedCmd && expectedCmd.length ) {
			_expectedCmd = new Set<string>();
			for ( let cmd of expectedCmd ) {
				_expectedCmd.add( cmd );
			}
		}
		if ( typeof pidOrLaunchInstance === 'number' ) {
			pid = pidOrLaunchInstance;
			log( 'Attaching new instance: pid - ' + pid + ', poll interval - ' + pollInterval + ', expected cmds - ' + JSON.stringify( expectedCmd || [] ) );
			instance = new LaunchInstanceHandle( pid, _expectedCmd, pollInterval );
		}
		else {
			instance = pidOrLaunchInstance;
			pid = instance.pid;
			log( 'Attaching existing instance: pid - ' + pid + ', poll interval - ' + pollInterval + ', expectedcmds - ' + JSON.stringify( expectedCmd || [] ) );
		}

		// This validates if the process actually started and gets the command its running with
		// It'll throw if it failed into this promise chain, so it shouldn't ever attach an invalid process.
		await instance.tick( true );

		if ( !this._runningInstances.has( pid ) ) {
			this._runningInstances.set( pid, instance );
		};
		instance = this._runningInstances.get( pid );

		instance.once( 'end', () =>
		{
			let cmds: string[] = [];
			for ( let cmd of instance.cmd.values() ) {
				cmds.push( cmd );
			}
			this.detach( pid, cmds );
		} );

		VoodooQueue.setSlower();

		return instance;
	}

	static async detach( pid: number, expectedCmd?: string[] )
	{
		log( 'Detaching: pid - ' + pid + ', expected cmds - ' + JSON.stringify( expectedCmd ) );
		let instance = this._runningInstances.get( pid );
		let found = !(expectedCmd && expectedCmd.length);
		if ( !found ) {
			for ( let cmd of expectedCmd ) {
				if ( instance.cmd.has( cmd ) ) {
					found = true;
					break;
				}
			}
		}
		if ( instance && found ) {
			instance.removeAllListeners();
			if ( this._runningInstances.delete( pid ) && this._runningInstances.size === 0 ) {
				VoodooQueue.setFaster();
			}
		}
		else {
			log( 'No instance with this pid and cmd was found' );
		}
	}
}

export class LaunchHandle
{
	private _promise: Promise<LaunchInstanceHandle>;
	private _file: string;

	constructor( private _localPackage: GameJolt.IGamePackage, private _os: string, private _arch: string, options?: ILaunchOptions )
	{
		options = options || {
			pollInterval: 1000,
		};

		this._promise = this.start( options.pollInterval );
	}

	get package()
	{
		return this._localPackage;
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
		for ( let launchOption of this._localPackage.launch_options ) {
			let lOs = launchOption.os ? launchOption.os.split( '_' ) : [];
			if ( lOs.length === 0 ) {
				lOs = [ null, '32' ];
			}
			else if ( lOs.length === 1 ) {
				lOs.push( '32' );
			}

			if ( lOs[0] === this._os ) {
				if ( lOs[1] === this._arch ) {
					return launchOption;
				}
				result = launchOption;
			}
			else if ( lOs[0] === null && !result ) {
				result = launchOption;
			}
		}
		return result;
	}

	private async ensureExecutable( file: string )
	{
		// Ensure that the main launcher file is executable.
		await Common.chmod( file, '0755' );
	}

	private async start( pollInterval: number )
	{
		let launchOption = this.findLaunchOption();
		if ( !launchOption ) {
			throw new Error( 'Can\'t find valid launch options for the given os/arch' );
		}

		var executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;
		executablePath = executablePath.replace( /\//, path.sep );
		this._file = path.join( this._localPackage.install_dir, executablePath );

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

		return Launcher.attach( pid, null, pollInterval );
	}

	private async startLinux( stat: fs.Stats, pollInterval: number )
	{
		if ( !stat.isFile() ) {
			throw new Error( 'Can\'t launch because the file isn\'t valid.' );
		}

		await Common.chmod( this._file, '0755' );

		let child = childProcess.spawn( this._file, [], {
			cwd: path.dirname( this._file ),
			detached: true,
		} );

		let pid = child.pid;
		child.unref();

		return Launcher.attach( pid, null, pollInterval );
	}

	private async startMac( stat: fs.Stats, pollInterval: number )
	{
		let pid;
		if ( stat.isFile() ) {

			await Common.chmod( this._file, '0755' )

			let child = childProcess.exec( shellEscape( [ this._file ] ), {
				cwd: path.dirname( this._file ),
			} );

			pid = child.pid;
			child.unref();
		}
		else {
			if ( !this._file.toLowerCase().endsWith( '.app' ) && !this._file.toLowerCase().endsWith( '.app/' ) ) {
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

			let executableFile = path.join( macosPath, executableName );
			await Common.chmod( executableFile, '0755' );

			// Kept commented in case we lost our mind and we want to use gatekeeper
			// let gatekeeper = await new Promise( ( resolve, reject ) =>
			// {
			// 	childProcess.exec( shellEscape( [ 'spctl', '--add', this._file ] ), ( err: Error, stdout: Buffer, stderr: Buffer ) =>
			// 	{
			// 		if ( err || ( stderr && stderr.length ) ) {
			// 			return reject( err );
			// 		}

			// 		resolve();
			// 	} );
			// } );


			let child = childProcess.exec( shellEscape( [ executableFile ] ), {
				cwd: macosPath, // TODO: maybe should be basename
			} );

			pid = child.pid;
			child.unref();
		}

		return Launcher.attach( pid, null, pollInterval );
	}
}

export class LaunchInstanceHandle extends EventEmitter
{
	private _interval: NodeJS.Timer;

	constructor( private _pid: number, private _expectedCmd: Set<string>, pollInterval?: number )
	{
		super();
		this._interval = setInterval( () => this.tick(), pollInterval || 1000 );
	}

	get pid()
	{
		return this._pid;
	}

	get cmd()
	{
		return this._expectedCmd;
	}

	tick( validate?: boolean)
	{
		return PidFinder.find( this._pid, validate ? this._expectedCmd : null )
			.then( ( result ) =>
			{
				if ( !result || result.size === 0 ) {
					throw new Error( 'Process doesn\'t exist anymore' );
				}

				if ( !this._expectedCmd ) {
					this._expectedCmd = new Set<string>();
				}
				for ( let value of result.values() ) {
					if ( !this._expectedCmd.has( value ) ) {
						log( 'Adding new expected cmd to launch instance handle ' + this._pid + ': ' + value );
					}
					this._expectedCmd.add( value );
				}
			} )
			.catch( ( err ) =>
			{
				clearInterval( this._interval );
				console.log( err );
				this.emit( 'end', err );
			} );
	}
}
