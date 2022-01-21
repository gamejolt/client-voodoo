"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mochaAsync = void 0;
function mochaAsync(fn) {
    return async (done) => {
        try {
            await fn();
            done();
        }
        catch (err) {
            done(err);
        }
    };
}
exports.mochaAsync = mochaAsync;
