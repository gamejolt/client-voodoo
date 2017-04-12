/// <reference types="node" />
export interface ISampleData {
    current: number;
    currentAverage: number;
    peak: number;
    low: number;
    average: number;
    unit: SampleUnit;
    sampleCount: number;
}
export interface ISampleOptions {
    samplesPerSecond?: number;
    samplesForAverage?: number;
}
export declare enum SampleUnit {
    Bps = 0,
    KBps = 1,
    MBps = 2,
    GBps = 3,
    TBps = 4,
    PBps = 5,
    EBps = 6,
    ZBps = 7,
    YBps = 8,
}
export declare class StreamSpeed {
    private _stream;
    private samplesPerSecond;
    private samplesForAverage;
    private samplesTaken;
    private samples;
    private interval;
    private current;
    private currentAverage;
    private peak;
    private low;
    private average;
    private emitter;
    constructor(options?: ISampleOptions);
    readonly stream: NodeJS.ReadWriteStream;
    takeSample(unit: SampleUnit, precision?: number): ISampleData;
    static convertSample(sample: ISampleData, unit: SampleUnit, precision?: number): ISampleData;
    private _takeSample(onDemand?);
    private emitSample(sample);
    start(options?: ISampleOptions): void;
    stop(): void;
    onSample(cb: (sample?: ISampleData) => any): this;
}
export default StreamSpeed;
