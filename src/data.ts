export interface UpdateMetadata {
	gameUID: string;
	url: string;
	checksum?: string;
	remoteSize?: number;
	os: string;
	arch: string;
	executable: string;

	oldBuildMetadata?: BuildMetadata;
	newBuildMetadata?: BuildMetadata;
	diffMetadata?: DiffMetadata;

	sideBySide?: boolean;
}

export interface BuildMetadata {
	files: { [path: string]: FileMetadata };
	dirs: string[];
	symlinks: { [path: string]: string };
}

export interface FileMetadata {
	size: number;
	checksum: string;
}

export interface DiffMetadata {
	identical: { [path: string]: string[] };
	similar: { [path: string]: SimilarFile[] };
	created: string[];
	removed: string[];
	dirs: string[];
	symlinks: { [path: string]: string };
}

export interface SimilarFile {
	chunkSize: number;
	new: string;
	size: number;
	patches: SimilarFilePart[];
	tails: SimilarFilePart[];
	diffSize: number;
}

export interface SimilarFilePart {
	file: string;
	size: number;
	checksum: string;
}

export enum PatcherState {
	Start = 0,
	Preparing = 1,
	Download = 2,
	PrepareExtract = 3,
	UpdateReady = 4,
	Extract = 5,
	Cleanup = 6,
	Uninstall = 7,
	Rollback = 8,
	Finished = 9,
}

export interface MsgStateResponse {
	version: string;
	state: 'running' | 'updating' | 'uninstalling';
	patcherState: PatcherState;
	pid: number;
	isPaused: boolean;
	isRunning: boolean;
	manifest: Manifest;
}

export interface MsgResultResponse {
	success: boolean;
	err?: string;
}

export interface MsgProgress {
	type: 'download' | 'extract';
	current: number;
	total: number;
	percent: number;
	sample?: ProgressSample;
}

export interface ProgressSample {
	sampleId: number;
	bytesPerSec: number;
	peak: number;
	low: number;
	average: number;
	movingPeak: number;
	movingLow: number;
	movingAverage: number;
}

export interface Info {
	dir: string;
	uid: string;
	archiveFiles?: string[];
}

export interface LaunchOptions {
	executable: string;
}

export interface PatchInfo {
	dir: string;
	uid: string;
	isDirty: boolean;
	dynamicFiles?: string[];

	downloadSize?: number;
	downloadChecksum?: string;
	launchOptions?: LaunchOptions;

	oldBuildMetadata?: BuildMetadata;
	newBuildMetadata?: BuildMetadata;
	diffMetadata?: DiffMetadata;
}

export interface RunningInfo {
	port: number;
	pid: number;
	since: number;
}

export interface PlayingInfo {
	args?: string[];
	since: number;
}

export interface Manifest {
	version: string;
	gameInfo: Info;
	launchOptions: LaunchOptions;
	os: 'windows' | 'mac' | 'linux';
	arch: '32' | '64';
	isFirstInstall: boolean;

	patchInfo?: PatchInfo;
	runningInfo?: RunningInfo;
	playingInfo?: PlayingInfo;
}
