import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import * as request from 'request';
import * as StreamSpeed from './stream-speed';
import * as Resumable from '../common/resumable';
import Common from '../common';

export interface IDownloadOptions extends StreamSpeed.ISampleOptions
{
	overwrite?: boolean;
	decompressStream?: any;
}

export abstract class Downloader
{
	static download( generateUrl: ( () => Promise<string> ) | string, to: string, options?: IDownloadOptions ): DownloadHandle
	{
		return new DownloadHandle( generateUrl, to, options );
	}
}

export interface IDownloadProgress
{
	progress: number;
	timeLeft: number;
	sample: StreamSpeed.ISampleData;
}

function log( message ) {
	console.log( `Downloader: ${message}` );
}

export class DownloadHandle
{
	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejector: ( err: NodeJS.ErrnoException ) => void;
	private _emitter: EventEmitter;
	private _resumable: Resumable.Resumable;

	private _url: string;
	private _totalSize: number;
	private _totalDownloaded: number;

	private _streamSpeed: StreamSpeed.StreamSpeed;
	private _destStream: fs.WriteStream;
	private _request: request.Request;
	private _response: http.IncomingMessage;

	constructor( private _generateUrl: ( () => Promise<string> ) | string, private _to: string, private _options: IDownloadOptions )
	{
		this._options = _.defaults( this._options || {}, {
			overwrite: false,
		} );

		this._promise = new Promise<void>( ( resolve, reject ) =>
		{
			this._resolver = resolve;
			this._rejector = reject;
		} );

		this._emitter = new EventEmitter();
		this._resumable = new Resumable.Resumable();
		this._totalSize = 0;
		this._totalDownloaded = 0;
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
		return this._resumable.state;
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
		return this._promise;
	}

	private async prepareFS()
	{
		log( 'Preparing fs' );
		// If the actual file already exists, we resume download.
		if ( await Common.fsExists( this._to ) ) {

			// Make sure the destination is a file.
			let stat = await Common.fsStat( this._to );
			if ( !stat.isFile() ) {
				throw new Error( `Can't resume downloading because the destination isn't a file.` );
			}
			else if ( this._options.overwrite ) {
				await Common.fsUnlink( this._to );
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
					throw new Error( `Can't download to destination because the path is invalid.` );
				}
			}
			// Create the folder path.
			else if ( !( await Common.mkdirp( toDir ) ) ) {
				throw new Error( `Couldn't create the destination folder path` );
			}
		}
		this._options.overwrite = false;
	}

	private async generateUrl()
	{
		log( 'Generating url' );
		let _generateUrl: any = this._generateUrl;
		if ( typeof _generateUrl === 'string' ) {
			this._url = _generateUrl;
		}
		else {
			this._url = await _generateUrl();
		}
	}

	private download()
	{
		log( `Downloading from ${this._url}` );
		let httpOptions: request.CoreOptions = {
			headers: {
				'Range': `bytes=${ this._totalDownloaded.toString() }-`,
			},
		};

		this._destStream = fs.createWriteStream( this._to, {
			flags: 'a',
		} );

		this._request = request.get( this._url, httpOptions )
			.on( 'response', ( response: http.IncomingMessage ) =>
			{
				// If received a redirect, simply skip the response and wait for the next one
				if ( response.statusCode === 301 ) {
					return;
				}

				this._response = response;

				this._streamSpeed = new StreamSpeed.StreamSpeed( this._options );
				this._streamSpeed
					.onSample( ( sample ) => this.emitProgress( {
						progress: this._totalDownloaded / this._totalSize,
						timeLeft: Math.round( ( this._totalSize - this._totalDownloaded ) / sample.currentAverage ),
						sample: sample,
					} ) )
					.stream.on( 'error', ( err ) => this.onError( err ) );

				// Unsatisfiable request - most likely we've downloaded the whole thing already.
				// TODO - send HEAD request to get content-length and compare.
				if ( this._response.statusCode === 416 ) {
					this.onFinished();
					return;
				}

				// Expecting the partial response status code
				if ( this._response.statusCode !== 206 ) {
					return this.onError( new Error( `Bad status code ${this._response.statusCode}` ) );
				}

				if ( !this._response.headers || !this._response.headers[ 'content-range' ] ) {
					return this.onError( new Error( 'Missing or invalid content-range response header' ) );
				}

				try {
					this._totalSize = parseInt( this._response.headers[ 'content-range' ].split( '/' )[1] );
				}
				catch ( err ) {
					return this.onError( new Error( `Invalid content-range header: ${ this._response.headers[ 'content-range' ] }` ) );
				}

				if ( this._options.decompressStream ) {
					this._request
						.pipe( this._streamSpeed.stream )
						.pipe( this._options.decompressStream )
						.pipe( this._destStream );
				}
				else {
					this._request
						.pipe( this._streamSpeed.stream )
						.pipe( this._destStream );
				}

				this._destStream.on( 'finish', () => this.onFinished() );
				this._destStream.on( 'error', ( err ) => this.onError( err ) );

				this._resumable.started();
				this._emitter.emit( 'started' );
				log( 'Resumable state: started' );
			} )
			.on( 'data', ( data ) =>
			{
				this._totalDownloaded += data.length;
			} )
			.on( 'error', ( err ) =>
			{
				if ( !this._response ) {
					throw err;
				}
				else {
					this.onError( err );
				}
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
		try {
			await this.prepareFS();
			await this.generateUrl();
			this.download();
		}
		catch ( err ) {
			log( `${err.message}\n${err.stack}` );
			this.onError( err );
		}
	}

	onStarted( cb: Function )
	{
		this._emitter.once( 'started', cb );
		return this;
	}

	stop()
	{
		log( 'Stopping resumable' );
		this._resumable.stop( { cb: this.onStopping, context: this } );
	}

	private onStopping()
	{
		log( 'Resumable state: stopping' );
		if ( this._streamSpeed ) {
			this._streamSpeed.stop();
			this._streamSpeed = null;
		}

		if ( this._response ) {
			this._response.removeAllListeners();
		}
		if ( this._destStream ) {
			this._destStream.removeAllListeners();
		}
		if ( this._response ) {
			this._response.unpipe( this._destStream );
			this._response = null;
		}
		if ( this._destStream ) {
			this._destStream.close();
			this._destStream = null;
		}
		if ( this._request ) {
			this._request.abort();
			this._request = null;
		}

		this._resumable.stopped();
		this._emitter.emit( 'stopped' );
		log( 'Resumable state: stopped' );
	}

	onStopped( cb: Function )
	{
		this._emitter.once( 'stopped', cb );
		return this;
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
		log( 'Error' );
		this.onStopping();
		this._resumable.finished();
		this._rejector( err );
	}

	private onFinished()
	{
		log( 'Finished' );
		if ( this._resumable.state === Resumable.State.STARTING ) {
			log( 'Forced to stop before started. Marking as started first. ' );
			this._resumable.started();
			this._emitter.emit( 'started' );
			log( 'Resumable state: started' );
		}
		this.onStopping();
		this._resumable.finished();
		this._resolver();
	}
}
