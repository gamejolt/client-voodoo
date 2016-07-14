import * as path from 'path';
import Common from '../common';
let xdgBasedir = require( 'xdg-basedir' );
let Winreg = require( 'winreg' );
let Bluebird = require( 'bluebird' );
let applescript: ( script: string ) => Promise<any> = Bluebird.promisify( require( 'applescript' ).execString );
let shellEscape = require( 'shell-escape' );

const autostartId = 'GameJoltClient';
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
		return new Promise<void>( ( resolve ) =>
		{
			WindowsAutostarter.getKey().set( autostartId , Winreg.REG_SZ, '\"' + program + '\"' + ( ( args && args.length ) ? ( ' ' + args.join( ' ' ) ) : '' ), resolve );
		} );
	}

	unset()
	{
		return new Promise<void>( ( resolve ) =>
		{
			WindowsAutostarter.getKey().remove( autostartId, resolve );
		} );
	}

	isset()
	{
		return new Promise<boolean>( ( resolve ) =>
		{
			WindowsAutostarter.getKey().get( autostartId, ( err, item ) =>
			{
				resolve( !!item );
			} );
		} );
	}
}

class LinuxAutostarter implements IAutostarter
{
	private static desktopFilePath = path.join( xdgBasedir.config, 'autostart', autostartId + '.desktop' );

	private async createRunner( program: string, runner: string, args?: string[] )
	{
		let runnerScript =
			'#!/bin/bash\n'
		+ 'if [ -e "' + program + '" ]; then\n'
		+ '	' + shellEscape( [ program ].concat( args || [] ) ) + '\n'
		+ 'fi';

		await Common.fsWriteFile( runner, runnerScript );
		await Common.chmod( runner, '0755' );
	}

	async set( program: string, args?: string[], runner?: string )
	{
		await this.createRunner( program, runner, args );
		let desktopContents =
			'[Desktop Entry]\n'
		  + 'Version=1.0\n'
		  + 'Type=Application\n'
		  + 'Name=Game Jolt Client\n'
		  + 'GenericName=Game Client\n'
		  + 'Comment=The power of Game Jolt website in your desktop\n'
		  + 'Exec=' + shellEscape( [ runner ] ) + '\n'
		  + 'Terminal=false\n'
		  + 'Categories=Game;\n'
		  + 'Keywords=Play;GJ;GameJolt;\n'
		  + 'Hidden=false\n'
		  + 'Name[en_US]=Game Jolt Client\n'
		  + 'TX-GNOME-Autostart-enabled=true\n';

		await Common.fsWriteFile( LinuxAutostarter.desktopFilePath, desktopContents );
		await Common.chmod( LinuxAutostarter.desktopFilePath, '0755' );
	}

	unset()
	{
		return Common.fsUnlink( LinuxAutostarter.desktopFilePath );
	}

	isset()
	{
		return Common.fsExists( LinuxAutostarter.desktopFilePath );
	}
}

class MacAutostarter implements IAutostarter
{
	private async createRunner( program: string, runner: string, args?: string[] )
	{
		let runnerScript =
			'#!/bin/bash\n'
		+ 'if [ -e "' + program + '" ]; then\n'
		+ '	' + shellEscape( [ program ].concat( args || [] ) ) + '\n'
		+ 'fi';

		await Common.fsWriteFile( runner, runnerScript );
		await Common.chmod( runner, '0755' );
	}

	async set( program: string, args?: string[], runner?: string )
	{
		await this.createRunner( program, runner, args );
		return applescript( 'tell application "System Events" to make login item at end with properties {path:"' + runner + '", hidden:false, name:"' + autostartId + '"}' );
	}

	unset( runner?: string )
	{
		return applescript( 'tell application "System Events" to delete every login item whose name is "' + autostartId + '"' );
	}

	isset()
	{
		return applescript( 'tell application "System Events" to get the name of every login item' ).then( ( loginItems: string ) =>
		{
			return ( loginItems && loginItems.indexOf( autostartId ) !== -1 );
		} );
	}
}

interface IAutostarter
{
	set: ( path: string, args?: string[], runner?: string ) => Promise<void>;
	unset: ( runner?: string ) => Promise<void>;
	isset: () => Promise<boolean>;
}

export abstract class Autostarter
{
	private static winAutostarter: WindowsAutostarter = new  WindowsAutostarter();
	private static linuxAutostarter: LinuxAutostarter = new LinuxAutostarter();
	private static macAutostarter: MacAutostarter = new MacAutostarter();

	private static _getAutostarter(): IAutostarter
	{
		switch ( process.platform ) {
			case 'win32':
				return this.winAutostarter;

			case 'linux':
				return this.linuxAutostarter;

			case 'darwin':
				return this.macAutostarter;
		}
	}

    static set( path: string, args?: string[], runner?: string ): Promise<void>
    {
        return this.unset( path )
            .then( () => this._getAutostarter().set( path, args, runner ) );
    }

    static unset( runner?: string ): Promise<void>
    {
		let autostarter = this._getAutostarter();
        return this.isset()
            .then( ( isset ) =>
            {
                if ( isset ) {
                    return this._getAutostarter().unset( runner );
                }
            } );
    }

    static isset(): Promise<boolean>
    {
        return this._getAutostarter().isset();
    }
}
