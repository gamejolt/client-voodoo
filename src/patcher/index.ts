import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-fs';
import * as path from 'path';
import { EventEmitter } from 'events';

import * as StreamSpeed from '../downloader/stream-speed';
import { Downloader, DownloadHandle, IDownloadProgress } from '../downloader';
import { Extractor } from '../extractor';

let decompressStream = require( 'iltorb' ).decompressStream;

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
	brotli?: boolean;
	tempDir: string;
	archiveListFile: string;
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
	static patch( from: string, to: string, options: IPatcherOptions ): PatchHandle
	{
		return new PatchHandle( from, to, options );
	}
}

export class PatchHandle
{
	private _state: PatchHandleState;
	private _downloadHandle: DownloadHandle;

	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;

	constructor( private _from: string, private _to: string, private _options: IPatcherOptions )
	{
		this._options = _.defaults<IPatcherOptions>( this._options || {}, {
			brotli: true,
		} );

		this._state = PatchHandleState.STOPPED;
		this._downloadHandle = null;
		this._emitter = new EventEmitter();
		this.start();
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

	start()
	{
		if ( this._state !== PatchHandleState.STOPPED ) {
			return false;
		}

		this._promise = this.promise;

		this._state = PatchHandleState.DOWNLOADING;

		this._downloadHandle = this._downloadHandle || Downloader.download( this._from, this._options.tempDir, {
			brotli: this._options.brotli,
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

		let currentFiles: string[];
		if ( !( await fsExists( this._to ) ) || !( await fsStat( this._to ) ).isDirectory() ) {
			currentFiles = [];
		}
		else {
			// TODO: check if ./ is valid on windows platforms as well.
			currentFiles = ( await fsReadDirRecursively( this._to ) ).map( ( file ) => './' + path.relative( this._to, file ) );
		}
		console.log( 'Current files: ' + JSON.stringify( currentFiles ) );

		let oldBuildFiles;
		if ( !( await fsExists( this._options.archiveListFile ) ) ) {
			oldBuildFiles = currentFiles;
		}
		else {
			oldBuildFiles = ( await fsReadFile( this._options.archiveListFile, 'utf8' ) ).split( "\n" );
		}
		console.log( 'Old files: ' + JSON.stringify( oldBuildFiles ) );


		let extractResult = await Extractor.extract( this._downloadHandle.toFullpath, this._to, {
			brotli: false,
			overwrite: true,
		} );

		if ( !extractResult.success ) {
			throw new Error( 'Failed to extract patch file' );
		}

		let newBuildFiles = extractResult.files;
		console.log( 'New files: ' + JSON.stringify( newBuildFiles ) );

		// Files that the old build created are files in the file system that are not listed in the old build files
		let createdByOldBuild = _.difference( currentFiles, oldBuildFiles );
		console.log( 'Created by old files: ' + JSON.stringify( createdByOldBuild ) );

		// Files that need to be removed are files in fs that dont exist in the new build and were not created dynamically by the old build
		let filesToRemove = _.difference( currentFiles, newBuildFiles, createdByOldBuild );
		console.log( 'Removing ' + JSON.stringify( filesToRemove ) );

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

		await fsWriteFile( this._options.archiveListFile, newBuildFiles.join( "\n" ) );
		return true;
	}

	onProgress( unit: StreamSpeed.SampleUnit, fn: ( state: PatchHandleState, progress?: IDownloadProgress ) => void ): PatchHandle
	{
		this._emitter.addListener( 'progress', ( progress: IDownloadProgress ) =>
		{
			progress.sample =  StreamSpeed.StreamSpeed.convertSample( progress.sample, unit );
			fn( this._state, progress );
		} );
		return this;
	}

	private emitProgress( progress?: IDownloadProgress )
	{
		this._emitter.emit( 'progress', this._state, progress );
	}

	private onError( err: NodeJS.ErrnoException )
	{
		this.stop().then( () =>
		{
			this._state = PatchHandleState.STOPPED;
			this._rejector( err );
			this._promise = null;
		} );
	}

	private onFinished()
	{
		this.stop().then( () =>
		{
			this._state = PatchHandleState.FINISHED;
			this._resolver();
		} );
	}
}
