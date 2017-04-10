"use strict";
var events_1 = require("events");
var through2 = require("through2");
(function (SampleUnit) {
    SampleUnit[SampleUnit["Bps"] = 0] = "Bps";
    SampleUnit[SampleUnit["KBps"] = 1] = "KBps";
    SampleUnit[SampleUnit["MBps"] = 2] = "MBps";
    SampleUnit[SampleUnit["GBps"] = 3] = "GBps";
    SampleUnit[SampleUnit["TBps"] = 4] = "TBps";
    SampleUnit[SampleUnit["PBps"] = 5] = "PBps";
    SampleUnit[SampleUnit["EBps"] = 6] = "EBps";
    SampleUnit[SampleUnit["ZBps"] = 7] = "ZBps";
    SampleUnit[SampleUnit["YBps"] = 8] = "YBps";
})(exports.SampleUnit || (exports.SampleUnit = {}));
var SampleUnit = exports.SampleUnit;
var StreamSpeed = (function () {
    function StreamSpeed(options) {
        var _this = this;
        this._stream = through2(function (chunk, enc, cb) {
            _this.current += chunk.length;
            cb(null, chunk);
        });
        this._stream.on('end', function () { return _this.stop(); });
        this._stream.resume();
        this.emitter = new events_1.EventEmitter();
        this.start(options);
    }
    Object.defineProperty(StreamSpeed.prototype, "stream", {
        get: function () {
            return this._stream;
        },
        enumerable: true,
        configurable: true
    });
    StreamSpeed.prototype.takeSample = function (unit, precision) {
        var sample = this._takeSample(true);
        return StreamSpeed.convertSample(sample, unit, precision);
    };
    StreamSpeed.convertSample = function (sample, unit, precision) {
        var div = Math.pow(1024, unit) / Math.pow(1024, sample.unit); // Use sane units ok?
        precision = Math.pow(10, precision || 2);
        function getUnit(value) {
            return Math.round(value * precision / div) / precision;
        }
        sample.current = getUnit(sample.current);
        sample.currentAverage = getUnit(sample.currentAverage);
        sample.peak = getUnit(sample.peak);
        sample.low = getUnit(sample.low);
        sample.average = getUnit(sample.average);
        sample.unit = unit;
        return sample;
    };
    StreamSpeed.prototype._takeSample = function (onDemand) {
        this.samplesTaken += 1;
        this.current *= this.samplesPerSecond;
        this.average += (this.current - this.average) / this.samplesTaken;
        this.peak = Math.max(this.peak, this.current);
        this.low = Math.min(this.low === -1 ? this.current : this.low, this.current);
        this.samples.unshift(this.current);
        this.currentAverage = this.samples.reduce(function (accumulate, value) {
            return accumulate + value;
        }, 0);
        this.currentAverage /= Math.min(this.samples.length, this.samplesForAverage);
        var sampleData = StreamSpeed.convertSample({
            current: this.current,
            currentAverage: this.currentAverage,
            peak: this.peak,
            low: this.low,
            average: this.average,
            unit: SampleUnit.Bps,
            sampleCount: this.samplesTaken,
        }, SampleUnit.Bps);
        if (!onDemand) {
            if (this.samples.length > this.samplesForAverage) {
                this.samples.pop();
            }
            this.emitSample(sampleData);
        }
        else {
            this.samples = this.samples.slice(1);
            this.samplesTaken -= 1;
        }
        this.current = 0;
        return sampleData;
    };
    StreamSpeed.prototype.emitSample = function (sample) {
        this.emitter.emit('sample', sample);
    };
    StreamSpeed.prototype.start = function (options) {
        var _this = this;
        this.samples = [];
        this.samplesTaken = 0;
        this.current = 0;
        this.currentAverage = 0;
        this.peak = 0;
        this.low = -1;
        this.average = 0;
        options = options || {};
        this.samplesPerSecond = options.samplesPerSecond || 2;
        this.samplesForAverage = options.samplesForAverage || (5 * this.samplesPerSecond);
        this.interval = setInterval(function () { return _this._takeSample(); }, 1000 / this.samplesPerSecond);
        this._stream.resume();
    };
    StreamSpeed.prototype.stop = function () {
        clearInterval(this.interval);
        this.current = 0;
        this._stream.pause();
    };
    StreamSpeed.prototype.onSample = function (cb) {
        this.emitter.on('sample', cb);
        return this;
    };
    return StreamSpeed;
}());
exports.StreamSpeed = StreamSpeed;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StreamSpeed;
//# sourceMappingURL=stream-speed.js.map