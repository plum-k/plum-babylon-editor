import { PerfCounter } from "../../Misc/perfCounter.js";
import { WebGPUQuerySet } from "./webgpuQuerySet.js";
import { Logger } from "../../Misc/logger.js";
/** @internal */
export class WebGPUTimestampQuery {
    get gpuFrameTimeCounter() {
        return this._gpuFrameTimeCounter;
    }
    constructor(engine, device, bufferManager) {
        this._enabled = false;
        this._gpuFrameTimeCounter = new PerfCounter();
        this._measureDurationState = 0;
        this._engine = engine;
        this._device = device;
        this._bufferManager = bufferManager;
    }
    get enable() {
        return this._enabled;
    }
    set enable(value) {
        if (this._enabled === value) {
            return;
        }
        this._enabled = value;
        this._measureDurationState = 0;
        if (value) {
            try {
                this._measureDuration = new WebGPUDurationMeasure(this._engine, this._device, this._bufferManager, 2000, "QuerySet_TimestampQuery");
            }
            catch (e) {
                this._enabled = false;
                Logger.Error("Could not create a WebGPUDurationMeasure!\nError: " + e.message + "\nMake sure timestamp query is supported and enabled in your browser.");
                return;
            }
        }
        else {
            this._measureDuration.dispose();
        }
    }
    startFrame(commandEncoder) {
        if (this._enabled && this._measureDurationState === 0) {
            this._measureDuration.start(commandEncoder);
            this._measureDurationState = 1;
        }
    }
    endFrame(commandEncoder) {
        if (this._measureDurationState === 1) {
            this._measureDurationState = 2;
            this._measureDuration.stop(commandEncoder).then((duration) => {
                if (duration !== null && duration >= 0) {
                    this._gpuFrameTimeCounter.fetchNewFrame();
                    this._gpuFrameTimeCounter.addCount(duration, true);
                }
                this._measureDurationState = 0;
            });
        }
    }
    startPass(descriptor, index) {
        if (this._enabled) {
            this._measureDuration.startPass(descriptor, index);
        }
        else {
            descriptor.timestampWrites = undefined;
        }
    }
    endPass(index, gpuPerfCounter) {
        if (!this._enabled || !gpuPerfCounter) {
            return;
        }
        const currentFrameId = this._engine.frameId;
        this._measureDuration.stopPass(index).then((duration_) => {
            gpuPerfCounter._addDuration(currentFrameId, duration_ !== null && duration_ > 0 ? duration_ : 0);
        });
    }
    dispose() {
        this._measureDuration?.dispose();
    }
}
/** @internal */
export class WebGPUDurationMeasure {
    constructor(engine, device, bufferManager, count = 2, querySetLabel) {
        this._count = count;
        this._querySet = new WebGPUQuerySet(engine, count, "timestamp" /* WebGPUConstants.QueryType.Timestamp */, device, bufferManager, true, querySetLabel);
    }
    start(encoder) {
        encoder.writeTimestamp?.(this._querySet.querySet, 0);
    }
    async stop(encoder) {
        encoder.writeTimestamp?.(this._querySet.querySet, 1);
        return encoder.writeTimestamp ? this._querySet.readTwoValuesAndSubtract(0) : 0;
    }
    startPass(descriptor, index) {
        if (index + 3 > this._count) {
            throw new Error("WebGPUDurationMeasure: index out of range (" + index + ")");
        }
        descriptor.timestampWrites = {
            querySet: this._querySet.querySet,
            beginningOfPassWriteIndex: index + 2,
            endOfPassWriteIndex: index + 3,
        };
    }
    async stopPass(index) {
        return this._querySet.readTwoValuesAndSubtract(index + 2);
    }
    dispose() {
        this._querySet.dispose();
    }
}
//# sourceMappingURL=webgpuTimestampQuery.js.map