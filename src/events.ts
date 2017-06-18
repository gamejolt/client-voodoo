import { EventEmitter } from 'events';

export class TSEventEmitter<
	E extends { [event: string]: Function }
> extends EventEmitter {
	constructor() {
		super();
	}

	addListener<T extends keyof E>(event: T, listener: E[T]) {
		return super.addListener(event, listener);
	}

	listeners(event: keyof E) {
		return super.listeners(event);
	}

	on<T extends keyof E>(event: T, listener: E[T]) {
		return super.on(event, listener);
	}

	once<T extends keyof E>(event: T, listener: E[T]) {
		return super.once(event, listener);
	}

	removeAllListeners(event?: keyof E) {
		return super.removeAllListeners(event);
	}

	removeListener<T extends keyof E>(event: T, listener: E[T]) {
		return super.removeListener(event, listener);
	}
}
