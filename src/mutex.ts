import { Controller } from './controller';
import * as util from './util';

export abstract class Mutex {
	static async create(name: string) {
		const port = await util.findFreePort();
		const args: string[] = [
			'--port',
			port.toString(),
			'--wait-for-connection',
			'2',
			'--symbiote',
			'--mutex',
			name,
			'--no-self-update',
			'noop',
		];

		const controller = await Controller.launchNew(args);
		return new MutexInstance(controller);
	}
}

export class MutexInstance {
	private releasePromise: Promise<Error>;

	constructor(private controller: Controller) {
		this.releasePromise = new Promise<Error>(resolve => {
			this.controller.on('fatal', resolve);
		});
	}

	release() {
		return this.controller.kill().then(() => this.releasePromise);
	}

	get onReleased() {
		return this.releasePromise;
	}
}
