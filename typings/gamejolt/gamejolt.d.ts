declare namespace GameJolt
{
	export interface IGameBuild
	{
		id: number;
		game_id: number;
		folder?: string;
		type: string; // downloadable, html, flash, silverlight, unity, applet
		package: IGamePackage;
		release: IGameRelease;
		file: IGameBuildFile;
		launch_options: IGameBuildLaunchOptions[];
		os_windows: boolean;
		os_windows_64: boolean;
		os_mac: boolean;
		os_mac_64: boolean;
		os_linux: boolean;
		os_linux_64: boolean;
		os_other: boolean;
		modified_on: number;
		library_dir: string;
	}

	export interface IGameBuildFile
	{
		id: number;
		filename: string;
		filesize: number;
		archive_type: string;
	}

	export interface IGamePackage
	{
		id: number;
		title: string;
		description: string;
	}

	export interface IGameRelease
	{
		id: number;
		version_number: string;
	}

	export interface IGameBuildLaunchOptions
	{
		id: number;
		os: string; // 'windows, windows_64, mac, mac_64, linux, linux_64, other
		executable_path: string;
	}
}