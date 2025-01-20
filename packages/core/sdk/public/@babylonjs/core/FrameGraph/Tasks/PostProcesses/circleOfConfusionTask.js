import { FrameGraphPostProcessTask } from "./postProcessTask.js";

import { ThinCircleOfConfusionPostProcess } from "../../../PostProcesses/thinCircleOfConfusionPostProcess.js";
/**
 * Task which applies a circle of confusion post process.
 */
export class FrameGraphCircleOfConfusionTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new circle of confusion task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use for the task. If not provided, a new one will be created.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinCircleOfConfusionPostProcess(name, frameGraph.engine));
        /**
         * The sampling mode to use for the depth texture.
         */
        this.depthSamplingMode = 2;
    }
    record(skipCreationOfDisabledPasses = false) {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCircleOfConfusionTask "${this.name}": sourceTexture, depthTexture and camera are required`);
        }
        const pass = super.record(skipCreationOfDisabledPasses, (context) => {
            context.setTextureSamplingMode(this.depthTexture, this.depthSamplingMode);
        }, (context) => {
            this.postProcess.camera = this.camera;
            context.bindTextureHandle(this._postProcessDrawWrapper.effect, "depthSampler", this.depthTexture);
        });
        this._internalDependencies.push(this.depthTexture);
        return pass;
    }
}
//# sourceMappingURL=circleOfConfusionTask.js.map