import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { sleep } from './util';
import { Autostarter } from './autostarter';

chai.use(chaiAsPromised);
// const expect = chai.expect;

let clientPath = '/path/to/client';
let runnerPath = '/path/to/client-runner';

describe('Autostarter', function () {
	it(
		'should work',
		async () => {
			console.log('Setting');
			await Autostarter.set(clientPath, ['--silent-start'], runnerPath);
			console.log('Waiting');
			await sleep(5000);
			console.log('Unsetting');
			await Autostarter.unset();
		}
	);
});
