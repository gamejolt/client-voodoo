import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as _ from 'lodash';
import Common from '../common';
import { WrapperFinder } from './pid-finder';
import { VoodooQueue } from '../queue';

let plist = require( 'plist' );
let shellEscape = require( 'shell-escape' );
let spawnShellEscape = function( cmd: string )
{
	return '"' + cmd.replace( /(["\s'$`\\])/g, '\\$1' ) + '"';
};

let GameWrapper = require( 'client-game-wrapper' );

export interface ILaunchOptions
{
	pollInterval?: number;
	env?: { [ key: string ]: string };
}

export interface IAttachOptions
{
	instance?: LaunchInstanceHandle;
	stringifiedWrapper?: string;
	wrapperId?: string;
	wrapperPort?: number;
	pollInterval?: number;
}

export interface IParsedWrapper
{
	wrapperId: string;
	wrapperPort: number;
}

function log( message ) {
	console.log( 'Launcher: ' + message );
}

export abstract class Launcher
{
	private static _runningInstances: Map<string, LaunchInstanceHandle> = new Map<string, LaunchInstanceHandle>();

	// Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
	static launch( localPackage: GameJolt.IGamePackage, os: string, arch: string, options?: ILaunchOptions ): LaunchHandle
	{
		return new LaunchHandle( localPackage, os, arch, options );
	}

	static async attach( options: IAttachOptions )
	{
		try {
			let wrapper: IParsedWrapper;
			let instance: LaunchInstanceHandle;

			if ( options.instance ) {
				instance = options.instance;
				log( `Attaching existing instance: id - ${instance.wrapperId}, port - ${instance.wrapperPort}, poll interval - ${options.pollInterval}` );
			}
			else if ( options.stringifiedWrapper ) {
				let parsedWrapper: IParsedWrapper = JSON.parse( options.stringifiedWrapper );
				instance = new LaunchInstanceHandle( parsedWrapper.wrapperId, parsedWrapper.wrapperPort, options.pollInterval );
				log( `Attaching new instance from stringified wrapper: id - ${instance.wrapperId}, port - ${instance.wrapperPort}, poll interval - ${options.pollInterval}` );
			}
			else if ( options.wrapperId && options.wrapperPort ) {
				instance = new LaunchInstanceHandle( options.wrapperId, options.wrapperPort, options.pollInterval );
				log( `Attaching new instance: id - ${instance.wrapperId}, port - ${instance.wrapperPort}, poll interval - ${options.pollInterval}` );
			}
			else {
				throw new Error( 'Invalid launch attach options' );
			}

			// This validates if the process actually started and gets the command its running with
			// It'll throw if it failed into this promise chain, so it shouldn't ever attach an invalid process.
			let success = false;
			for ( let i = 0; i < 25; i++ ) {
				try {
					if ( await instance.tick() ) {
						success = true;
						break;
					}
				}
				catch ( err ) {}
				await Common.wait( 200 );
			}

			if ( !success ) {
				// Here is where it throws
				instance.abort( new Error( 'Couldn\'t attach to launch instance' ) );
			}

			if ( !this._runningInstances.has( instance.wrapperId ) ) {
				this._runningInstances.set( instance.wrapperId, instance );
			};
			instance = this._runningInstances.get( instance.wrapperId );

			instance.once( 'end', () =>
			{
				log( 'Ended' );
				this.detach( instance.wrapperId );
			} );

			VoodooQueue.setSlower();

			return instance;
		}
		catch ( err ) {
			log( 'Got error: ' + err.message + "\n" + err.stack );
			throw err;
		}
	}

	static async detach( wrapperId: string, expectedWrapperPort?: number )
	{
		log( `Detaching: wrapperId - ${wrapperId}, expected port - ${expectedWrapperPort}` );
		let instance = this._runningInstances.get( wrapperId );
		if ( instance && (!expectedWrapperPort || instance.wrapperPort === expectedWrapperPort) ) {
			instance.removeAllListeners();
			if ( this._runningInstances.delete( wrapperId ) && this._runningInstances.size === 0 ) {
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

	constructor( private _localPackage: GameJolt.IGamePackage, private _os: string, private _arch: string, private options?: ILaunchOptions )
	{
		this.options = _.defaultsDeep<ILaunchOptions, ILaunchOptions>( this.options || {}, {
			pollInterval: 1000,
			env: _.cloneDeep( process.env ),
		} );
		log( JSON.stringify( this.options ) );

		this._promise = this.start();
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

	private async start()
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
		let isJava = path.extname( this._file ) === 'jar';

		switch ( process.platform ) {
			case 'win32':
				return this.startWindows( stat, isJava );

			case 'linux':
				return this.startLinux( stat, isJava );

			case 'darwin':
				return this.startMac( stat, isJava );

			default:
				throw new Error( 'What potato are you running on? Detected platform: ' + process.platform );
		}
	}

	private async startWindows( stat: fs.Stats, isJava: boolean )
	{
		if ( !stat.isFile() ) {
			throw new Error( 'Can\'t launch because the file isn\'t valid.' );
		}

		let cmd, args;
		if ( isJava ) {
			cmd = 'java';
			args = [ '-jar', this._file ];
		}
		else {
			cmd = this._file;
			args = [];
		}

		let wrapperId = this._localPackage.id.toString()
		let wrapperPort = GameWrapper.start( wrapperId, this._file, args, {
			cwd: path.dirname( this._file ),
			detached: true,
			env: this.options.env,
		} );

		return Launcher.attach( {
			wrapperId: wrapperId,
			wrapperPort: wrapperPort,
			pollInterval: this.options.pollInterval,
		} );
	}

	private async startLinux( stat: fs.Stats, isJava: boolean )
	{
		if ( !stat.isFile() ) {
			throw new Error( 'Can\'t launch because the file isn\'t valid.' );
		}

		await Common.chmod( this._file, '0755' );

		let cmd, args;
		if ( isJava ) {
			cmd = 'java';
			args = [ '-jar', this._file ];
		}
		else {
			cmd = this._file;
			args = [];
		}

		let wrapperId = this._localPackage.id.toString()
		let wrapperPort = GameWrapper.start( wrapperId, this._file, args, {
			cwd: path.dirname( this._file ),
			detached: true,
			env: this.options.env,
		} );

		return Launcher.attach( {
			wrapperId: wrapperId,
			wrapperPort: wrapperPort,
			pollInterval: this.options.pollInterval,
		} );
	}

	private async startMac( stat: fs.Stats, isJava: boolean )
	{
		let pid;
		if ( stat.isFile() ) {

			await Common.chmod( this._file, '0755' )

			let cmd, args;
			if ( isJava ) {
				cmd = 'java';
				args = [ '-jar', this._file ];
			}
			else {
				cmd = this._file;
				args = [];
			}

			let wrapperId = this._localPackage.id.toString()
			let wrapperPort = GameWrapper.start( wrapperId, this._file, args, {
				cwd: path.dirname( this._file ),
				detached: true,
				env: this.options.env,
			} );

			return Launcher.attach( {
				wrapperId: wrapperId,
				wrapperPort: wrapperPort,
				pollInterval: this.options.pollInterval,
			} );
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

			let wrapperId = this._localPackage.id.toString()
			let wrapperPort = GameWrapper.start( wrapperId, executableFile, [], {
				cwd: macosPath,
				detached: true,
				env: this.options.env,
			} );

			return Launcher.attach( {
				wrapperId: wrapperId,
				wrapperPort: wrapperPort,
				pollInterval: this.options.pollInterval,
			} );
		}
	}
}

export class LaunchInstanceHandle extends EventEmitter implements IParsedWrapper
{
	private _interval: NodeJS.Timer;
	private _stable: boolean;

	constructor( private _wrapperId: string, private _wrapperPort: number, pollInterval?: number )
	{
		super();
		this._interval = setInterval( () => this.tick(), pollInterval || 1000 );
		this._stable = false;
	}

	get pid(): IParsedWrapper
	{
		return {
			wrapperId: this._wrapperId,
			wrapperPort: this._wrapperPort,
		};
	}

	get wrapperId()
	{
		return this._wrapperId;
	}

	get wrapperPort()
	{
		return this._wrapperPort;
	}

	tick(): Promise<boolean>
	{
		return WrapperFinder.find( this._wrapperId, this._wrapperPort )
			.then( () =>
			{
				this._stable = true;
				return true;
			} )
			.catch( ( err ) =>
			{
				if ( this._stable ) {
					clearInterval( this._interval );
					console.error( err );
					this.emit( 'end', err );
					throw err;
				}
				return false;
			} );
	}

	abort( err: NodeJS.ErrnoException )
	{
		clearInterval( this._interval );
		console.error( err );
		this.emit( 'end', err );
		throw err;
	}
}
