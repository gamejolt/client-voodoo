declare module 'client-game-wrapper'
{
	import * as cp from 'child_process';

	export function start( wrapperId: string, pidPath: string, packagePath: string, executablePath: string, args: string[], options?: cp.SpawnOptions ): void
}
