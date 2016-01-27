import { Application } from './application';
Application.start();

import { Logger } from './common/logger';
export * from './common/logger';
Logger.hijack();

export * from './autostarter';
export * from './downloader';
export * from './downloader/stream-speed';
export * from './extractor';
export * from './launcher';
export * from './patcher';
export * from './uninstaller';
export * from './queue';
export * from './shortcut';

