"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var controller_1 = require("./controller");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var JSONStream = require('JSONStream');
describe('Joltron Controller', function () {
    var _this = this;
    function wrapAll(promises) {
        var result = [];
        for (var _i = 0, promises_1 = promises; _i < promises_1.length; _i++) {
            var p = promises_1[_i];
            result.push(p
                .then(function (value) {
                return { success: true, value: value };
            })
                .catch(function (err) {
                return { success: false, value: err };
            }));
        }
        return Promise.all(result);
    }
    function sleep(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    }
    // Creates a newController suitable for testing.
    // We need sequential message ids to mock responses reliably.
    function newController(port, options) {
        options = options || {};
        options.sequentialMessageId = true;
        return new controller_1.Controller(port, options);
    }
    function mockRunner(onConnection) {
        var mockId = nextMockId++;
        console.log("created mock #" + mockId);
        currentConns = [];
        currentMock = net.createServer(function (socket) {
            currentConns.push(socket);
            console.log("mock #" + mockId + " connection");
            onConnection(socket);
        });
        currentMock.mockId = mockId;
        currentMock
            .on('error', function (err) {
            throw err;
        })
            .listen(1337, 'localhost');
    }
    function disposeMockRunner() {
        return new Promise(function (resolve) {
            if (!currentMock) {
                resolve();
            }
            currentMock.close(function () {
                console.log("disposed mock #" + currentMock.mockId);
                currentMock = null;
                currentConns = null;
                resolve();
            });
            console.log("disposing mock #" + currentMock.mockId + "...");
            for (var _i = 0, currentConns_1 = currentConns; _i < currentConns_1.length; _i++) {
                var conn = currentConns_1[_i];
                conn.end();
            }
        });
    }
    var nextMockId = 0;
    var currentMock;
    var currentConns;
    beforeEach(disposeMockRunner);
    it('should attach to running instance', function () { return __awaiter(_this, void 0, void 0, function () {
        var inst, resolve, waitForConnect;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inst = newController(1337);
                    resolve = null;
                    waitForConnect = new Promise(function (_resolve) {
                        resolve = _resolve;
                    });
                    mockRunner(function (socket) {
                        // Connecting is enough
                        resolve();
                    });
                    inst.connect();
                    return [4 /*yield*/, waitForConnect];
                case 1:
                    _a.sent();
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    return [4 /*yield*/, sleep(10)];
                case 2:
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should wait until connection is made', function () { return __awaiter(_this, void 0, void 0, function () {
        var connected, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connected = false;
                    mockRunner(function (socket) {
                        console.log('set the thing');
                        connected = true;
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    expect(inst.connected, 'runner connection status').to.equal(true);
                    // There is a race condition between the mock firing, the socket accepted callback,
                    // and the connector firing the connection established event.
                    // This is fine, usually the mock would be joltron and testing how it handles the connection is out of the scope of these tests.
                    return [4 /*yield*/, sleep(0)];
                case 2:
                    // There is a race condition between the mock firing, the socket accepted callback,
                    // and the connector firing the connection established event.
                    // This is fine, usually the mock would be joltron and testing how it handles the connection is out of the scope of these tests.
                    _a.sent();
                    expect(connected, 'socket connection').to.equal(true);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should connect only once while connected', function () { return __awaiter(_this, void 0, void 0, function () {
        var connectCount, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectCount = 0;
                    mockRunner(function (socket) {
                        connectCount++;
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, inst.connect()];
                case 2:
                    _a.sent();
                    expect(inst.connected, 'runner connection status').to.equal(true);
                    return [4 /*yield*/, sleep(0)];
                case 3:
                    _a.sent();
                    expect(connectCount, 'connection count').to.equal(1);
                    return [4 /*yield*/, inst.dispose()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should fail connecting twice in parallel', function () { return __awaiter(_this, void 0, void 0, function () {
        var connectCount, inst, conn1, conn2, _a, result1, result2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    connectCount = 0;
                    mockRunner(function (socket) {
                        connectCount++;
                    });
                    inst = newController(1337);
                    conn1 = inst.connect();
                    conn2 = inst.connect();
                    return [4 /*yield*/, wrapAll([conn1, conn2])];
                case 1:
                    _a = _b.sent(), result1 = _a[0], result2 = _a[1];
                    expect(result1.success, 'first connection').to.equal(true);
                    expect(result2.success, 'second connection').to.equal(false);
                    expect(inst.connected, 'runner connection status').to.equal(true);
                    return [4 /*yield*/, sleep(0)];
                case 2:
                    _b.sent();
                    expect(connectCount, 'connection count').to.equal(1);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should wait until disconnection is complete', function () { return __awaiter(_this, void 0, void 0, function () {
        var connected, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connected = true;
                    mockRunner(function (socket) {
                        socket.on('close', function (hasError) {
                            if (hasError) {
                                throw new Error('Socket closed uncleanly');
                            }
                            connected = false;
                        });
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    return [4 /*yield*/, sleep(10)];
                case 2:
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    _a.sent();
                    return [4 /*yield*/, inst.disconnect()];
                case 3:
                    _a.sent();
                    expect(inst.connected, 'runner connection status').to.equal(false);
                    return [4 /*yield*/, sleep(0)];
                case 4:
                    _a.sent();
                    expect(connected, 'socket connection').to.equal(false);
                    return [4 /*yield*/, inst.dispose()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should disconnect only once', function () { return __awaiter(_this, void 0, void 0, function () {
        var disconnectCount, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    disconnectCount = 0;
                    mockRunner(function (socket) {
                        socket.on('close', function (hasError) {
                            if (hasError) {
                                throw new Error('Socket closed uncleanly');
                            }
                            disconnectCount++;
                        });
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    return [4 /*yield*/, sleep(10)];
                case 2:
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    _a.sent();
                    return [4 /*yield*/, inst.disconnect()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, inst.disconnect()];
                case 4:
                    _a.sent();
                    expect(inst.connected, 'runner connection status').to.equal(false);
                    return [4 /*yield*/, sleep(0)];
                case 5:
                    _a.sent();
                    expect(disconnectCount, 'disconnection count').to.equal(1);
                    return [4 /*yield*/, inst.dispose()];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should fail disconnecting twice in parallel', function () { return __awaiter(_this, void 0, void 0, function () {
        var disconnectCount, inst, conn1, conn2, _a, result1, result2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    disconnectCount = 0;
                    mockRunner(function (socket) {
                        socket.on('close', function (hasError) {
                            if (hasError) {
                                throw new Error('Socket closed uncleanly');
                            }
                            disconnectCount++;
                        });
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _b.sent();
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    return [4 /*yield*/, sleep(10)];
                case 2:
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    _b.sent();
                    conn1 = inst.disconnect();
                    conn2 = inst.disconnect();
                    return [4 /*yield*/, wrapAll([conn1, conn2])];
                case 3:
                    _a = _b.sent(), result1 = _a[0], result2 = _a[1];
                    expect(result1.success, 'first disconnection').to.equal(true);
                    expect(result2.success, 'second disconnection').to.equal(false);
                    expect(inst.connected, 'runner connection status').to.equal(false);
                    return [4 /*yield*/, sleep(0)];
                case 4:
                    _b.sent();
                    expect(disconnectCount, 'disconnection count').to.equal(1);
                    return [4 /*yield*/, inst.dispose()];
                case 5:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should fail connect and disconnect in parallel', function () { return __awaiter(_this, void 0, void 0, function () {
        var wasConnected, inst, conn1, conn2, _a, result1, result2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    wasConnected = false;
                    mockRunner(function (socket) {
                        wasConnected = true;
                    });
                    inst = newController(1337);
                    conn1 = inst.connect();
                    conn2 = inst.disconnect();
                    return [4 /*yield*/, wrapAll([conn1, conn2])];
                case 1:
                    _a = _b.sent(), result1 = _a[0], result2 = _a[1];
                    expect(result1.success, 'first connection').to.equal(true);
                    expect(result2.success, 'second disconnection').to.equal(false);
                    expect(inst.connected, 'runner connection status').to.equal(true);
                    return [4 /*yield*/, sleep(0)];
                case 2:
                    _b.sent();
                    expect(wasConnected, 'was socket connected').to.equal(true);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should disconnect and connect in quick succession', function () { return __awaiter(_this, void 0, void 0, function () {
        var connectionCount, inst, conn1, conn2, _a, result1, result2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    connectionCount = 0;
                    mockRunner(function (socket) {
                        connectionCount++;
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _b.sent();
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    return [4 /*yield*/, sleep(10)];
                case 2:
                    // Sleep is just to ensure the test would be accurate to the disconnect itself.
                    // Without the delay it'd be testing possible effects of disconnecting after connection in quick succession,
                    // which is it's own test.
                    _b.sent();
                    conn1 = inst.disconnect();
                    conn2 = inst.connect();
                    return [4 /*yield*/, wrapAll([conn1, conn2])];
                case 3:
                    _a = _b.sent(), result1 = _a[0], result2 = _a[1];
                    expect(result1.success, 'first disconnection').to.equal(true);
                    expect(result2.success, 'second connection').to.equal(false);
                    expect(inst.connected, 'runner connection status').to.equal(false);
                    return [4 /*yield*/, sleep(0)];
                case 4:
                    _b.sent();
                    expect(connectionCount, 'connection count').to.equal(1);
                    return [4 /*yield*/, inst.dispose()];
                case 5:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should retry the initial connection up to 5 seconds', function () { return __awaiter(_this, void 0, void 0, function () {
        var connected, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connected = false;
                    setTimeout(function () {
                        mockRunner(function (socket) {
                            connected = true;
                        });
                    }, 2000);
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    expect(inst.connected, 'runner connection status').to.equal(true);
                    return [4 /*yield*/, sleep(0)];
                case 2:
                    _a.sent();
                    expect(connected, 'socket connection').to.equal(true);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should timeout the connection attempt if over 5 seconds', function () { return __awaiter(_this, void 0, void 0, function () {
        var connected, runnerCreatePromise, inst, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connected = false;
                    runnerCreatePromise = new Promise(function (resolve) {
                        setTimeout(function () {
                            mockRunner(function (socket) {
                                connected = true;
                            });
                            resolve();
                        }, 7000);
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, wrapAll([inst.connect()])];
                case 1:
                    result = (_a.sent())[0];
                    expect(result.success, 'connection result').to.equal(false);
                    expect(inst.connected, 'runner connection status').to.equal(false);
                    return [4 /*yield*/, sleep(0)];
                case 2:
                    _a.sent();
                    expect(connected, 'socket connection').to.equal(false);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    // Wait until the runner is actually created so that it can be cleaned up properly in the end of this test.
                    return [4 /*yield*/, runnerCreatePromise];
                case 4:
                    // Wait until the runner is actually created so that it can be cleaned up properly in the end of this test.
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should emit a "fatal" event when joltron disconnects unexpectedly', function () { return __awaiter(_this, void 0, void 0, function () {
        var inst, resolveConnected, waitForConnect, resolveDisconnected, waitForDisconnect;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inst = newController(1337);
                    resolveConnected = null;
                    waitForConnect = new Promise(function (_resolve) {
                        resolveConnected = _resolve;
                    });
                    mockRunner(function (socket) {
                        resolveConnected();
                        socket.destroy();
                    });
                    inst.connect();
                    resolveDisconnected = null;
                    waitForDisconnect = new Promise(function (_resolve) {
                        resolveDisconnected = _resolve;
                    });
                    inst.once('fatal', function (err) {
                        expect(err.message).to.equal('Unexpected disconnection from joltron');
                        resolveDisconnected();
                    });
                    return [4 /*yield*/, waitForConnect];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, waitForDisconnect];
                case 2:
                    _a.sent();
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    return [4 /*yield*/, sleep(10)];
                case 3:
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should retry connection if the controller is set to keep connection alive', function () { return __awaiter(_this, void 0, void 0, function () {
        var inst, wasConnected, resolveConnected, waitForConnect, resolveConnectedAgain, waitForConnectAgain, resolveDisconnected, waitForDisconnect;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inst = newController(1337, { keepConnected: true });
                    wasConnected = false;
                    resolveConnected = null;
                    waitForConnect = new Promise(function (_resolve) {
                        resolveConnected = _resolve;
                    });
                    resolveConnectedAgain = null;
                    waitForConnectAgain = new Promise(function (_resolve) {
                        resolveConnectedAgain = _resolve;
                    });
                    mockRunner(function (socket) {
                        if (!wasConnected) {
                            wasConnected = true;
                            resolveConnected();
                            socket.destroy();
                        }
                        else {
                            resolveConnectedAgain();
                        }
                    });
                    inst.connect();
                    resolveDisconnected = null;
                    waitForDisconnect = new Promise(function (_resolve) {
                        resolveDisconnected = _resolve;
                    });
                    inst.once('fatal', function (err) {
                        expect(err.message).to.equal('Unexpected disconnection from joltron');
                        resolveDisconnected();
                    });
                    return [4 /*yield*/, waitForConnect];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, waitForDisconnect];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, waitForConnectAgain];
                case 3:
                    _a.sent();
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    return [4 /*yield*/, sleep(10)];
                case 4:
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should not retry connection if the controller is not set to keep connection alive', function () { return __awaiter(_this, void 0, void 0, function () {
        var inst, connections, resolveConnected, waitForConnect, resolveDisconnected, waitForDisconnect;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inst = newController(1337);
                    connections = 0;
                    resolveConnected = null;
                    waitForConnect = new Promise(function (_resolve) {
                        resolveConnected = _resolve;
                    });
                    mockRunner(function (socket) {
                        if (connections === 0) {
                            resolveConnected();
                            socket.destroy();
                        }
                        connections++;
                    });
                    inst.connect();
                    resolveDisconnected = null;
                    waitForDisconnect = new Promise(function (_resolve) {
                        resolveDisconnected = _resolve;
                    });
                    inst.once('fatal', function (err) {
                        expect(err.message).to.equal('Unexpected disconnection from joltron');
                        resolveDisconnected();
                    });
                    return [4 /*yield*/, waitForConnect];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, waitForDisconnect];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, sleep(10)];
                case 3:
                    _a.sent();
                    expect(inst.connected).to.equal(false, 'controller should not be connected');
                    expect(connections).to.equal(1, 'expected only 1 connection');
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    return [4 /*yield*/, sleep(10)];
                case 4:
                    // We sleep here so that the connection would fully go through before calling dispose.
                    // This is because dispose needs to call disconnect which requires the connection to not be currently transitioning,
                    // and we resolve the connection promise before the transition is finished fully.
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    function getMockReaderPromise(expectedData, expectedResult) {
        return new Promise(function (resolve, reject) {
            var receive = Array.isArray(expectedData) ? expectedData : [expectedData];
            var expected = Array.isArray(expectedResult) ? expectedResult : [expectedResult];
            if (receive.length !== expected.length) {
                return reject(new Error('Receive and expected result should be the same for mock runner'));
            }
            var currentReceive = 0;
            mockRunner(function (socket) {
                var incomingJson = JSONStream.parse(true);
                incomingJson
                    .on('data', function (data) {
                    expect(data, 'received json data').to.deep.equal(receive[currentReceive]);
                    var result = expected[currentReceive];
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
            setTimeout(function () { return reject(new Error('Did not receive any json data in time')); }, 2000);
        });
    }
    it('should send kill command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'control',
                        msgId: '0',
                        payload: {
                            command: 'kill',
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendKillGame();
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send pause command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'control',
                        msgId: '0',
                        payload: {
                            command: 'pause',
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendPause();
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send resume command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'control',
                        msgId: '0',
                        payload: {
                            command: 'resume',
                            extraData: {},
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendResume();
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send cancel command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'control',
                        msgId: '0',
                        payload: {
                            command: 'cancel',
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendCancel();
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send get state command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'state',
                        msgId: '0',
                        payload: {
                            includePatchInfo: true,
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendGetState(true);
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send get state command (2)', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'state',
                        msgId: '0',
                        payload: {
                            includePatchInfo: false,
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendGetState(false);
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send check for updates command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'checkForUpdates',
                        msgId: '0',
                        payload: {
                            gameUID: '1',
                            platformURL: '2',
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendCheckForUpdates('1', '2');
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send check for updates command (2)', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'checkForUpdates',
                        msgId: '0',
                        payload: {
                            gameUID: '1',
                            platformURL: '2',
                            authToken: '3',
                            metadata: '4',
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendCheckForUpdates('1', '2', '3', '4');
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send update available command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'updateAvailable',
                        msgId: '0',
                        payload: {
                            test: true,
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendUpdateAvailable({ test: true });
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send update begin command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'updateBegin',
                        msgId: '0',
                        payload: {},
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendUpdateBegin();
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send update apply command', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'updateApply',
                        msgId: '0',
                        payload: {
                            env: { var1: true, var2: false },
                            args: ['1', '2', '3'],
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    inst.sendUpdateApply({ var1: true, var2: false }, ['1', '2', '3']);
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should wait for send to get the response', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst, resolvedMock, _a, expectedResult, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'updateBegin',
                        msgId: '0',
                        payload: {},
                    }, {
                        type: 'result',
                        msgId: '0',
                        payload: {
                            success: true,
                        },
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _b.sent();
                    resolvedMock = false;
                    return [4 /*yield*/, Promise.all([
                            mockPromise.then(function (value) {
                                resolvedMock = true;
                                return value;
                            }),
                            inst.sendUpdateBegin().then(function (value) {
                                // tslint:disable-next-line:no-unused-expression
                                expect(resolvedMock, 'mock resolve status').to.be.true;
                                return value;
                            }),
                        ])];
                case 2:
                    _a = _b.sent(), expectedResult = _a[0], result = _a[1];
                    expect(result, 'response for sent message').to.deep.equal(expectedResult.payload);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send two messages one after the other', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst, resolvedMock, resolvedResult1, _a, expectedResult, result1, result2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockPromise = getMockReaderPromise([
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
                    ], [
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
                    ]);
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _b.sent();
                    resolvedMock = false;
                    resolvedResult1 = false;
                    return [4 /*yield*/, Promise.all([
                            mockPromise.then(function (value) {
                                resolvedMock = true;
                                // tslint:disable-next-line:no-unused-expression
                                expect(resolvedResult1, 'result 1 resolved status').to.be.true;
                                return value;
                            }),
                            inst.sendUpdateBegin().then(function (value) {
                                resolvedResult1 = true;
                                // tslint:disable-next-line:no-unused-expression
                                expect(resolvedMock, 'mock resolve status').to.be.false;
                                return value;
                            }),
                            inst.sendUpdateApply({}, []).then(function (value) {
                                // tslint:disable-next-line:no-unused-expression
                                expect(resolvedMock, 'mock resolve status').to.be.true;
                                // tslint:disable-next-line:no-unused-expression
                                expect(resolvedResult1, 'result 1 resolved status').to.be.true;
                                return value;
                            }),
                        ])];
                case 2:
                    _a = _b.sent(), expectedResult = _a[0], result1 = _a[1], result2 = _a[2];
                    expect(result1, 'response for message 1').to.deep.equal(expectedResult[0].payload);
                    expect(result2, 'response for message 2').to.deep.equal(expectedResult[1].payload);
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should send the response as soon as connected', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst, connected, resolvedMock, promises, _a, expectedResult, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockPromise = getMockReaderPromise({
                        type: 'updateBegin',
                        msgId: '0',
                        payload: {},
                    }, {
                        type: 'result',
                        msgId: '0',
                        payload: {
                            success: true,
                        },
                    });
                    inst = newController(1337);
                    connected = false;
                    resolvedMock = false;
                    promises = Promise.all([
                        mockPromise.then(function (value) {
                            // tslint:disable-next-line:no-unused-expression
                            expect(connected, 'connection status').to.be.true;
                            // tslint:disable-next-line:no-unused-expression
                            expect(inst.connected, 'instance connection status').to.be.true;
                            resolvedMock = true;
                            return value;
                        }),
                        inst.sendUpdateBegin().then(function (value) {
                            // tslint:disable-next-line:no-unused-expression
                            expect(resolvedMock, 'mock resolve status').to.be.true;
                            return value;
                        }),
                    ]);
                    // This is just to make sure that the promises and send operation goes through before connecting
                    return [4 /*yield*/, sleep(1)];
                case 1:
                    // This is just to make sure that the promises and send operation goes through before connecting
                    _b.sent();
                    return [4 /*yield*/, inst.connect()];
                case 2:
                    _b.sent();
                    connected = true;
                    return [4 /*yield*/, promises];
                case 3:
                    _a = _b.sent(), expectedResult = _a[0], result = _a[1];
                    expect(result, 'response for sent message').to.deep.equal(expectedResult.payload);
                    return [4 /*yield*/, inst.dispose()];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should fail sending a message if not connected past the delay', function () { return __awaiter(_this, void 0, void 0, function () {
        var inst, race, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inst = newController(1337);
                    race = Promise.race([
                        inst.sendUpdateBegin(1000).then(function (value) {
                            throw new Error('Sending message somehow worked');
                        }, function (err) { return err; }),
                        sleep(2000).then(function () {
                            throw new Error('Did not timeout in time');
                        }),
                    ]);
                    return [4 /*yield*/, expect(race, 'send operation with timeout').to.eventually.be.an('Error')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, race];
                case 2:
                    result = _a.sent();
                    expect(result.message, 'result error message').to.equal('Message was not handled in time');
                    return [4 /*yield*/, inst.dispose()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should not fail sending a message if not limited by a timeout', function () { return __awaiter(_this, void 0, void 0, function () {
        var inst, race;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    inst = newController(1337);
                    race = Promise.race([
                        inst.sendUpdateBegin().then(function () {
                            throw new Error('send should not have finished');
                        }, function () {
                            throw new Error('send should not have finished');
                        }),
                        sleep(2000).then(function () { return 'success'; }),
                    ]);
                    return [4 /*yield*/, expect(race, 'send operation without timeout').to.eventually.equal('success')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, inst.dispose()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should fail receiving an invalid json', function () { return __awaiter(_this, void 0, void 0, function () {
        var mockPromise, inst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPromise = new Promise(function (resolve, reject) {
                        mockRunner(function (socket) {
                            socket.write('this is not a valid json', function (err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve();
                                return;
                            });
                        });
                        setTimeout(function () { return reject(new Error('Did not receive any data in time')); }, 2000);
                    });
                    inst = newController(1337);
                    return [4 /*yield*/, inst.connect()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, mockPromise];
                case 2:
                    _a.sent();
                    // Have to sleep for a bit to give the instance a chance to receive the bad message and dispose itself.
                    return [4 /*yield*/, sleep(50)];
                case 3:
                    // Have to sleep for a bit to give the instance a chance to receive the bad message and dispose itself.
                    _a.sent();
                    expect(inst.connected, 'runner connection status').to.equal(false);
                    return [4 /*yield*/, inst.dispose()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
