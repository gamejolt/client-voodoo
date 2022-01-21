import * as EventEmitter from 'events';

type EventListener = (...args: any[]) => void;

export class TSEventEmitter<E extends { [event: string]: EventListener }> extends EventEmitter {
	constructor() {
		super();
	}

	addListener<T extends Extract<keyof E, string>>(event: T, listener: E[T]) {
		return super.addListener(event + '', listener);
	}

	listeners(event: Extract<keyof E, string>) {
		return super.listeners(event + '');
	}

	on<T extends Extract<keyof E, string>>(event: T, listener: E[T]) {
		return super.on(event + '', listener);
	}

	once<T extends Extract<keyof E, string>>(event: T, listener: E[T]) {
		return super.once(event + '', listener);
	}

	removeAllListeners(event?: Extract<keyof E, string>) {
		return super.removeAllListeners(event + '');
	}

	removeListener<T extends Extract<keyof E, string>>(event: T, listener: E[T]) {
		return super.removeListener(event + '', listener);
	}

	emit<T extends Extract<keyof E, string>>(event: T, ...args: Parameters<E[T]>) {
		return super.emit(event, args);
	}
}
