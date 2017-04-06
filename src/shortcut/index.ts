import * as path from 'path';
import Common from '../common';
let xdgBasedir = require( 'xdg-basedir' );
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
`[Desktop Entry]
Version=1.0
Type=Application
Name=Game Jolt Client
GenericName=Game Client
Comment=The power of Game Jolt website in your desktop
Exec=${ shellEscape( [ program ] ) }
Terminal=false
Icon=${icon}
Categories=Game;
Keywords=Play;Games;GJ;GameJolt;Indie;
Hidden=false
Name[en_US]=Game Jolt Client`;

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
