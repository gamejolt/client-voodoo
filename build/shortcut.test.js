"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const util_1 = require("./util");
const shortcut_1 = require("./shortcut");
chai.use(chaiAsPromised);
const expect = chai.expect;
let clientPath = '/path/to/client';
let iconPath = '/path/to/client-icon';
describe('Shortcut', function () {
    if (process.platform === 'linux') {
        it('should work', async () => {
            console.log('Setting');
            await shortcut_1.Shortcut.create(clientPath, iconPath);
            console.log('Waiting');
            await (0, util_1.sleep)(5000);
            console.log('Unsetting');
            await shortcut_1.Shortcut.remove();
        });
    }
    else {
        it('should say operation is not supported', async () => {
            await expect(shortcut_1.Shortcut.create(clientPath, iconPath)).to.eventually.rejectedWith('Not supported');
        });
    }
});
