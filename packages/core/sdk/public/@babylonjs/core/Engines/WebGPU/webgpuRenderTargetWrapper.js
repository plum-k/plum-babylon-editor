import { RenderTargetWrapper } from "../renderTargetWrapper.js";
import { WebGPUPerfCounter } from "./webgpuPerfCounter.js";
/**
 * Specialized class used to store a render target of a WebGPU engine
 */
export class WebGPURenderTargetWrapper extends RenderTargetWrapper {
    /**
     * Initializes the render target wrapper
     * @param isMulti true if the wrapper is a multi render target
     * @param isCube true if the wrapper should render to a cube texture
     * @param size size of the render target (width/height/layers)
     * @param engine engine used to create the render target
     * @param label defines the label to use for the wrapper (for debugging purpose only)
     */
    constructor(isMulti, isCube, size, engine, label) {
        super(isMulti, isCube, size, engine, label);
        if (engine.enableGPUTimingMeasurements) {
            this.gpuTimeInFrame = new WebGPUPerfCounter();
        }
    }
}
//# sourceMappingURL=webgpuRenderTargetWrapper.js.map