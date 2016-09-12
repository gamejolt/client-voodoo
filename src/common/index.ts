import * as fs from 'fs';
import * as Bluebird from 'bluebird';
import * as _mkdirp from 'mkdirp';

const mkdirp: ( path: string, mode?: string ) => PromiseLike<boolean> = Bluebird.promisify( _mkdirp );
const fsUnlink: ( path: string | Buffer ) => PromiseLike<NodeJS.ErrnoException> = Bluebird.promisify( fs.unlink );

function fsExists( path: string ): Promise<boolean>
{
	return new Promise<boolean>( function( resolve )
	{
		fs.exists( path, resolve );
	} );
}

const fsReadFile: ( path: string, encoding?: string ) => PromiseLike<string> = Bluebird.promisify( fs.readFile );
const fsWriteFile: ( path: string, data: string ) => PromiseLike<string> = Bluebird.promisify( fs.writeFile );
const chmod: ( path: string, mode: string | number ) => PromiseLike<void> = Bluebird.promisify( fs.chmod );
const fsStat: ( path: string ) => PromiseLike<fs.Stats> = Bluebird.promisify( fs.stat );

async function fsCopy( from: string, to: string )
{
	return new Promise<boolean>( ( resolve, reject ) =>
	{
		const destStream = fs.createWriteStream( to );

		destStream
			.on( 'finish', resolve )
			.on( 'error', reject );

		fs.createReadStream( from ).pipe( destStream );
	} );
}

const fsReadDir: ( path: string ) => PromiseLike<string[]> = Bluebird.promisify( fs.readdir );
const fsReadDirRecursively: ( path: string ) => PromiseLike<string[]> = Bluebird.promisify( require( 'recursive-readdir' ) );

function wait( millis: number )
{
	return new Promise<void>( ( resolve ) => setTimeout( resolve, millis ) );
}

function test( fn: Function, done?: Function )
{
	let func = function( _done: Function )
	{
		try {
			let result = fn( _done );
			if ( result && typeof result.then === 'function' && typeof result.catch === 'function' ) {
				result.catch( ( err: any ) => _done( err ) );
			}
		}
		catch ( err ) {
			_done( err );
		}
	};

	if ( done ) {
		func = func.bind( this, done );
	}

	return func;
}

function makeCallbackPromise( resolve: Function, reject: Function )
{
	return ( err: any ) =>
	{
		if ( err ) {
			reject( err );
		}
		else {
			resolve( err );
		}
	};
}

export default {
	mkdirp,
	fsUnlink,
	fsExists,
	fsReadFile,
	fsWriteFile,
	chmod,
	fsStat,
	fsCopy,
	fsReadDir,
	fsReadDirRecursively,
	test,
	wait,
	makeCallbackPromise,
};
