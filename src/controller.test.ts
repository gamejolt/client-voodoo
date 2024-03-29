import * as net from 'net';
import { Controller, Options } from './controller';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as stream from 'stream';

chai.use(chaiAsPromised);
const expect = chai.expect;

const JSONStream = require('JSONStream');

describe('Joltron Controller', function () {
	function wrapAll(promises: Promise<any>[]) {
		const result: Promise<{ success: boolean; value: any }>[] = [];
		for (let p of promises) {
			result.push(
				p
					.then(value => {
						return { success: true, value: value };
					})
					.catch(err => {
						return { success: false, value: err };
					})
			);
		}
		return Promise.all(result);
	}

	function sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// Creates a newController suitable for testing.
	// We need sequential message ids to mock responses reliably.
	function newController(port: number, options?: Options) {
		options = options || {};
		options.sequentialMessageId = true;
		return new Controller(port, options);
	}

	function mockRunner(onConnection: (socket: net.Socket) => void) {
		let mockId = nextMockId++;
		console.log(`created mock #${mockId}`);

		currentConns = [];
		currentMock = net.createServer(socket => {
			currentConns.push(socket);
			console.log(`mock #${mockId} connection`);
			onConnection(socket);
		});
		(currentMock as any).mockId = mockId;

		currentMock
			.on('error', err => {
				throw err;
			})
			.listen(1337, 'localhost');
	}

	function disposeMockRunner() {
		return new Promise<void>(resolve => {
			if (!currentMock) {
				resolve();
				return;
			}

			currentMock.close(() => {
				console.log(`disposed mock #${(currentMock as any).mockId}`);
				currentMock = null;
				currentConns = [];
				resolve();
			});

			console.log(`disposing mock #${(currentMock as any).mockId}...`);
			for (let conn of currentConns) {
				conn.end();
			}
		});
	}

	let nextMockId = 0;
	let currentMock: net.Server | null;
	let currentConns: net.Socket[];

	beforeEach(disposeMockRunner);
	this.afterAll(disposeMockRunner);

	it(
		'should attach to running instance',
		async () => {
			const inst = newController(1337);

			let resolve: (() => void) | null = null;
			const waitForConnect = new Promise<void>(_resolve => {
				resolve = () => _resolve();
			});

			mockRunner(socket => {
				// Connecting is enough
				console.log('mock server connect resolving');
				resolve!();
			});

			inst.connect();
			await waitForConnect;
			console.log('mock server connect resolved');

			console.log('disposing from test');
			await inst.dispose();
			console.log('disposed from test');
		}
	);

	it(
		'should wait until connection is made',
		async () => {
			let connected = false;
			mockRunner(socket => {
				console.log('set the thing');
				connected = true;
			});

			const inst = newController(1337);
			await inst.connect();
			expect(inst.connected, 'runner connection status').to.equal(true);

			// There is a race condition between the mock firing, the socket accepted callback,
			// and the connector firing the connection established event.
			// This is fine, usually the mock would be joltron and testing how it handles the connection is out of the scope of these tests.
			await sleep(0);
			expect(connected, 'socket connection').to.equal(true);

			await inst.dispose();
		}
	);

	it(
		'should connect only once while connected',
		async () => {
			let connectCount = 0;
			mockRunner(socket => {
				connectCount++;
			});

			const inst = newController(1337);
			await inst.connect();
			await inst.connect();
			expect(inst.connected, 'runner connection status').to.equal(true);

			await sleep(0);
			expect(connectCount, 'connection count').to.equal(1);
			await inst.dispose();
		}
	);

	it(
		'should connect only once even when parallel',
		async () => {
			let connectCount = 0;
			mockRunner(socket => {
				connectCount++;
			});

			const inst = newController(1337);

			const conn1 = inst.connect();
			const conn2 = inst.connect();
			const [result1, result2] = await wrapAll([conn1, conn2]);

			expect(result1.success, 'first connection').to.equal(true);
			expect(result2.success, 'second connection').to.equal(true);
			expect(inst.connected, 'runner connection status').to.equal(true);

			await sleep(0);
			expect(connectCount, 'connection count').to.equal(1);

			await inst.dispose();
		}
	);

	it(
		'should wait until disconnection is complete',
		async () => {
			let connected: any = true;
			mockRunner(socket => {
				socket.on('close', (hasError: boolean) => {
					if (hasError) {
						throw new Error('Socket closed uncleanly');
					}
					connected = false;
				});
			});

			const inst = newController(1337);
			await inst.connect();

			// Sleep is just to ensure the test would be accurate to the disconnect itself.
			// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
			// which is it's own test.
			await sleep(10);

			await inst.disconnect();

			expect(inst.connected, 'runner connection status').to.equal(false);

			await sleep(0);
			expect(connected, 'socket connection').to.equal(false);

			await inst.dispose();
		}
	);

	it(
		'should disconnect only once',
		async () => {
			let disconnectCount = 0;
			mockRunner(socket => {
				socket.on('close', (hasError: boolean) => {
					if (hasError) {
						throw new Error('Socket closed uncleanly');
					}
					disconnectCount++;
				});
			});

			const inst = newController(1337);
			await inst.connect();

			// Sleep is just to ensure the test would be accurate to the disconnect itself.
			// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
			// which is it's own test.
			await sleep(10);

			await inst.disconnect();
			await inst.disconnect();

			expect(inst.connected, 'runner connection status').to.equal(false);

			await sleep(0);
			expect(disconnectCount, 'disconnection count').to.equal(1);

			await inst.dispose();
		}
	);

	it(
		'should not fail disconnecting twice in parallel',
		async () => {
			let disconnectCount = 0;
			mockRunner(socket => {
				socket.on('close', (hasError: boolean) => {
					if (hasError) {
						throw new Error('Socket closed uncleanly');
					}
					disconnectCount++;
				});
			});

			const inst = newController(1337);
			await inst.connect();

			// Sleep is just to ensure the test would be accurate to the disconnect itself.
			// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
			// which is it's own test.
			await sleep(10);

			const conn1 = inst.disconnect();
			const conn2 = inst.disconnect();
			const [result1, result2] = await wrapAll([conn1, conn2]);

			expect(result1.success, 'first disconnection').to.equal(true);
			expect(result2.success, 'second disconnection').to.equal(true);
			expect(inst.connected, 'runner connection status').to.equal(false);

			await sleep(0);
			expect(disconnectCount, 'disconnection count').to.equal(1);

			await inst.dispose();
		}
	);

	it(
		'should connect and disconnect in quick succession',
		async () => {
			let wasConnected: any = false;
			mockRunner(socket => {
				wasConnected = true;
			});

			const inst = newController(1337);
			const conn1 = inst.connect();
			const conn2 = inst.disconnect();
			const [result1, result2] = await wrapAll([conn1, conn2]);

			expect(result1.success, 'first connection').to.equal(true);
			expect(result2.success, 'second disconnection').to.equal(true);
			expect(inst.connected, 'runner connection status').to.equal(false);

			await sleep(0);
			expect(wasConnected, 'was socket connected').to.equal(true);

			await inst.dispose();
		}
	);

	it(
		'should disconnect and connect in quick succession',
		async () => {
			let connectionCount = 0;
			mockRunner(socket => {
				connectionCount++;
			});

			const inst = newController(1337);
			await inst.connect();

			// Sleep is just to ensure the test would be accurate to the disconnect itself.
			// Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
			// which is it's own test.
			await sleep(10);

			const conn1 = inst.disconnect();
			const conn2 = inst.connect();
			const [result1, result2] = await wrapAll([conn1, conn2]);

			expect(result1.success, 'first disconnection').to.equal(true);
			expect(result2.success, 'second connection').to.equal(true);
			expect(inst.connected, 'runner connection status').to.equal(true);

			await sleep(0);
			expect(connectionCount, 'connection count').to.equal(2);

			await inst.dispose();
		}
	);

	it(
		'should retry the initial connection up to 3 seconds',
		async () => {
			// Delay the mock runner creation by 2 seconds.
			let connected: any = false;
			setTimeout(() => {
				mockRunner(socket => {
					connected = true;
				});
			}, 2000);

			const inst = newController(1337);
			await inst.connect();
			expect(inst.connected, 'runner connection status').to.equal(true);

			await sleep(0);
			expect(connected, 'socket connection').to.equal(true);

			await inst.dispose();
		}
	);

	it(
		'should timeout the connection attempt if over 3 seconds',
		async () => {
			// Delay the mock runner creation by 7 seconds which is over the 5 second timeout.
			let connected = false;
			const runnerCreatePromise = new Promise<void>(resolve => {
				setTimeout(() => {
					mockRunner(socket => {
						connected = true;
					});
					resolve();
				}, 4000);
			});

			const inst = newController(1337);
			const [result] = await wrapAll([inst.connect()]);
			expect(result.success, 'connection result').to.equal(false);
			expect(inst.connected, 'runner connection status').to.equal(false);

			await sleep(0);
			expect(connected, 'socket connection').to.equal(false);

			await inst.dispose();

			// Wait until the runner is actually created so that it can be cleaned up properly in the end of this test.
			await runnerCreatePromise;
		}
	);

	it(
		'should emit a "fatal" event when joltron disconnects unexpectedly',
		async () => {
			const inst = newController(1337);

			let resolveConnected: (() => void) = null as any;
			const waitForConnect = new Promise<void>(_resolve => {
				resolveConnected = _resolve;
			});

			mockRunner(socket => {
				resolveConnected();
				socket.destroy();
			});

			inst.connect();

			let resolveDisconnected: (() => void) = null as any;
			const waitForDisconnect = new Promise<void>(_resolve => {
				resolveDisconnected = _resolve;
			});
			inst.once('fatal', (err: Error) => {
				expect(err.message).to.equal('Unexpected disconnection from joltron');
				resolveDisconnected();
			});

			await waitForConnect;
			console.log('connected');
			await waitForDisconnect;
			console.log('disconnected');

			// We sleep here so that the connection would fully go through before calling dispose.
			// This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
			// and we resolve the connection promise before the transition is finished fully.
			await sleep(10);
			await inst.dispose();
		}
	);

	it(
		'should retry connection if the controller is set to keep connection alive',
		async () => {
			const inst = newController(1337, { keepConnected: true });

			let wasConnected = false;

			let resolveConnected: (() => void) = null as any;
			const waitForConnect = new Promise<void>(_resolve => {
				resolveConnected = _resolve;
			});

			let resolveConnectedAgain: (() => void) = null as any;
			const waitForConnectAgain = new Promise<void>(_resolve => {
				resolveConnectedAgain = _resolve;
			});

			mockRunner(socket => {
				if (!wasConnected) {
					wasConnected = true;
					resolveConnected();
					socket.destroy();
				} else {
					resolveConnectedAgain();
				}
			});

			inst.connect();

			let resolveDisconnected: (() => void) = null as any;
			const waitForDisconnect = new Promise<void>(_resolve => {
				resolveDisconnected = _resolve;
			});
			inst.once('fatal', (err: Error) => {
				expect(err.message).to.equal('Unexpected disconnection from joltron');
				resolveDisconnected();
			});

			await waitForConnect;
			await waitForDisconnect;
			await waitForConnectAgain;

			// We sleep here so that the connection would fully go through before calling dispose.
			// This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
			// and we resolve the connection promise before the transition is finished fully.
			await sleep(10);
			await inst.dispose();
		}
	);

	it(
		'should not retry connection if the controller is not set to keep connection alive',
		async () => {
			const inst = newController(1337);

			let connections = 0;

			let resolveConnected: (() => void) = null as any;
			const waitForConnect = new Promise<void>(_resolve => {
				resolveConnected = _resolve;
			});

			mockRunner(socket => {
				if (connections === 0) {
					resolveConnected();
					socket.destroy();
				}

				connections++;
			});

			inst.connect();

			let resolveDisconnected: (() => void) = null as any;
			const waitForDisconnect = new Promise<void>(_resolve => {
				resolveDisconnected = _resolve;
			});
			inst.once('fatal', (err: Error) => {
				expect(err.message).to.equal('Unexpected disconnection from joltron');
				resolveDisconnected();
			});

			await waitForConnect;
			await waitForDisconnect;

			await sleep(10);
			expect(inst.connected).to.equal(false, 'controller should not be connected');
			expect(connections).to.equal(1, 'expected only 1 connection');

			// We sleep here so that the connection would fully go through before calling dispose.
			// This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
			// and we resolve the connection promise before the transition is finished fully.
			await sleep(10);
			await inst.dispose();
		}
	);

	function getMockReaderPromise(
		expectedData: Object | Object[],
		expectedResult?: Object | Object[]
	) {
		return new Promise<any>((resolve, reject) => {
			const receive = Array.isArray(expectedData) ? expectedData : [expectedData];
			const expected = Array.isArray(expectedResult) ? expectedResult : [expectedResult];
			if (receive.length !== expected.length) {
				return reject(
					new Error('Receive and expected result should be the same for mock runner')
				);
			}
			let currentReceive = 0;

			mockRunner(socket => {
				const incomingJson: stream.Duplex = JSONStream.parse(true);
				incomingJson
					.on('data', data => {
						expect(data, 'received json data').to.deep.equal(receive[currentReceive]);
						const result = expected[currentReceive];
						if (++currentReceive === receive.length) {
							resolve(expectedResult);
						}

						if (result) {
							socket.write(JSON.stringify(result));
						}
					})
					.on('error', reject);

				socket.setEncoding('utf8');
				socket.pipe(incomingJson);
			});

			setTimeout(() => reject(new Error('Did not receive any json data in time')), 2000);
		});
	}

	it(
		'should send kill command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'control',
				msgId: '0',
				payload: {
					command: 'kill',
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendKillGame();
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send pause command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'control',
				msgId: '0',
				payload: {
					command: 'pause',
				},
			});

			const inst = newController(1337);
			await inst.connect();
			console.log('connected, sending pause');
			inst.sendPause();
			console.log('waiting for mock reader to finish');
			await mockPromise;
			console.log('waiting for controller to dispose');
			await inst.dispose();
			console.log('ok');
		}
	);

	it(
		'should send resume command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'control',
				msgId: '0',
				payload: {
					command: 'resume',
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendResume();
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send cancel command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'control',
				msgId: '0',
				payload: {
					command: 'cancel',
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendCancel();
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send get state command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'state',
				msgId: '0',
				payload: {
					includePatchInfo: true,
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendGetState(true);
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send get state command (2)',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'state',
				msgId: '0',
				payload: {
					includePatchInfo: false,
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendGetState(false);
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send check for updates command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'checkForUpdates',
				msgId: '0',
				payload: {
					gameUID: '1',
					platformURL: '2',
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendCheckForUpdates('1', '2');
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send check for updates command (2)',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'checkForUpdates',
				msgId: '0',
				payload: {
					gameUID: '1',
					platformURL: '2',
					authToken: '3',
					metadata: '4',
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendCheckForUpdates('1', '2', '3', '4');
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send update available command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'updateAvailable',
				msgId: '0',
				payload: {
					test: true,
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendUpdateAvailable({ test: true } as any);
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send update begin command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'updateBegin',
				msgId: '0',
				payload: {},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendUpdateBegin();
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should send update apply command',
		async () => {
			const mockPromise = getMockReaderPromise({
				type: 'updateApply',
				msgId: '0',
				payload: {
					env: { var1: true, var2: false },
					args: ['1', '2', '3'],
				},
			});

			const inst = newController(1337);
			await inst.connect();
			inst.sendUpdateApply({ var1: true, var2: false }, ['1', '2', '3']);
			await mockPromise;
			await inst.dispose();
		}
	);

	it(
		'should wait for send to get the response',
		async () => {
			const mockPromise = getMockReaderPromise(
				{
					type: 'updateBegin',
					msgId: '0',
					payload: {},
				},
				{
					type: 'result',
					msgId: '0',
					payload: {
						success: true,
					},
				}
			);

			const inst = newController(1337);
			await inst.connect();

			let resolvedMock = false;
			const [expectedResult, result] = await Promise.all([
				mockPromise.then(value => {
					resolvedMock = true;
					return value;
				}),
				inst.sendUpdateBegin().then(value => {
					// tslint:disable-next-line:no-unused-expression
					expect(resolvedMock, 'mock resolve status').to.be.true;
					return value;
				}),
			]);
			expect(result, 'response for sent message').to.deep.equal(expectedResult.payload);
			await inst.dispose();
		}
	);

	it(
		'should send two messages one after the other',
		async () => {
			const mockPromise = getMockReaderPromise(
				[
					{
						type: 'updateBegin',
						msgId: '0',
						payload: {},
					},
					{
						type: 'updateApply',
						msgId: '1',
						payload: {
							env: {},
							args: [],
						},
					},
				],
				[
					{
						type: 'result',
						msgId: '0',
						payload: {
							success: true,
						},
					},
					{
						type: 'result',
						msgId: '1',
						payload: {
							success: true,
						},
					},
				]
			);

			const inst = newController(1337);
			await inst.connect();

			// The mock is expected to resolve right BEFORE sending the last message, and after sending the previous ones.
			// So the order of resolutions we're expecting is result1 -> mock -> result2
			let resolvedMock = false;
			let resolvedResult1 = false;
			const [expectedResult, result1, result2] = await Promise.all([
				mockPromise.then(value => {
					resolvedMock = true;
					// tslint:disable-next-line:no-unused-expression
					expect(resolvedResult1, 'result 1 resolved status').to.be.true;
					return value;
				}),
				inst.sendUpdateBegin().then(value => {
					resolvedResult1 = true;
					// tslint:disable-next-line:no-unused-expression
					expect(resolvedMock, 'mock resolve status').to.be.false;
					return value;
				}),
				inst.sendUpdateApply({}, []).then(value => {
					// tslint:disable-next-line:no-unused-expression
					expect(resolvedMock, 'mock resolve status').to.be.true;
					// tslint:disable-next-line:no-unused-expression
					expect(resolvedResult1, 'result 1 resolved status').to.be.true;
					return value;
				}),
			]);
			expect(result1, 'response for message 1').to.deep.equal(expectedResult[0].payload);
			expect(result2, 'response for message 2').to.deep.equal(expectedResult[1].payload);
			await inst.dispose();
		}
	);

	it(
		'should send the response as soon as connected',
		async () => {
			const mockPromise = getMockReaderPromise(
				{
					type: 'updateBegin',
					msgId: '0',
					payload: {},
				},
				{
					type: 'result',
					msgId: '0',
					payload: {
						success: true,
					},
				}
			);

			const inst = newController(1337);

			let connected = false;
			let resolvedMock = false;
			const promises = Promise.all([
				mockPromise.then(value => {
					// tslint:disable-next-line:no-unused-expression
					expect(connected, 'connection status').to.be.true;
					// tslint:disable-next-line:no-unused-expression
					expect(inst.connected, 'instance connection status').to.be.true;
					resolvedMock = true;
					return value;
				}),
				inst.sendUpdateBegin().then(value => {
					// tslint:disable-next-line:no-unused-expression
					expect(resolvedMock, 'mock resolve status').to.be.true;
					return value;
				}),
			]);

			// This is just to make sure that the promises and send operation goes through before connecting
			await sleep(1);

			await inst.connect();
			connected = true;

			const [expectedResult, result] = await promises;
			expect(result, 'response for sent message').to.deep.equal(expectedResult.payload);
			await inst.dispose();
		}
	);

	it(
		'should fail sending a message if not connected past the delay',
		async () => {
			const inst = newController(1337);
			const race = Promise.race([
				inst.sendUpdateBegin(1000).then(value => {
					throw new Error('Sending message somehow worked');
				}),
				sleep(2000).then(() => {
					throw new Error('Did not timeout in time');
				}),
			])
			.catch(err => err);

			await expect(race, 'send operation with timeout').to.eventually.be.an('Error');
			const result = await race;
			expect(result.message, 'result error message').to.match(
				/^Message was not sent in time/
			);
			await inst.dispose();
		}
	);

	it(
		'should not fail sending a message if not limited by a timeout',
		async () => {
			const inst = newController(1337);
			const race = Promise.race([
				inst.sendUpdateBegin().then(
					() => {
						throw new Error('send should not have finished');
					},
					() => {
						throw new Error('send should not have finished');
					}
				),
				sleep(2000).then(() => 'success'),
			]);

			await expect(race, 'send operation without timeout').to.eventually.equal('success');
			await inst.dispose();
		}
	);

	it(
		'should fail receiving an invalid json',
		async () => {
			const mockPromise = new Promise<void>((resolve, reject) => {
				mockRunner(socket => {
					socket.write('this is not a valid json', (err?: Error) => {
						if (err) {
							reject(err);
							return;
						}

						resolve();
						return;
					});
				});

				setTimeout(() => reject(new Error('Did not receive any data in time')), 2000);
			});

			const inst = newController(1337);
			await inst.connect();
			await mockPromise;

			// Have to sleep for a bit to give the instance a chance to receive the bad message and dispose itself.
			await sleep(50);

			expect(inst.connected, 'runner connection status').to.equal(false);
			await inst.dispose();
		}
	);
});
