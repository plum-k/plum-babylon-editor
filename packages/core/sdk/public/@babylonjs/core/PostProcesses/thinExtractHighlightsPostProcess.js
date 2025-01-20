import { EffectWrapper } from "../Materials/effectRenderer.js";
import { ToGammaSpace } from "../Maths/math.constants.js";
import { Engine } from "../Engines/engine.js";
/**
 * Post process used to extract highlights.
 */
export class ThinExtractHighlightsPostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/extractHighlights.fragment.js"));
        }
        else {
            list.push(import("../Shaders/extractHighlights.fragment.js"));
        }
    }
    /**
     * Constructs a new extract highlights post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinExtractHighlightsPostProcess.FragmentUrl,
            uniforms: ThinExtractHighlightsPostProcess.Uniforms,
        });
        /**
         * The luminance threshold, pixels below this value will be set to black.
         */
        this.threshold = 0.9;
        /** @internal */
        this._exposure = 1;
    }
    bind() {
        super.bind();
        const effect = this._drawWrapper.effect;
        effect.setFloat("threshold", Math.pow(this.threshold, ToGammaSpace));
        effect.setFloat("exposure", this._exposure);
    }
}
/**
 * The fragment shader url
 */
ThinExtractHighlightsPostProcess.FragmentUrl = "extractHighlights";
/**
 * The list of uniforms used by the effect
 */
ThinExtractHighlightsPostProcess.Uniforms = ["threshold", "exposure"];
//# sourceMappingURL=thinExtractHighlightsPostProcess.js.map