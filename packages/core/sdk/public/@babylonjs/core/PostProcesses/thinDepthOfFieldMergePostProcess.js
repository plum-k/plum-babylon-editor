import { EffectWrapper } from "../Materials/effectRenderer.js";
import { Engine } from "../Engines/engine.js";
/**
 * @internal
 */
export class ThinDepthOfFieldMergePostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/depthOfFieldMerge.fragment.js"));
        }
        else {
            list.push(import("../Shaders/depthOfFieldMerge.fragment.js"));
        }
    }
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinDepthOfFieldMergePostProcess.FragmentUrl,
            samplers: ThinDepthOfFieldMergePostProcess.Samplers,
        });
    }
}
ThinDepthOfFieldMergePostProcess.FragmentUrl = "depthOfFieldMerge";
ThinDepthOfFieldMergePostProcess.Samplers = ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2"];
//# sourceMappingURL=thinDepthOfFieldMergePostProcess.js.map