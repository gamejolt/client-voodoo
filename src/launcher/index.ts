import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as _ from 'lodash';

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

export abstract class Launcher
{
	static launch( file: string ): LaunchHandle
	{
		return new LaunchHandle( file );
	}
}

export class LaunchHandle
{
	private _promise: Promise<number>;
	constructor( private _file: string )
	{
		this._promise = this.start();
	}

	get file(): string
	{
		return this._file;
	}

	get promise(): Promise<number>
	{
		return this._promise;
	}

	private async start()
	{
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

		let launchableFile = path.resolve( process.cwd(), this._file );
		let child = childProcess.spawn( launchableFile, [], {
			cwd: path.dirname( launchableFile ),
			detached: true,
		} );

		let pid = child.pid;
		child.unref();

		return pid;
	}
}
