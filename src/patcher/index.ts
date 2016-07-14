import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-fs';
import * as path from 'path';
import { EventEmitter } from 'events';

import { IEntryHeader } from 'tar-stream';
import * as StreamSpeed from '../downloader/stream-speed';
import { Downloader, DownloadHandle, IDownloadProgress } from '../downloader';
import { Extractor, ExtractHandle, IExtractProgress, IExtractResult } from '../extractor';
import * as Resumable from '../common/resumable';
import { VoodooQueue } from '../queue';
import Common from '../common';

export interface IPatcherOptions
{
	overwrite?: boolean;
	decompressInDownload?: boolean;
}

export interface IPatcherStartOptions
{
	voodooQueue?: boolean;
}

export interface IPatcherStopOptions
{
	voodooQueue?: boolean;
}

interface IPatcherInternalStopOptions extends IPatcherStopOptions
{
	terminate?: boolean;
}

interface IPatchPrepareResult
{
	createdByOldBuild: string[];
	currentFiles: string[];
}

export enum PatchOperation
{
	STOPPED,
	DOWNLOADING,
	PATCHING,
	FINISHED,
}

export abstract class Patcher
{
	static patch( generateUrl: ( () => Promise<string> ) | string, localPackage: GameJolt.IGamePackage, options?: IPatcherOptions ): PatchHandle
	{
		return new PatchHandle( generateUrl, localPackage, options );
	}
}

function log( message ) {
	console.log( 'Patcher: ' + message );
}

function difference( arr1: string[], arr2: string[], caseInsensitive?: boolean )
{
	if ( !caseInsensitive ) {
		return _.difference<string>( arr1, arr2 );
	}

	let result: string[] = [];
	for ( let e1 of arr1 ) {
		let lcE1 = e1.toLowerCase();
		let found = false;
		for ( let e2 of arr2 ) {
			if ( lcE1 == e2.toLowerCase() ) {
				found = true;
				break;
			}
		}

		if ( !found ) {
			result.push( e1 );
		}
	}
	return result;
}

export class PatchHandle
{
	private _state: PatchOperation;
	private _url: string;
	private _wasStopped: boolean;
	private _to: string;
	private _tempFile: string;
	private _archiveListFile: string;
	private _patchListFile: string;
	private _downloadHandle: DownloadHandle;
	private _extractHandle: ExtractHandle;
	private _onProgressFuncMapping: Map<Function, Function>;
	private _onExtractProgressFuncMapping: Map<Function, Function>;

	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;
	private _resumable: Resumable.Resumable;
	private _firstRun: boolean;

	private _emittedDownloading: boolean;
	private _emittedPatching: boolean;
	private _waitForStartPromise: Promise<void>;
	private _waitForStartResolver: () => void;
	private _waitForStartRejector: ( err: NodeJS.ErrnoException ) => void;

	constructor( private _generateUrl: ( () => Promise<string> ) | string, private _localPackage: GameJolt.IGamePackage, private _options?: IPatcherOptions )
	{
		this._options = _.defaults<IPatcherOptions>( this._options || {}, {
			overwrite: false,
			decompressInDownload: false,
		} );

		this._state = PatchOperation.STOPPED;
		this._firstRun = true;
		this._downloadHandle = null;
		this._extractHandle = null;
		this._onProgressFuncMapping = new Map<Function, Function>();
		this._onExtractProgressFuncMapping = new Map<Function, Function>();
		this._emitter = new EventEmitter();
		this._resumable = new Resumable.Resumable();

		this._tempFile = path.join( this._localPackage.install_dir, '.gj-tempDownload' );
		this._archiveListFile = path.join( this._localPackage.install_dir, '.gj-archive-file-list' );
		this._patchListFile = path.join( this._localPackage.install_dir, '.gj-patch-file' );
		this._to = this._localPackage.install_dir;

		this._promise = new Promise<void>( ( resolve, reject ) =>
		{
			this._resolver = resolve;
			this._rejector = reject;
		} );
	}

	get promise()
	{
		return this._promise;
	}

	get state()
	{
		return this._state;
	}

	isDownloading()
	{
		return this._state === PatchOperation.DOWNLOADING || this._state === PatchOperation.STOPPED;
	}

	isPatching()
	{
		return this._state === PatchOperation.PATCHING;
	}

	isFinished()
	{
		return this._state === PatchOperation.FINISHED;
	}

	isRunning()
	{
		switch ( this._state ) {
			case PatchOperation.DOWNLOADING:
				return this._downloadHandle.state === Resumable.State.STARTING || this._downloadHandle.state === Resumable.State.STARTED;

			case PatchOperation.PATCHING:
				return this._extractHandle.state === Resumable.State.STARTING || this._extractHandle.state === Resumable.State.STARTED;

			default:
				return false;

		}
	}

	private _getDecompressStream()
	{
		if ( !this._localPackage.build.archive_type ) {
			return null;
		}

		switch ( this._localPackage.build.archive_type ) {
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

	private download()
	{
		return new Promise<{ promise: Promise<void> }>( ( resolve ) =>
		{
			this._state = PatchOperation.DOWNLOADING;
			this._downloadHandle = Downloader.download( this._generateUrl, this._tempFile, {
				overwrite: this._options.overwrite,
				decompressStream: this._options.decompressInDownload ? this._getDecompressStream() : null,
			} );

			this._downloadHandle
				.onProgress( StreamSpeed.SampleUnit.Bps, ( progress ) => this.emitProgress( progress ) )
				.onStarted( () => resolve( { promise: this._downloadHandle.promise } ) )
				.start();
		} );
	}

	private async patchPrepare(): Promise<IPatchPrepareResult>
	{
		this._state = PatchOperation.PATCHING;

		let createdByOldBuild: string[];

		let currentFiles = ( await Common.fsReadDirRecursively( this._to ) )
			.filter( ( file ) =>
			{
				return !path.basename( file ).startsWith( '.gj-' );
			} )
			.map( ( file ) =>
			{
				return './' + path.relative( this._to, file ).replace( /\\/g, '/' );
			} );
		log( 'Current files: ' + JSON.stringify( currentFiles ) );

		// If the patch file already exists, make sure its valid.
		if ( await Common.fsExists( this._patchListFile ) ) {

			// Make sure the destination is a file.
			let stat = await Common.fsStat( this._patchListFile );
			if ( !stat.isFile() ) {
				throw new Error( 'Can\'t patch because the patch file isn\'t a file.' );
			}

			createdByOldBuild = ( await Common.fsReadFile( this._patchListFile, 'utf8' ) ).split( "\n" );
			log( 'Created by old build files: ' + JSON.stringify( createdByOldBuild ) );
		}
		else {

			let oldBuildFiles: string[];

			// If the destination already exists, make sure its valid.
			if ( await Common.fsExists( this._archiveListFile ) ) {

				// Make sure the destination is a file.
				let stat = await Common.fsStat( this._archiveListFile );
				if ( !stat.isFile() ) {
					throw new Error( 'Can\'t patch because the archive file list isn\'t a file.' );
				}
				oldBuildFiles = ( await Common.fsReadFile( this._archiveListFile, 'utf8' ) ).split( "\n" );
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
				oldBuildFiles = currentFiles;
			}

			log( 'Old build files: ' + JSON.stringify( oldBuildFiles ) );

			// Files that the old build created are files in the file system that are not listed in the old build files
			// In Windows we need to compare the files case insensitively.
			createdByOldBuild = difference( currentFiles, oldBuildFiles, process.platform !== 'linux' );
			log( 'Created by old build files: ' + JSON.stringify( createdByOldBuild ) );

			await Common.fsWriteFile( this._patchListFile, createdByOldBuild.join( "\n" ) );
		}

		return {
			createdByOldBuild: createdByOldBuild,
			currentFiles: currentFiles,
		};
	}

	private async finalizePatch( prepareResult: IPatchPrepareResult, extractResult: IExtractResult )
	{
		let newBuildFiles = extractResult.files;
		log( 'New build files: ' + JSON.stringify( newBuildFiles ) );

		// Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build
		// In Windows we need to compare the files case insensitively.
		let filesToRemove = difference( prepareResult.currentFiles, newBuildFiles.concat( prepareResult.createdByOldBuild ), process.platform !== 'linux' );
		log( 'Files to remove: ' + JSON.stringify( filesToRemove ) );

		// TODO: use del lib
		let unlinks = await Promise.all( filesToRemove.map( ( file ) =>
		{
			return Common.fsUnlink( path.resolve( this._to, file ) );
		} ) );

		await Common.fsWriteFile( this._archiveListFile, newBuildFiles.join( "\n" ) );
		await Common.fsUnlink( this._patchListFile );
	}

	private patch()
	{
		// TODO: restrict operations to the given directories.

		return new Promise<{ promise: Promise<IExtractResult> }>( ( resolve ) =>
		{
			this._extractHandle = Extractor.extract( this._tempFile, this._to, {
				overwrite: true,
				deleteSource: true,
				decompressStream: this._options.decompressInDownload ? null : this._getDecompressStream(),
			} );

			this._extractHandle
				.onProgress( StreamSpeed.SampleUnit.Bps, ( progress ) => this.emitExtractProgress( progress ) )
				.onFile( ( file ) => this.emitFile( file ) )
				.onStarted( () => resolve( { promise: this._extractHandle.promise } ) )
				.start();
		} );
	}

	start( options?: IPatcherStartOptions )
	{
		log( 'Starting resumable' );
		this._resumable.start( { cb: this.onStarting, args: [ options ], context: this } );
	}

	private async onStarting( options?: IPatcherStartOptions )
	{
		log( 'Resumable state: starting' );
		if ( this._firstRun ) {
			this._firstRun = false;
			try {
				VoodooQueue.manage( this );

				let waitForDownload = await this.download();
				this._emitter.emit( 'downloading' );
				this._resumable.started();
				await waitForDownload.promise;

				let prepareResult = await this.patchPrepare();
				let waitForPatch = await this.patch();
				this._emitter.emit( 'patching' );
				let unpackResult = await waitForPatch.promise;

				await this.finalizePatch( prepareResult, unpackResult );
				this.onFinished();
			}
			catch ( err ) {
				log( 'I really really hate you babel: ' + err.message + '\n' + err.stack );
				this.onError( err );
			}
		}
		else {
			if ( this._state === PatchOperation.DOWNLOADING ) {
				this._downloadHandle.onStarted( () =>
				{
					this._resumable.started();
					this._emitter.emit( 'resumed', options && options.voodooQueue );
					log( 'Resumable state: started' );
					VoodooQueue.manage( this );
				} ).start();
			}
			else if ( this._state === PatchOperation.PATCHING ) {
				this._extractHandle.onStarted( () =>
				{
					this._resumable.started();
					this._emitter.emit( 'resumed', options && options.voodooQueue );
					log( 'Resumable state: started' );
					VoodooQueue.manage( this );
				} ).start();
			}
		}
	}

	private _stop( options: IPatcherInternalStopOptions )
	{
		log( 'Stopping resumable' );
		this._resumable.stop( {
			cb: this.onStopping,
			args: [ options ],
			context: this
		} );
	}

	private async onStopping( options: IPatcherInternalStopOptions )
	{
		if ( this._state === PatchOperation.DOWNLOADING ) {
			this._downloadHandle.onStopped( () =>
			{
				this._resumable.stopped();
				this._emitter.emit( options.terminate ? 'canceled' : 'stopped', options && options.voodooQueue );
				log( 'Resumable state: stopped' );
			} ).stop();
		}
		else if ( this._state === PatchOperation.PATCHING ) {
			this._extractHandle.onStopped( () =>
			{
				this._resumable.stopped();
				this._emitter.emit( options.terminate ? 'canceled' : 'stopped', options && options.voodooQueue );
				log( 'Resumable state: stopped' );
			} ).stop( options.terminate );
		}
	}

	stop( options?: IPatcherStopOptions )
	{
		let stopOptions = _.assign<IPatcherStopOptions, IPatcherInternalStopOptions>( options || { voodooQueue: false }, {
			terminate: false,
		} );

		return this._stop( stopOptions );
	}

	cancel( options?: IPatcherStopOptions )
	{
		let stopOptions = _.assign<IPatcherStopOptions, IPatcherInternalStopOptions>( options || { voodooQueue: false }, {
			terminate: true,
		} );

		if ( this._state === PatchOperation.STOPPED || this._state === PatchOperation.FINISHED ||
			 ( this._state === PatchOperation.DOWNLOADING && this._downloadHandle.state === Resumable.State.STOPPED ) ||
			 ( this._state === PatchOperation.PATCHING && this._extractHandle.state === Resumable.State.STOPPED ) ) {
			this._emitter.emit( 'canceled', options && options.voodooQueue );
			log( 'Resumable state: stopped' );
			return;
		}

		return this._stop( stopOptions );
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

	onExtractProgress( unit: StreamSpeed.SampleUnit, fn: ( progress: IDownloadProgress ) => any )
	{
		let func = function( progress: IDownloadProgress )
		{
			progress.sample =  StreamSpeed.StreamSpeed.convertSample( progress.sample, unit );
			progress.timeLeft
			fn( progress );
		};

		this._onExtractProgressFuncMapping.set( fn, func );
		this._emitter.addListener( 'extract-progress', func );
		return this;
	}

	deregisterOnExtractProgress( fn: Function )
	{
		let func = this._onExtractProgressFuncMapping.get( fn );
		if ( func ) {
			this._emitter.removeListener( 'extract-progress', func );
			this._onExtractProgressFuncMapping.delete( fn );
		}
		return this;
	}

	onFile( fn: ( file: IEntryHeader ) => any )
	{
		this._emitter.addListener( 'file', fn );
		return this;
	}

	deregisterOnFile( fn: ( file: IEntryHeader ) => any )
	{
		this._emitter.removeListener( 'file', fn );
		return this;
	}

	onPaused( fn: ( voodooQueue: boolean ) => any )
	{
		this._emitter.addListener( 'stopped', fn );
		return this;
	}

	deregisterOnPaused( fn: ( voodooQueue: boolean ) => any )
	{
		this._emitter.removeListener( 'stopped', fn );
		return this;
	}

	onResumed( fn: ( voodooQueue: boolean ) => any )
	{
		this._emitter.addListener( 'resumed', fn );
		return this;
	}

	deregisterOnResumed( fn: ( voodooQueue: boolean ) => any )
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

	private emitExtractProgress( progress: IExtractProgress )
	{
		this._emitter.emit( 'extract-progress', progress );
	}

	private emitFile( file: IEntryHeader )
	{
		this._emitter.emit( 'file', file );
	}

	private onError( err: NodeJS.ErrnoException )
	{
		log( err.message + '\n' + err.stack );
		if ( this._resumable.state === Resumable.State.STARTING ) {
			log( 'Forced to stop before started. Marking as started first. ' );
			this._resumable.started();
			this._emitter.emit( 'started' );
			log( 'Resumable state: started' );
		}
		this._resumable.stop( { cb: this.onErrorStopping, args: [ err ], context: this }, true );
	}

	private onErrorStopping( err: NodeJS.ErrnoException )
	{
		this._resumable.finished();
		this._rejector( err );
	}

	private onFinished()
	{
		if ( this._resumable.state === Resumable.State.STARTING ) {
			log( 'Forced to stop before started. Marking as started first. ' );
			this._resumable.started();
			this._emitter.emit( 'started' );
			log( 'Resumable state: started' );
		}
		this._resumable.finished();
		this._resolver();
	}
}
