describe( 'Stream awaiter', () =>
{
	it( 'should complete simple function calls', ( done ) =>
	{
		function test()
		{
			return 5;
		}

		for ( let i = 0; i < 100000; i += 1 ) {
			test();
		}
		done();
	} );

	it( 'should complete promise function calls', ( done ) =>
	{
		function test()
		{
			return new Promise( ( resolve ) => resolve( 5 ) );
		}

		let promise = test();
		for ( let i = 1; i < 100000; i += 1 ) {
			promise = promise.then( () => test() );
		}
		promise.then( () => done() );
	} );

	it( 'should complete simple await function calls', async ( done ) =>
	{
		async function test()
		{
			return 5;
		}

		for ( let i = 0; i < 100000; i += 1 ) {
			await test();
		}
		done();
	} );

	it( 'should complete promise await function calls', async ( done ) =>
	{
		async function test()
		{
			return new Promise<number>( ( resolve ) => resolve( 5 ) );
		}

		for ( let i = 0; i < 100000; i += 1 ) {
			await test();
		}
		done();
	} );
} );