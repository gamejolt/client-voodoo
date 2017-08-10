import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Patcher } from './patcher';
import * as path from 'path';
import { Launcher } from './launcher';
import { mochaAsync } from './test';
import * as GameJolt from './gamejolt';

chai.use(chaiAsPromised);
// const expect = chai.expect;

describe('Patcher', function() {
	// function wrapAll( promises: Promise<any>[] )
	// {
	// 	const result: Promise<{ success: boolean, value: any }>[] = [];
	// 	for ( let p of promises ) {
	// 		result.push( p
	// 			.then( ( value ) => { return { success: true, value: value } } )
	// 			.catch( ( err ) => { return { success: false, value: err } } )
	// 		);
	// 	}
	// 	return Promise.all( result );
	// }

	it(
		'should do a patch',
		mochaAsync(async () => {
			let localPackage: GameJolt.IGamePackage = {
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
			};

			console.log('test');
			const patchInstance = await Patcher.patch(
				localPackage,
				() => Promise.resolve(''),
				{
					// runLater: true,
				}
			);

			await new Promise((resolve, reject) => {
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

			const launcher = await Launcher.launch(localPackage, {
				username: 'test',
				user_token: '123',
			});
			await new Promise((resolve, reject) => {
				launcher.on('gameOver', err => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			});
		})
	);
});
