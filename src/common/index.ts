import * as fs from 'fs';
let Bluebird = require( 'bluebird' );

let mkdirp: ( path: string, mode?: string ) => Promise<boolean> = Bluebird.promisify( require( 'mkdirp' ) );
let fsUnlink: ( path: string ) => Promise<NodeJS.ErrnoException> = Bluebird.promisify( fs.unlink );
let fsExists = function( path: string ): Promise<boolean>
{
	return new Promise<boolean>( function( resolve )
	{
		fs.exists( path, resolve );
	} );
};
let fsReadFile: ( path: string, encoding?: string ) => Promise<string> = Bluebird.promisify( fs.readFile );
let fsWriteFile: ( path: string, data: string ) => Promise<string> = Bluebird.promisify( fs.writeFile );
let chmod:( path: string, mode: string | number ) => Promise<void> = Bluebird.promisify( fs.chmod );
let fsStat: ( path: string ) => Promise<fs.Stats> = Bluebird.promisify( fs.stat );
let fsCopy = async function( from: string, to: string )
{
	return new Promise<boolean>( ( resolve, reject ) =>
	{
		let destStream = fs.createWriteStream( to );
		destStream
			.on( 'finish', resolve )
			.on( 'error', reject );

		fs.createReadStream( from ).pipe( destStream );
	} );
};
let fsReadDir: ( path: string ) => Promise<string[]> = Bluebird.promisify( fs.readdir );
let fsReadDirRecursively: ( path: string ) => Promise<string[]> = Bluebird.promisify( require( 'recursive-readdir' ) );

let wait = function( millis: number ): Promise<void>
{
	return new Promise<void>( ( resolve ) =>
	{
		setTimeout( resolve, millis );
	} );
}

let test = function( fn: Function, done?: Function )
{
	let func = function( _done )
	{
		try {
			let result = fn( _done );
			if ( result && typeof result.then === 'function' && typeof result.catch === 'function' ) {
				result.catch( ( err ) => _done( err ) );
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
};

export default {
	mkdirp: mkdirp,
	fsUnlink: fsUnlink,
	fsExists: fsExists,
	fsReadFile: fsReadFile,
	fsWriteFile: fsWriteFile,
	chmod: chmod,
	fsStat: fsStat,
	fsCopy: fsCopy,
	fsReadDir: fsReadDir,
	fsReadDirRecursively: fsReadDirRecursively,
	test: test,
	wait: wait,
};