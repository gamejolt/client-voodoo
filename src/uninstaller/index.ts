import * as del from 'del';

export abstract class Uninstaller
{
	static uninstall( localPackage: GameJolt.IGamePackage ): UninstallHandle
	{
		return new UninstallHandle( localPackage );
	}
}

export class UninstallHandle
{
	private _promise: Promise<string[]>;
	constructor( private _localPackage: GameJolt.IGamePackage )
	{
		this._promise = del( this._localPackage.install_dir, {
			cwd: this._localPackage.install_dir,
			force: true, // TODO: make sure this doesnt allow following symlinks.
		} );
	}

	get dir(): string
	{
		return this._localPackage.install_dir;
	}

	get promise(): Promise<string[]>
	{
		return this._promise;
	}
}
