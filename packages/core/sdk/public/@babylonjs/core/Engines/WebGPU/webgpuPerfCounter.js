import { PerfCounter } from "../../Misc/perfCounter.js";
/**
 * Class used to define a WebGPU performance counter
 */
export class WebGPUPerfCounter {
    constructor() {
        this._gpuTimeInFrameId = -1;
        /**
         * The GPU time in nanoseconds spent in the last frame
         */
        this.counter = new PerfCounter();
    }
    /**
     * @internal
     */
    _addDuration(currentFrameId, duration) {
        if (currentFrameId < this._gpuTimeInFrameId) {
            return;
        }
        if (this._gpuTimeInFrameId !== currentFrameId) {
            this.counter._fetchResult();
            this.counter.fetchNewFrame();
            this.counter.addCount(duration, false);
            this._gpuTimeInFrameId = currentFrameId;
        }
        else {
            this.counter.addCount(duration, false);
        }
    }
}
//# sourceMappingURL=webgpuPerfCounter.js.map