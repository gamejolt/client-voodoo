import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-stream';
import * as tarFS from 'tar-fs';
import { Readable, Transform } from 'stream';
import Common from '../common';

export interface IExtractOptions extends tarFS.IExtractOptions
{
	deleteSource?: boolean;
	overwrite?: boolean;
	decompressStream?: Transform;
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
	private _resolver: Function;
	private _rejector: Function;
	private _readStream: Readable;
	private _extractStream: tar.Extract;
	private _running: boolean;
	private _terminated: boolean;

	constructor( private _from: string, private _to: string, private _options?: IExtractOptions )
	{
		this._options = _.defaults( this._options || {}, {
			deleteSource: false,
			overwrite: false,
		} );

		// Avoid fat arrow here because it causes an implicit return and will resolve the promise.
		let _this = this;
		this._promise = new Promise<IExtractResult>( function( resolve, reject )
		{
			_this.start().then( ( result ) =>
			{
				if ( !_this._terminated ) {
					resolve( result );
				}
			} );
		} );
	}

	get from(): string
	{
		return this._from;
	}

	get to(): string
	{
		return this._to;
	}

	get promise(): Promise<IExtractResult>
	{
		return this._promise;
	}

	async start(): Promise<IExtractResult>
	{
		if ( this._running ) {
			return this._promise;
		}
		else if ( this._readStream ) {
			this._pipe();
			this._readStream.resume();
			return this._promise;
		}

		this._running = true;

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

		if ( this._terminated ) {
			return {
				success: false,
				files: [],
			};
		}

		let files: string[] = [];
		let result = await new Promise<boolean>( ( resolve, reject ) =>
		{
			this._readStream = fs.createReadStream( this._from );
			this._resolver = resolve;
			this._rejector = reject;

			// If stopped between starting and here, the stop wouldn't have registered this read stream. So just do it now.
			if ( !this._running ) {
				this.stop( false );
			}

			let optionsMap = this._options.map;
			this._extractStream = tarFS.extract( this._to, _.assign( this._options, {
				map: ( header: tar.IEntryHeader ) =>
				{
					// TODO: fuggin symlinks and the likes.
					if ( header.type === 'file' ) {
						files.push( header.name );
					}

					if ( optionsMap ) {
						return optionsMap( header );
					}
					return header;
				},
			} ) );

			this._extractStream.on( 'finish', () => this._resolver( true ) );
			this._extractStream.on( 'error', ( err ) => this._rejector( err ) );
			if ( this._options.decompressStream ) {
				this._options.decompressStream.pipe( this._extractStream );
			}

			this._pipe();
		} );

		if ( result && this._options.deleteSource ) {

			// Remove the source file, but throw only if there was an error and the file still exists.
			let unlinked = await Common.fsUnlink( this._from );
			if ( unlinked && ( await Common.fsExists( this._from ) ) ) {
				throw unlinked;
			}
		}

		return {
			success: result,
			files: files,
		};
	}

	private _pipe()
	{
		this._readStream.on( 'error', ( err ) => this._rejector( err ) );

		if ( this._options.decompressStream ) {
			this._readStream.pipe( this._options.decompressStream )
		}
		else {
			this._readStream.pipe( this._extractStream );
		}
	}

	private _unpipe()
	{
		this._readStream.unpipe();
		this._readStream.removeAllListeners();
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
