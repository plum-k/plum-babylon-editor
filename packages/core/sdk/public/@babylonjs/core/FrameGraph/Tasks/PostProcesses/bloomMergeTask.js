import { ThinBloomMergePostProcess } from "../../../PostProcesses/thinBloomMergePostProcess.js";
import { FrameGraphPostProcessTask } from "./postProcessTask.js";
/**
 * @internal
 */
export class FrameGraphBloomMergeTask extends FrameGraphPostProcessTask {
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinBloomMergePostProcess(name, frameGraph.engine));
    }
    record(skipCreationOfDisabledPasses = false) {
        if (this.sourceTexture === undefined || this.blurTexture === undefined) {
            throw new Error(`FrameGraphBloomMergeTask "${this.name}": sourceTexture and blurTexture are required`);
        }
        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            context.bindTextureHandle(this._postProcessDrawWrapper.effect, "bloomBlur", this.blurTexture);
        });
        this._internalDependencies.push(this.blurTexture);
        return pass;
    }
}
//# sourceMappingURL=bloomMergeTask.js.map