/// <reference types="gamejolt" />
/// <reference types="node" />
import { EventEmitter } from 'events';
export interface ILaunchOptions {
    pollInterval?: number;
    env?: {
        [key: string]: string;
    };
}
export interface IAttachOptions {
    instance?: LaunchInstanceHandle;
    stringifiedWrapper?: string;
    wrapperId?: string;
    pollInterval?: number;
}
export interface IParsedWrapper {
    wrapperId: string;
}
export declare abstract class Launcher {
    private static _runningInstances;
    static launch(localPackage: GameJolt.IGamePackage, os: string, arch: string, credentials: GameJolt.IGameCredentials, options?: ILaunchOptions): LaunchHandle;
    static attach(options: IAttachOptions): Promise<LaunchInstanceHandle>;
    static detach(wrapperId: string, expectedWrapperPort?: number): Promise<void>;
}
export declare class LaunchHandle {
    private _localPackage;
    private _os;
    private _arch;
    private _credentials;
    private options;
    private _promise;
    private _file;
    private _executablePath;
    constructor(_localPackage: GameJolt.IGamePackage, _os: string, _arch: string, _credentials: GameJolt.IGameCredentials, options?: ILaunchOptions);
    readonly package: GameJolt.IGamePackage;
    readonly file: string;
    readonly promise: Promise<LaunchInstanceHandle>;
    private findLaunchOption();
    private ensureExecutable(file);
    private ensureCredentials();
    private start();
    private startWindows(stat, isJava);
    private startLinux(stat, isJava);
    private startMac(stat, isJava);
}
export declare class LaunchInstanceHandle extends EventEmitter implements IParsedWrapper {
    private _wrapperId;
    private _interval;
    private _wrapperPort;
    private _stable;
    constructor(_wrapperId: string, pollInterval?: number);
    readonly pid: IParsedWrapper;
    readonly wrapperId: string;
    readonly wrapperPort: number;
    tick(): Promise<boolean>;
    abort(err: NodeJS.ErrnoException): void;
}
