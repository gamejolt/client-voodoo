"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const patcher_1 = require("./patcher");
const path = require("path");
const launcher_1 = require("./launcher");
chai.use(chaiAsPromised);
describe('Patcher', function () {
    it('should do a patch', async () => {
        let localPackage = {
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
                type: 'downloadable',
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
            install_dir: path.resolve(process.cwd(), path.join('test-files', 'games', 'game-test-1', 'build-1')),
            executablePath: 'eggnoggplus-linux/eggnoggplus',
        };
        console.log('test');
        const patchInstance = await patcher_1.Patcher.patch(localPackage, () => Promise.resolve(''), {
        // runLater: true,
        });
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
        const launcher = await launcher_1.Launcher.launch(localPackage, {
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
    });
});
