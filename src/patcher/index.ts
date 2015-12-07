import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-fs';
import * as path from 'path';
import { Transform } from 'stream';
import { EventEmitter } from 'events';

import * as StreamSpeed from '../downloader/stream-speed';
import { Downloader, DownloadHandle, IDownloadProgress } from '../downloader';
import { Extractor } from '../extractor';

let brotliDecompress = require( 'iltorb' ).decompressStream;

let Bluebird = require( 'bluebird' );
let mkdirp:( path: string, mode?: string ) => Promise<boolean> = Bluebird.promisify( require( 'mkdirp' ) );
let fsUnlink:( path: string ) => Promise<NodeJS.ErrnoException> = Bluebird.promisify( fs.unlink );
let fsExists = function( path: string ): Promise<boolean>
{
	return new Promise<boolean>( function( resolve )
	{
		fs.exists( path, resolve );
	} );
}
let fsReadFile: ( path: string, encoding?: string ) => Promise<string> = Bluebird.promisify( fs.readFile );
let fsWriteFile: ( path: string, data: string ) => Promise<string> = Bluebird.promisify( fs.writeFile );
let fsStat: ( path: string ) => Promise<fs.Stats> = Bluebird.promisify( fs.stat );
let fsReadDir: ( path: string ) => Promise<string[]> = Bluebird.promisify( fs.readdir );
let fsReadDirRecursively: ( path: string ) => Promise<string[]> = Bluebird.promisify( require( 'recursive-readdir' ) );

export interface IPatcherOptions
{
	decompressInDownload?: boolean;
}

export enum PatchHandleState
{
	STOPPED,
	STOPPING,
	DOWNLOADING,
	PATCHING,
	FINISHED,
}

export abstract class Patcher
{
	static patch( url: string, build: GameJolt.IGameBuild, options?: IPatcherOptions ): PatchHandle
	{
		return new PatchHandle( url, build, options );
	}
}

export class PatchHandle
{
	private _state: PatchHandleState;
	private _to: string;
	private _tempFile: string;
	private _archiveListFile: string;
	private _downloadHandle: DownloadHandle;

	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;

	constructor( private _url: string, private _build: GameJolt.IGameBuild, private _options?: IPatcherOptions )
	{
		this._options = _.defaults<IPatcherOptions>( this._options || {}, {
			decompmressInDownload: true,
		} );

		this._state = PatchHandleState.STOPPED;
		this._downloadHandle = null;
		this._emitter = new EventEmitter();
	}

	get promise(): Promise<void>
	{
		if ( !this._promise ) {
			this._promise = new Promise<void>( ( resolve, reject ) =>
			{
				this._resolver = resolve;
				this._rejector = reject;
			} );
		}
		return this._promise;
	}

	private _getDecompressStream()
	{
		if ( !this._build.file.archive_type ) {
			return null;
		}

		switch ( this._build.file.archive_type ) {
			case 'brotli':
				return brotliDecompress();

			default:
				return null;
		}
	}

	start()
	{
		if ( this._state !== PatchHandleState.STOPPED ) {
			return false;
		}

		this._promise = this.promise;

		this._state = PatchHandleState.DOWNLOADING;
		this._emitter.emit( 'downloading' );

		this._tempFile = path.join( this._build.library_dir, 'tempDownload' );
		this._archiveListFile = path.join( this._build.library_dir, 'archive-file-list' );
		this._to = path.join( this._build.library_dir, 'game' );

		this._downloadHandle = this._downloadHandle || Downloader.download( this._url, this._tempFile, {
			decompressStream: this._options.decompressInDownload ? this._getDecompressStream() : null,
		} );

		this._downloadHandle.onProgress( StreamSpeed.SampleUnit.Bps, ( progress ) => this.emitProgress( progress ) )
			.promise
				.then( () => this.patch() )
				.then( () => this.onFinished() )
				.catch( ( err ) => this.onError( err ) );

		return true;
	}

	async stop()
	{
		if ( this._state !== PatchHandleState.DOWNLOADING ) {
			return false;
		}

		this._state = PatchHandleState.STOPPING;

		if ( !( await this._downloadHandle.stop() ) ) {
			this._state = PatchHandleState.DOWNLOADING;
			return false;
		}

		this._state = PatchHandleState.STOPPED;

		return true;
	}

	private async patch()
	{
		// TODO: restrict operations to the given directories.
		this._state = PatchHandleState.PATCHING;
		this._emitter.emit( 'patching' );

		let currentFiles: string[];
		if ( !( await fsExists( this._to ) ) || !( await fsStat( this._to ) ).isDirectory() ) {
			currentFiles = [];
		}
		else {
			// TODO: check if ./ is valid on windows platforms as well.
			currentFiles = ( await fsReadDirRecursively( this._to ) ).map( ( file ) => './' + path.relative( this._to, file ) );
		}

		// If the destination already exists, make sure its valid.
		if ( await fsExists( this._archiveListFile ) ) {

			// Make sure the destination is a file.
			let stat = await fsStat( this._archiveListFile );
			if ( !stat.isFile() ) {
				throw new Error( 'Can\'t patch because the archive file list isn\'t a file.' );
			}
		}
		// Otherwise, we validate the folder path.
		else {
			let archiveListFileDir = path.dirname( this._archiveListFile );
			if ( await fsExists( archiveListFileDir ) ) {
				let dirStat = await fsStat( archiveListFileDir );
				if ( !dirStat.isDirectory() ) {
					throw new Error( 'Can\'t patch because the path to the archive file list is invalid.' );
				}
			}
			// Create the folder path.
			else if ( !( await mkdirp( archiveListFileDir ) ) ) {
				throw new Error( 'Couldn\'t create the patch archive file list folder path' );
			}
		}

		let oldBuildFiles;
		if ( !( await fsExists( this._archiveListFile ) ) ) {
			oldBuildFiles = currentFiles;
		}
		else {
			oldBuildFiles = ( await fsReadFile( this._archiveListFile, 'utf8' ) ).split( "\n" );
		}

		let extractResult = await Extractor.extract( this._tempFile, this._to, {
			overwrite: true,
			deleteSource: false,
			decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream(),
		} ).promise;

		if ( !extractResult.success ) {
			throw new Error( 'Failed to extract patch file' );
		}

		let newBuildFiles = extractResult.files;

		// Files that the old build created are files in the file system that are not listed in the old build files
		let createdByOldBuild = _.difference( currentFiles, oldBuildFiles );

		// Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build
		let filesToRemove = _.difference( currentFiles, newBuildFiles, createdByOldBuild );

		// TODO: use del lib
		let unlinks = await Promise.all( filesToRemove.map( ( file ) =>
		{
			return fsUnlink( path.resolve( this._to, file ) ).then( function( err )
			{
				if ( err ) {
					throw err;
				}
				return true;
			} );
		} ) );

		await fsWriteFile( this._archiveListFile, newBuildFiles.join( "\n" ) );
		return true;
	}

	onDownloading( fn: Function ): PatchHandle
	{
		this._emitter.addListener( 'downloading', fn );
		return this;
	}

	onProgress( unit: StreamSpeed.SampleUnit, fn: ( progress: IDownloadProgress ) => any ): PatchHandle
	{
		this._emitter.addListener( 'progress', ( progress: IDownloadProgress ) =>
		{
			progress.sample =  StreamSpeed.StreamSpeed.convertSample( progress.sample, unit );
			fn( progress );
		} );
		return this;
	}

	onPatching( fn: Function ): PatchHandle
	{
		this._emitter.addListener( 'downloading', fn );
		return this;
	}

	private emitProgress( progress: IDownloadProgress )
	{
		this._emitter.emit( 'progress', progress );
	}

	private onError( err: NodeJS.ErrnoException )
	{
		this._state = PatchHandleState.STOPPED;
		this._rejector( err );
		this._promise = null;
	}

	private onFinished()
	{
		this._state = PatchHandleState.FINISHED;
		this._resolver();
	}
}
