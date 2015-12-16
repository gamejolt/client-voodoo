import { PatchHandle } from '../patcher';
import { DownloadHandle, IDownloadProgress } from '../downloader';
import { SampleUnit } from '../downloader/stream-speed';
import { ExtractHandle, IExtractProgress } from '../extractor';
import * as _ from 'lodash';

interface IQueueState
{
	queued: boolean;
	expectingManagement: number;
	timeLeft: number;
	managed: boolean;

	events: {
		onProgress?: ( progress: IDownloadProgress ) => any;
		onPatching?: Function;
		onExtractProgress?: ( progress: IExtractProgress ) => any;
		onPaused?: Function;
		onResumed?: Function;
		onCanceled?: Function;
	}
}

interface IQueueProfile
{
	downloads: number;
	extractions: number;
}

export abstract class VoodooQueue
{
	private static _fastProfile: IQueueProfile = {
		downloads: 3,
		extractions: 3,
	}

	private static _slowProfile: IQueueProfile = {
		downloads: 3,
		extractions: 3,
	}

	private static _maxDownloads: number = 3;
	private static _maxExtractions: number = 3;

	private static _settingDownloads: boolean = false;
	private static _settingExtractions: boolean = false;

	private static _patches: Map<PatchHandle, IQueueState> = new Map<PatchHandle, IQueueState>();

	static reset()
	{
		console.log( 'Resetting' );
		let patchesToReset: PatchHandle[] = [];
		for ( let patch of this._patches.keys() ) {
			this.dequeue( patch );
			patchesToReset.push( patch );
		}
		console.log( 'Restting ' + patchesToReset.length + ' patches' );

		this._maxDownloads = 3;
		this._maxExtractions = 3;

		this._settingDownloads = false;
		this._settingExtractions = false;

		this._patches.clear();

		return Promise.all( patchesToReset.map( ( patch ) => patch.cancel() ) );
	}

	static fetch( running: boolean, isDownloading?: boolean )
	{
		console.log( 'Fetching ' + ( running ? 'running' : 'pending' ) + ' ' + ( isDownloading ? 'downloading' : ( isDownloading === false ? 'patching' : 'all' ) ) + ' tasks' );
		let patches = [];
		this._patches.forEach( ( patchState, patch ) =>
		{
			if ( running !== patchState.queued &&
				 ( typeof isDownloading !== 'boolean' ||
				   isDownloading === patch.isDownloading() ) ) {

				patches.push( {
					patch: patch,
					state: patchState,
					sort: patchState.timeLeft
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

	private static async applyProfile( profile: IQueueProfile )
	{
		this._maxDownloads = this._fastProfile.downloads;
		this._maxExtractions = this._fastProfile.extractions;
		await this.tick();
	}

	static async faster()
	{
		this.applyProfile( this._fastProfile );
	}

	static async slower()
	{
		this.applyProfile( this._slowProfile );
	}

	private static log( patch: PatchHandle, message: string )
	{
		let state = this._patches.get( patch );
		console.log( 'Voodoo Queue: ' + message + ' ( ' + JSON.stringify( state ) + ' )' );
	}

	private static onProgress( patch: PatchHandle, state: IQueueState, progress: IDownloadProgress )
	{
		state.timeLeft = progress.timeLeft;
		this.log( patch, 'Updated time left' );
	}

	private static onPatching( patch: PatchHandle, state: IQueueState, progress )
	{
		this.log( patch, 'Patching' );

		let concurrentPatches = this.fetch( true, false );

		// Use > and not >= because also counting self
		if ( concurrentPatches.length > this._maxExtractions ) {
			this.pausePatch( patch, state );
		}
	}

	private static onExtractProgress( patch: PatchHandle, state: IQueueState, progress: IExtractProgress )
	{
		state.timeLeft = progress.timeLeft;
		this.log( patch, 'Updated time left' );
	}

	private static onPaused( patch: PatchHandle, state: IQueueState )
	{
		this.log( patch, 'Paused' );
		if ( state && !state.expectingManagement ) {
			this.dequeue( patch );
		}
	}

	private static onResumed( patch: PatchHandle, state: IQueueState )
	{
		this.log( patch, 'Resumed' );
		console.log( state );
		if ( !state.expectingManagement ) {
			this.dequeue( patch );
		}
	}

	private static onCanceled( patch: PatchHandle, state: IQueueState )
	{
		this.log( patch, 'Cancelled' );
		this.dequeue( patch );
	}

	static async enqueue( patch: PatchHandle )
	{
		if ( patch.isFinished() ) {
			return null;
		}

		let isDownloading = patch.isDownloading();
		let operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
		let concurrentPatches = this.fetch( true, isDownloading );

		let state: IQueueState = {
			queued: concurrentPatches.length >= operationLimit,
			expectingManagement: 0,
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
			.promise.then( () =>
			{
				if ( !state.managed ) {
					return;
				}

				this.log( patch, 'Finished' );
				this.dequeue( patch );
			} );

		if ( state.queued ) {
			await this.pausePatch( patch, state );
		}
		this.log( patch, 'Enqueued a patch' );

		return state;
	}

	static async dequeue( patch: PatchHandle )
	{
		this.log( patch, 'Dequeueing' );
		let state = this._patches.get( patch );
		if ( !state ) {
			return;
		}

		this.log( patch, 'Deregistering events' );
		patch
			.deregisterOnProgress( state.events.onProgress )
			.deregisterOnPatching( state.events.onPatching )
			.deregisterOnExtractProgress( state.events.onExtractProgress )
			.deregisterOnPaused( state.events.onPaused )
			.deregisterOnResumed( state.events.onResumed )
			.deregisterOnCanceled( state.events.onCanceled );

		state.managed = false;
		this._patches.delete( patch );

		await this.tick();
	}

	private static async resumePatch( patch: PatchHandle, state: IQueueState )
	{
		this.log( patch, 'Resuming patch' );
		state.expectingManagement += 1;
		let result: boolean;
		try {
			console.log( 'Expecting management' );
			result = await patch.start();
			if ( result ) {
				state.queued = false;
			}
		}
		catch ( err ) {
			result = false;
		}
		console.log( 'Not expecting management' );
		state.expectingManagement = Math.max( state.expectingManagement - 1, 0 );
		return result;
	}

	private static async pausePatch( patch: PatchHandle, state: IQueueState )
	{
		this.log( patch, 'Pausing patch' );
		state.expectingManagement += 1;
		let result: boolean;
		try {
			result = await patch.stop();
			if ( result ) {
				state.queued = true;
			}
		}
		catch ( err ) {
			result = false;
		}
		state.expectingManagement = Math.max( state.expectingManagement - 1, 0 );
		return result;
	}

	static async tick( downloads?: boolean )
	{
		if ( typeof downloads !== 'boolean' ) {
			await this.tick( false );
			await this.tick( true );
			return;
		}

		let running = this.fetch( true, downloads );
		let pending = this.fetch( false, downloads );
		console.log( 'Running: ' + running.length + ', Pending: ' + pending.length );

		let patchesToResume = ( downloads ? this._maxDownloads : this._maxExtractions ) - running.length;
		if ( patchesToResume > 0 ) {
			patchesToResume = Math.min( patchesToResume, pending.length );
			console.log( 'Patches to resume: ' + patchesToResume );
			for ( let i = 0; i < patchesToResume; i += 1 ) {
				await this.resumePatch( pending[i].patch, pending[i].state );
			}
		}
		else if ( patchesToResume < 0 ) {
			let patchesToPause = -patchesToResume;
			console.log( 'Patches to pause: ' + patchesToPause );
			for ( let i = 0; i < patchesToPause; i += 1 ) {
				await this.pausePatch( running[i].patch, running[i].state );
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
		console.log( 'Setting max downloads' );
		if ( this._settingDownloads ) {
			console.log( 'Nope' );
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
			await this.tick( true );
		}
		finally {
			this._settingDownloads = false;
		}
	}

	static async setMaxExtractions( newMaxExtractions: number )
	{
		if ( this._settingExtractions ) {
			return false;
		}
		this._settingExtractions = true;

		try {
			this._maxExtractions = newMaxExtractions;
			await new Promise( ( resolve ) => process.nextTick( resolve ) );
			await this.tick( false );
		}
		finally {
			this._settingExtractions = false;
		}
	}
}