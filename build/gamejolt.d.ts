export interface IGamePackage {
    id: number;
    title: string;
    description: string;
    release: IGameRelease;
    build: IGameBuild;
    file: IGameBuildFile;
    launch_options: IGameBuildLaunchOptions[];
    install_dir: string;
    update?: IGamePackage;
}
export interface IGameRelease {
    id: number;
    version_number: string;
}
export interface IGameBuild {
    id: number;
    game_id: number;
    folder?: string;
    type: string;
    archive_type: string;
    os_windows: boolean;
    os_windows_64: boolean;
    os_mac: boolean;
    os_mac_64: boolean;
    os_linux: boolean;
    os_linux_64: boolean;
    os_other: boolean;
    modified_on: number;
}
export interface IGameBuildFile {
    id: number;
    filename: string;
    filesize: number;
}
export interface IGameBuildLaunchOptions {
    id: number;
    os: string;
    executable_path: string;
}
export interface IGameCredentials {
    username: string;
    user_token: string;
}
