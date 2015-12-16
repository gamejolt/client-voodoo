import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-stream';
import * as tarFS from 'tar-fs';
import { EventEmitter } from 'events';
import { Readable, Transform } from 'stream';
import * as StreamSpeed from '../downloader/stream-speed';
import Common from '../common';

export interface IExtractOptions extends tarFS.IExtractOptions
{
	deleteSource?: boolean;
	overwrite?: boolean;
	decompressStream?: Transform;
}

export interface IExtractProgress
{
	progress: number;
	timeLeft: number;
	sample: StreamSpeed.ISampleData;
}

export interface IExtractResult
{
	success: boolean;
	files: string[];
}

export abstract class Extractor
{
	static extract( from: string, to: string, options?: IExtractOptions ): ExtractHandle
	{
		return new ExtractHandle( from, to, options );
	}
}

export class ExtractHandle
{
	private _promise: Promise<IExtractResult>;
	private _resolver: ( result: IExtractResult ) => any;
	private _rejector: Function;

	private _streamSpeed: StreamSpeed.StreamSpeed;
	private _readStream: Readable;
	private _extractStream: tar.Extract;
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

		this._emitter = new EventEmitter();
	}

	get from(): string
	{
		return this._from;
	}

	get to(): string
	{
		return this._to;
	}

	get promise()
	{
		if ( !this._promise ) {
			this._promise = new Promise<IExtractResult>( ( resolve, reject ) =>
			{
				this._resolver = function( result: IExtractResult )
				{
					console.log( 'done' );
					if ( this._streamSpeed ) {
						console.log( 'Removing stream speed' );
						this._streamSpeed.stop();
					}

					if ( !this._terminated ) {
						resolve( result );
					}
				};
				this._rejector = function( err )
				{
					if ( this._streamSpeed ) {
						this._streamSpeed.stop();
					}

					reject( err );
				};
			} );
		}
		return this._promise;
	}

	async start(): Promise<boolean>
	{
		if ( this._running || this._terminated ) {
			return false;
		}
		else if ( this._readStream ) {
			this._pipe();
			this._readStream.resume();
			return true;
		}

		this._running = true;
		this._promise = this.promise; // Make sure a promise exists when starting.

		if ( !( await Common.fsExists( this._from ) ) ) {
			throw new Error( 'Can\'t extract to destination because the source does not exist' );
		}

		let srcStat = await Common.fsStat( this._from );
		if ( !srcStat.isFile() ) {
			throw new Error( 'Can\'t extract to destination because the source is not a valid file' );
		}

		this._totalSize = srcStat.size;
		this._totalProcessed = 0;

		// If the destination already exists, make sure its valid.
		if ( await Common.fsExists( this._to ) ) {
			let destStat = await Common.fsStat( this._to );
			if ( !destStat.isDirectory() ) {
				throw new Error( 'Can\'t extract to destination because its not a valid directory' );
			}

			// Don't extract to a non-empty directory.
			let filesInDest = await Common.fsReadDir( this._to );
			if ( filesInDest && filesInDest.length > 0 ) {

				// Allow extracting to a non empty directory only if the overwrite option is set.
				if ( !this._options.overwrite ) {
					throw new Error( 'Can\'t extract to destination because it isnt empty' );
				}
			}
		}
		// Create the folder path to extract to.
		else if ( !( await Common.mkdirp( this._to ) ) ) {
			throw new Error( 'Couldn\'t create destination folder path' );
		}

		// Check terminated again because between checking the fs and now it could've changed.
		if ( this._terminated ) {
			return false;
		}

		return new Promise<boolean>( ( resolve ) => this.extract( resolve ) );
	}

	private async extract( resolve: ( result: boolean ) => any )
	{
		let files: string[] = [];
		let result;
		try {
			result = await new Promise<boolean>( ( _resolve, _reject ) =>
			{
				this._readStream = fs.createReadStream( this._from );

				// If stopped between starting and here, the stop wouldn't have registered this read stream. So just do it now.
				if ( !this._running ) {
					this.stop( false );
				}

				let optionsMap = this._options.map;
				this._extractStream = tarFS.extract( this._to, _.assign( this._options, {
					map: ( header: tar.IEntryHeader ) =>
					{
						if ( optionsMap ) {
							header = optionsMap( header );
						}

						// TODO: fuggin symlinks and the likes.
						if ( header && header.type === 'file' ) {
							files.push( header.name );
							this.emitFile( header );
						}

						return header;
					},
				} ) );

				this._extractStream.on( 'finish', () => _resolve( true ) );
				this._extractStream.on( 'error', ( err ) => _reject( err ) );

				this._streamSpeed = new StreamSpeed.StreamSpeed( this._options );
				this._streamSpeed.stop(); //  Dont auto start. _pipe will take care of that
				this._streamSpeed.onSample( ( sample ) => this.emitProgress( {
					progress: this._totalProcessed / this._totalSize,
					timeLeft: Math.round( ( this._totalSize - this._totalProcessed ) / sample.currentAverage ),
					sample: sample,
				} ) );

				if ( this._options.decompressStream ) {
					this._streamSpeed
						.pipe( this._options.decompressStream )
						.pipe( this._extractStream );
				}
				else {
					this._streamSpeed.pipe( this._extractStream );
				}

				this._pipe();
				resolve( true );
			} );
		}
		catch ( err ) {
			resolve( false );
			this._rejector( err );
			return;
		}

		// If we're here we should be running because it can only trigger the stream's finish event if we've resumed the reading pipes.
		// So here its safe to continue on the assumption that we werent stopped or terminated and delete the source file if needed
		if ( result && this._options.deleteSource ) {

			// Remove the source file, but throw only if there was an error and the file still exists.
			let unlinked = await Common.fsUnlink( this._from );
			if ( unlinked && ( await Common.fsExists( this._from ) ) ) {
				throw unlinked;
			}
		}

		this._resolver( {
			success: result,
			files: files,
		} );
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

	private _pipe()
	{
		this._readStream
			.on( 'data', ( data: string | Buffer ) => { this._totalProcessed += data.length } )
			.on( 'error', ( err ) => this._rejector( err ) );

		this._readStream.pipe( this._streamSpeed );
		this._streamSpeed.start();
	}

	private _unpipe()
	{
		this._readStream.unpipe();
		this._readStream.removeAllListeners();
		this._streamSpeed.stop();
	}

	async stop( terminate?: boolean )
	{
		this._running = false;
		if ( terminate ) {
			this._terminated = true;
			let readStreamHack: any = this._readStream;
			readStreamHack.destroy(); // Hack to get ts to stop bugging me. Its an undocumented function on readable streams
		}
		else {
			this._readStream.pause();
			this._unpipe();
		}
		return true;
	}
}
