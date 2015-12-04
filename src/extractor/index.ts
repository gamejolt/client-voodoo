import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-stream';
import * as tarFS from 'tar-fs';
import { Readable } from 'stream';

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
let fsReadDir: ( path: string ) => Promise<string[]> = Bluebird.promisify( fs.readdir );

export interface IExtractOptions extends tarFS.IExtractOptions
{
	deleteSource?: boolean;
	brotli?: boolean;
	overwrite?: boolean;
}

export interface IExtractResult
{
	success: boolean;
	files: string[];
}

export abstract class Extractor
{
	static async extract( from: string, to: string, options?: IExtractOptions ): Promise<IExtractResult>
	{
		options = _.defaults( options || {}, {
			deleteSource: false,
			brotli: true,
			overwrite: false,
		} );

		// If the destination already exists, make sure its valid.
		let destExists = await fsExists( to );
		if ( destExists ) {
			let destStat = await fsStat( to );
			if ( !destStat.isDirectory() ) {
				throw new Error( 'Can\'t extract to destination because its not a valid directory' );
			}

			// Don't extract to a non-empty directory.
			let filesInDest = await fsReadDir( to );
			if ( filesInDest && filesInDest.length > 0 ) {

				// Allow extracting to a non empty directory only if the overwrite option is set.
				if ( !options.overwrite ) {
					throw new Error( 'Can\'t extract to destination because it isnt empty' );
				}
			}
		}
		// Create the folder path to extract to.
		else if ( !( await mkdirp( to ) ) ) {
			throw new Error( 'Couldn\'t create destination folder path' );
		}

		let files: string[] = [];
		let result = await new Promise<boolean>( ( resolve, reject ) =>
		{
			let stream = fs.createReadStream( from )
			let optionsMap = options.map;
			let extractStream = tarFS.extract( to, _.assign( options, {
				map: ( header: tar.IEntryHeader ) =>
				{
					console.log( header );
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

			if ( options.brotli ) {
				stream
					.pipe( decompressStream() )
					.pipe( extractStream );
			}
			else {
				stream.pipe( extractStream );
			}
		} );

		if ( result && options.deleteSource ) {

			// Remove the source file, but throw only if there was an error and the file still exists.
			let unlinked = await fsUnlink( from );
			if ( unlinked && ( await fsExists( from ) ) ) {
				throw unlinked;
			}
		}

		return {
			success: result,
			files: files,
		};
	}
}
