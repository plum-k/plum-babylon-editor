import { ThinDepthOfFieldMergePostProcess } from "../../../PostProcesses/thinDepthOfFieldMergePostProcess.js";
import { FrameGraphPostProcessTask } from "./postProcessTask.js";

/**
 * @internal
 */
export class FrameGraphDepthOfFieldMergeTask extends FrameGraphPostProcessTask {
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinDepthOfFieldMergePostProcess(name, frameGraph.engine));
        this.blurSteps = [];
        this.onTexturesAllocatedObservable.add((context) => {
            context.setTextureSamplingMode(this.blurSteps[this.blurSteps.length - 1], 2);
        });
    }
    record(skipCreationOfDisabledPasses = false) {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined || this.blurSteps.length === 0) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture, circleOfConfusionTexture and blurSteps are required`);
        }
        this.postProcess.updateEffect("#define BLUR_LEVEL " + (this.blurSteps.length - 1) + "\n");
        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect, "circleOfConfusionSampler", this.circleOfConfusionTexture);
            this.blurSteps.forEach((handle, index) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect, "blurStep" + (this.blurSteps.length - index - 1), handle);
            });
        });
        this._internalDependencies.push(this.circleOfConfusionTexture);
        for (const handle of this.blurSteps) {
            this._internalDependencies.push(handle);
        }
        return pass;
    }
}
//# sourceMappingURL=depthOfFieldMergeTask.js.map