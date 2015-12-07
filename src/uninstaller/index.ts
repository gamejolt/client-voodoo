import * as del from 'del';

export abstract class Uninstaller
{
	static uninstall( build: GameJolt.IGameBuild ): UninstallHandle
	{
		return new UninstallHandle( build );
	}
}

export class UninstallHandle
{
	private _promise: Promise<string[]>;
	constructor( private _build: GameJolt.IGameBuild )
	{
		this._promise = del( this._build.library_dir, {
			cwd: this._build.library_dir,
			force: true, // TODO: make sure this doesnt allow following symlinks.
		} );
	}

	get dir(): string
	{
		return this._build.library_dir;
	}

	get promise(): Promise<string[]>
	{
		return this._promise;
	}
}
