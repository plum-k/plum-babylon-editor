import { EffectWrapper } from "../Materials/effectRenderer.js";
import { Engine } from "../Engines/engine.js";
/**
 * @internal
 */
export class ThinBloomMergePostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/bloomMerge.fragment.js"));
        }
        else {
            list.push(import("../Shaders/bloomMerge.fragment.js"));
        }
    }
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinBloomMergePostProcess.FragmentUrl,
            uniforms: ThinBloomMergePostProcess.Uniforms,
            samplers: ThinBloomMergePostProcess.Samplers,
        });
        /** Weight of the bloom to be added to the original input. */
        this.weight = 1;
    }
    bind() {
        super.bind();
        this._drawWrapper.effect.setFloat("bloomWeight", this.weight);
    }
}
ThinBloomMergePostProcess.FragmentUrl = "bloomMerge";
ThinBloomMergePostProcess.Uniforms = ["bloomWeight"];
ThinBloomMergePostProcess.Samplers = ["bloomBlur"];
//# sourceMappingURL=thinBloomMergePostProcess.js.map