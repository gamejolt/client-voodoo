import { EventEmitter } from 'events';
import * as through2 from 'through2';

export interface ISampleData
{
	current: number;
	currentAverage: number;
	peak: number;
	low: number;
	average: number;

	unit: SampleUnit;
	sampleCount: number;
}

export interface ISampleOptions
{
	samplesPerSecond?: number;
	samplesForAverage?: number;
}

export enum SampleUnit
{
	Bps  = 0,
	KBps = 1,
	MBps = 2, // Anything south of here is silly.
	GBps = 3, // Why do I have it if it's so silly you ask?
	TBps = 4, // Well...
	PBps = 5, // You see...
	EBps = 6, // I have a reason.
	ZBps = 7, // It's just that...
	YBps = 8, // I like writing useless code.
}

export class StreamSpeed
{
	private _stream: NodeJS.ReadWriteStream;
	private samplesPerSecond: number;
	private samplesForAverage: number;
	private samplesTaken: number;
	private samples: number[];

	private interval: NodeJS.Timer;
	private current: number;
	private currentAverage: number;
	private peak: number;
	private low: number;
	private average: number;

	private emitter: EventEmitter;

	constructor( options?: ISampleOptions )
	{
		this._stream = through2( ( chunk, enc, cb ) =>
		{
			this.current += chunk.length;
			cb( null, chunk );
		} );
		this._stream.on( 'end', () => this.stop() );
		this._stream.resume();
		this.emitter = new EventEmitter();

		this.start( options );
	}

	get stream()
	{
		return this._stream;
	}

	takeSample( unit: SampleUnit, precision?: number ): ISampleData
	{
		let sample = this._takeSample( true );
		return StreamSpeed.convertSample( sample, unit, precision );
	}

	static convertSample( sample: ISampleData, unit: SampleUnit, precision?: number ): ISampleData
	{
		let div = Math.pow( 1024, unit ) / Math.pow( 1024, sample.unit ); // Use sane units ok?
		precision = Math.pow( 10, precision || 2 );

		function getUnit( value ): number
		{
			return Math.round( value * precision / div ) / precision;
		}

		sample.current = getUnit( sample.current );
		sample.currentAverage = getUnit( sample.currentAverage );
		sample.peak = getUnit( sample.peak );
		sample.low = getUnit( sample.low );
		sample.average = getUnit( sample.average );
		sample.unit = unit;

		return sample;
	}

	private _takeSample( onDemand?: boolean ): ISampleData
	{
		this.samplesTaken += 1;

		this.current *= this.samplesPerSecond;
		this.average += ( this.current - this.average ) / this.samplesTaken;
		this.peak = Math.max( this.peak, this.current );
		this.low = Math.min( this.low === -1 ? this.current : this.low, this.current );

		this.samples.unshift( this.current );

		this.currentAverage = this.samples.reduce( ( accumulate, value ) =>
		{
			return accumulate + value;
		}, 0 );
		this.currentAverage /= Math.min( this.samples.length, this.samplesForAverage );

		let sampleData = StreamSpeed.convertSample( {
			current: this.current,
			currentAverage: this.currentAverage,
			peak: this.peak,
			low: this.low,
			average: this.average,

			unit: SampleUnit.Bps,
			sampleCount: this.samplesTaken,
		}, SampleUnit.Bps );

		if ( !onDemand ) {
			if ( this.samples.length > this.samplesForAverage ) {
				this.samples.pop();
			}

			this.emitSample( sampleData );
		}
		// If were doing an on demand we need to roll back some data so we wouldn't screw up the next sample
		else {
			this.samples = this.samples.slice( 1 );
			this.samplesTaken -= 1;
		}

		this.current = 0;
		return sampleData;
	}

	private emitSample( sample: ISampleData )
	{
		this.emitter.emit( 'sample', sample );
	}

	start( options?: ISampleOptions )
	{
		this.samples = [];
		this.samplesTaken = 0;
		this.current = 0;
		this.currentAverage = 0;
		this.peak = 0;
		this.low = -1;
		this.average = 0;

		options = options || {};
		this.samplesPerSecond = options.samplesPerSecond || 2;
		this.samplesForAverage = options.samplesForAverage || ( 5 * this.samplesPerSecond );
		this.interval = setInterval( () => this._takeSample(), 1000 / this.samplesPerSecond );
		this._stream.resume();
	}

	stop()
	{
		clearInterval( this.interval );
		this.current = 0;
		this._stream.pause();
	}

	onSample( cb: ( sample?: ISampleData ) => any )
	{
		this.emitter.on( 'sample', cb );
		return this;
	}
}

export default StreamSpeed;