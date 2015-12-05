import * as fs from 'fs';
import * as http from 'http';
import * as url from 'url';
import * as util from 'util';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import * as StreamSpeed from './stream-speed';

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
let fsStat:( path: string ) => Promise<fs.Stats> = Bluebird.promisify( fs.stat );

export interface IDownloadOptions extends StreamSpeed.IStreamSpeedOptions
{
	brotli?: boolean;
	overwrite?: boolean;
	destIsFolder?: boolean
}

export abstract class Downloader
{
	static download( from: string, to: string, options?: IDownloadOptions ): DownloadHandle
	{
		return new DownloadHandle( from, to, options );
	}
}

export enum DownloadHandleState
{
	STARTED,
	STARTING,
	STOPPED,
	STOPPING,
	FINISHED,
}

export interface IDownloadProgress
{
	progress: number;
	sample: StreamSpeed.ISampleData;
}

export class DownloadHandle
{
	private _state: DownloadHandleState;

	private _toFile: string;
	private _toFilename: string;

	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;

	private _totalSize: number;
	private _totalDownloaded: number;

	private _streamSpeed: StreamSpeed.StreamSpeed;
	private _destStream: fs.WriteStream;
	private _request: http.ClientRequest;
	private _response: http.IncomingMessage;

	constructor( private _from: string, private _to: string, private _options: IDownloadOptions )
	{
		this._options = _.defaults( this._options || {}, {
			brotli: true,
			overwrite: false,
			destIsFolder: true,
		} );

		this._state = DownloadHandleState.STOPPED;
		this._emitter = new EventEmitter();
		this.start();
	}

	get from(): string
	{
		return this._from;
	}

	get to(): string
	{
		return this._to;
	}

	get toFilename(): string
	{
		return this._toFilename;
	}

	get toFullpath(): string
	{
		return this._toFile;
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

	async start()
	{
		if ( this._state !== DownloadHandleState.STOPPED ) {
			return false;
		}

		this._state = DownloadHandleState.STARTING;
		this._promise = this.promise; // Make sure a promise exists when starting.

		this._totalSize = 0;
		this._totalDownloaded = 0;

		try {
			if ( this._options.destIsFolder ) {
				let parsedDownloadUrl = url.parse( this._from, true );
				this._toFilename = path.basename( parsedDownloadUrl.pathname );
			}
			else {
				this._toFilename = path.basename( this._to );
				this._to = path.dirname( this._to );
			}
			this._toFile = path.join( this._to, this._toFilename );

			// If the actual file already exists, we resume download.
			let exists = await fsExists( this._toFile );
			if ( await fsExists( this._toFile ) ) {

				// Make sure the destination is a file.
				let stat = await fsStat( this._toFile );
				if ( !stat.isFile() ) {
					throw new Error( 'Can\'t resume downloading because the destination isn\'t a file.' );
				}
				else if ( this._options.overwrite ) {
					let unlinked = await fsUnlink( this._toFile );
					if ( unlinked ) {
						throw new Error( 'Can\'t download because destination cannot be overwritten.' );
					}
					this._options.overwrite = false;
				}
				this._totalDownloaded = stat.size;
			}
			// Otherwise, we validate the folder path.
			else {
				if ( await fsExists( this._to ) ) {
					let dirStat = await fsStat( this._to );
					if ( !dirStat.isDirectory() ) {
						throw new Error( 'Can\'t download to destination because the path is invalid.' );
					}
				}
				// Create the folder path.
				else if ( !( await mkdirp( this._to ) ) ) {
					throw new Error( 'Couldn\'t create the destination folder path' );
				}
			}
		}
		catch ( err ) {
			this.onError( err );
		}

		this.download();
		return true;
	}

	async stop()
	{
		if ( this._state !== DownloadHandleState.STARTED ) {
			return false;
		}

		this._state = DownloadHandleState.STOPPING;

		this._streamSpeed.stop();
		this._response.removeAllListeners();
		this._destStream.removeAllListeners();
		this._response.unpipe( this._destStream );
		this._destStream.close();
		this._request.abort();

		this._state = DownloadHandleState.STOPPED;

		return true;
	}

	private download()
	{
		let hostUrl = url.parse( this._from );
		let httpOptions = {
			host: hostUrl.host,
			path: hostUrl.path,
			headers: {
				'Range': 'bytes=' + this._totalDownloaded.toString() + '-',
			}
		};

		this._destStream = fs.createWriteStream( this._toFile, {
			flags: 'a',
		} );

		this._request = http.request( httpOptions, ( response ) =>
		{
			this._response = response;
			this._streamSpeed = new StreamSpeed.StreamSpeed( this._options );
			this._streamSpeed.onSample( ( sample ) => this.emitProgress( {
				progress: this._totalDownloaded / this._totalSize,
				sample: sample,
			} ) );
			this._state = DownloadHandleState.STARTED;

			// Unsatisfiable request - most likely we've downloaded the whole thing already.
			// TODO - send HEAD request to get content-length and compare.
			if ( this._response.statusCode == 416 ) {
				return this.onFinished();
			}

			// Expecting the partial response status code
			if ( this._response.statusCode != 206 ) {
				return this.onError( new Error( 'Bad status code ' + this._response.statusCode ) );
			}

			if ( !this._response.headers || !this._response.headers[ 'content-range' ] ) {
				return this.onError( new Error( 'Missing or invalid content-range response header' ) );
			}

			try {
				this._totalSize = parseInt( this._response.headers[ 'content-range' ].split( '/' )[1] );
			}
			catch ( err ) {
				return this.onError( new Error( 'Invalid content-range header: ' + this._response.headers[ 'content-range' ] ) );
			}

			if ( this._options.brotli ) {
				this._response
					.pipe( this._streamSpeed )
					.pipe( decompressStream() )
					.pipe( this._destStream );
			}
			else {
				this._response
					.pipe( this._streamSpeed )
					.pipe( this._destStream );
			}

			this._response.on( 'data', ( data ) =>
			{
				this._totalDownloaded += data.length;
			} );

			this._destStream.on( 'finish', () => this.onFinished() );

			this._response.on( 'error', ( err ) => this.onError( err ) );
			this._destStream.on( 'error', ( err ) => this.onError( err ) );
		} );
		this._request.on( 'error', ( err ) => this.onError( err ) );
		this._request.end();
	}

	onProgress( unit: StreamSpeed.SampleUnit, fn: ( progress: IDownloadProgress ) => void ): DownloadHandle
	{
		this._emitter.addListener( 'progress', ( progress: IDownloadProgress ) =>
		{
			progress.sample =  StreamSpeed.StreamSpeed.convertSample( progress.sample, unit );
			fn( progress );
		} );
		return this;
	}

	private emitProgress( progress: IDownloadProgress )
	{
		this._emitter.emit( 'progress', progress );
	}

	private onError( err: NodeJS.ErrnoException )
	{
		this.stop();
		this._rejector( err );
		this._promise = null;
	}

	private onFinished()
	{
		this.stop();
		this._state = DownloadHandleState.FINISHED;
		this._resolver();
	}
}
