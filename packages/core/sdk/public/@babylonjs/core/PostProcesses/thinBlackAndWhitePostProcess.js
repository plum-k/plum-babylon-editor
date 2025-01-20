import { EffectWrapper } from "../Materials/effectRenderer.js";
import { Engine } from "../Engines/engine.js";
/**
 * Post process used to render in black and white
 */
export class ThinBlackAndWhitePostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/blackAndWhite.fragment.js"));
        }
        else {
            list.push(import("../Shaders/blackAndWhite.fragment.js"));
        }
    }
    /**
     * Constructs a new black and white post process
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
            fragmentShader: ThinBlackAndWhitePostProcess.FragmentUrl,
            uniforms: ThinBlackAndWhitePostProcess.Uniforms,
        });
        /**
         * Effect intensity (default: 1)
         */
        this.degree = 1;
    }
    bind() {
        super.bind();
        this._drawWrapper.effect.setFloat("degree", this.degree);
    }
}
/**
 * The fragment shader url
 */
ThinBlackAndWhitePostProcess.FragmentUrl = "blackAndWhite";
/**
 * The list of uniforms used by the effect
 */
ThinBlackAndWhitePostProcess.Uniforms = ["degree"];
//# sourceMappingURL=thinBlackAndWhitePostProcess.js.map