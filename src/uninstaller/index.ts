import * as del from 'del';

export abstract class Uninstaller
{
	static uninstall( dir: string ): UninstallHandle
	{
		return new UninstallHandle( dir );
	}
}

export class UninstallHandle
{
	private _promise: Promise<string[]>;
	constructor( private _dir: string )
	{
		this._promise = del( _dir, {
			cwd: _dir,
			force: true, // TODO: make sure this doesnt allow following symlinks.
		} );
	}

	get dir(): string
	{
		return this._dir;
	}

	get promise(): Promise<string[]>
	{
		return this._promise;
	}
}
