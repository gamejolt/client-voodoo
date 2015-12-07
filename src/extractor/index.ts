import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-stream';
import * as tarFS from 'tar-fs';
import { Readable, Transform } from 'stream';

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
let fsReadDir: ( path: string ) => Promise<string[]> = Bluebird.promisify( fs.readdir );

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

	constructor( private _from: string, private _to: string, private _options?: IExtractOptions )
	{
		this._options = _.defaults( this._options || {}, {
			deleteSource: false,
			overwrite: false,
		} );

		this._promise = this.start();
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

	private async start(): Promise<IExtractResult>
	{
		// If the destination already exists, make sure its valid.
		if ( await fsExists( this._to ) ) {
			let destStat = await fsStat( this._to );
			if ( !destStat.isDirectory() ) {
				throw new Error( 'Can\'t extract to destination because its not a valid directory' );
			}

			// Don't extract to a non-empty directory.
			let filesInDest = await fsReadDir( this._to );
			if ( filesInDest && filesInDest.length > 0 ) {

				// Allow extracting to a non empty directory only if the overwrite option is set.
				if ( !this._options.overwrite ) {
					throw new Error( 'Can\'t extract to destination because it isnt empty' );
				}
			}
		}
		// Create the folder path to extract to.
		else if ( !( await mkdirp( this._to ) ) ) {
			throw new Error( 'Couldn\'t create destination folder path' );
		}

		let files: string[] = [];
		let result = await new Promise<boolean>( ( resolve, reject ) =>
		{
			let stream = fs.createReadStream( this._from )
			let optionsMap = this._options.map;
			let extractStream = tarFS.extract( this._to, _.assign( this._options, {
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

			extractStream.on( 'finish', () => resolve( true ) );
			extractStream.on( 'error', ( err ) => reject( err ) );
			stream.on( 'error', ( err ) => reject( err ) );

			if ( this._options.decompressStream ) {
				stream
					.pipe( this._options.decompressStream )
					.pipe( extractStream );
			}
			else {
				stream.pipe( extractStream );
			}
		} );

		if ( result && this._options.deleteSource ) {

			// Remove the source file, but throw only if there was an error and the file still exists.
			let unlinked = await fsUnlink( this._from );
			if ( unlinked && ( await fsExists( this._from ) ) ) {
				throw unlinked;
			}
		}

		return {
			success: result,
			files: files,
		};
	}
}
