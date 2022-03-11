import { TSEventEmitter } from './events';
import { Controller, Events } from './controller';

export class ControllerWrapper<E extends Events> extends TSEventEmitter<E> {
	constructor(readonly controller: Controller) {
		super();
	}

	addListener<T extends keyof E>(event: T, listener: E[T]) {
		this.controller.addListener(event as any, listener);
		return this;
	}

	listeners(event: keyof E) {
		return this.controller.listeners(event as any);
	}

	on<T extends keyof E>(event: T, listener: E[T]) {
		this.controller.on(event as any, listener);
		return this;
	}

	once<T extends keyof E>(event: T, listener: E[T]) {
		this.controller.once(event as any, listener);
		return this;
	}

	removeAllListeners(event?: keyof E) {
		this.controller.removeAllListeners(event as any);
		return this;
	}

	removeListener<T extends keyof E>(event: T, listener: E[T]) {
		this.controller.removeListener(event as any, listener);
		return this;
	}

	dispose() {
		return this.controller.dispose();
	}
}
