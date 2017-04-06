declare module "tar-fs"
{
	import * as stream from 'stream';
	import * as tarStream from 'tar-stream';

	interface IPackOptions
	{
		fs?: any; // fs polyfill, sheesh
		ignore?: ( name: string ) => boolean;
		filter?: ( name: string ) => boolean;
		map?: ( header: tarStream.IEntryHeader ) => tarStream.IEntryHeader;
		mapStream?: ( fileStream: stream.Readable, header: tarStream.IEntryHeader ) => stream.Readable;
		dereference?: boolean;
		strict?: boolean;
		dmode?: number;
		fmode?: number;
		strip?: number;
		readable?: boolean;
		writable?: boolean;
	}

	interface IExtractOptions
	{
		fs?: any; // fs polyfill, sheesh
		ignore?: ( name: string ) => boolean;
		filter?: ( name: string ) => boolean;
		map?: ( header: tarStream.IEntryHeader ) => tarStream.IEntryHeader;
		mapStream?: ( fileStream: stream.Readable, header: tarStream.IEntryHeader ) => stream.Readable;
		chown?: boolean;
		umask?: number;
		dmode?: number;
		fmode?: number;
		strict?: boolean;
		strip?: number;
		readable?: boolean;
		writable?: boolean;
	}

	export function pack( path: string, options?: IPackOptions ): tarStream.Pack;
	export function extract( path: string, options?: IExtractOptions ): tarStream.Extract;
}
