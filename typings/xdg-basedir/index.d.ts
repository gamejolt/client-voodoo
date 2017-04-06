declare module 'xdg-basedir'
{
	module xdg
	{
		var data: string;
		var config: string;
		var cache: string;
		var runtime: string;
		var dataDirs: string[];
		var configDirs: string[];
	}

	export default xdg;
}