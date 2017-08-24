import * as fs_ from 'fs';
import * as Bluebird from 'bluebird';

type fsPromisified = typeof fs_ & {
	writeFileAsync(
		filename: string,
		data: any,
		options?: { encoding?: string; mode?: number; flag?: string }
	): Promise<void>;
	unlinkAsync(filename: string): Promise<void>;
	existsAsync(filename: string): Promise<boolean>;
	readFileAsync(filename: string, encoding: string): Promise<string>;
};

const fs = Bluebird.promisifyAll(fs_) as fsPromisified;
export = fs;
