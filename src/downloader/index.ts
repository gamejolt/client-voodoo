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

class DownloadHandle
{
	private _emitter: EventEmitter;
	private _promise: Promise<void>;
	private _resolver: () => void;
	private _rejecter: ( err: NodeJS.ErrnoException ) => void;

	constructor( private _from: string, private _to: string )
	{
		this._promise = new Promise<void>( ( resolve, reject ) =>
		{
			this._resolver = resolve;
			this._rejecter = reject;
		} );

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

	get promise(): Promise<void>
	{
		return this._promise;
	}

	onProgress( fn: ( progress: number ) => void ): DownloadHandle
	{
		this._emitter.addListener( 'progress', fn );
		return this;
	}

	private async start()
	{
		let exists = await fsExists( this._to );
		if ( !exists ) {
			return this.download( 0 );
		}

		let stat = await fsStat( this._to );
		console.log( util.inspect( stat ) );
		if ( !stat.isFile() ) {
			let unlinkResult = await fsUnlink( this._to );
			if ( unlinkResult ) {
				throw unlinkResult;
			}
			return this.download( 0 );
		}

		return this.download( stat.size );
	}

	private download( alreadyDownloaded: number )
	{
		let hostUrl = url.parse( this._from );
		let httpOptions = {
			host: hostUrl.host,
			path: hostUrl.path,
			headers: {
				'Range': 'bytes=' + alreadyDownloaded.toString() + '-',
			}
		};

		let stream = fs.createWriteStream( this._to, {
			encoding: 'binary',
			flags: 'a',
			// start: alreadyDownloaded,
		} );

		let request = http.request( httpOptions, ( response ) =>
		{
			function onError( err: NodeJS.ErrnoException )
			{
				stream.close();
				this._rejecter( err );
				response.removeAllListeners();
			};

			// Unsatisfiable request - most likely we've downloaded the whole thing already.
			// TODO - send HEAD request to get content-length and compare.
			if ( response.statusCode == 416 ) {
				stream.close();
				this._resolver();
				return;
			}

			// Expecting the partial response status code
			if ( !( response.statusCode == 206 ) ) {
				onError( new Error( 'Bad status code ' + response.statusCode ) );
				return;
			}

			if ( !response.headers || !response.headers[ 'content-range' ] ) {
				onError( new Error( 'Missing or invalid content-range response header' ) );
				return;
			}

			let totalSize;
			try {
				totalSize = parseInt( response.headers[ 'content-range' ].split( '/' )[1] );
			}
			catch ( err ) {
				onError( new Error( 'Invalid content-range header: ' + response.headers[ 'content-range' ] ) );
				return;
			}

			response.setEncoding( 'binary' );
			response.pipe( stream );
			response.on( 'data', ( data ) =>
			{
				alreadyDownloaded += data.length;
				this._emitter.emit( 'progress', alreadyDownloaded / totalSize );
			} );

			stream.on( 'finish', () =>
			{
				stream.close();
				this._resolver();
			} );

			response.on( 'error', onError );
			stream.on( 'error', onError );
		} );
		request.end();
	}
}

export default Downloader;