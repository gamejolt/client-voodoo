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
		this._emitter = new EventEmitter();

		this._promise = this.promise;

		this.patch()
			.then( () => this.onFinished() )
			.catch( ( err ) => this.onError( err ) );
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

		// If the destination already exists, make sure its valid.
		if ( await fsExists( this._options.archiveListFile ) ) {

			// Make sure the destination is a file.
			let stat = await fsStat( this._options.archiveListFile );
			if ( !stat.isFile() ) {
				throw new Error( 'Can\'t patch because the archive file list isn\'t a file.' );
			}
		}
		// Otherwise, we validate the folder path.
		else {
			let archiveListFileDir = path.dirname( this._options.archiveListFile );
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
		if ( !( await fsExists( this._options.archiveListFile ) ) ) {
			oldBuildFiles = currentFiles;
		}
		else {
			oldBuildFiles = ( await fsReadFile( this._options.archiveListFile, 'utf8' ) ).split( "\n" );
		}

		let extractResult = await Extractor.extract( this._from, this._to, {
			brotli: this._options.brotli,
			overwrite: true,
			deleteSource: true,
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

		await fsWriteFile( this._options.archiveListFile, newBuildFiles.join( "\n" ) );
		return true;
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
