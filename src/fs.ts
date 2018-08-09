import * as fs from 'fs';

export default class FsAsync {
	static writeFile(
		filename: string,
		data: any,
		options?: { encoding?: string; mode?: number; flag?: string }
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (options) {
				fs.writeFile(filename, data, options, err => {
					if (err) {
						return reject(err);
					}
					return resolve();
				});
			} else {
				fs.writeFile(filename, data, err => {
					if (err) {
						return reject(err);
					}
					return resolve();
				});
			}
		});
	}

	static unlink(filename: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.unlink(filename, err => {
				if (err) {
					return reject(err);
				}
				return resolve();
			});
		});
	}

	static exists(filename: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			fs.exists(filename, exists => {
				return resolve(exists);
			});
		});
	}

	static readFile(filename: string, encoding: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			fs.readFile(filename, encoding, (err, data) => {
				if (err) {
					return reject(err);
				}
				return resolve(data);
			});
		});
	}

	static chmod(path: string, mode: number | string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			return fs.chmod(path, mode as any, err => {
				if (err) {
					return reject(err);
				}
				return resolve();
			});
		});
	}
}
