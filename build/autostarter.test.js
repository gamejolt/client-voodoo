"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const util_1 = require("./util");
const autostarter_1 = require("./autostarter");
chai.use(chaiAsPromised);
// const expect = chai.expect;
let clientPath = '/path/to/client';
let runnerPath = '/path/to/client-runner';
describe('Autostarter', function () {
    it('should work', async () => {
        console.log('Setting');
        await autostarter_1.Autostarter.set(clientPath, ['--silent-start'], runnerPath);
        console.log('Waiting');
        await (0, util_1.sleep)(5000);
        console.log('Unsetting');
        await autostarter_1.Autostarter.unset();
    });
});
