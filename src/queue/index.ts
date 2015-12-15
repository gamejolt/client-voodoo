import { PatchHandle } from '../patcher';
import { DownloadHandle, IDownloadProgress } from '../downloader';
import { SampleUnit } from '../downloader/stream-speed';
import { ExtractHandle } from '../extractor';
import * as _ from 'lodash';

interface QueueState
{
	queued: boolean;
	expectingManagement: boolean;
	timeLeft: number;
	managed: boolean;

	events: {
		onProgress?: ( progress: IDownloadProgress ) => any;
		onPatching?: Function;
		onPaused?: Function;
		onResumed?: Function;
		onCanceled?: Function;
	}
}

export abstract class VoodooQueue
{
	private static _maxDownloads: number = 3;
	private static _maxExtractions: number = 3;

	private static _settingDownloads: boolean = false;
	private static _settingExtractions: boolean = false;

	private static _patches: Map<PatchHandle, QueueState> = new Map<PatchHandle, QueueState>();

	static fetch( running: boolean, isDownloading?: boolean )
	{
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
		let sortedPatches = sorted.map( ( value: { patch: PatchHandle, state: QueueState } ) =>
		{
			return {
				patch: value.patch,
				state: value.state,
			};
		} );
		return sortedPatches;
	}

	private static log( patch: PatchHandle, message: string )
	{
		let state = this._patches.get( patch );
		console.log( 'Voodoo Queue: ' + message + ' ( ' + JSON.stringify( state ) + ' )' );
	}

	private static onProgress( patch: PatchHandle, state: QueueState, progress )
	{
		state.timeLeft = progress.timeLeft;
		this.log( patch, 'Updated time left' );
	}

	private static onPatching( patch: PatchHandle, state: QueueState, progress )
	{
		this.log( patch, 'Patching' );

		let concurrentPatches = this.fetch( true, false );
		if ( concurrentPatches.length >= this._maxExtractions ) {
			this.pausePatch( patch, state );
		}
	}

	private static onPaused( patch: PatchHandle, state: QueueState )
	{
		this.log( patch, 'Paused' );
		if ( state && !state.expectingManagement ) {
			this.dequeue( patch );
		}
	}

	private static onResumed( patch: PatchHandle, state: QueueState )
	{
		this.log( patch, 'Resumed' );
		if ( !state.expectingManagement ) {
			this.dequeue( patch );
		}
	}

	private static onCanceled( patch: PatchHandle, state: QueueState )
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

		let state: QueueState = {
			queued: concurrentPatches.length >= operationLimit,
			expectingManagement: false,
			timeLeft: Infinity,
			managed: true,
			events: {},
		};
		state.events.onProgress = this.onProgress.bind( this, patch, state );
		state.events.onPatching = this.onPatching.bind( this, patch, state );
		state.events.onPaused = this.onPaused.bind( this, patch, state );
		state.events.onResumed = this.onResumed.bind( this, patch, state );
		state.events.onCanceled = this.onCanceled.bind( this, patch, state );

		this._patches.set( patch, state );

		patch
			.onProgress( SampleUnit.KBps, state.events.onProgress )
			.onPatching( state.events.onPatching )
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
			.deregisterOnPaused( state.events.onPaused )
			.deregisterOnResumed( state.events.onResumed )
			.deregisterOnCanceled( state.events.onCanceled );

		state.managed = false;
		this._patches.delete( patch );

		await this.tick();
	}

	static get maxDownloads()
	{
		return this._maxDownloads;
	}

	static get maxExtractions()
	{
		return this._maxExtractions;
	}

	private static async resumePatch( patch: PatchHandle, state: QueueState )
	{
		state.expectingManagement = true;
		let result: boolean;
		try {
			result = await patch.start();
			if ( result ) {
				state.queued = false;
			}
		}
		catch ( err ) {
			result = false;
		}
		state.expectingManagement = false;
		return result;
	}

	private static async pausePatch( patch: PatchHandle, state: QueueState )
	{
		state.expectingManagement = true;
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
		state.expectingManagement = false;
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

		let patchesToResume = ( downloads ? this._maxDownloads : this._maxExtractions ) - running.length;
		if ( patchesToResume > 0 ) {
			patchesToResume = Math.min( patchesToResume, pending.length );
			for ( let i = 0; i < patchesToResume; i += 1 ) {
				this.resumePatch( pending[i].patch, pending[i].state );
			}
		}
		else if ( patchesToResume < 0 ) {
			let patchesToPause = -patchesToResume;
			for ( let i = 0; i < patchesToPause; i += 1 ) {
				this.pausePatch( running[i].patch, running[i].state );
			}
		}
	}

	static async setMaxDownloads( newMaxDownloads: number )
	{
		if ( this._settingDownloads ) {
			return false;
		}
		this._settingDownloads = true;

		try {
			this._maxDownloads = newMaxDownloads;
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
			await this.tick( false );
		}
		finally {
			this._settingExtractions = false;
		}
	}
}