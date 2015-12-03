import * as fs from 'fs';
import * as _ from 'lodash';
import * as tar from 'tar-fs';

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

export interface IExtractOptions
{
	deleteSource?: boolean
	brotli?: boolean
	overwrite?: boolean;
}

export abstract class Extractor
{
	static async extract( from: string, to: string, options?: IExtractOptions ): Promise<boolean>
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

		let result = await new Promise<boolean>( ( resolve, reject ) =>
		{
			let stream = fs.createReadStream( from )
			let extractStream = tar.extract( to );

			extractStream.on( 'finish', () => resolve( true ) );
			extractStream.on( 'error', ( err ) => reject( err ) );
			stream.on( 'error', ( err ) => reject( err ) );

			stream
				.pipe( decompressStream() )
				.pipe( extractStream );
		} );

		if ( result && options.deleteSource ) {

			// Remove the source file, but throw only if there was an error and the file still exists.
			let unlinked = await fsUnlink( from );
			if ( unlinked && ( await fsExists( from ) ) ) {
				throw unlinked;
			}
		}

		return result;
	}
}
