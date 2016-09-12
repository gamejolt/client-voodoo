import * as path from 'path';
import Common from '../common';
import xdgBasedir = require( 'xdg-basedir' );
let shellEscape = require( 'shell-escape' );

export abstract class Shortcut
{
	static create( program: string, icon: string )
	{
		if ( process.platform === 'linux' ) {
			return this.removeLinux()
				.then( () => this.createLinux( program, icon ) );
		}
		else {
			throw new Error( 'Not supported' );
		}
	}

	static remove()
	{
		if ( process.platform === 'linux' ) {
			return this.removeLinux();
		}
		else {
			throw new Error( 'Not supported' );
		}
	}

	private static async createLinux( program: string, icon: string)
	{
		let desktopFile = path.join( xdgBasedir.data, 'applications', 'game-jolt-client.desktop' );

		let desktopContents =
			'[Desktop Entry]\n'
		  + 'Version=1.0\n'
		  + 'Type=Application\n'
		  + 'Name=Game Jolt Client\n'
		  + 'GenericName=Game Client\n'
		  + 'Comment=The power of Game Jolt website in your desktop\n'
		  + 'Exec=' + shellEscape( [ program ] ) + '\n'
		  + 'Terminal=false\n'
		  + 'Icon=' + icon + '\n'
		  + 'Categories=Game;\n'
		  + 'Keywords=Play;Games;GJ;GameJolt;Indie;\n'
		  + 'Hidden=false\n'
		  + 'Name[en_US]=Game Jolt Client\n';

		await Common.fsWriteFile( desktopFile, desktopContents );
		return Common.chmod( desktopFile,  '0755' );
	}

	private static removeLinux()
	{
		let desktopFile = path.join( xdgBasedir.data, 'applications', 'game-jolt-client.desktop' );
		let oldDesktopFile = path.join( xdgBasedir.data, 'applications', 'Game Jolt Client.desktop' );
		return Promise.all( [
			Common.fsUnlink( desktopFile ),
			Common.fsUnlink( oldDesktopFile ),
		] )
			.then( () => true )
			.catch( ( err ) => false );
	}

}
