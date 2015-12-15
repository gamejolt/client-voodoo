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
		onPaused?: Function;
		onResumed?: Function;
		onCanceled?: Function;
	}
}

export abstract class VoodooQueue
{
	private static _maxDownloads: number = 3;
	private static _maxExtractions: number = 3;

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

	static enqueue( patch: PatchHandle )
	{
		if ( patch.isFinished() ) {
			return null;
		}

		let isDownloading = patch.isDownloading();
		let operationLimit = isDownloading ? this._maxDownloads : this._maxExtractions;
		let concurrentPatches = this.fetch( true, isDownloading );

		let state: QueueState = {
			queued: concurrentPatches.length < operationLimit,
			expectingManagement: false,
			timeLeft: Infinity,
			managed: true,
			events: {},
		};
		state.events.onProgress = this.onProgress.bind( this, patch, state );
		state.events.onPaused = this.onPaused.bind( this, patch, state );
		state.events.onResumed = this.onResumed.bind( this, patch, state );
		state.events.onCanceled = this.onCanceled.bind( this, patch, state );

		this._patches.set( patch, state );
		this.log( patch, 'Enqueued a patch' );

		patch
			.onProgress( SampleUnit.KBps, state.events.onProgress )
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
			.deregisterOnPaused( state.events.onPaused )
			.deregisterOnResumed( state.events.onResumed )
			.deregisterOnCanceled( state.events.onCanceled );

		state.managed = false;
		this._patches.delete( patch );

		// If the dequeued task was running - run another task instead
		if ( !state.queued ) {
			this.log( patch, 'Trying to resume a pending task if any' );
			let pendingDownloads = this.fetch( false, true );
			if ( pendingDownloads.length ) {
				pendingDownloads[0].state.expectingManagement = true;
				await pendingDownloads[0].patch.start();
				pendingDownloads[0].state.expectingManagement = false;
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
		let currentlyDownloading = this.fetch( true, true );
		let pendingDownloads = this.fetch( false, true );

		this._maxDownloads = newMaxDownloads;
		let patchesToResume = this._maxDownloads - currentlyDownloading.length;
		if ( patchesToResume > 0 ) {
			patchesToResume = Math.min( patchesToResume, pendingDownloads.length );
			for ( let i = 0; i < patchesToResume; i += 1 ) {
				pendingDownloads[i].state.expectingManagement = true;
				await pendingDownloads[i].patch.start();
				pendingDownloads[i].state.expectingManagement = false;
			}
		}
		else if ( patchesToResume < 0 ) {
			let patchesToPause = -patchesToResume;
			for ( let i = 0; i < patchesToPause; i += 1 ) {
				currentlyDownloading[i].state.expectingManagement = true;
				await currentlyDownloading[i].patch.stop();
				currentlyDownloading[i].state.expectingManagement = false;
			}
		}
	}

	static async setMaxExtractions( newMaxExtractions: number )
	{
		let currentlyExtracting = this.fetch( true, false );
		let pendingExtractions = this.fetch( false, false );

		this._maxExtractions = newMaxExtractions;
		let patchesToResume = this._maxExtractions - currentlyExtracting.length;
		if ( patchesToResume > 0 ) {
			patchesToResume = Math.min( patchesToResume, pendingExtractions.length );
			for ( let i = 0; i < patchesToResume; i += 1 ) {
				pendingExtractions[i].state.expectingManagement = true;
				await pendingExtractions[i].patch.start();
				pendingExtractions[i].state.expectingManagement = false;
			}
		}
		else if ( patchesToResume < 0 ) {
			let patchesToPause = -patchesToResume;
			for ( let i = 0; i < patchesToPause; i += 1 ) {
				currentlyExtracting[i].state.expectingManagement = true;
				await currentlyExtracting[i].patch.stop();
				currentlyExtracting[i].state.expectingManagement = false;
			}
		}
	}
}