import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-fs';
import * as path from 'path';
import { Transform } from 'stream';
import { EventEmitter } from 'events';

import * as StreamSpeed from '../downloader/stream-speed';
import { Downloader, DownloadHandle, IDownloadProgress } from '../downloader';
import { Extractor, ExtractHandle } from '../extractor';
import { VoodooQueue } from '../queue';
import Common from '../common';

export interface IPatcherOptions
{
	overwrite?: boolean;
	decompressInDownload?: boolean;
	generateUrl?: Function;
}

export enum PatchHandleState
{
	STOPPED_DOWNLOAD,
	STOPPING_DOWNLOAD,
	STARTING_DOWNLOAD,
	DOWNLOADING,
	STOPPED_PATCH,
	STOPPING_PATCH,
	STARTING_PATCH,
	PATCHING,
	FINISHING,
	FINISHED,
}

const DOWNLOADING_STATES = [ PatchHandleState.STOPPED_DOWNLOAD, PatchHandleState.STOPPING_DOWNLOAD, PatchHandleState.STARTING_DOWNLOAD, PatchHandleState.DOWNLOADING ];
const PATCHING_STATES = [ PatchHandleState.STOPPED_PATCH, PatchHandleState.STOPPING_PATCH, PatchHandleState.STARTING_PATCH, PatchHandleState.PATCHING ];
const FINISHED_STATES = [ PatchHandleState.FINISHING, PatchHandleState.FINISHED ];

export abstract class Patcher
{
	static patch( url: string, build: GameJolt.IGameBuild, options?: IPatcherOptions ): PatchHandle
	{
		let patchHandle = new PatchHandle( url, build, options );
		VoodooQueue.enqueue( patchHandle );
		return patchHandle;
	}
}

export class PatchHandle
{
	private _state: PatchHandleState;
	private _wasStopped: boolean;
	private _to: string;
	private _tempFile: string;
	private _archiveListFile: string;
	private _patchListFile: string;
	private _downloadHandle: DownloadHandle;
	private _extractHandle: ExtractHandle;
	private _onProgressFuncMapping: Map<Function, Function>;

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
		this._onProgressFuncMapping = new Map<Function, Function>();
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

	get state()
	{
		return this._state;
	}

	isDownloading()
	{
		return DOWNLOADING_STATES.indexOf( this._state ) !== -1;
	}

	isPatching()
	{
		return PATCHING_STATES.indexOf( this._state ) !== -1;
	}

	isFinished()
	{
		return FINISHED_STATES.indexOf( this._state ) !== -1;
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
			return this._waitForStartPromise;
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
			this._state = PatchHandleState.STARTING_DOWNLOAD;
			if ( this._waitForStartPromise ) {
				this._waitForStartResolver();
				this._waitForStartPromise = null;
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

				this._downloadHandle.onProgress( StreamSpeed.SampleUnit.Bps, ( progress ) => this.emitProgress( progress ) )
				.promise
					.then( () => this.patch() )
					.then( () => this.onFinished() )
					.catch( ( err ) => this.onError( err ) );

				// Make sure to not remove the temp download file if we're resuming.
				this._options.overwrite = false;
			}

			// This resumes if it already existed.
			await this._downloadHandle.start();

			this._state = PatchHandleState.DOWNLOADING;
			if ( !this._emittedDownloading ) {
				this._emitter.emit( 'downloading' );
				this._emittedDownloading = true;
			}
			if ( this._wasStopped ) {
				this._emitter.emit( 'resumed' );
			}

			return true;
		}
		else if ( this._state === PatchHandleState.STOPPED_PATCH ) {
			this._state = PatchHandleState.STARTING_PATCH;
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
			console.log( 'Stopping download' );
			this._state = PatchHandleState.STOPPING_DOWNLOAD;

			if ( !( await this._downloadHandle.stop() ) ) {
				console.log( 'Failed to stop download' );
				this._state = PatchHandleState.DOWNLOADING;
				return false;
			}

			this._state = PatchHandleState.STOPPED_DOWNLOAD;
		}
		else if ( this._state === PatchHandleState.PATCHING ) {
			console.log( 'Stopping patch' );
			this._state = PatchHandleState.STOPPING_PATCH;

			if ( this._extractHandle && !( await this._extractHandle.stop( terminate ) ) ) {
				console.log( 'Failed to stop patch' );
				this._state = PatchHandleState.PATCHING;
				return false;
			}

			this._state = PatchHandleState.STOPPED_PATCH;
		}
		else {
			return false;
		}

		console.log( 'Stopped' );
		this._wasStopped = true;
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
		if ( this._wasStopped ) {
			this._emitter.emit( 'resumed' );
		}

		let createdByOldBuild: string[];

		// TODO: check if ./ is valid on windows platforms as well.
		let currentFiles = ( await Common.fsReadDirRecursively( this._to ) )
			.filter( ( file ) =>
			{
				return !path.basename( file ).startsWith( '.gj-' );
			} )
			.map( ( file ) =>
			{
				return './' + path.relative( this._to, file );
			} );

		// If the patch file already exists, make sure its valid.
		if ( await Common.fsExists( this._patchListFile ) ) {

			// Make sure the destination is a file.
			let stat = await Common.fsStat( this._patchListFile );
			if ( !stat.isFile() ) {
				throw new Error( 'Can\'t patch because the patch file isn\'t a file.' );
			}

			createdByOldBuild = ( await Common.fsReadFile( this._patchListFile, 'utf8' ) ).split( "\n" );
		}
		else {

			// If the destination already exists, make sure its valid.
			if ( await Common.fsExists( this._archiveListFile ) ) {

				// Make sure the destination is a file.
				let stat = await Common.fsStat( this._archiveListFile );
				if ( !stat.isFile() ) {
					throw new Error( 'Can\'t patch because the archive file list isn\'t a file.' );
				}
			}
			// Otherwise, we validate the folder path.
			else {
				let archiveListFileDir = path.dirname( this._archiveListFile );
				if ( await Common.fsExists( archiveListFileDir ) ) {
					let dirStat = await Common.fsStat( archiveListFileDir );
					if ( !dirStat.isDirectory() ) {
						throw new Error( 'Can\'t patch because the path to the archive file list is invalid.' );
					}
				}
				// Create the folder path.
				else if ( !( await Common.mkdirp( archiveListFileDir ) ) ) {
					throw new Error( 'Couldn\'t create the patch archive file list folder path' );
				}
			}

			let oldBuildFiles;
			if ( !( await Common.fsExists( this._archiveListFile ) ) ) {
				oldBuildFiles = currentFiles;
			}
			else {
				oldBuildFiles = ( await Common.fsReadFile( this._archiveListFile, 'utf8' ) ).split( "\n" );
			}

			// Files that the old build created are files in the file system that are not listed in the old build files
			let createdByOldBuild = _.difference( currentFiles, oldBuildFiles );

			await Common.fsWriteFile( this._patchListFile, createdByOldBuild.join( "\n" ) );
		}

		await this.waitForStart();
		this._extractHandle = Extractor.extract( this._tempFile, this._to, {
			overwrite: true,
			deleteSource: true,
			decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream(),
		} );

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
			return Common.fsUnlink( path.resolve( this._to, file ) ).then( function( err )
			{
				if ( err ) {
					throw err;
				}
				return true;
			} );
		} ) );

		await Common.fsWriteFile( this._archiveListFile, newBuildFiles.join( "\n" ) );
		return true;
	}

	onDownloading( fn: Function )
	{
		this._emitter.addListener( 'downloading', fn );
		return this;
	}

	deregisterOnDownloading( fn: Function )
	{
		this._emitter.removeListener( 'downloading', fn );
		return this;
	}

	onProgress( unit: StreamSpeed.SampleUnit, fn: ( progress: IDownloadProgress ) => any )
	{
		let func = function( progress: IDownloadProgress )
		{
			progress.sample =  StreamSpeed.StreamSpeed.convertSample( progress.sample, unit );
			progress.timeLeft
			fn( progress );
		};

		this._onProgressFuncMapping.set( fn, func );
		this._emitter.addListener( 'progress', func );
		return this;
	}

	deregisterOnProgress( fn: Function )
	{
		let func = this._onProgressFuncMapping.get( fn );
		if ( func ) {
			this._emitter.removeListener( 'progress', func );
			this._onProgressFuncMapping.delete( fn );
		}
		return this;
	}

	onPatching( fn: Function )
	{
		this._emitter.addListener( 'patching', fn );
		return this;
	}

	deregisterOnPatching( fn: Function )
	{
		this._emitter.removeListener( 'patching', fn );
		return this;
	}

	onPaused( fn: Function )
	{
		this._emitter.addListener( 'stopped', fn );
		return this;
	}

	deregisterOnPaused( fn: Function )
	{
		this._emitter.removeListener( 'stopped', fn );
		return this;
	}

	onResumed( fn: Function )
	{
		this._emitter.addListener( 'resumed', fn );
		return this;
	}

	deregisterOnResumed( fn: Function )
	{
		this._emitter.removeListener( 'resumed', fn );
		return this;
	}

	onCanceled( fn: Function )
	{
		this._emitter.addListener( 'canceled', fn );
		return this;
	}

	deregisterOnCanceled( fn: Function )
	{
		this._emitter.removeListener( 'canceled', fn );
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