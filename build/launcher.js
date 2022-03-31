"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchInstance = exports.Launcher = void 0;
const fs_1 = require("./fs");
const path = require("path");
const controller_1 = require("./controller");
const util = require("./util");
const controller_wrapper_1 = require("./controller-wrapper");
const old_launcher_1 = require("./old-launcher");
const queue_1 = require("./queue");
class Launcher {
    // TODO(ylivay): Should set the credentials file for now.
    static async launch(localPackage, credentials, ...executableArgs) {
        if (credentials) {
            await this.ensureCredentials(localPackage, credentials);
        }
        const dir = localPackage.install_dir;
        const port = await util.findFreePort();
        const gameUid = localPackage.id + '-' + localPackage.build.id;
        const args = [
            '--port',
            port.toString(),
            '--dir',
            dir,
            '--game',
            gameUid,
            '--wait-for-connection',
            '2',
            '--no-self-update',
            'run',
        ];
        args.push(...executableArgs);
        await controller_1.Controller.ensureMigrationFile(localPackage);
        const controller = await controller_1.Controller.launchNew(args);
        const instance = await new Promise((resolve, reject) => {
            // tslint:disable-next-line:no-unused-expression
            new LaunchInstance(controller, (err, inst) => {
                if (err) {
                    return reject(err);
                }
                resolve(inst);
            });
        });
        return this.manageInstanceInQueue(instance);
    }
    static async attach(runningPid) {
        let instance = null;
        if (typeof runningPid !== 'string') {
            console.log('Attaching to wrapper id: ' + runningPid.wrapperId);
            instance = await old_launcher_1.OldLauncher.attach(runningPid.wrapperId);
        }
        else {
            const index = runningPid.indexOf(':');
            if (index === -1) {
                throw new Error('Invalid or unsupported running pid: ' + runningPid);
            }
            const pidVersion = parseInt(runningPid.substring(0, index), 10);
            const pidStr = runningPid.substring(index + 1);
            if (pidVersion !== 1) {
                throw new Error('Invalid or unsupported running pid: ' + runningPid);
            }
            const parsedPid = JSON.parse(pidStr);
            console.log('Attaching to parsed pid: ' + pidStr);
            const controller = new controller_1.Controller(parsedPid.port, parsedPid.pid);
            controller.connect();
            instance = await new Promise((resolve, reject) => {
                // tslint:disable-next-line:no-unused-expression
                new LaunchInstance(controller, (err, inst) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(inst);
                });
            });
        }
        return this.manageInstanceInQueue(instance);
    }
    static async ensureCredentials(localPackage, credentials) {
        let dir, executable;
        // We try getting the data dir and executable path from the manifest,
        // but the manifest might not exist if the package hasn't been migrated yet,
        // and since joltron does the migration itself we fall back to placing the credentials
        // in the old location - where the data dir doesn't exist and the game contents
        // are located directly inside the installation dir.
        try {
            const manifestStr = await fs_1.default.readFile(path.join(localPackage.install_dir, '.manifest'), 'utf8');
            const manifest = JSON.parse(manifestStr);
            dir = manifest.gameInfo.dir;
            executable = manifest.launchOptions.executable;
        }
        catch (err) {
            dir = '.';
            executable = localPackage.executablePath;
        }
        const str = `0.2.1\n${credentials.username}\n${credentials.user_token}\n`;
        await Promise.all([
            fs_1.default.writeFile(path.join(localPackage.install_dir, '.gj-credentials'), str),
            fs_1.default.writeFile(path.join(localPackage.install_dir, dir, executable, '..', '.gj-credentials'), str),
        ]);
    }
    static manageInstanceInQueue(instance) {
        queue_1.Queue.setSlower();
        instance.once('gameOver', () => queue_1.Queue.setFaster());
        return instance;
    }
}
exports.Launcher = Launcher;
class LaunchInstance extends controller_wrapper_1.ControllerWrapper {
    constructor(controller, onReady) {
        super(controller);
        this
            .on('gameClosed', () => {
            this.controller.emit('gameOver');
        })
            .on('gameCrashed', err => {
            this.controller.emit('gameOver', err);
        })
            .on('gameLaunchFinished', () => {
            this.controller.emit('gameOver');
        })
            .on('gameLaunchFailed', err => {
            this.controller.emit('gameOver', err);
        });
        this.controller
            // TODO: the timeout on initial messages sent to joltron has to be higher
            // than the time it takes joltron to give up making a connection to a previous
            // running instance of joltron. for some reason this takes around 3 seconds on Windows.
            .sendGetState(false, 4000)
            .then(state => {
            this._pid = state.pid;
            onReady(null, this);
        })
            .catch(err => onReady(err, this));
    }
    get pid() {
        return '1:' + JSON.stringify({ port: this.controller.port, pid: this._pid });
    }
    kill() {
        return this.controller.sendKillGame();
    }
}
exports.LaunchInstance = LaunchInstance;
