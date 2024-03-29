import * as _https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { getExecutable } from './controller';

const packageJson = require('../package.json');
const joltronVersion = packageJson.joltronVersion;

const https = require('follow-redirects').https as typeof _https;

async function doTheThing() {
	const executable = getExecutable();
	const binDir = path.dirname(executable);

	await new Promise<void>((resolve, reject) => {
		mkdirp(binDir, err => {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

	const file = fs.createWriteStream(executable, { mode: 0o755 });
	let remoteExecutable: string;
	switch (process.platform) {
		case 'win32':
			remoteExecutable = 'joltron_win64.exe';
			break;
		case 'linux':
			remoteExecutable = 'joltron_linux';
			break;
		case 'darwin':
			remoteExecutable = 'joltron_osx';
			break;
		default:
			throw new Error('Unsupported platform');
	}
	const options: _https.RequestOptions = {
		host: 'github.com',
		path: `/gamejolt/joltron-builds/releases/download/${joltronVersion}/${remoteExecutable}`,
	};

	await new Promise<void>((resolve, reject) => {
		https
			.get(options, res => {
				if (res.statusCode !== 200) {
					throw new Error(
						`Invalid status code. Expected 200 got ${res.statusCode}`
					);
				}

				res.pipe(file);
			})
			.on('error', reject)
			.on('end', () => resolve)
			.end();
	});
}

doTheThing();
