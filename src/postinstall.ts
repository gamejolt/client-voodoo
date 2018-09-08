import * as _https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { getExecutable } from './controller';

const joltronVersion = 'v2.2.1-beta';
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
			remoteExecutable = 'joltron_win32.exe';
			break;
		case 'linux':
			remoteExecutable = 'joltron_linux';
			break;
		case 'darwin':
			remoteExecutable = 'joltron_osx';
			break;
	}
	const options: _https.RequestOptions = {
		host: 'github.com',
		path: `/gamejolt/joltron/releases/download/${joltronVersion}/${remoteExecutable}`,
	};

	await new Promise<void>((resolve, reject) => {
		https
			.get(options, res => {
				if (res.statusCode !== 200) {
					throw new Error(`Invalid status code. Expected 200 got ${res.statusCode}`);
				}

				res.pipe(file);
			})
			.on('error', reject)
			.on('end', () => resolve)
			.end();
	});
}

doTheThing();
