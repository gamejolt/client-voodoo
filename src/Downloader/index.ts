import * as fs from 'fs';
import { EventEmitter } from 'events';

let Bluebird = require( 'bluebird' );
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
		let stat = await fsStat( this._to );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		this._emitter.emit( 'progress', 33 );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		this._emitter.emit( 'progress', 67 );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		this._emitter.emit( 'progress', 99 );
		this._resolver();
	}
}

export default Downloader;