import fs from './fs';
import { Controller, Events } from './controller';
import { ControllerWrapper } from './controller-wrapper';
import { Manifest } from './data';

export abstract class SelfUpdater {
	static async attach(manifestFile: string): Promise<SelfUpdaterInstance> {
		const manifestStr = await fs.readFile(manifestFile, 'utf8');
		const manifest: Manifest = JSON.parse(manifestStr);

		if (!manifest.runningInfo) {
			throw new Error(`Manifest doesn't have a running info, cannot connect to self updater`);
		}

		const controller = new Controller(manifest.runningInfo.port, {
			process: manifest.runningInfo.pid,
			keepConnected: true,
		});
		controller.connect();

		return new SelfUpdaterInstance(controller);
	}
}

export type SelfUpdaterEvents = Events;

export class SelfUpdaterInstance extends ControllerWrapper<SelfUpdaterEvents> {
	constructor(controller: Controller) {
		super(controller);
	}

	async checkForUpdates(options?: { authToken?: string; metadata?: string }) {
		options = options || {};
		const result = await this.controller.sendCheckForUpdates(
			'',
			'',
			options.authToken,
			options.metadata
		);
		return result.success;
	}

	async updateBegin() {
		const result = await this.controller.sendUpdateBegin();
		return result.success;
	}

	async updateApply() {
		const result = await this.controller.sendUpdateApply(process.env, process.argv.slice(2));
		return result.success;
	}
}
