import * as cp from 'child_process';
import * as path from 'path';
import * as net from 'net';
import * as stream from 'stream';
import { EventEmitter } from 'events';
import * as data from './data';
import { TSEventEmitter } from './events';
import * as fs from 'fs';

type onStreamCallback = ( stream: net.Socket ) => void;
type reconnectModuleBuilder = ( opts: any, onStream: onStreamCallback ) => EventEmitter;
const reconnect: reconnectModuleBuilder = require( 'reconnect-core' )( ( ...args: any[] ) => net.connect.apply( null, args ) );

const JSONStream = require( 'JSONStream' );
const ps = require( 'ps-node' );

export function getExecutable()
{
	let binFolder = path.resolve( __dirname, '..', 'bin' );
	switch ( process.platform ) {
		case 'win32':
			return path.join( binFolder, 'joltron_win32.exe' );
		case 'linux':
			return path.join( binFolder, 'joltron_linux' );
		case 'darwin':
			return path.join( binFolder, 'joltron_osx' );
		default:
			throw new Error( 'Unsupported OS' );
	}
}

class SentMessage
{
	readonly msg: string;
	readonly msgId: string;
	private _resolved: boolean;
	private resolver: Function;
	private rejector: Function;
	readonly promise: Promise<any>;

	constructor( msg: any, timeout?: number )
	{
		this.msg = JSON.stringify( msg );
		this.msgId = msg.msgId;
		this._resolved = false;
		this.promise = new Promise<any>( ( resolve, reject ) =>
		{
			this.resolver = resolve;
			this.rejector = reject;
			if ( timeout && timeout !== Infinity ) {
				setTimeout( () =>
				{
					this._resolved = true;
					reject( new Error( 'Message was not handled in time' ) );
				}, timeout );
			}
		} );
	}

	get resolved()
	{
		return this._resolved;
	}

	resolve( data: any )
	{
		this._resolved = true;
		this.resolver( data );
	}

	reject( reason: any )
	{
		this._resolved = true;
		this.rejector( reason );
	}
}

type Events =
{
	'error': ( err: Error ) => void;
	// called when a launch operation begins
	'gameLaunchBegin': ( dir: string, ...args: string[] ) => void;
	// called when the launch operation ends completely
	'gameLaunchFinished': () => void;
	// called when the game fails to launch
	'gameLaunchFailed': ( reason: string ) => void;
	// called when the game quit due to crash
	'gameCrashed': ( reason: string ) => void;
	// called when the game quit normally
	'gameClosed': () => void;
	// called when the runner attempts to kill a game. It'll most likely follow a gameCrashed event
	'gameKilled': () => void;
	// called when a game is attempted to be launched again (right after a game is updated while its running)
	'gameRelaunchBegin': ( dir: string, ...args: string[] ) => void;
	// same as gameLaunchFailed only for relaunch
	'gameRelaunchFailed': ( reason: string ) => void;
	// called when a new update is available to begin
	'updateAvailable': ( metadata: data.UpdateMetadata ) => void;
	// called when an update begins (either an install or update during run)
	'updateBegin': ( dir: string, metadata: data.UpdateMetadata ) => void;
	// called when an update finished successfully
	'updateFinished': () => void;
	// called when an update is ready to be applied (finished downloading and is waiting for extract)
	'updateReady': () => void;
	// called when an update is applying (used to wait for game to quit or force kill it to resume updating)
	'updateApply': ( ...args: string[] ) => void;
	// called when an update fails for whatever reason
	'updateFailed': ( reason: string ) => void;
	// called when an update is paused
	'updatePaused': () => void;
	// called when an update is resumed
	'updateResumed': () => void;
	// called when an update is canceled
	'updateCanceled': () => void;
	// called when an uninstall operation begins
	'uninstallBegin': ( dir: string ) => void;
	// called when an uninstall operation failed for whatever reason
	'uninstallFailed': ( reason: string ) => void;
	// called when an uninstall operation finished successfully
	'uninstallFinished': () => void;
	// called when the patcher state changes
	'patcherState': ( state: data.PatcherState ) => void;
};

export class Instance extends TSEventEmitter<Events>
{
	readonly port: number;
	private process: cp.ChildProcess | number; // process or pid
	private reconnector: any;
	private connectionLock: boolean;
	private conn: net.Socket;
	private nextMessageId: number;
	private sendQueue: SentMessage[];
	private sentMessage: SentMessage | null;
	private consumingQueue: boolean;

	constructor( port: number, process?: cp.ChildProcess | number )
	{
		super();
		this.port = port;
		if ( process ) {
			this.process = process;
		}
		this.nextMessageId = 0;
		this.sendQueue = [];
		this.sentMessage = null;
		this.consumingQueue = false;

		const incomingJson: stream.Duplex = JSONStream.parse();
		incomingJson
			.on( 'data', ( data ) =>
			{
				console.log( 'Received json: ' + JSON.stringify( data ) );

				if ( data.msgId && this.sentMessage && data.msgId == this.sentMessage.msgId ) {
					const payload = data.payload;
					if ( !payload ) {
						return this.sentMessage.reject( new Error( 'Missing `payload` field in response' + ' in ' + JSON.stringify( data ) ) );
					}

					const type = data.type;
					if ( !type ) {
						return this.sentMessage.reject( new Error( 'Missing `type` field in response' + ' in ' + JSON.stringify( data ) ) );
					}

					switch ( type ) {
						case 'state':
							return this.sentMessage.resolve( payload );
						case 'result':
							if ( payload.success ) {
								return this.sentMessage.resolve( data );
							}
							return this.sentMessage.resolve( payload.err );
						default:
							return this.sentMessage.reject( new Error( 'Unexpected `type` value: ' + type + ' in ' + JSON.stringify( data ) ) );
					}
				}

				const type = data.type;
				if ( !type ) {
					return this.emit( 'error', new Error( 'Missing `type` field in response' + ' in ' + JSON.stringify( data ) ) );
				}

				let payload = data.payload;
				if ( !payload ) {
					return this.emit( 'error', new Error( 'Missing `payload` field in response' + ' in ' + JSON.stringify( data ) ) );
				}

				switch ( type ) {
					case 'update':
						const message = payload.message;
						payload = payload.payload; // lol
						switch ( message ) {
							case 'gameLaunchBegin':
								return this.emit( message, payload.dir, ...payload.args );
							case 'gameLaunchFinished':
								return this.emit( message );
							case 'gameLaunchFailed':
								return this.emit( message, payload );
							case 'gameCrashed':
								return this.emit( message, payload );
							case 'gameClosed':
								return this.emit( message );
							case 'gameKilled':
								return this.emit( message );
							case 'gameRelaunchBegin':
								return this.emit( message, payload.dir, ...payload.args );
							case 'gameRelaunchFailed':
								return this.emit( message, payload );
							case 'updateAvailable':
								return this.emit( message, payload );
							case 'updateBegin':
								return this.emit( message, payload.dir, payload.metadata );
							case 'updateFinished':
								return this.emit( message );
							case 'updateReady':
								return this.emit( message );
							case 'updateApply':
								return this.emit( message, ...payload.args );
							case 'updateFailed':
								return this.emit( message, payload );
							case 'updatePaused':
								return this.emit( message );
							case 'updateResumed':
								return this.emit( message );
							case 'updateCanceled':
								return this.emit( message );
							case 'uninstallBegin':
								return this.emit( message, payload );
							case 'uninstallFailed':
								return this.emit( message, payload );
							case 'uninstallFinished':
								return this.emit( message );
							case 'patcherState':
								return this.emit( message, payload );
							default:
								return this.emit( 'error', new Error( 'Unexpected update `message` value: ' + message + ' in ' + JSON.stringify( data ) ) );
						}
					case 'progress':
						break;
					default:
						return this.emit( 'error', new Error( 'Unexpected `type` value: ' + type + ' in ' + JSON.stringify( data ) ) );
				}
			} )
			.on( 'error', ( err ) =>
			{
				this.emit( 'error', err );
				this.dispose();
			} );

		this.reconnector = reconnect( {
			initialDelay: 100,
			maxDelay: 1000,
			strategy: 'fibonacci',
			failAfter: 7,
			randomisationFactor: 0,
			immediate: false,
		}, ( conn: net.Socket ) =>
		{
			this.conn = conn;
			this.conn.setKeepAlive( true, 1000 );
			this.conn.setEncoding( 'utf8' );
			this.conn.setTimeout( 10000 );
			this.conn.pipe( incomingJson );

			this.consumeSendQueue();
		} );
		this.connectionLock = false;

		this.reconnector
			.on( 'connect', ( conn ) =>
			{
				// Once connected, don't attempt to reconnect on disconnection.
				// We only want to use reconnect core for the initial connection attempts.
				this.reconnector.reconnect = false;

				// console.log( 'Connected to runner' );
			} )
			.on( 'disconnect', ( err: Error ) =>
			{
				this.conn = null;
				if ( this.sentMessage ) {
					this.sentMessage.reject( new Error( 'Disconnected before receiving message response' ) );
				}

				console.log( 'Disconnected from runner' + ( this.reconnector.reconnect ? ', reconnecting...' : '' ) );
				if ( err ) {
					console.log( 'Received error: ' + err.message );
				}
			} )
			.on( 'error', ( err: Error ) =>
			{
				this.conn = null;
				if ( this.sentMessage ) {
					this.sentMessage.reject( new Error( 'Connection got an error before receiving message response: ' + err.message ) );
				}
				console.log( 'Received error: ' + err.message );
			} );
	}

	static async launchNew( args: string[], options?: cp.SpawnOptions )
	{
		let runnerExecutable = getExecutable();

		// Ensure that the runner is executable.
		fs.chmodSync( runnerExecutable, '0755' );

		const portArg = args.indexOf( '--port' );
		if ( portArg == -1 ) {
			throw new Error( 'Can\'t launch a new instance without specifying a port number' );
		}
		const port = parseInt( args[ portArg + 1 ] );

		console.log( 'Spawning ' + runnerExecutable + ' "' + args.join( '" "' ) + '"' );
		const runnerInstance = new Instance( port, cp.spawn( runnerExecutable, args, options ) );
		try {
			await runnerInstance.connect();
			return runnerInstance;
		}
		catch ( err ) {
			await runnerInstance.kill();
			throw err;
		}
	}

	get connected()
	{
		return this.reconnector.connected;
	}

	connect()
	{
		return new Promise( ( resolve, reject ) =>
		{
			if ( this.connectionLock ) {
				reject( new Error( 'Can\'t connect while connection is transitioning' ) );
				return;
			}

			if ( this.reconnector.connected ) {
				resolve();
				return;
			}

			this.connectionLock = true;

			// Make functions that can be safely removed from event listeners.
			// Once one of them is called, it'll remove the other before resolving or rejecting the promise.
			const _reconnector: EventEmitter = this.reconnector;
			const __this = this;
			function onConnected()
			{
				_reconnector.removeListener( 'fail', onFail );

				__this.connectionLock = false;
				resolve();
			}

			function onFail( err: Error )
			{
				_reconnector.removeListener( 'connect', onConnected );

				__this.connectionLock = false;
				reject( err );
			}

			this.reconnector
				.once( 'connect', onConnected )
				.once( 'fail', onFail )
				.connect( this.port );

			// // Only do the actual connection if not already connecting.
			// // Otherwise simply wait on event that should be emitter from a previous in connection that is in progress.
			// if ( !this.reconnector._connection || !this.reconnector._connection.connecting ) {
			// 	this.reconnector.connect( this.port );
			// }
		} );
	}

	disconnect()
	{
		return new Promise( ( resolve, reject ) =>
		{
			if ( this.connectionLock ) {
				reject( new Error( 'Can\'t disconnect while connection is transitioning' ) );
				return;
			}

			if ( !this.reconnector.connected ) {
				resolve();
				return;
			}

			this.connectionLock = true;

			// Make functions that can be safely removed from event listeners.
			// Once one of them is called, it'll remove the other before resolving or rejecting the promise.
			const _reconnector: EventEmitter = this.reconnector;
			const __this = this;
			function onDisconnected()
			{
				_reconnector.removeListener( 'error', onError );

				__this.connectionLock = false;
				resolve();
			}

			function onError( err: Error )
			{
				_reconnector.removeListener( 'disconnect', onDisconnected );

				__this.connectionLock = false;
				reject( err );
			}

			this.reconnector
				.once( 'disconnect', onDisconnected )
				.once( 'error', onError )
				.disconnect();
		} );
	}

	async dispose()
	{
		await this.disconnect();
		this.reconnector.removeAllListeners();
	}

	private async consumeSendQueue()
	{
		if ( this.consumingQueue ) {
			return;
		}

		this.consumingQueue = true;

		while ( this.sendQueue.length != 0 ) {
			this.sentMessage = this.sendQueue.shift();
			if ( this.sentMessage.resolved ) {
				this.sentMessage = null;
				continue;
			}

			if ( !this.connected || this.connectionLock ) {
				this.sentMessage.reject( new Error( 'Not connected' ) );
				this.sentMessage = null;
				continue;
			}

			await new Promise<void>( ( resolve, reject ) =>
			{
				this.conn.write( this.sentMessage.msg, ( err?: Error ) =>
				{
					if ( err ) {
						return reject( err );
					}

					resolve();
				} );
			} ).catch( ( err ) => this.sentMessage.reject( err ) );

			try {
				await this.sentMessage.promise;
			}
			catch ( err ) {}
			this.sentMessage = null;
		}

		this.consumingQueue = false;
	}

	private send<T>( type: string, data: Object, timeout?: number ): Promise<T>
	{
		const msg = new SentMessage( {
			type: type,
			msgId: ( this.nextMessageId++ ).toString(),
			payload: data,
		}, timeout );

		this.sendQueue.push( msg );

		if ( this.connected ) {
			this.consumeSendQueue();
		}

		return msg.promise;
	}

	private sendControl( command: string, timeout?: number )
	{
		return this.send<data.MsgResultResponse>( 'control', { command }, timeout );
	}

	sendKillGame( timeout?: number )
	{
		return this.sendControl( 'kill', timeout );
	}

	sendPause( timeout?: number )
	{
		return this.sendControl( 'pause', timeout );
	}

	sendResume( timeout?: number )
	{
		return this.sendControl( 'resume', timeout );
	}

	sendCancel( timeout?: number )
	{
		return this.sendControl( 'cancel', timeout );
	}

	sendGetState( includePatchInfo: boolean, timeout?: number )
	{
		return this.send<data.MsgStateResponse>( 'state', { includePatchInfo }, timeout );
	}

	sendCheckForUpdates( gameUID: string, platformURL: string, authToken?: string, metadata?: string, timeout?: number )
	{
		let data: any = { gameUID, platformURL };
		if ( authToken ) {
			data.authToken = authToken;
		}
		if ( metadata ) {
			data.metadata = metadata;
		}
		return this.send( 'checkForUpdates', data, timeout );
	}

	// TODO: use types
	sendUpdateAvailable( updateMetadata: any, timeout?: number )
	{
		return this.send( 'updateAvailable', updateMetadata, timeout );
	}

	sendUpdateBegin( timeout?: number )
	{
		return this.send( 'updateBegin', {}, timeout );
	}

	sendUpdateApply( env: Object, args: string[], timeout?: number )
	{
		return this.send( 'updateApply', { env, args }, timeout );
	}

	kill()
	{
		if ( this.process ) {
			return new Promise( ( resolve, reject ) =>
			{
				if ( typeof this.process == 'number' ) {
					ps.kill( this.process.toString(), ( err ) =>
					{
						if ( err ) {
							reject( err );
						}
						resolve();
					} );
				}
				else {
					this.process
						.once( 'close', resolve )
						.once( 'error', reject );

					this.process.kill();
				}
			} );
		}
		return Promise.resolve();
	}
}
