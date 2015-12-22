/// <reference path="../../../typings/node/node.d.ts" />

declare module "tar-stream"
{
	import * as stream from 'stream';

	export function pack( options?: stream.ReadableOptions ): Pack;
	export function extract( options?: stream.WritableOptions ): Extract;

	export interface IEntryHeader
	{
		name?: string;
		size?: number;
		mode?: number;
		mtime?: Date | number;
		type?: string;
		linkname?: string;
		uid?: number;
		gid?: number;
		uname?: string;
		gname?: string;
		devmajor?: number;
		devminor?: number;
	}

	class Pack extends stream.Readable
	{
		constructor( options?: stream.ReadableOptions );
		entry( header: IEntryHeader, buffer?: string | Buffer, callback?: ( err?: NodeJS.ErrnoException ) => any ): stream.Writable;
	}

	class Extract extends stream.Writable
	{
		constructor( options?: stream.WritableOptions );
	}
}