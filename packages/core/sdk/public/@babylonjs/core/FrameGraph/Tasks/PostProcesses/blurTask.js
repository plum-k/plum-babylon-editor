import { ThinBlurPostProcess } from "../../../PostProcesses/thinBlurPostProcess.js";
import { FrameGraphPostProcessTask } from "./postProcessTask.js";
import { Vector2 } from "../../../Maths/math.vector.js";
/**
 * Task which applies a blur post process.
 */
export class FrameGraphBlurTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new blur task.
     * @param name Name of the task.
     * @param frameGraph Frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the blur effect.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 10));
    }
    record(skipCreationOfDisabledPasses = false, additionalExecute, additionalBindings) {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);
        this.postProcess.textureWidth = this._outputWidth;
        this.postProcess.textureHeight = this._outputHeight;
        return pass;
    }
}
//# sourceMappingURL=blurTask.js.map