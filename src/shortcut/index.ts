import * as path from 'path';
import xdgBasedir from 'xdg-basedir'
import Common from '../common';

abstract class Shortcut
{
	static create( program: string, icon: string, autostart?: boolean )
	{
		if ( process.platform === 'linux' ) {
			return this.createLinux( program, icon  );
		}
		else {
			throw new Error( 'Not supported' );
		}
	}

	private static createLinux( program: string, icon: string)
	{
		let desktopContents = '[Desktop Entry]\nVersion=1.0\nType=Application\nName=Game Jolt Client\nGenericName=Game Client\nComment=The power of Game Jolt website in your desktop\nExec=' + program + '\nTerminal=false\nIcon=' + icon + '\nCategories=Game;\nKeywords=Play;Games;GJ;GameJolt;Indie;\nHidden=false\nName[en_US]=Game Jolt Client\n';

		return Common.fsWriteFile( path.join( xdgBasedir.data, 'application', 'Game Jolt Client.desktop' ), desktopContents );
	}
}

export default Shortcut;