import * as net from 'net';
import * as Runner from './runner';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as stream from 'stream';

chai.use( chaiAsPromised );
const expect = chai.expect;

const JSONStream = require( 'JSONStream' );

describe( 'Runner', function()
{
	const mochaAsync = ( fn: () => Promise<any> ) =>
	{
		return async ( done ) =>
		{
			try {
				await fn();
				done();
			}
			catch ( err ) {
				done( err );
			}
		};
	};

	function wrapAll( promises: Promise<any>[] )
	{
		const result: Promise<{ success: boolean, value: any }>[] = [];
		for ( let p of promises ) {
			result.push( p
				.then( ( value ) => { return { success: true, value: value } } )
				.catch( ( err ) => { return { success: false, value: err } } )
			);
		}
		return Promise.all( result );
	}

	function sleep( ms: number )
	{
		return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	}

	function mockRunner( onConnection: ( socket: net.Socket ) => void )
	{
		let mockId = nextMockId++;
		console.log( `created mock #${mockId}` );

		currentConns = [];
		currentMock = net.createServer( ( socket ) =>
		{
			currentConns.push( socket );
			console.log( `mock #${mockId} connection` );
			onConnection( socket );
		} );
		(currentMock as any).mockId = mockId;

		currentMock
			.on( 'error', ( err ) => { throw err } )
			.listen( 1337, '127.0.0.1' );
	}

	function disposeMockRunner()
	{
		return new Promise( ( resolve ) =>
		{
			if ( !currentMock ) {
				resolve();
			}

			console.log( `disposing mock #${(currentMock as any).mockId}...` );
			for ( let conn of currentConns ) {
				conn.end();
			}

			currentMock.close( () => {
				console.log( `disposed mock #${(currentMock as any).mockId}` );
				currentMock = null;
				currentConns = null;
				resolve();
			} );
		} );
	}

	let nextMockId: number = 0;
	let currentMock: net.Server;
	let currentConns: net.Socket[];

	beforeEach( mochaAsync( disposeMockRunner ) );

	it( 'should attach to running instance', mochaAsync( async () =>
	{
		const inst = new Runner.Instance( 1337 );

		let resolve: any = null;
		const waitForConnect = new Promise( ( _resolve ) =>
		{
			resolve = _resolve;
		} );

		mockRunner( async ( socket ) =>
		{
			// Connecting is enough
			resolve();
		} );

		inst.connect();
		await waitForConnect;

		// We sleep here so that the connection would fully go through before calling dispose.
		// This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
		// and we resolve the connection promise before the transition is finished fully.
		await sleep( 10 );
		await inst.dispose();
	} ) );

	it( 'should wait until connection is made', mochaAsync( async () =>
	{
		let connected: any = false;
		mockRunner( ( socket ) => {
			connected = true;
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		expect( connected, 'socket connection' ).to.equal( true );
		expect( inst.connected, 'runner connection status' ).to.equal( true );
		await inst.dispose();
	} ) );

	it( 'should connect only once while connected', mochaAsync( async () =>
	{
		let connectCount = 0;
		mockRunner( ( socket ) => {
			connectCount++;
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		await inst.connect();
		expect( connectCount, 'connection count' ).to.equal( 1 );
		expect( inst.connected, 'runner connection status' ).to.equal( true );
		await inst.dispose();
	} ) );

	it( 'should fail connecting twice in parallel', mochaAsync( async () =>
	{
		let connectCount = 0;
		mockRunner( ( socket ) => {
			connectCount++;
		} );

		const inst = new Runner.Instance( 1337 );

		const conn1 = inst.connect();
		const conn2 = inst.connect();
		const [ result1, result2 ] = await wrapAll( [ conn1, conn2 ] );

		expect( result1.success, 'first connection' ).to.equal( true );
		expect( result2.success, 'second connection' ).to.equal( false );
		expect( connectCount, 'connection count' ).to.equal( 1 );
		expect( inst.connected, 'runner connection status' ).to.equal( true );
		await inst.dispose();
	} ) );

	it( 'should wait until disconnection is complete', mochaAsync( async () =>
	{
		let connected: any = true;
		mockRunner( ( socket ) => {
			socket.on( 'close', ( hasError: boolean ) =>
			{
				if ( hasError ) {
					throw new Error( 'Socket closed uncleanly' );
				}
				connected = false;
			} );
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();

		// Sleep is just to ensure the test would be accurate to the disconnect itself.
		// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
		// which is it's own test.
		await sleep( 10 );

		await inst.disconnect();

		expect( connected, 'socket connection' ).to.equal( false );
		expect( inst.connected, 'runner connection status' ).to.equal( false );
		await inst.dispose();
	} ) );

	it( 'should disconnect only once', mochaAsync( async () =>
	{
		let disconnectCount = 0;
		mockRunner( ( socket ) => {
			socket.on( 'close', ( hasError: boolean ) =>
			{
				if ( hasError ) {
					throw new Error( 'Socket closed uncleanly' );
				}
				disconnectCount++;
			} );
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();

		// Sleep is just to ensure the test would be accurate to the disconnect itself.
		// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
		// which is it's own test.
		await sleep( 10 );

		await inst.disconnect();
		await inst.disconnect();

		expect( disconnectCount, 'disconnection count' ).to.equal( 1 );
		expect( inst.connected, 'runner connection status' ).to.equal( false );
		await inst.dispose();
	} ) );

	it( 'should fail disconnecting twice in parallel', mochaAsync( async () =>
	{
		let disconnectCount = 0;
		mockRunner( ( socket ) => {
			socket.on( 'close', ( hasError: boolean ) =>
			{
				if ( hasError ) {
					throw new Error( 'Socket closed uncleanly' );
				}
				disconnectCount++;
			} );
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();

		// Sleep is just to ensure the test would be accurate to the disconnect itself.
		// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
		// which is it's own test.
		await sleep( 10 );

		const conn1 = inst.disconnect();
		const conn2 = inst.disconnect();
		const [ result1, result2 ] = await wrapAll( [ conn1, conn2 ] );

		expect( result1.success, 'first disconnection' ).to.equal( true );
		expect( result2.success, 'second disconnection' ).to.equal( false );
		expect( disconnectCount, 'disconnection count' ).to.equal( 1 );
		expect( inst.connected, 'runner connection status' ).to.equal( false );
		await inst.dispose();
	} ) );

	it( 'should fail connect and disconnect in parallel', mochaAsync( async () =>
	{
		let wasConnected: any = false;
		mockRunner( ( socket ) => {
			wasConnected = true;
		} );

		const inst = new Runner.Instance( 1337 );
		const conn1 = inst.connect();
		const conn2 = inst.disconnect();
		const [ result1, result2 ] = await wrapAll( [ conn1, conn2 ] );

		expect( result1.success, 'first connection' ).to.equal( true );
		expect( result2.success, 'second disconnection' ).to.equal( false );
		expect( wasConnected, 'was socket connected' ).to.equal( true );
		expect( inst.connected, 'runner connection status' ).to.equal( true );
		await inst.dispose();
	} ) );

	it( 'should disconnect and connect in quick succession', mochaAsync( async () =>
	{
		let connectionCount = 0;
		mockRunner( ( socket ) => {
			connectionCount++;
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();

		// Sleep is just to ensure the test would be accurate to the disconnect itself.
		// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
		// which is it's own test.
		await sleep( 10 );

		const conn1 = inst.disconnect();
		const conn2 = inst.connect();
		const [ result1, result2 ] = await wrapAll( [ conn1, conn2 ] );

		expect( result1.success, 'first disconnection' ).to.equal( true );
		expect( result2.success, 'second connection' ).to.equal( false );
		expect( connectionCount, 'connection count' ).to.equal( 1 );
		expect( inst.connected, 'runner connection status' ).to.equal( false );
		await inst.dispose();
	} ) );

	it( 'should retry the initial connection up to 5 seconds', mochaAsync( async () =>
	{
		// Delay the mock runner creation by 2 seconds.
		let connected: any = false;
		setTimeout( () =>
		{
			mockRunner( ( socket ) => {
				connected = true;
			} );
		}, 2000 );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		expect( connected, 'socket connection' ).to.equal( true );
		expect( inst.connected, 'runner connection status' ).to.equal( true );
		await inst.dispose();
	} ) );

	it( 'should timeout the connection attempt if over 5 seconds', mochaAsync( async () =>
	{
		// Delay the mock runner creation by 7 seconds which is over the 5 second timeout.
		let connected: any = false;
		const runnerCreatePromise = new Promise( ( resolve ) =>
		{
			setTimeout( () =>
			{
				mockRunner( ( socket ) => {
					connected = true;
				} );
				resolve();
			}, 7000 );
		} );

		const inst = new Runner.Instance( 1337 );
		const [ result ] = await wrapAll( [ inst.connect() ] );
		expect( result.success, 'connection result' ).to.equal( false );
		expect( connected, 'socket connection' ).to.equal( false );
		expect( inst.connected, 'runner connection status' ).to.equal( false );
		await inst.dispose();

		// Wait until the runner is actually created so that it can be cleaned up properly in the end of this test.
		await runnerCreatePromise;
	} ) );

	function getMockReaderPromise( expectedData: Object | Object[], expectedResult?: Object | Object[] )
	{
		return new Promise( ( resolve, reject ) =>
		{
			const receive = Array.isArray( expectedData ) ? expectedData : [ expectedData ];
			const expected = Array.isArray( expectedResult ) ? expectedResult : [ expectedResult ];
			if ( receive.length != expected.length ) {
				return reject( new Error( 'Receive and expected result should be the same for mock runner' ) );
			}
			let currentReceive = 0;

			mockRunner( ( socket ) => {
				const incomingJson: stream.Duplex = JSONStream.parse( true );
				incomingJson
					.on( 'data', ( data ) =>
					{
						expect( data, 'received json data' ).to.deep.equal( receive[ currentReceive ] );
						const result = expected[ currentReceive ];
						if ( ++currentReceive == receive.length ) {
							resolve( expectedResult );
						}

						if ( result ) {
							socket.write( JSON.stringify( result ) );
						}
					} )
					.on( 'error', reject );

				socket.setEncoding( 'utf8' );
				socket.pipe( incomingJson );
			} );

			setTimeout( () => reject( new Error( 'Did not receive any json data in time' ) ), 2000 );
		} );
	}

	it( 'should send kill command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'control',
			msgId: '0',
			payload: {
				command: 'kill',
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendKillGame();
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send pause command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'control',
			msgId: '0',
			payload: {
				command: 'pause',
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendPause();
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send resume command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'control',
			msgId: '0',
			payload: {
				command: 'resume',
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendResume();
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send cancel command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'control',
			msgId: '0',
			payload: {
				command: 'cancel',
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendCancel();
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send get state command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'state',
			msgId: '0',
			payload: {
				includePatchInfo: true,
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendGetState( true );
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send get state command (2)', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'state',
			msgId: '0',
			payload: {
				includePatchInfo: false,
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendGetState( false );
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send check for updates command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'checkForUpdates',
			msgId: '0',
			payload: {
				gameUID: '1',
				platformURL: '2',
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendCheckForUpdates( '1', '2' );
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send check for updates command (2)', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'checkForUpdates',
			msgId: '0',
			payload: {
				gameUID: '1',
				platformURL: '2',
				authToken: '3',
				metadata: '4',
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendCheckForUpdates( '1', '2', '3', '4' );
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send update available command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'updateAvailable',
			msgId: '0',
			payload: {
				test: true,
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendUpdateAvailable( { test: true } );
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send update begin command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'updateBegin',
			msgId: '0',
			payload: {},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendUpdateBegin();
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should send update apply command', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'updateApply',
			msgId: '0',
			payload: {
				env: { var1: true, var2: false },
				args: [ '1', '2', '3' ],
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		inst.sendUpdateApply( { var1: true, var2: false }, [ '1', '2', '3' ] );
		await mockPromise;
		await inst.dispose();
	} ) );

	it( 'should wait for send to get the response', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'updateBegin',
			msgId: '0',
			payload: {},
		}, {
			type: 'result',
			msgId: '0',
			payload: {
				success: true,
			},
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();

		let resolvedMock = false;
		const [expectedResult, result] = await Promise.all( [
			mockPromise.then( ( value ) =>
			{
				resolvedMock = true;
				return value;
			} ),
			inst.sendUpdateBegin().then( ( value ) =>
			{
				expect( resolvedMock, 'mock resolve status' ).to.be.true;
				return value;
			} ),
		] );
		expect( result, 'response for sent message' ).to.deep.equal( expectedResult );
		await inst.dispose();
	} ) );

	it( 'should send two messages one after the other', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( [ {
			type: 'updateBegin',
			msgId: '0',
			payload: {},
		}, {
			type: 'updateApply',
			msgId: '1',
			payload: {
				env: {},
				args: [],
			},
		} ], [ {
			type: 'result',
			msgId: '0',
			payload: {
				success: true,
			},
		}, {
			type: 'result',
			msgId: '1',
			payload: {
				success: true,
			},
		} ] );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();

		// The mock is expected to resolve right BEFORE sending the last message, and after sending the previous ones.
		// So the order of resolutions we're expecting is result1 -> mock -> result2
		let resolvedMock = false;
		let resolvedResult1 = false;
		const [expectedResult, result1, result2] = await Promise.all( [
			mockPromise.then( ( value ) =>
			{
				resolvedMock = true;
				expect( resolvedResult1, 'result 1 resolved status' ).to.be.true;
				return value;
			} ),
			inst.sendUpdateBegin().then( ( value ) =>
			{
				resolvedResult1 = true;
				expect( resolvedMock, 'mock resolve status' ).to.be.false;
				return value;
			} ),
			inst.sendUpdateApply({}, []).then( ( value ) =>
			{
				expect( resolvedMock, 'mock resolve status' ).to.be.true;
				expect( resolvedResult1, 'result 1 resolved status' ).to.be.true;
				return value;
			} ),
		] );
		expect( result1, 'response for message 1' ).to.deep.equal( expectedResult[0] );
		expect( result2, 'response for message 2' ).to.deep.equal( expectedResult[1] );
		await inst.dispose();
	} ) );

	it( 'should send the response as soon as connected', mochaAsync( async () =>
	{
		const mockPromise = getMockReaderPromise( {
			type: 'updateBegin',
			msgId: '0',
			payload: {},
		}, {
			type: 'result',
			msgId: '0',
			payload: {
				success: true,
			},
		} );

		const inst = new Runner.Instance( 1337 );

		let connected = false;
		let resolvedMock = false;
		const promises = Promise.all( [
			mockPromise.then( ( value ) =>
			{
				expect( connected, 'connection status' ).to.be.true;
				expect( inst.connected, 'instance connection status' ).to.be.true;
				resolvedMock = true;
				return value;
			} ),
			inst.sendUpdateBegin().then( ( value ) =>
			{
				expect( resolvedMock, 'mock resolve status' ).to.be.true;
				return value;
			} ),
		] );

		// This is just to make sure that the promises and send operation goes through before connecting
		await sleep( 1 );

		await inst.connect();
		connected = true;

		const [expectedResult, result] = await promises;
		expect( result, 'response for sent message' ).to.deep.equal( expectedResult );
		await inst.dispose();
	} ) );

	it( 'should fail sending a message if not connected past the delay', mochaAsync( async () =>
	{
		const inst = new Runner.Instance( 1337 );
		const race = Promise.race( [
			inst.sendUpdateBegin( 1000 ).then(
				( value ) => { throw new Error( 'Sending message somehow worked' ) },
				( err ) => err,
			),
			sleep( 2000 ).then( () => { throw new Error( 'Did not timeout in time' ) } ),
		] );

		await expect( race, 'send operation with timeout' ).to.eventually.be.an( 'Error' );
		const result = await race;
		expect( result.message, 'result error message' ).to.equal( 'Message was not handled in time' );
		await inst.dispose();
	} ) );

	it( 'should not fail sending a message if not limited by a timeout', mochaAsync( async () =>
	{
		const inst = new Runner.Instance( 1337 );
		const race = Promise.race( [
			inst.sendUpdateBegin().then(
				() => { throw new Error( 'send should not have finished' ) },
				() => { throw new Error( 'send should not have finished' ) },
			),
			sleep( 2000 ).then( () => 'success' ),
		] );

		await expect( race, 'send operation without timeout' ).to.eventually.equal( 'success' )
		await inst.dispose();
	} ) );

	it( 'should fail receiving an invalid json', mochaAsync( async () =>
	{
		const mockPromise = new Promise( ( resolve, reject ) =>
		{
			mockRunner( ( socket ) => {
				socket.write( 'this is not a valid json', ( err?: Error ) =>
				{
					if ( err ) {
						reject( err );
						return;
					}

					resolve();
					return;
				} );
			} );

			setTimeout( () => reject( new Error( 'Did not receive any data in time' ) ), 2000 );
		} );

		const inst = new Runner.Instance( 1337 );
		await inst.connect();
		await mockPromise;

		// Have to sleep for a bit to give the instance a chance to receive the bad message and dispose itself.
		await sleep( 50 );

		expect( inst.connected, 'runner connection status' ).to.equal( false );
		await inst.dispose();
	} ) );
} );
