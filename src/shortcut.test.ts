import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { sleep } from './util';
import { mochaAsync } from './test';
import { Shortcut } from './shortcut';

chai.use(chaiAsPromised);
const expect = chai.expect;

let clientPath = '/path/to/client';
let iconPath = '/path/to/client-icon';

describe('Shortcut', function () {
	if (process.platform === 'linux') {
		it(
			'should work',
			mochaAsync(async () => {
				console.log('Setting');
				await Shortcut.create(clientPath, iconPath);
				console.log('Waiting');
				await sleep(5000);
				console.log('Unsetting');
				await Shortcut.remove();
			})
		);
	} else {
		it(
			'should say operation is not supported',
			mochaAsync(async () => {
				await expect(Shortcut.create(clientPath, iconPath)).to.eventually.rejectedWith('Not supported');
			})
		)
	}
});
