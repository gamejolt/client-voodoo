import * as data from './data';
import { PatchInstance, State as PatcherState } from './patcher';

interface IQueueState
{
	queued: boolean;
	timeLeft: number;
	managed: boolean;

	events: {
		progress?: ( progress: data.MsgProgress ) => void;
		state?: ( state: PatcherState ) => void;
		paused?: () => void;
		resumed?: () => void;
		canceled?: () => void;
		done?: ( errMessage?: string ) => void;
		fatal?: ( err: Error ) => void;
	};
}

export interface IQueueProfile
{
	downloads: number;
	extractions: number;
}

export abstract class Queue
{
	private static _isFast = true;
	private static _fastProfile: IQueueProfile = {
		downloads: 3,
		extractions: 3,
	};

	private static _slowProfile: IQueueProfile = {
		downloads: 0,
		extractions: 0,
	};

	private static _maxDownloads: number = Queue._fastProfile.downloads;
	private static _maxExtractions: number = Queue._fastProfile.extractions;

	private static _settingDownloads = false;
	private static _settingExtractions = false;

	private static _patches: Map<PatchInstance, IQueueState> = new Map<PatchInstance, IQueueState>();

	private static log( message: string, patch?: PatchInstance )
	{
		const state = patch ? this._patches.get( patch ) : null;
		if ( state ) {
			console.log( `Queue: ${message} (${JSON.stringify( {
				queued: state.queued,
				timeLeft: state.timeLeft,
				managed: state.managed,
			} )} )` );
		}
		else {
			console.log( `Queue: ${message}` );
		}
	}

	// static reset( cancel?: boolean )
	// {
	// 	this.log( `Restting ${this._patches.size} patches` );
	// 	const patchesToReset: PatchInstance[] = [];

	// 	const values: PatchInstance[] = [];
	// 	this._patches.forEach( ( key, patch ) => values.push( patch ) );
	// 	for ( let patch of values ) {
	// 		this.unmanage( patch, true );
	// 		patchesToReset.push( patch );
	// 	}

	// 	this._maxDownloads = this._fastProfile.downloads;
	// 	this._maxExtractions = this._fastProfile.extractions;

	// 	this._settingDownloads = false;
	// 	this._settingExtractions = false;

	// 	this._patches.clear();

	// 	return Promise.all( patchesToReset.map( ( patch ) => cancel ? patch.cancel() : patch.pause() ) );
	// }

	static fetch( running: boolean, isDownloading?: boolean )
	{
		// tslint:disable-next-line:max-line-length
		this.log( `Fetching ${running ? 'running' : 'pending'} ${isDownloading ? 'downloading' : ( isDownloading === false ? 'patching' : 'all' )} tasks` );

		const patches: {patch: PatchInstance, state: IQueueState, sort: number}[] = [];
		this._patches.forEach( ( patchState, patch ) =>
		{
			if ( running !== patchState.queued &&
				( typeof isDownloading !== 'boolean' ||
				isDownloading === patch.isDownloading() ) ) {

				patches.push( {
					patch: patch,
					state: patchState,
					sort: ( patchState.timeLeft || patchState.timeLeft === 0 ) ? patchState.timeLeft : Infinity,
				} );
			}
		} );

		return patches
			.sort( ( patch1, patch2 ) => patch1.sort - patch2.sort )
			.map( ( value ) =>
			{
				return {
					patch: value.patch,
					state: value.state,
				};
			} );
	}

	private static applyProfile( profile: IQueueProfile )
	{
		this._maxDownloads = profile.downloads;
		this._maxExtractions = profile.extractions;
		this.tick();
	}

	static get faster(): IQueueProfile
	{
		return Object.assign( {}, this._fastProfile );
	}

	static set faster( profile: IQueueProfile )
	{
		this._fastProfile = Object.assign( {}, profile );
		if ( this._isFast ) {
			this.applyProfile( this._fastProfile );
		}
	}

	static setFaster()
	{
		this.log( 'Applying faster profile' );
		this._isFast = true;
		this.applyProfile( this._fastProfile );
	}

	static get slower(): IQueueProfile
	{
		return Object.assign( {}, this._slowProfile );
	}

	static set slower( profile: IQueueProfile )
	{
		this._slowProfile = Object.assign( {}, profile );
		if ( !this._isFast ) {
			this.applyProfile( this._slowProfile );
		}
	}

	static setSlower()
	{
		this.log( 'Applying slower profile' );
		this._isFast = false;
		this.applyProfile( this._slowProfile );
	}

	private static onProgress( patch: PatchInstance, state: IQueueState, progress: data.MsgProgress )
	{
		if ( !state.managed ) {
			return;
		}

		state.timeLeft = ( progress.total - progress.current ) / progress.sample.movingAverage;
	}

	private static async onState( patch: PatchInstance, state: IQueueState, patchState: PatcherState )
	{
		if ( !state.managed ) {
			return;
		}

		if ( patchState !== PatcherState.Patching ) {
			return;
		}

		this.log( 'Received patch unpacking', patch );

		let concurrentPatches = this.fetch( true, false );

		// Use > and not >= because also counting self
		if ( this._maxExtractions >= 0 && concurrentPatches.length > this._maxExtractions ) {
			await this.pausePatch( patch, state );
		}
		await this.tick( true );
	}

	private static onPaused( patch: PatchInstance, state: IQueueState, queue: boolean )
	{
		if ( !state.managed ) {
			return;
		}

		this.log( 'Received patch paused', patch );
		if ( queue ) {
			state.queued = true;
		}
		else {
			this.unmanage( patch );
		}
	}

	private static onResumed( patch: PatchInstance, state: IQueueState, queue: boolean )
	{
		if ( !state.managed ) {
			return;
		}
		this.log( 'Received patch resumed', patch );
		state.queued = false;
	}

	private static onCanceled( patch: PatchInstance, state: IQueueState )
	{
		if ( !state.managed ) {
			return;
		}

		this.log( 'Received patch cancel', patch );
		this.unmanage( patch );
	}

	private static onDone( patch: PatchInstance, state: IQueueState, errMessage?: string )
	{
		if ( !state.managed ) {
			return;
		}

		if ( errMessage ) {
			this.log( `Finished with error: ${errMessage}`, patch );
		}
		else {
			this.log( 'Finished', patch );
		}
		this.unmanage( patch );
	}

	private static onFatalError( patch: PatchInstance, state: IQueueState, err: Error )
	{
		if ( !state.managed ) {
			return;
		}

		this.log( `Finished with fatal error: ${err.message}`, patch );
		this.unmanage( patch );
	}

	static canResume( patch: PatchInstance )
	{
		let isDownloading = patch.isDownloading();
		let operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
		let concurrentPatches = this.fetch( true, isDownloading );

		this.log( `Checking if patch can resume a ${isDownloading ? 'download' : 'patch'} operation` );
		// tslint:disable-next-line:max-line-length
		this.log( `Queue manager is currently handling: ${concurrentPatches.length} concurrent operations and can handle: ${operationLimit === -1 ? 'Infinite' : operationLimit} operations` );

		return operationLimit < 0 || operationLimit > concurrentPatches.length;
	}

	static async manage( patch: PatchInstance )
	{
		if ( this._patches.has( patch ) ) {
			this.log( 'Already managing this patch' );
			return this._patches.get( patch );
		}

		this.log( 'Managing patch handle' );
		if ( patch.isFinished() ) {
			this.log( 'Refusing to manage a finished patch' );
			return null;
		}

		let queued = !this.canResume( patch );
		let state: IQueueState = {
			queued: queued,
			timeLeft: Infinity,
			managed: true,
			events: {},
		};
		state.events.progress = this.onProgress.bind( this, patch, state );
		state.events.state = this.onState.bind( this, patch, state );
		state.events.paused = this.onPaused.bind( this, patch, state );
		state.events.resumed = this.onResumed.bind( this, patch, state );
		state.events.canceled = this.onCanceled.bind( this, patch, state );
		state.events.done = this.onDone.bind( this, patch, state );
		state.events.fatal = this.onFatalError.bind( this, patch, state );

		this._patches.set( patch, state );

		patch
			.on( 'progress', state.events.progress )
			.on( 'state', state.events.state )
			.on( 'paused', state.events.paused )
			.on( 'resumed', state.events.resumed )
			.on( 'canceled', state.events.canceled )
			.on( 'done', state.events.done )
			.on( 'fatal', state.events.fatal );

		if ( state.queued ) {
			await this.pausePatch( patch, state );
		}

		return state;
	}

	static unmanage( patch: PatchInstance, noTick?: boolean )
	{
		this.log( 'Unmanaging', patch );
		let state = this._patches.get( patch );
		if ( !state ) {
			return;
		}

		patch
			.removeListener( 'progress', state.events.progress )
			.removeListener( 'state', state.events.state )
			.removeListener( 'paused', state.events.paused )
			.removeListener( 'resumed', state.events.resumed )
			.removeListener( 'canceled', state.events.canceled )
			.removeListener( 'done', state.events.done )
			.removeListener( 'fatal', state.events.fatal )

		state.managed = false;
		this._patches.delete( patch );

		if ( !noTick ) {
			this.tick();
		}
	}

	private static async resumePatch( patch: PatchInstance, state: IQueueState )
	{
		this.log( 'Resuming patch', patch );
		let result: boolean;
		try {
			patch.resume( true );
		}
		catch ( err ) {
			result = false;
		}
		return result;
	}

	private static pausePatch( patch: PatchInstance, state: IQueueState )
	{
		this.log( 'Pausing patch', patch );
		let result: boolean;
		try {
			patch.pause( true );
		}
		catch ( err ) {
			result = false;
		}
		return result;
	}

	static tick( downloads?: boolean )
	{
		if ( typeof downloads !== 'boolean' ) {
			this.tick( false );
			this.tick( true );
			return;
		}

		let running = this.fetch( true, downloads );
		let pending = this.fetch( false, downloads );
		this.log( 'Ticking ' + ( downloads ? 'downloads' : 'extractions' ) + '. Running: ' + running.length + ', Pending: ' + pending.length );

		let limit = downloads ? this._maxDownloads : this._maxExtractions;
		let patchesToResume = limit - running.length;
		if ( limit < 0 || patchesToResume > 0 ) {
			patchesToResume = limit < 0 ? pending.length : Math.min( patchesToResume, pending.length );
			this.log( 'Resuming ' + patchesToResume + ' patches' );
			for ( let i = 0; i < patchesToResume; i += 1 ) {
				this.resumePatch( pending[i].patch, pending[i].state );
			}
		}
		else if ( patchesToResume < 0 ) {
			let patchesToPause = -patchesToResume;
			this.log( 'Pausing ' + patchesToPause + ' patches' );
			for ( let i = 0; i < patchesToPause; i += 1 ) {
				this.pausePatch( running[i].patch, running[i].state );
			}
		}
	}

	static get maxDownloads()
	{
		return this._maxDownloads;
	}

	static get maxExtractions()
	{
		return this._maxExtractions;
	}

	static async setMaxDownloads( newMaxDownloads: number )
	{
		this.log( 'Setting max downloads to ' + newMaxDownloads );
		if ( this._settingDownloads ) {
			this.log( 'Can\'t set max downloads now because theres a setting in progress' );
			return false;
		}
		this._settingDownloads = true;

		try {
			this._maxDownloads = newMaxDownloads;

			// Wait for next tick in case states change inside a patcher's onPause/onResume.
			// Example: when a patcher is pended by the queue manager it calls the patch handle's onPause event (as part of stopping it)
			// If in that event handler the max download count increases the task will not resume because the queue manager has yet
			// to tag it as pending because it's waiting for it to stop completely, which only happens after onPause is called
			await new Promise( ( resolve ) => process.nextTick( resolve ) );
			this.tick( true );
		}
		catch ( err ) {
			return false;
		}
		finally {
			this._settingDownloads = false;
		}

		return true;
	}

	static async setMaxExtractions( newMaxExtractions: number )
	{
		this.log( 'Setting max extraccions to ' + newMaxExtractions );
		if ( this._settingExtractions ) {
			this.log( 'Can\'t set max extractions now because theres a setting in progress' );
			return false;
		}
		this._settingExtractions = true;

		try {
			this._maxExtractions = newMaxExtractions;
			await new Promise( ( resolve ) => process.nextTick( resolve ) );
			this.tick( false );
		}
		catch ( err ) {
			return false;
		}
		finally {
			this._settingExtractions = false;
		}

		return true;
	}
}
