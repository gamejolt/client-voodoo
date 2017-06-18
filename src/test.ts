export function mochaAsync(fn: () => Promise<any>) {
	return async done => {
		try {
			await fn();
			done();
		} catch (err) {
			done(err);
		}
	};
}
