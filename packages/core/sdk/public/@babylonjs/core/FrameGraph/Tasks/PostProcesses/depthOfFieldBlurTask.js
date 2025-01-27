
import { FrameGraphBlurTask } from "./blurTask.js";
import { ThinDepthOfFieldBlurPostProcess } from "../../../PostProcesses/thinDepthOfFieldBlurPostProcess.js";
import { Vector2 } from "../../../Maths/math.vector.js";
/**
 * @internal
 */
export class FrameGraphDepthOfFieldBlurTask extends FrameGraphBlurTask {
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinDepthOfFieldBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 10));
        this.circleOfConfusionSamplingMode = 2;
        this.onTexturesAllocatedObservable.add((context) => {
            context.setTextureSamplingMode(this.circleOfConfusionTexture, this.circleOfConfusionSamplingMode);
        });
    }
    record(skipCreationOfDisabledPasses = false) {
        if (this.sourceTexture === undefined || this.circleOfConfusionTexture === undefined) {
            throw new Error(`FrameGraphDepthOfFieldBlurTask "${this.name}": sourceTexture and circleOfConfusionTexture are required`);
        }
        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect, "circleOfConfusionSampler", this.circleOfConfusionTexture);
        });
        this._addInternalDependencies(this.circleOfConfusionTexture);
        return pass;
    }
}
//# sourceMappingURL=depthOfFieldBlurTask.js.map