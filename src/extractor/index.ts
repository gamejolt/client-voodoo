import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-stream';
import * as tarFS from 'tar-fs';
import * as path from  'path';
import { EventEmitter } from 'events';
import * as StreamSpeed from '../downloader/stream-speed';
import * as Resumable from '../common/resumable';
import Common from '../common';
import * as through2 from 'through2';

export interface IExtractOptions extends tarFS.IExtractOptions
{
	deleteSource?: boolean;
	overwrite?: boolean;
	decompressStream?: any;
}

export interface IExtractProgress
{
	progress: number;
	timeLeft: number;
	sample: StreamSpeed.ISampleData;
}

export interface IExtractResult
{
	files: string[];
}

export abstract class Extractor
{
	static extract( from: string, to: string, options?: IExtractOptions ): ExtractHandle
	{
		return new ExtractHandle( from, to, options );
	}
}

function log( message ) {
	console.log( 'Extractor: ' + message );
}

export class ExtractHandle
{
	private _promise: Promise<IExtractResult>;
	private _resolver: ( result: IExtractResult ) => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _resumable: Resumable.Resumable;
	private _firstRun: boolean;

	private _streamSpeed: StreamSpeed.StreamSpeed;
	private _readStream: any;
	private _extractStream: tar.Extract;
	private _extractedFiles: string[];
	private _totalProcessed: number;
	private _totalSize: number;

	private _emitter: EventEmitter;
	private _running: boolean;
	private _terminated: boolean;

	constructor( private _from: string, private _to: string, private _options?: IExtractOptions )
	{
		this._options = _.defaults( this._options || {}, {
			deleteSource: false,
			overwrite: false,
		} );

		this._firstRun = true;
		this._promise = new Promise<IExtractResult>( ( resolve, reject ) =>
		{
			this._resolver = resolve;
			this._rejector = reject;
		} );

		this._emitter = new EventEmitter();
		this._resumable = new Resumable.Resumable();
		this._extractedFiles = [];
		this._totalSize = 0;
		this._totalProcessed = 0;
	}

	get from(): string
	{
		return this._from;
	}

	get to(): string
	{
		return this._to;
	}

	get state()
	{
		return this._resumable.state;
	}

	get promise()
	{
		return this._promise;
	}

	private async prepareFS()
	{
		log( 'Preparing fs' );
		if ( !( await Common.fsExists( this._from ) ) ) {
			throw new Error( 'Can\'t unpack to destination because the source does not exist' );
		}

		let srcStat = await Common.fsStat( this._from );
		if ( !srcStat.isFile() ) {
			throw new Error( 'Can\'t unpack to destination because the source is not a valid file' );
		}

		this._totalSize = srcStat.size;
		this._totalProcessed = 0;

		// If the destination already exists, make sure its valid.
		if ( await Common.fsExists( this._to ) ) {
			let destStat = await Common.fsStat( this._to );
			if ( !destStat.isDirectory() ) {
				throw new Error( 'Can\'t unpack to destination because its not a valid directory' );
			}

			// Don't unpack to a non-empty directory.
			let filesInDest = await Common.fsReadDir( this._to );
			if ( filesInDest && filesInDest.length > 0 ) {

				// Allow unpacking to a non empty directory only if the overwrite option is set.
				if ( !this._options.overwrite ) {
					throw new Error( 'Can\'t unpack to destination because it isnt empty' );
				}
			}
		}
		// Create the folder path to unpack to.
		else if ( !( await Common.mkdirp( this._to ) ) ) {
			throw new Error( 'Couldn\'t create destination folder path' );
		}
	}

	private async unpack()
	{
		log( 'Unpacking from ' + this._from + ' to ' + this._to );
		return new Promise<void>( ( resolve, reject ) =>
		{
			this._readStream = fs.createReadStream( this._from );
			this._readStream.on( 'error', ( err ) => this._rejector( err ) );

			let optionsMap = this._options.map;
			this._extractStream = tarFS.extract( this._to, _.assign( this._options, {
				strict: true,
				map: ( header: tar.IEntryHeader ) =>
				{
					if ( optionsMap ) {
						header = optionsMap( header );
					}

					if ( path.relative( this._to, path.resolve( this._to, header.name ) ).startsWith( '..' + path.sep ) ) {
						// Makes tar fs die with 'unsupported type
						header.name = this._to;
						header.type = 'kill me now';
					}

					// TODO: fuggin symlinks and the likes.
					if ( header && header.type === 'file' ) {
						this._extractedFiles.push( header.name );
						this.emitFile( header );
					}

					return header;
				},
			} ) );

			this._extractStream.on( 'finish', () => resolve() );
			this._extractStream.on( 'error', ( err: NodeJS.ErrnoException ) =>
			{
				let match = err.message.match( /^unsupported type for (.*) \(kill me now\)$/ );
				if ( match ) {
					err = new Error( 'Sneaky sneaky tar file attempted to break from its directory: ' + match[1] );
				}
				reject( err );
			} );

			this._streamSpeed = new StreamSpeed.StreamSpeed( this._options );
			this._streamSpeed.stop(); //  Dont auto start. resume() will take care of that
			this._streamSpeed.onSample( ( sample ) => this.emitProgress( {
				progress: this._totalProcessed / this._totalSize,
				timeLeft: Math.round( ( this._totalSize - this._totalProcessed ) / sample.currentAverage ),
				sample: sample,
			} ) );

			if ( this._options.decompressStream ) {
				this._streamSpeed.stream
					.pipe( this._options.decompressStream )
					.pipe( this._extractStream );
			}
			else {
				this._streamSpeed.stream.pipe( this._extractStream );
			}

			this.resume();

			this._resumable.started();
			this._emitter.emit( 'started' );
			log( 'Resumable state: started' );
		} );
	}

	start()
	{
		log( 'Starting resumable' );
		this._resumable.start( { cb: this.onStarting, context: this } );
	}

	private async onStarting()
	{
		log( 'Resumable state: starting' );
		if ( this._firstRun ) {
			this._firstRun = false;
			try {
				await this.prepareFS();

				// Somewhere in here the task will be marked as started, allowing it to pause and resume.
				// This will return only after the archive has been fully extracted.
				await this.unpack();
				if ( this._options.deleteSource ) {

					// Remove the source file, but throw only if there was an error and the file still exists.
					let unlinked = await Common.fsUnlink( this._from );
					if ( unlinked && ( await Common.fsExists( this._from ) ) ) {
						throw unlinked;
					}
				}

				this.onFinished();
			}
			catch ( err ) {
				log( 'I really hate you babel: ' + err.message + '\n' + err.stack );
				this.onError( err );
			}
		}
		else {
			this.resume();

			this._resumable.started();
			this._emitter.emit( 'started' );
			log( 'Resumable state: started' );
		}
	}

	onStarted( cb: Function )
	{
		this._emitter.once( 'started', cb );
		return this;
	}

	stop( terminate?: boolean )
	{
		log( 'Stopping resumable' );
		this._resumable.stop( { cb: terminate ? this.onTerminating : this.onStopping, context: this } );
	}

	private onStopping()
	{
		log( 'Resumable state: stopping' );

		this.pause();

		this._resumable.stopped();
		this._emitter.emit( 'stopped' );
		log( 'Resumable state: stopped' );
	}

	onStopped( cb: Function )
	{
		this._emitter.once( 'stopped', cb );
		return this;
	}

	private async onTerminating()
	{
		log( 'Resumable state: stopping' );

		let readStreamHack: any = this._readStream;
		readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams

		if ( this._options.deleteSource ) {

			// Remove the source file, but throw only if there was an error and the file still exists.
			let unlinked = await Common.fsUnlink( this._from );
			if ( unlinked && ( await Common.fsExists( this._from ) ) ) {
				// TODO: what to do with this error
				throw unlinked;
			}
		}

		this._resumable.stopped();
		this._emitter.emit( 'stopped' );
		log( 'Resumable state: stopped' );
	}

	onProgress( unit: StreamSpeed.SampleUnit, fn: ( progress: IExtractProgress ) => void )
	{
		this._emitter.addListener( 'progress', ( progress: IExtractProgress ) =>
		{
			progress.sample =  StreamSpeed.StreamSpeed.convertSample( progress.sample, unit );
			fn( progress );
		} );
		return this;
	}

	private emitProgress( progress: IExtractProgress )
	{
		this._emitter.emit( 'progress', progress );
	}

	onFile( fn: ( file: tar.IEntryHeader ) => void )
	{
		this._emitter.addListener( 'file', fn );
		return this;
	}

	private emitFile( file: tar.IEntryHeader )
	{
		this._emitter.emit( 'file', file );
	}

	private resume()
	{
		this._readStream
			.pipe( through2( ( chunk, enc, cb ) =>
			{
				this._totalProcessed += chunk.length;
				cb( null, chunk );
			} ) )
			.pipe( this._streamSpeed.stream );

		this._streamSpeed.start();
	}

	private pause()
	{
		if ( this._readStream ) {
			this._readStream.unpipe();
		}

		if ( this._streamSpeed ) {
			this._streamSpeed.stop();
		}
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
		this.pause();
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
		this.pause();
		this._resumable.finished();
		this._resolver( {
			files: this._extractedFiles,
		} );
	}
}
