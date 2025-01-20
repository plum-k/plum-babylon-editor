import { PrecisionDate } from "./precisionDate.js";
/**
 * Performance monitor tracks rolling average frame-time and frame-time variance over a user defined sliding-window
 */
export class PerformanceMonitor {
    /**
     * constructor
     * @param frameSampleSize The number of samples required to saturate the sliding window
     */
    constructor(frameSampleSize = 30) {
        this._enabled = true;
        this._rollingFrameTime = new RollingAverage(frameSampleSize);
    }
    /**
     * Samples current frame
     * @param timeMs A timestamp in milliseconds of the current frame to compare with other frames
     */
    sampleFrame(timeMs = PrecisionDate.Now) {
        if (!this._enabled) {
            return;
        }
        if (this._lastFrameTimeMs != null) {
            const dt = timeMs - this._lastFrameTimeMs;
            this._rollingFrameTime.add(dt);
        }
        this._lastFrameTimeMs = timeMs;
    }
    /**
     * Returns the average frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
     */
    get averageFrameTime() {
        return this._rollingFrameTime.average;
    }
    /**
     * Returns the variance frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
     */
    get averageFrameTimeVariance() {
        return this._rollingFrameTime.variance;
    }
    /**
     * Returns the frame time of the most recent frame
     */
    get instantaneousFrameTime() {
        return this._rollingFrameTime.history(0);
    }
    /**
     * Returns the average framerate in frames per second over the sliding window (or the subset of frames sampled so far)
     */
    get averageFPS() {
        return 1000.0 / this._rollingFrameTime.average;
    }
    /**
     * Returns the average framerate in frames per second using the most recent frame time
     */
    get instantaneousFPS() {
        const history = this._rollingFrameTime.history(0);
        if (history === 0) {
            return 0;
        }
        return 1000.0 / history;
    }
    /**
     * Returns true if enough samples have been taken to completely fill the sliding window
     */
    get isSaturated() {
        return this._rollingFrameTime.isSaturated();
    }
    /**
     * Enables contributions to the sliding window sample set
     */
    enable() {
        this._enabled = true;
    }
    /**
     * Disables contributions to the sliding window sample set
     * Samples will not be interpolated over the disabled period
     */
    disable() {
        this._enabled = false;
        //clear last sample to avoid interpolating over the disabled period when next enabled
        this._lastFrameTimeMs = null;
    }
    /**
     * Returns true if sampling is enabled
     */
    get isEnabled() {
        return this._enabled;
    }
    /**
     * Resets performance monitor
     */
    reset() {
        //clear last sample to avoid interpolating over the disabled period when next enabled
        this._lastFrameTimeMs = null;
        //wipe record
        this._rollingFrameTime.reset();
    }
}
/**
 * RollingAverage
 *
 * Utility to efficiently compute the rolling average and variance over a sliding window of samples
 */
export class RollingAverage {
    /**
     * constructor
     * @param length The number of samples required to saturate the sliding window
     */
    constructor(length) {
        this._samples = new Array(length);
        this.reset();
    }
    /**
     * Adds a sample to the sample set
     * @param v The sample value
     */
    add(v) {
        //http://en.wikipedia.org/wiki/Algorithms_for_calculating_variance
        let delta;
        //we need to check if we've already wrapped round
        if (this.isSaturated()) {
            //remove bottom of stack from mean
            const bottomValue = this._samples[this._pos];
            delta = bottomValue - this.average;
            this.average -= delta / (this._sampleCount - 1);
            this._m2 -= delta * (bottomValue - this.average);
        }
        else {
            this._sampleCount++;
        }
        //add new value to mean
        delta = v - this.average;
        this.average += delta / this._sampleCount;
        this._m2 += delta * (v - this.average);
        //set the new variance
        this.variance = this._m2 / (this._sampleCount - 1);
        this._samples[this._pos] = v;
        this._pos++;
        this._pos %= this._samples.length; //positive wrap around
    }
    /**
     * Returns previously added values or null if outside of history or outside the sliding window domain
     * @param i Index in history. For example, pass 0 for the most recent value and 1 for the value before that
     * @returns Value previously recorded with add() or null if outside of range
     */
    history(i) {
        if (i >= this._sampleCount || i >= this._samples.length) {
            return 0;
        }
        const i0 = this._wrapPosition(this._pos - 1.0);
        return this._samples[this._wrapPosition(i0 - i)];
    }
    /**
     * Returns true if enough samples have been taken to completely fill the sliding window
     * @returns true if sample-set saturated
     */
    isSaturated() {
        return this._sampleCount >= this._samples.length;
    }
    /**
     * Resets the rolling average (equivalent to 0 samples taken so far)
     */
    reset() {
        this.average = 0;
        this.variance = 0;
        this._sampleCount = 0;
        this._pos = 0;
        this._m2 = 0;
    }
    /**
     * Wraps a value around the sample range boundaries
     * @param i Position in sample range, for example if the sample length is 5, and i is -3, then 2 will be returned.
     * @returns Wrapped position in sample range
     */
    _wrapPosition(i) {
        const max = this._samples.length;
        return ((i % max) + max) % max;
    }
}
//# sourceMappingURL=performanceMonitor.js.map