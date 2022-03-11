import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Patcher } from './patcher';
import * as path from 'path';
import * as os from 'os';
import { Launcher } from './launcher';
import * as GameJolt from './gamejolt';
import { sleep } from './util';

chai.use(chaiAsPromised);

describe('Patcher', function () {

	it(
		'should do a patch',
		async () => {
			let localPackage: GameJolt.IGamePackage;
			switch (os.platform()) {
				case 'win32':
					localPackage = {
						id: 119886,
						game_id: 42742,
						title: 'test',
						description: 'test',
						release: {
							id: 1,
							version_number: '1.0.0',
						},
						build: {
							id: 282273,
							folder: 'test',
							type: 'downloadable', // downloadable, html, flash, silverlight, unity, applet
							archive_type: 'tar.xz',
							os_windows: true,
							os_windows_64: false,
							os_mac: false,
							os_mac_64: false,
							os_linux: false,
							os_linux_64: false,
							os_other: false,
							modified_on: 1,
						},
						file: {
							id: 1,
							filename: 'eggnoggplus-win.tar.xz',
							filesize: 1,
						},
						launch_options: [
							{
								id: 1,
								os: 'windows_32',
								executable_path: 'eggnoggplus-win/eggnoggplus.exe',
							},
						],
						install_dir: path.resolve(
							process.cwd(),
							path.join('test-files', 'games', 'game-test-1', 'build-1')
						),
						executablePath: 'data/eggnoggplus-win/eggnoggplus.exe',
					};
					break;

				case 'linux':
					localPackage = {
						id: 119886,
						game_id: 42742,
						title: 'test',
						description: 'test',
						release: {
							id: 1,
							version_number: '1.0.0',
						},
						build: {
							id: 282275,
							folder: 'test',
							type: 'downloadable', // downloadable, html, flash, silverlight, unity, applet
							archive_type: 'tar.xz',
							os_windows: false,
							os_windows_64: false,
							os_mac: false,
							os_mac_64: false,
							os_linux: false,
							os_linux_64: true,
							os_other: false,
							modified_on: 1,
						},
						file: {
							id: 1,
							filename: 'eggnoggplus-linux.tar.xz',
							filesize: 1,
						},
						launch_options: [
							{
								id: 1,
								os: 'linux_64',
								executable_path: 'eggnoggplus-linux/eggnoggplus',
							},
						],
						install_dir: path.resolve(
							process.cwd(),
							path.join('test-files', 'games', 'game-test-1', 'build-1')
						),
						executablePath: 'data/eggnoggplus-linux/eggnoggplus',
					};
					break;

				default:
					throw new Error("Test not implemeneted for current platform/arch");
			}

			let elapsed = Date.now();

			const patchInstance = await Patcher.patch(
				localPackage,
				() => Promise.resolve(''),
				{
					// runLater: true,
				}
			);

			console.log('waiting for patch to finish');
			await new Promise<void>((resolve, reject) => {
				patchInstance
					.on('done', err => {
						if (err) {
							return reject(err);
						}
						resolve();
					})
					.on('fatal', err => {
						reject(err);
					});
			});

			console.log('waiting for patcher to dispose');
			await patchInstance.dispose();

			elapsed = Date.now() - elapsed;
			console.log('patch took: ' + elapsed + 'ms');

			const launcher = await Launcher.launch(localPackage, {
				username: 'test',
				user_token: '123',
			});

			await new Promise<void>((resolve, reject) => {
				launcher.on('gameOver', err => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				});
			});

			await launcher.dispose();
		}
	);
});
