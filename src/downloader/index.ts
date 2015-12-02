import * as fs from 'fs';
import * as http from 'http';
import * as url from 'url';
import * as util from 'util';
import { EventEmitter } from 'events';

let Bluebird = require( 'bluebird' );
let fsUnlink:( path: string ) => Promise<NodeJS.ErrnoException> = Bluebird.promisify( fs.unlink );
let fsExists = function( path: string ): Promise<boolean>
{
	return new Promise<boolean>( function( resolve )
	{
		fs.exists( path, resolve );
	} );
}
let fsStat:( path: string ) => Promise<fs.Stats> = Bluebird.promisify( fs.stat );

abstract class Downloader
{
	static download( from: string, to: string ): DownloadHandle
	{
		return new DownloadHandle( from, to );
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

class DownloadHandle
{
	private _state: DownloadHandleState;
	private _emitter: EventEmitter;
	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejecter: ( err: NodeJS.ErrnoException ) => void;
	private _peakSpeed: number;
	private _lowSpeed: number;
	private _avgSpeed: number;
	private _speedTicksCount: number;
	private _curSpeed: number;
	private _curSpeedTicks: Array<number>;
	private _curSpeedInterval: number;
	private _totalSize: number;
	private _totalDownloaded: number;
	private destStream: fs.WriteStream;
	private request: http.ClientRequest;
	private response: http.IncomingMessage;

	constructor( private _from: string, private _to: string )
	{
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

	get peakKbps(): number
	{
		return this._peakSpeed / 1024;
	}

	get lowKbps(): number
	{
		return this._lowSpeed / 1024;
	}

	get avgKbps(): number
	{
		return this._avgSpeed / 1024;
	}

	get currentKbps(): number
	{
		return this._curSpeed / 1024;
	}

	get currentAveragedSpeed(): number
	{
		if ( this._curSpeedTicks.length === 0 ) {
			return this.currentKbps;
		}

		let sum = this._curSpeedTicks.reduce( function( accumulated, current )
		{
			return accumulated + current / 1024;
		}, 0 );

		return sum / this._curSpeedTicks.length;
	}

	get promise(): Promise<void>
	{
		if ( !this._promise ) {
			this._promise = new Promise<void>( ( resolve, reject ) =>
			{
				this._resolver = resolve;
				this._rejecter = reject;
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

		this._peakSpeed = 0;
		this._lowSpeed = 0;
		this._avgSpeed = 0;
		this._speedTicksCount = 0;
		this._curSpeed = 0;
		this._curSpeedTicks = [];
		this._totalSize = 0;
		this._totalDownloaded = 0;

		try {
			let exists = await fsExists( this._to );
			if ( await fsExists( this._to ) ) {
				let stat = await fsStat( this._to );
				this._totalDownloaded = stat.size;
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

		clearInterval( this._curSpeedInterval );
		this.response.removeAllListeners();
		this.destStream.removeAllListeners();
		this.response.unpipe( this.destStream );
		this.destStream.close();
		this.request.abort();

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

		this.destStream = fs.createWriteStream( this._to, {
			encoding: 'binary',
			flags: 'a',
		} );

		this.request = http.request( httpOptions, ( response ) =>
		{
			this.response = response;
			this._curSpeedInterval = setInterval( this.onTick.bind( this ), 1000 );
			this._state = DownloadHandleState.STARTED;

			// Unsatisfiable request - most likely we've downloaded the whole thing already.
			// TODO - send HEAD request to get content-length and compare.
			if ( this.response.statusCode == 416 ) {
				return this.onFinished();
			}

			// Expecting the partial response status code
			if ( this.response.statusCode != 206 ) {
				return this.onError( new Error( 'Bad status code ' + this.response.statusCode ) );
			}

			if ( !this.response.headers || !this.response.headers[ 'content-range' ] ) {
				return this.onError( new Error( 'Missing or invalid content-range response header' ) );
			}

			try {
				this._totalSize = parseInt( this.response.headers[ 'content-range' ].split( '/' )[1] );
			}
			catch ( err ) {
				return this.onError( new Error( 'Invalid content-range header: ' + this.response.headers[ 'content-range' ] ) );
			}

			this.response.setEncoding( 'binary' );
			this.response.pipe( this.destStream );
			this.response.on( 'data', ( data ) =>
			{
				this._totalDownloaded += data.length;
				this._curSpeed += data.length;
			} );

			this.destStream.on( 'finish', () => this.onFinished() );

			this.response.on( 'error', ( err ) => this.onError( err ) );
			this.destStream.on( 'error', ( err ) => this.onError( err ) );
		} );
		this.request.on( 'error', ( err ) => this.onError( err ) );
		this.request.end();
	}

	onProgress( fn: ( progress: number, curKbps: number, peakKbps: number, lowKbps: number, avgKbps: number ) => void ): DownloadHandle
	{
		this._emitter.addListener( 'progress', fn );
		return this;
	}

	private onTick()
	{
		this._curSpeedTicks.unshift( this._curSpeed );
		this._speedTicksCount += 1;
		this._avgSpeed += ( this._curSpeed - this._avgSpeed ) / this._speedTicksCount;
		this._peakSpeed = Math.max( this._peakSpeed, this._curSpeed );
		this._lowSpeed = Math.min( this._lowSpeed || Infinity, this._curSpeed );
		this._curSpeed = 0;

		if ( this._curSpeedTicks.length > 5 ) { // Save only the 5 last seconds for average speed
			this._curSpeedTicks.pop();
		}

		this._emitter.emit( 'progress', this._totalDownloaded / this._totalSize, this.currentKbps,  this.peakKbps, this.lowKbps, this.avgKbps );
	}

	private onError( err: NodeJS.ErrnoException )
	{
		this.stop();
		this._rejecter( err );
		this._promise = null;
	}

	private onFinished()
	{
		this.stop();
		this._state = DownloadHandleState.FINISHED;
		this._resolver();
	}
}

export default Downloader;