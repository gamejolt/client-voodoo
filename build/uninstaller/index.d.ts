/// <reference types="gamejolt" />
export declare abstract class Uninstaller {
    static uninstall(localPackage: GameJolt.IGamePackage): UninstallHandle;
}
export declare class UninstallHandle {
    private _localPackage;
    private _promise;
    constructor(_localPackage: GameJolt.IGamePackage);
    readonly dir: string;
    readonly promise: Promise<string[]>;
}
