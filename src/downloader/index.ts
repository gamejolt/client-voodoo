import * as fs from 'fs';
import * as http from 'http';
import * as url from 'url';
import * as util from 'util';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import { Transform } from 'stream';
import * as request from 'request';
import * as StreamSpeed from './stream-speed';
import Common from '../common';

export interface IDownloadOptions extends StreamSpeed.IStreamSpeedOptions
{
	overwrite?: boolean;
	decompressStream?: Transform;
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
	timeLeft: number;
	sample: StreamSpeed.ISampleData;
}

export class DownloadHandle
{
	private _state: DownloadHandleState;

	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;

	private _totalSize: number;
	private _totalDownloaded: number;

	private _streamSpeed: StreamSpeed.StreamSpeed;
	private _destStream: fs.WriteStream;
	private _request: request.Request;
	private _response: http.IncomingMessage;

	constructor( private _url: string, private _to: string, private _options: IDownloadOptions )
	{
		this._options = _.defaults( this._options || {}, {
			overwrite: false,
		} );

		this._state = DownloadHandleState.STOPPED;
		this._emitter = new EventEmitter();
	}

	get url()
	{
		return this._url;
	}

	get to()
	{
		return this._to;
	}

	get state()
	{
		return this._state;
	}

	get totalSize()
	{
		return this._totalSize;
	}

	get totalDownloaded()
	{
		return this._totalDownloaded;
	}

	get promise()
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

			// If the actual file already exists, we resume download.
			if ( await Common.fsExists( this._to ) ) {

				// Make sure the destination is a file.
				let stat = await Common.fsStat( this._to );
				if ( !stat.isFile() ) {
					throw new Error( 'Can\'t resume downloading because the destination isn\'t a file.' );
				}
				else if ( this._options.overwrite ) {
					let unlinked = await Common.fsUnlink( this._to );
					if ( unlinked ) {
						throw new Error( 'Can\'t download because destination cannot be overwritten.' );
					}
					stat.size = 0;
				}
				this._totalDownloaded = stat.size;
			}
			// Otherwise, we validate the folder path.
			else {
				let toDir = path.dirname( this._to );
				if ( await Common.fsExists( toDir ) ) {
					let dirStat = await Common.fsStat( toDir );
					if ( !dirStat.isDirectory() ) {
						throw new Error( 'Can\'t download to destination because the path is invalid.' );
					}
				}
				// Create the folder path.
				else if ( !( await Common.mkdirp( toDir ) ) ) {
					throw new Error( 'Couldn\'t create the destination folder path' );
				}
			}
			this._options.overwrite = false;
		}
		catch ( err ) {
			this.onError( err );
			return false;
		}

		return new Promise<boolean>( ( resolve ) => this.download( resolve ) );
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

	private download( resolve: ( result: boolean ) => any )
	{

		let hostUrl = url.parse( this._url );
		let httpOptions: request.CoreOptions = {
			headers: {
				'Range': 'bytes=' + this._totalDownloaded.toString() + '-',
			},
		};

		this._destStream = fs.createWriteStream( this._to, {
			flags: 'a',
		} );

		this._request = request.get( this._url, httpOptions )
			.on( 'response', ( response: http.IncomingMessage ) =>
			{
				if ( response.statusCode === 301 ) {
					return;
				}

				this._response = response;

				this._streamSpeed = new StreamSpeed.StreamSpeed( this._options );
				this._streamSpeed.onSample( ( sample ) => this.emitProgress( {
					progress: this._totalDownloaded / this._totalSize,
					timeLeft: Math.round( ( this._totalSize - this._totalDownloaded ) / sample.currentAverage ),
					sample: sample,
				} ) );
				this._state = DownloadHandleState.STARTED;
				resolve( true );

				// Unsatisfiable request - most likely we've downloaded the whole thing already.
				// TODO - send HEAD request to get content-length and compare.
				if ( this._response.statusCode === 416 ) {
					return this.onFinished();
				}

				// Expecting the partial response status code
				if ( this._response.statusCode !== 206 ) {
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

				if ( this._options.decompressStream ) {
					this._request
						.pipe( this._streamSpeed )
						.pipe( this._options.decompressStream )
						.pipe( this._destStream );
				}
				else {
					this._request
						.pipe( this._streamSpeed )
						.pipe( this._destStream );
				}

				this._destStream.on( 'finish', () => this.onFinished() );
				this._destStream.on( 'error', ( err ) => this.onError( err ) );
			} )
			.on( 'data', ( data ) =>
			{
				this._totalDownloaded += data.length;
		 	} )
			.on( 'error', ( err ) => this.onError( err ) );

		// 	this._response.on( 'data', ( data ) =>
		// 	{
		// 		this._totalDownloaded += data.length;
		// 	} );

		// 	this._destStream.on( 'finish', () => this.onFinished() );

		// 	this._response.on( 'error', ( err ) => this.onError( err ) );
		// 	this._destStream.on( 'error', ( err ) => this.onError( err ) );
		// } );
		// this._request.on( 'error', ( err ) => this.onError( err ) );
		// this._request.end();
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
