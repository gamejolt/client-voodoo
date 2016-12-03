declare module 'windows-mutex'
{
	export class Mutex
	{
		constructor(name: string);
		isActive(): boolean;
		release(): void;
	}
}