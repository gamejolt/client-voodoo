import { PassThrough } from 'stream';

let duplexer2 = require( 'duplexer2' );
let WrappedBunzip = require( 'seek-bzip' );

export interface IResumeOptions
{
	level: number;
	streamCRC: number;
}

export default function stream( onChunk: ( streamCRC: number, isFinalBlock: boolean, next: Function ) => any, resumeOptions?: IResumeOptions )
{
	let pass1 = new PassThrough();
	let pass2 = new PassThrough();

	WrappedBunzip.decodeStream( pass1, pass2, resumeOptions, onChunk );
	return duplexer2( pass1, pass2 );
}