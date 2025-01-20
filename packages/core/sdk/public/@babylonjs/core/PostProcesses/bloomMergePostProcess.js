import { __decorate } from "../tslib.es6.js";
import { PostProcess } from "./postProcess.js";

import { RegisterClass } from "../Misc/typeStore.js";
import { serialize } from "../Misc/decorators.js";
import { ThinBloomMergePostProcess } from "./thinBloomMergePostProcess.js";
/**
 * The BloomMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
 */
export class BloomMergePostProcess extends PostProcess {
    /** Weight of the bloom to be added to the original input. */
    get weight() {
        return this._effectWrapper.weight;
    }
    set weight(value) {
        this._effectWrapper.weight = value;
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "BloomMergePostProcess" string
     */
    getClassName() {
        return "BloomMergePostProcess";
    }
    /**
     * Creates a new instance of @see BloomMergePostProcess
     * @param name The name of the effect.
     * @param originalFromInput Post process which's input will be used for the merge.
     * @param blurred Blurred highlights post process which's output will be used.
     * @param weight Weight of the bloom to be added to the original input.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name, originalFromInput, blurred, weight, options, camera = null, samplingMode, engine, reusable, textureType = 0, blockCompilation = false) {
        const blockCompilationFinal = typeof options === "number" ? blockCompilation : !!options.blockCompilation;
        const localOptions = {
            uniforms: ThinBloomMergePostProcess.Uniforms,
            samplers: ThinBloomMergePostProcess.Samplers,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            ...options,
            blockCompilation: true,
        };
        super(name, ThinBloomMergePostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinBloomMergePostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
        this.weight = weight;
        this.externalTextureSamplerBinding = true;
        this.onApplyObservable.add((effect) => {
            effect.setTextureFromPostProcess("textureSampler", originalFromInput);
            effect.setTextureFromPostProcessOutput("bloomBlur", blurred);
        });
        if (!blockCompilationFinal) {
            this.updateEffect();
        }
    }
}
__decorate([
    serialize()
], BloomMergePostProcess.prototype, "weight", null);
RegisterClass("BABYLON.BloomMergePostProcess", BloomMergePostProcess);
//# sourceMappingURL=bloomMergePostProcess.js.map