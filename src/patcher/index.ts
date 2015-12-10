import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-fs';
import * as path from 'path';
import { Transform } from 'stream';
import { EventEmitter } from 'events';

import * as StreamSpeed from '../downloader/stream-speed';
import { Downloader, DownloadHandle, IDownloadProgress } from '../downloader';
import { Extractor, ExtractHandle } from '../extractor';

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
	overwrite?: boolean;
	decompressInDownload?: boolean;
}

export enum PatchHandleState
{
	STOPPED_DOWNLOAD,
	STOPPING_DOWNLOAD,
	DOWNLOADING,
	STOPPED_PATCH,
	STOPPING_PATCH,
	PATCHING,
	FINISHING,
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
	private _patchListFile: string;
	private _downloadHandle: DownloadHandle;
	private _extractHandle: ExtractHandle;

	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;

	private _emittedDownloading: boolean;
	private _emittedPatching: boolean;
	private _waitForStartPromise: Promise<void>;
	private _waitForStartResolver: () => void;
	private _waitForStartRejector: ( err: NodeJS.ErrnoException ) => void;

	constructor( private _url: string, private _build: GameJolt.IGameBuild, private _options?: IPatcherOptions )
	{
		this._options = _.defaults<IPatcherOptions>( this._options || {}, {
			overwrite: false,
			decompressInDownload: false,
		} );

		this._state = PatchHandleState.STOPPED_DOWNLOAD;
		this._downloadHandle = null;
		this._extractHandle = null;
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
		if ( !this._build.archive_type ) {
			return null;
		}

		switch ( this._build.archive_type ) {
			case 'tar.xz':
				return require( 'lzma-native' ).createDecompressor();

			case 'tar.gz':
				return require( 'gunzip-maybe' )();

			case 'brotli':
				throw new Error( 'Not supporting brotli anymore.' );

			default:
				throw new Error( 'No decompression given' );
		}
	}

	private async waitForStart()
	{
		if ( this._state !== PatchHandleState.STOPPED_DOWNLOAD && this._state !== PatchHandleState.STOPPED_PATCH ) {
			return;
		}
		if ( !this._waitForStartPromise ) {
			this._waitForStartPromise = new Promise<void>( ( resolve, reject ) =>
			{
				this._waitForStartResolver = resolve;
				this._waitForStartRejector = reject;
			} );
		}
		return this._waitForStartPromise;
	}

	async start( url?: string )
	{
		this._url = url || this._url;
		this._promise = this.promise;

		if ( this._state === PatchHandleState.STOPPED_DOWNLOAD ) {
			if ( this._waitForStartPromise ) {
				this._waitForStartResolver();
				this._waitForStartPromise = null;
			}

			this._state = PatchHandleState.DOWNLOADING;
			if ( !this._emittedDownloading ) {
				this._emitter.emit( 'downloading' );
				this._emittedDownloading = true;
			}

			this._tempFile = path.join( this._build.install_dir, '.gj-tempDownload' );
			this._archiveListFile = path.join( this._build.install_dir, '.gj-archive-file-list' );
			this._patchListFile = path.join( this._build.install_dir, '.gj-patch-file' );
			this._to = this._build.install_dir;

			if ( !this._downloadHandle ) {
				this._downloadHandle = Downloader.download( this._url, this._tempFile, {
					overwrite: this._options.overwrite,
					decompressStream: this._options.decompressInDownload ? this._getDecompressStream() : null,
				} );

				// Make sure to not remove the temp download file if we're resuming.
				this._options.overwrite = false;
			}

			this._downloadHandle.onProgress( StreamSpeed.SampleUnit.Bps, ( progress ) => this.emitProgress( progress ) )
				.promise
					.then( () => this.patch() )
					.then( () => this.onFinished() )
					.catch( ( err ) => this.onError( err ) );

			return true;
		}
		else if ( this._state === PatchHandleState.STOPPED_PATCH ) {
			if ( this._waitForStartPromise ) {
				this._waitForStartResolver();
				this._waitForStartPromise = null;
			}

			this._state = PatchHandleState.PATCHING;
			this._extractHandle.start();

			return true;
		}

		return false;
	}

	private async _stop( terminate: boolean )
	{
		if ( this._state === PatchHandleState.DOWNLOADING ) {
			this._state = PatchHandleState.STOPPING_DOWNLOAD;

			if ( !( await this._downloadHandle.stop() ) ) {
				this._state = PatchHandleState.DOWNLOADING;
				return false;
			}

			this._state = PatchHandleState.STOPPED_DOWNLOAD;
		}
		else if ( this._state === PatchHandleState.PATCHING ) {
			this._state = PatchHandleState.STOPPING_PATCH;

			if ( !( await this._extractHandle.stop( terminate ) ) ) {
				this._state = PatchHandleState.PATCHING;
				return false;
			}

			this._state = PatchHandleState.STOPPED_PATCH;
		}
		else {
			return false;
		}

		if ( terminate ) {
			this._emitter.emit( 'canceled' );
		}
		else {
			this._emitter.emit( 'stopped' );
		}
		this.waitForStart();
		return true;
	}

	async stop()
	{
		return this._stop( false );
	}

	async cancel()
	{
		return this._stop( true );
	}

	private async patch()
	{
		// TODO: restrict operations to the given directories.
		this._state = PatchHandleState.PATCHING;
		if ( !this._emittedPatching ) {
			this._emitter.emit( 'patching' );
			this._emittedPatching = true;
		}

		let createdByOldBuild: string[];

		// TODO: check if ./ is valid on windows platforms as well.
		let currentFiles = ( await fsReadDirRecursively( this._to ) )
			.filter( ( file ) =>
			{
				return !path.basename( file ).startsWith( '.gj-' );
			} )
			.map( ( file ) =>
			{
				return './' + path.relative( this._to, file );
			} );

		// If the patch file already exists, make sure its valid.
		if ( await fsExists( this._patchListFile ) ) {

			// Make sure the destination is a file.
			let stat = await fsStat( this._patchListFile );
			if ( !stat.isFile() ) {
				throw new Error( 'Can\'t patch because the patch file isn\'t a file.' );
			}

			createdByOldBuild = ( await fsReadFile( this._patchListFile, 'utf8' ) ).split( "\n" );
		}
		else {

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

			// Files that the old build created are files in the file system that are not listed in the old build files
			let createdByOldBuild = _.difference( currentFiles, oldBuildFiles );

			await fsWriteFile( this._patchListFile, createdByOldBuild.join( "\n" ) );
		}

		this._extractHandle = await this.waitForStart().then( () => Extractor.extract( this._tempFile, this._to, {
			overwrite: true,
			deleteSource: true,
			decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream(),
		} ) );

		let extractResult = await this._extractHandle.promise;
		if ( !extractResult.success ) {
			throw new Error( 'Failed to extract patch file' );
		}

		this._state = PatchHandleState.FINISHING;
		let newBuildFiles = extractResult.files;

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
		this._emitter.addListener( 'patching', fn );
		return this;
	}

	private emitProgress( progress: IDownloadProgress )
	{
		this._emitter.emit( 'progress', progress );
	}

	private onError( err: NodeJS.ErrnoException )
	{
		this._state = PatchHandleState.STOPPED_DOWNLOAD;
		this._rejector( err );
		this._promise = null;
	}

	private onFinished()
	{
		this._state = PatchHandleState.FINISHED;
		this._resolver();
	}
}
