import * as util from 'util';
import * as os from 'os';
import * as _ from 'lodash';
import * as fs from 'fs';
import Common from './index';

const LOG_LINES = 300;
const CONSOLE_LOG = console.log;
const CONSOLE_ERR = console.error;

export interface IClientLog
{
	logLines: string[];
	osInfo: IClientOSInfo;
}

export interface IClientOSInfo
{
	os: string;
	arch: string;
	release: string;
	uptime: number;
	freeMemory: number;
	totalMemory: number;
	cpuCount: number;
}

export abstract class Logger
{
	private static _logLines:string[] = [];
	private static _hijacked = false;
	private static _file: fs.WriteStream;
	private static _filePath: string;
	private static _flushInterval: NodeJS.Timer;

	private static async _flushFile()
	{
		try {
			if ( this._file ) {
				this._file.close();
			}
			this._file = null;
			await Common.fsUnlink( this._filePath );
			let str = this._logLines.join( '\n' ) + '\n';
			await Common.fsWriteFile( this._filePath, str );
			CONSOLE_LOG.apply( console, [ 'Flushing log file of length ' + this._logLines.join( '\n' ).length + ' with ' + this._logLines.length + ' rows' ] );
			this._file = fs.createWriteStream( this._filePath, {
				flags: 'a',
				encoding: 'utf8',
			} );
		}
		catch ( err ) {
			CONSOLE_LOG.apply( console, [ 'Babel sucks: ' + err.message + '\n' + err.stack ] );
		}
	}

	private static _log( ...args: any[] )
	{
		CONSOLE_LOG.apply( console, args );
		let str = util.format.apply( console, args ).split( '\n' );
		for ( let strVal of str ) {
			this._logLines.push( strVal );
		}
		if ( this._file ) {
			this._file.write( str + '\n' );
		}
		if ( this._logLines.length > LOG_LINES ) {
			this._logLines = _.clone( this._logLines.slice( this._logLines.length - LOG_LINES ) );
		}
	}

	private static _logErr( ...args: any[] )
	{
		CONSOLE_ERR.apply( console, args );
		let str = util.format.apply( console, args ).split( '\n' );
		for ( let strVal of str ) {
			this._logLines.push( strVal );
		}
		if ( this._file ) {
			this._file.write( str + '\n' );
		}
		if ( this._logLines.length > LOG_LINES ) {
			this._logLines = this._logLines.slice( this._logLines.length - LOG_LINES );
		}
	}

	static async hijack( file?: string)
	{
		if ( this._hijacked ) {
			return;
		}

		this._filePath = file || 'client.log';
		if ( await Common.fsExists( this._filePath ) ) {
			try {
				let readLines = await Common.fsReadFile( this._filePath, 'utf8' );
				console.log( typeof readLines );
				this._logLines = readLines.split( '\n' );
				if ( this._logLines.length > LOG_LINES ) {
					this._logLines = this._logLines.slice( this._logLines.length - LOG_LINES );
				}
			}
			catch ( err ) {
				console.log( 'Seroiusly babel gtfo: ' + err.message + '\n' + err.stack );
			}
		}
		this._file = fs.createWriteStream( this._filePath, {
			flags: 'a',
			encoding: 'utf8',
		} );
		let flushFunc: ( ...args:any[] ) => void = this._flushFile.bind( this );
		this._flushInterval = setInterval( flushFunc, 10000 );

		console.log = this._log.bind( this );
		console.info = this._log.bind( this );
		console.warn = this._logErr.bind( this );
		console.error = this._logErr.bind( this );

		this._hijacked = true;
	}

	static async unhijack()
	{
		if ( !this._hijacked ) {
			return;
		}

		clearInterval( this._flushInterval );
		if ( this._file ) {
			this._file.close();
		}
		await Common.fsWriteFile( this._filePath, this._logLines.join( '\n' ) );

		console.log = CONSOLE_LOG;
		console.info = CONSOLE_LOG;
		console.warn = CONSOLE_ERR;
		console.error = CONSOLE_ERR;

		this._hijacked = false;
	}

	static getClientLog(): IClientLog
	{
		return {
			logLines: _.clone( this._logLines ),
			osInfo: {
				os: os.platform(),
				arch: os.arch(),
				release: os.release(),
				uptime: os.uptime(),
				freeMemory: os.freemem(),
				totalMemory: os.totalmem(),
				cpuCount: os.cpus().length,
			},
		};
	}
}