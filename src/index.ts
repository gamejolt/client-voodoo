export * from './patcher';
export * from './launcher';
export * from './uninstaller';
export * from './config';
export * from './queue';
export * from './autostarter';
export * from './shortcut';
export * from './rollbacker';
export * from './mutex';

import { Logger } from './logger';
export * from './logger';
Logger.hijack();
