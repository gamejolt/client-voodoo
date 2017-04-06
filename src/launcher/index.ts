import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import * as _ from 'lodash';
import Common from '../common';
import { WrapperFinder } from './pid-finder';
import { VoodooQueue } from '../queue';
import { Application } from '../application';
import * as GameWrapper from 'client-game-wrapper';

let plist = require( 'plist' );
let shellEscape = require( 'shell-escape' );

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
	pollInterval?: number;
}

export interface IParsedWrapper
{
	wrapperId: string;
}

function log( message ) {
	console.log( `Launcher: ${message}` );
}

export abstract class Launcher
{
	private static _runningInstances: Map<string, LaunchInstanceHandle> = new Map<string, LaunchInstanceHandle>();

	// Its a package, but strict mode doesnt like me using its reserved keywords. so uhh.. localPackage it is.
	static launch( localPackage: GameJolt.IGamePackage, os: string, arch: string, credentials: GameJolt.IGameCredentials, options?: ILaunchOptions ): LaunchHandle
	{
		return new LaunchHandle( localPackage, os, arch, credentials, options );
	}

	static async attach( options: IAttachOptions )
	{
		try {
			let instance: LaunchInstanceHandle;

			if ( options.instance ) {
				instance = options.instance;
				log( `Attaching existing instance: id - ${instance.wrapperId}, port - ${instance.wrapperPort}, poll interval - ${options.pollInterval}` );
			}
			else if ( options.stringifiedWrapper ) {
				let parsedWrapper: IParsedWrapper = JSON.parse( options.stringifiedWrapper );
				instance = new LaunchInstanceHandle( parsedWrapper.wrapperId, options.pollInterval );
				log( `Attaching new instance from stringified wrapper: id - ${instance.wrapperId}, port - ${instance.wrapperPort}, poll interval - ${options.pollInterval}` );
			}
			else if ( options.wrapperId ) {
				instance = new LaunchInstanceHandle( options.wrapperId, options.pollInterval );
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
				instance.abort( new Error( `Couldn't attach to launch instance` ) );
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
			log( `Got error: ${err.message}\n${err.stack}` );
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
	private _executablePath: string;

	constructor( private _localPackage: GameJolt.IGamePackage, private _os: string, private _arch: string, private _credentials: GameJolt.IGameCredentials, private options?: ILaunchOptions )
	{
		this.options = _.defaultsDeep<ILaunchOptions, ILaunchOptions>( this.options || {}, {
			pollInterval: 1000,
			env: _.cloneDeep( process.env ),
		} );

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

	private ensureExecutable( file: string )
	{
		// Ensure that the main launcher file is executable.
		return Common.chmod( file, '0755' );
	}

	private ensureCredentials()
	{
		if ( !this._credentials ) {
			return Promise.resolve( null );
		}
		return Common.fsWriteFile( path.join( this._localPackage.install_dir, '.gj-credentials' ), `0.1.0\n${this._credentials.username}\n${this._credentials.user_token}\n` );
	}

	private async start()
	{
		let launchOption = this.findLaunchOption();
		if ( !launchOption ) {
			throw new Error( `Can't find valid launch options for the given os/arch` );
		}

		this._executablePath = launchOption.executable_path ? launchOption.executable_path : this._localPackage.file.filename;
		this._file = path.join( this._localPackage.install_dir, this._executablePath );

		// If the destination already exists, make sure its valid.
		if ( !(await Common.fsExists( this._file ) ) ) {
			throw new Error( `Can't launch because the file doesn't exist.` );
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
				throw new Error( `What potato are you running on? Detected platform: ${process.platform}` );
		}
	}

	private async startWindows( stat: fs.Stats, isJava: boolean )
	{
		if ( !stat.isFile() ) {
			throw new Error( `Can't launch because the file isn't valid.` );
		}

		await this.ensureExecutable( this._file );

		let cmd, args;
		if ( isJava ) {
			cmd = 'java';
			args = [ '-jar', this._file ];
		}
		else {
			cmd = this._file;
			args = [];
		}

		await Application.ensurePidDir();
		await this.ensureCredentials();

		let wrapperId = this._localPackage.id.toString();
		GameWrapper.start( wrapperId, Application.PID_DIR, this._localPackage.install_dir, cmd, args, {
			cwd: path.dirname( this._file ),
			detached: true,
			env: this.options.env,
		} );

		return Launcher.attach( {
			wrapperId: wrapperId,
			pollInterval: this.options.pollInterval,
		} );
	}

	private async startLinux( stat: fs.Stats, isJava: boolean )
	{
		if ( !stat.isFile() ) {
			throw new Error( `Can't launch because the file isn't valid.` );
		}

		await this.ensureExecutable( this._file );

		let cmd, args;
		if ( isJava ) {
			cmd = 'java';
			args = [ '-jar', this._file ];
		}
		else {
			cmd = this._file;
			args = [];
		}

		await Application.ensurePidDir();
		await this.ensureCredentials();

		let wrapperId = this._localPackage.id.toString();
		GameWrapper.start( wrapperId, Application.PID_DIR, this._localPackage.install_dir, cmd, args, {
			cwd: path.dirname( this._file ),
			detached: true,
			env: this.options.env,
		} );

		return Launcher.attach( {
			wrapperId: wrapperId,
			pollInterval: this.options.pollInterval,
		} );
	}

	private async startMac( stat: fs.Stats, isJava: boolean )
	{
		if ( stat.isFile() ) {

			await this.ensureExecutable( this._file );

			let cmd, args;
			if ( isJava ) {
				cmd = 'java';
				args = [ '-jar', this._file ];
			}
			else {
				cmd = this._file;
				args = [];
			}

			await Application.ensurePidDir();
			await this.ensureCredentials();

			let wrapperId = this._localPackage.id.toString();
			GameWrapper.start( wrapperId, Application.PID_DIR, this._localPackage.install_dir, cmd, args, {
				cwd: path.dirname( this._file ),
				detached: true,
				env: this.options.env,
			} );

			return Launcher.attach( {
				wrapperId: wrapperId,
				pollInterval: this.options.pollInterval,
			} );
		}
		else {
			if ( !this._file.toLowerCase().endsWith( '.app' ) && !this._file.toLowerCase().endsWith( '.app/' ) ) {
				throw new Error( `That doesn't look like a valid Mac OS X bundle. Expecting .app folder` );
			}

			let plistPath = path.join( this._file, 'Contents', 'Info.plist' );
			if ( !( await Common.fsExists( plistPath ) ) ) {
				throw new Error( `That doesn't look like a valid Mac OS X bundle. Missing Info.plist file.` );
			}

			let plistStat = await Common.fsStat( plistPath );
			if ( !plistStat.isFile() ) {
				throw new Error( `That doesn't look like a valid Mac OS X bundle. Info.plist isn't a valid file.` );
			}

			let plistContents = await Common.fsReadFile( plistPath, 'utf8' );
			let parsedPlist: any;
			try {

				// First try parsing normally.
				parsedPlist = plist.parse( plistContents );
			}
			catch ( err ) {

				// If failed, it may be a plist in binary format (http://www.forensicswiki.org/wiki/Converting_Binary_Plists)
				// This makes sure to convert it to xml before parsing.
				plistContents = await new Promise<string>( ( resolve, reject ) =>
				{
					childProcess.exec( shellEscape( [ 'plutil', '-convert', 'xml1', '-o', '-', plistPath ] ), ( err: Error, stdout: Buffer, stderr: Buffer ) =>
					{
						if ( err ) {
							return reject( err );
						}

						let errMsg: string;
						if ( stderr && ( errMsg = stderr.toString( 'utf8' ) ) ) {
							return reject( new Error( errMsg ) );
						}

						return resolve( stdout.toString( 'utf8' ) );
					} );
				} );
				parsedPlist = plist.parse( plistContents );
			}

			if ( !parsedPlist ) {
				throw new Error( `That doesn't look like a valid  Mac OS X bundle. Info.plist is not a valid plist file.` );
			}

			let macosPath = path.join( this._file, 'Contents', 'MacOS' );
			if ( !( await Common.fsExists( macosPath ) ) ) {
				throw new Error( `That doesn't look like a valid Mac OS X bundle. Missing MacOS directory.` );
			}

			let macosStat = await Common.fsStat( macosPath );
			if ( !macosStat.isDirectory() ) {
				throw new Error( `That doesn't look like a valid Mac OS X bundle. MacOS isn't a valid directory.` );
			}

			let baseName = path.basename( this._file );
			let executableName = parsedPlist.CFBundleExecutable || baseName.substr( 0, baseName.length - '.app'.length );

			this._executablePath = path.join( this._executablePath, 'Contents', 'MacOS', executableName );
			this._file = path.join( this._localPackage.install_dir, this._executablePath );
			await this.ensureExecutable( this._file );

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

			await Application.ensurePidDir();
			await this.ensureCredentials();

			let wrapperId = this._localPackage.id.toString();
			GameWrapper.start( wrapperId, Application.PID_DIR, this._localPackage.install_dir, this._file, [], {
				cwd: path.dirname( this._file ),
				detached: true,
				env: this.options.env,
			} );

			return Launcher.attach( {
				wrapperId: wrapperId,
				pollInterval: this.options.pollInterval,
			} );
		}
	}
}

export class LaunchInstanceHandle extends EventEmitter implements IParsedWrapper
{
	private _interval: NodeJS.Timer;
	private _wrapperPort: number;
	private _stable: boolean;

	constructor( private _wrapperId: string, pollInterval?: number )
	{
		super();
		this._interval = setInterval( () => this.tick(), pollInterval || 1000 );
		this._stable = false;
	}

	get pid(): IParsedWrapper
	{
		return {
			wrapperId: this._wrapperId,
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
		return WrapperFinder.find( this._wrapperId )
			.then( ( port ) =>
			{
				this._stable = true;
				this._wrapperPort = port;
				return true;
			} )
			.catch( ( err ) =>
			{
				if ( this._stable ) {
					clearInterval( this._interval );
					console.error( err );
					this.emit( 'end', err );
					//throw err;
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
