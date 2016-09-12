import * as path from 'path';
import Common from '../common';
import * as Winreg from 'winreg';
import * as Bluebird from 'bluebird';
import * as xdgBasedir from 'xdg-basedir';
const _applescript = require( 'applescript' );
const shellEscape = require( 'shell-escape' );

const applescript: ( script: string ) => PromiseLike<any> = Bluebird.promisify( _applescript.execString );

const AUTOSTART_ID = 'GameJoltClient';

interface IAutostarter
{
	set: ( path: string, args: string[], runner?: string ) => PromiseLike<void>;
	unset: ( runner?: string ) => PromiseLike<void>;
	isset: () => PromiseLike<boolean>;
}

class WindowsAutostarter implements IAutostarter
{
	private static getKey()
	{
		return new Winreg( {
			hive: Winreg.HKCU,
			key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
		} );
	}

	async set( program: string, args: string[] )
	{
		return new Promise<void>( ( resolve, reject ) =>
		{
			const argsString = args && args.length ? ' ' + args.join( ' ' ) : '';

			WindowsAutostarter.getKey().set(
				AUTOSTART_ID,
				Winreg.REG_SZ,
				`"${program}" ${argsString}`,
				Common.makeCallbackPromise( resolve, reject ),
			);
		} );
	}

	unset()
	{
		return new Promise<void>( ( resolve, reject ) =>
		{
			WindowsAutostarter.getKey().remove( AUTOSTART_ID, Common.makeCallbackPromise( resolve, reject ) );
		} );
	}

	isset()
	{
		return new Promise<boolean>( ( resolve, reject ) =>
		{
			WindowsAutostarter.getKey().get( AUTOSTART_ID, ( err, item ) =>
			{
				if ( err ) {
					reject( err );
				}
				else {
					resolve( !!item );
				}
			} );
		} );
	}
}

class LinuxAutostarter implements IAutostarter
{
	static readonly DESKTOP_FILE_PATH = path.join( xdgBasedir.config, 'autostart', AUTOSTART_ID + '.desktop' );

	private async createRunner( program: string, runner: string, args: string[] = [] )
	{
		const escaped = shellEscape( [ program ].concat( args || [] ) );
		const runnerScript =
`#!/bin/bash
if [ -e "${program}" ]; then
	${escaped}
fi
`;

		await Common.fsWriteFile( runner, runnerScript );
		await Common.chmod( runner, '0755' );
	}

	async set( program: string, args: string[], runner: string )
	{
		await this.createRunner( program, runner, args );

		const escaped = shellEscape( [ runner ] );
		const desktopContents =
`[Desktop Entry]
Version=1.0
Type=Application
Name=Game Jolt Client
GenericName=Game Client
Comment=The power of Game Jolt website in your desktop
Exec='${escaped}
Terminal=false
Categories=Game;
Keywords=Play;GJ;GameJolt;
Hidden=false
Name[en_US]=Game Jolt Client
TX-GNOME-Autostart-enabled=true
`;

		await Common.fsWriteFile( LinuxAutostarter.DESKTOP_FILE_PATH, desktopContents );
		await Common.chmod( LinuxAutostarter.DESKTOP_FILE_PATH, '0755' );
	}

	unset()
	{
		return Common.fsUnlink( LinuxAutostarter.DESKTOP_FILE_PATH ).then( ( err ) =>
		{
			if ( err ) {
				throw err;
			}
		} );
	}

	isset()
	{
		return Common.fsExists( LinuxAutostarter.DESKTOP_FILE_PATH );
	}
}

class MacAutostarter implements IAutostarter
{
	private async createRunner( program: string, runner: string, args?: string[] )
	{
		const escaped = shellEscape( [ program ].concat( args || [] ) ) ;
		const runnerScript =
`#!/bin/bash
if [ -e "${program}" ]; then
	${escaped}
fi
`;

		await Common.fsWriteFile( runner, runnerScript );
		await Common.chmod( runner, '0755' );
	}

	async set( program: string, args: string[], runner: string )
	{
		await this.createRunner( program, runner, args );
		return applescript( `tell application "System Events" to make login item at end with properties {path:"${runner}", hidden:false, name:"${AUTOSTART_ID}"}` );
	}

	unset()
	{
		return applescript( `tell application "System Events" to delete every login item whose name is "${AUTOSTART_ID}"` );
	}

	isset()
	{
		return applescript( `tell application "System Events" to get the name of every login item` )
			.then( ( loginItems: string ) =>
			{
				return loginItems && loginItems.indexOf( AUTOSTART_ID ) !== -1;
			} );
	}
}

export abstract class Autostarter
{
	static readonly winAutostarter = new  WindowsAutostarter();
	static readonly linuxAutostarter = new LinuxAutostarter();
	static readonly macAutostarter = new MacAutostarter();

	private static _getAutostarter(): IAutostarter
	{
		switch ( process.platform ) {
			case 'win32':
				return this.winAutostarter;

			case 'linux':
				return this.linuxAutostarter;

			case 'darwin':
				return this.macAutostarter;

			default:
				throw new Error( 'Invalid platform.' );
		}
	}

	static set( path: string, args?: string[], runner?: string )
	{
		return this.unset( path )
			.then( () => this._getAutostarter().set( path, args || [], runner ) );
	}

	static unset( runner?: string )
	{
		const autostarter = this._getAutostarter();
		return this.isset()
			.then( ( isset ) =>
			{
				if ( isset ) {
					return autostarter.unset( runner );
				}
			} );
	}

	static isset()
	{
		return this._getAutostarter().isset();
	}
}
