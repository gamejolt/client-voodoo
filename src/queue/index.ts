import { PatchHandle } from '../patcher';
import { DownloadHandle, IDownloadProgress } from '../downloader';
import { SampleUnit } from '../downloader/stream-speed';
import { ExtractHandle, IExtractProgress } from '../extractor';
import * as _ from 'lodash';

interface IQueueState
{
	queued: boolean;
	timeLeft: number;
	managed: boolean;

	events: {
		onProgress?: ( progress: IDownloadProgress ) => any;
		onPatching?: Function;
		onExtractProgress?: ( progress: IExtractProgress ) => any;
		onPaused?: ( voodooQueue: boolean ) => any;
		onResumed?: ( voodooQueue: boolean ) => any;
		onCanceled?: Function;
	}
}

export interface IQueueProfile
{
	downloads: number;
	extractions: number;
}

export abstract class VoodooQueue
{
	private static _isFast: boolean = true;
	private static _fastProfile: IQueueProfile = {
		downloads: 3,
		extractions: 3,
	}

	private static _slowProfile: IQueueProfile = {
		downloads: 0,
		extractions: 0,
	}

	private static _maxDownloads: number = VoodooQueue._fastProfile.downloads;
	private static _maxExtractions: number = VoodooQueue._fastProfile.extractions;

	private static _settingDownloads: boolean = false;
	private static _settingExtractions: boolean = false;

	private static _patches: Map<PatchHandle, IQueueState> = new Map<PatchHandle, IQueueState>();

	private static log( message: string, patch?: PatchHandle )
	{
		let state = patch ? this._patches.get( patch ) : null;
		console.log( 'Voodoo Queue: ' + message + ( state ? ( ' ( ' + JSON.stringify( state ) + ' )' ) : '' ) );
	}

	static reset( cancel?: boolean)
	{
		this.log( 'Resetting' );
		let patchesToReset: PatchHandle[] = [];
		for ( let patch of this._patches.keys() ) {
			this.unmanage( patch );
			patchesToReset.push( patch );
		}
		this.log( 'Restting ' + patchesToReset.length + ' patches' );

		this._maxDownloads = this._fastProfile.downloads;
		this._maxExtractions = this._fastProfile.extractions;

		this._settingDownloads = false;
		this._settingExtractions = false;

		this._patches.clear();

		return Promise.all( patchesToReset.map( ( patch ) => cancel ? patch.cancel() : patch.stop() ) );
	}

	static fetch( running: boolean, isDownloading?: boolean )
	{
		this.log( 'Fetching ' + ( running ? 'running' : 'pending' ) + ' ' + ( isDownloading ? 'downloading' : ( isDownloading === false ? 'patching' : 'all' ) ) + ' tasks' );
		let patches = [];
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

		let sorted = _.sortBy( patches, 'sort' );
		let sortedPatches = sorted.map( ( value: { patch: PatchHandle, state: IQueueState } ) =>
		{
			return {
				patch: value.patch,
				state: value.state,
			};
		} );
		return sortedPatches;
	}

	private static applyProfile( profile: IQueueProfile )
	{
		this._maxDownloads = profile.downloads;
		this._maxExtractions = profile.extractions;
		this.tick();
	}

	static get faster(): IQueueProfile
	{
		return _.clone( this._fastProfile );
	}

	static set faster( profile: IQueueProfile )
	{
		this._fastProfile = _.clone( profile );
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
		return _.clone( this._slowProfile );
	}

	static set slower( profile: IQueueProfile )
	{
		this._slowProfile = _.clone( profile );
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

	private static onProgress( patch: PatchHandle, state: IQueueState, progress: IDownloadProgress )
	{
		state.timeLeft = progress.timeLeft;
		this.log( 'Updated download time left', patch );
	}

	private static onPatching( patch: PatchHandle, state: IQueueState, progress )
	{
		this.log( 'Received patch unpacking', patch );

		let concurrentPatches = this.fetch( true, false );

		// Use > and not >= because also counting self
		if ( concurrentPatches.length > this._maxExtractions ) {
			this.pausePatch( patch, state );
		}
		this.tick( true );
	}

	private static onExtractProgress( patch: PatchHandle, state: IQueueState, progress: IExtractProgress )
	{
		state.timeLeft = progress.timeLeft;
		this.log( 'Updated unpack time left', patch );
	}

	private static onPaused( patch: PatchHandle, state: IQueueState, voodooQueue: boolean )
	{
		this.log( 'Received patch paused', patch );
		if ( state ) {
			if ( voodooQueue ) {
				state.queued = true;
			}
			else {
				this.unmanage( patch );
			}
		}
	}

	private static onResumed( patch: PatchHandle, state: IQueueState, voodooQueue: boolean )
	{
		this.log( 'Received patch resumed', patch );
		if ( state ) {
			state.queued = false;
		}
	}

	private static onCanceled( patch: PatchHandle, state: IQueueState )
	{
		this.log( 'Received patch cancel', patch );
		this.unmanage( patch );
	}

	static canResume( patch: PatchHandle )
	{
		this.log( 'Checking if patch can resume' );
		let isDownloading = patch.isDownloading();
		let operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
		let concurrentPatches = this.fetch( true, isDownloading );
		this.log( 'Patch to manage is currently: ' + ( isDownloading ? 'Downloading' : 'Patching' ) );
		this.log( 'Queue manager is currently handling: ' + concurrentPatches.length + ' concurrent operations and can handle: ' + ( operationLimit === -1 ? 'Infinite' : operationLimit ) + ' operations' );

		return operationLimit < 0 || operationLimit > concurrentPatches.length;
	}

	static manage( patch: PatchHandle )
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
		state.events.onProgress = this.onProgress.bind( this, patch, state );
		state.events.onPatching = this.onPatching.bind( this, patch, state );
		state.events.onExtractProgress = this.onExtractProgress.bind( this, patch, state );
		state.events.onPaused = this.onPaused.bind( this, patch, state );
		state.events.onResumed = this.onResumed.bind( this, patch, state );
		state.events.onCanceled = this.onCanceled.bind( this, patch, state );

		this._patches.set( patch, state );

		patch
			.onProgress( SampleUnit.KBps, state.events.onProgress )
			.onPatching( state.events.onPatching )
			.onExtractProgress( SampleUnit.KBps, state.events.onExtractProgress )
			.onPaused( state.events.onPaused )
			.onResumed( state.events.onResumed )
			.onCanceled( state.events.onCanceled )
			.promise
				.then( () =>
				{
					if ( !state.managed ) {
						return;
					}

					this.log( 'Finished', patch );
					this.unmanage( patch );
				} )
				.catch( ( err ) =>
				{
					if ( !state.managed ) {
						return;
					}

					this.log( 'Finished with error: ' + err.message, patch );
					this.unmanage( patch );
				} );

		if ( state.queued ) {
			this.pausePatch( patch, state );
		}

		return state;
	}

	static unmanage( patch: PatchHandle )
	{
		this.log( 'Unmanaging', patch );
		let state = this._patches.get( patch );
		if ( !state ) {
			return;
		}

		patch
			.deregisterOnProgress( state.events.onProgress )
			.deregisterOnPatching( state.events.onPatching )
			.deregisterOnExtractProgress( state.events.onExtractProgress )
			.deregisterOnPaused( state.events.onPaused )
			.deregisterOnResumed( state.events.onResumed )
			.deregisterOnCanceled( state.events.onCanceled );

		state.managed = false;
		this._patches.delete( patch );

		this.tick();
	}

	private static resumePatch( patch: PatchHandle, state: IQueueState )
	{
		this.log( 'Resuming patch', patch );
		let result: boolean;
		try {
			patch.start( { voodooQueue: true } );
		}
		catch ( err ) {
			result = false;
		}
		return result;
	}

	private static pausePatch( patch: PatchHandle, state: IQueueState )
	{
		this.log( 'Pausing patch', patch );
		let result: boolean;
		try {
			patch.stop( { voodooQueue: true } );
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

		this.log( 'Ticking ' + ( downloads ? 'downloads' : 'extractions' ) );

		let running = this.fetch( true, downloads );
		let pending = this.fetch( false, downloads );
		this.log( 'Running: ' + running.length + ', Pending: ' + pending.length );

		let limit = downloads ? this._maxDownloads : this._maxExtractions;
		let patchesToResume = limit - running.length;
		if ( limit < 0 || patchesToResume > 0 ) {
			patchesToResume = limit < 0 ? pending.length : Math.min( patchesToResume, pending.length );
			this.log( 'Patches to resume: ' + patchesToResume );
			for ( let i = 0; i < patchesToResume; i += 1 ) {
				this.resumePatch( pending[i].patch, pending[i].state );
			}
		}
		else if ( patchesToResume < 0 ) {
			let patchesToPause = -patchesToResume;
			this.log( 'Patches to pause: ' + patchesToPause );
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
		finally {
			this._settingDownloads = false;
		}
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
		finally {
			this._settingExtractions = false;
		}
	}
}