'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var stream_1 = require('stream');
var events_1 = require('events');
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

var StreamSpeed = (function (_stream_1$PassThrough) {
    (0, _inherits3.default)(StreamSpeed, _stream_1$PassThrough);

    function StreamSpeed(options) {
        (0, _classCallCheck3.default)(this, StreamSpeed);

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(StreamSpeed).call(this, options));

        _this.on('data', function (data) {
            _this.current += data.length;
        });
        _this.on('end', function () {
            return _this.stop();
        });
        _this.emitter = new events_1.EventEmitter();
        _this.start(options);
        return _this;
    }

    (0, _createClass3.default)(StreamSpeed, [{
        key: 'takeSample',
        value: function takeSample(unit, precision) {
            var sample = this._takeSample(true);
            return StreamSpeed.convertSample(sample, unit, precision);
        }
    }, {
        key: '_takeSample',
        value: function _takeSample(onDemand) {
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
                sampleCount: this.samplesTaken
            }, SampleUnit.Bps);
            if (!onDemand) {
                if (this.samples.length > this.samplesForAverage) {
                    this.samples.pop();
                }
                this.emitSample(sampleData);
            } else {
                this.samples = this.samples.slice(1);
                this.samplesTaken -= 1;
            }
            this.current = 0;
            return sampleData;
        }
    }, {
        key: 'emitSample',
        value: function emitSample(sample) {
            this.emitter.emit('sample', sample);
        }
    }, {
        key: 'start',
        value: function start(options) {
            var _this2 = this;

            this.samples = [];
            this.samplesTaken = 0;
            this.current = 0;
            this.currentAverage = 0;
            this.peak = 0;
            this.low = -1;
            this.average = 0;
            options = options || {};
            this.samplesPerSecond = options.samplesPerSecond || 2;
            this.samplesForAverage = options.samplesForAverage || 5 * this.samplesPerSecond;
            this.interval = setInterval(function () {
                return _this2._takeSample();
            }, 1000 / this.samplesPerSecond);
        }
    }, {
        key: 'stop',
        value: function stop() {
            clearInterval(this.interval);
            this.current = 0;
        }
    }, {
        key: 'onSample',
        value: function onSample(cb) {
            this.emitter.on('sample', cb);
        }
    }], [{
        key: 'convertSample',
        value: function convertSample(sample, unit, precision) {
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
        }
    }]);
    return StreamSpeed;
})(stream_1.PassThrough);

exports.StreamSpeed = StreamSpeed;
exports.default = StreamSpeed;
//# sourceMappingURL=stream-speed.js.map
