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
let fsReadDir: ( path: string ) => Promise<string[]> = Bluebird.promisify( fs.readdir );
let fsReadDirRecursively: ( path: string ) => Promise<string[]> = Bluebird.promisify( require( 'recursive-readdir' ) );

export default {
	mkdirp: mkdirp,
	fsUnlink: fsUnlink,
	fsExists: fsExists,
	fsReadFile: fsReadFile,
	fsWriteFile: fsWriteFile,
	chmod: chmod,
	fsStat: fsStat,
	fsReadDir: fsReadDir,
	fsReadDirRecursively: fsReadDirRecursively,
};