export enum State
{
	STARTED,
	STARTING,
	STOPPED,
	STOPPING,
	FINISHED,
}

export interface ICallback
{
	cb: Function;
	args?: any[];
	context?: any;
}

export class Resumable
{
	private _currentState: State;
	private _wantsStart: boolean;

	private _waitForStart?: Promise<void>;
	private _waitForStartResolver?: () => void;
	private _startCbs: Set<ICallback>;

	private _waitForStop?: Promise<void>;
	private _waitForStopResolver?: () => void;
	private _stopCbs: Set<ICallback>;

	constructor()
	{
		this._currentState = State.STOPPED;
		this._wantsStart = false;
		this._startCbs = new Set<ICallback>();
		this._stopCbs = new Set<ICallback>();
	}

	get state()
	{
		return this._currentState;
	}

	start( cb: ICallback, force?: boolean )
	{
		this._wantsStart = true;
		if ( this._currentState === State.STARTING || this. _currentState === State.STARTED ) {
			this._stopCbs.clear();
			return;
		}

		this._startCbs.add( cb );

		if ( !this._waitForStop ) {
			this._waitForStop = new Promise<void>( ( resolve ) =>
			{
				this._waitForStopResolver = resolve;
			} )
			.then( () =>
			{
				if ( this._currentState === State.FINISHED ) {
					return;
				}

				this._currentState = State.STARTING;
				this._waitForStop = undefined;
				this._waitForStopResolver = undefined;

				let cbCount = this._startCbs.size;
				for ( const _cb of this._startCbs.values() ) {
					this._startCbs.delete( _cb );
					_cb.cb.apply( _cb.context || this, _cb.args );

					cbCount -= 1;
					if ( !cbCount ) {
						break;
					}
				}
			} );
		}

		if ( this._currentState === State.STOPPED || force ) {
			if ( this._waitForStopResolver ) {
				this._waitForStopResolver();
			}
		}

		return this._waitForStop;
	}

	started()
	{
		if ( this._waitForStartResolver ) {
			this._waitForStartResolver();
		}
		this._currentState = State.STARTED;
	}

	stop( cb: ICallback, force?: boolean )
	{
		this._wantsStart = false;
		if ( this._currentState === State.STOPPING || this. _currentState === State.STOPPED ) {
			this._startCbs.clear();
			return;
		}

		this._stopCbs.add( cb );

		if ( !this._waitForStart ) {
			this._waitForStart = new Promise<void>( ( resolve ) =>
			{
				this._waitForStartResolver = resolve;
			} )
			.then( () =>
			{
				if ( this._currentState === State.FINISHED ) {
					return;
				}

				this._currentState = State.STOPPING;
				this._waitForStart = undefined;
				this._waitForStartResolver = undefined;

				let cbCount = this._stopCbs.size;
				for ( const _cb of this._stopCbs.values() ) {
					this._stopCbs.delete( _cb );
					_cb.cb.apply( _cb.context || this, _cb.args );

					cbCount -= 1;
					if ( !cbCount ) {
						break;
					}
				}
			} );
		}

		if ( this._currentState === State.STARTED || force ) {
			if ( this._waitForStartResolver ) {
				this._waitForStartResolver();
			}
		}

		return this._waitForStart;
	}

	stopped()
	{
		if ( this._waitForStopResolver ) {
			this._waitForStopResolver();
		}
		this._currentState = State.STOPPED;
	}

	finished()
	{
		this._startCbs.clear();
		this._stopCbs.clear();
		this._currentState = State.FINISHED;
	}

	checkContinue( cb: ICallback, running: boolean )
	{
		if ( this._wantsStart === running ) {
			return Promise.resolve();
		}

		if ( running ) {
			return this.stop( { cb: () => this.start( cb ) }, true );
		}
		else {
			return this.start( { cb: () => this.stop( cb ) }, true );
		}
	}
}
