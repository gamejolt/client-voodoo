declare namespace GameJolt
{
	// package: IGamePackage;
	// release: IGameRelease;
	// file: IGameBuildFile;
	// launch_options: IGameBuildLaunchOptions[];
	// install_dir: string;

	export interface IGamePackage
	{
		id: number;
		title: string;
		description: string;
		release: IGameRelease;
		build: IGameBuild;
		file: IGameBuildFile;
		launch_options: IGameBuildLaunchOptions[];
		install_dir: string;
	}

	export interface IGameRelease
	{
		id: number;
		version_number: string;
	}

	export interface IGameBuild
	{
		id: number;
		game_id: number;
		folder?: string;
		type: string; // downloadable, html, flash, silverlight, unity, applet
		archive_type: string;
		os_windows: boolean;
		os_windows_64: boolean;
		os_mac: boolean;
		os_mac_64: boolean;
		os_linux: boolean;
		os_linux_64: boolean;
		os_other: boolean;
		modified_on: number;
	}

	export interface IGameBuildFile
	{
		id: number;
		filename: string;
		filesize: number;
	}

	export interface IGameBuildLaunchOptions
	{
		id: number;
		os: string; // 'windows, windows_64, mac, mac_64, linux, linux_64, other
		executable_path: string;
	}

	export interface IGameCredentials
	{
		username: string;
		user_token: string;
	}
}
