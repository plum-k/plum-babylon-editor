import { PostProcess } from "./postProcess.js";

/**
 * Extracts highlights from the image
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses
 */
export class HighlightsPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "HighlightsPostProcess" string
     */
    getClassName() {
        return "HighlightsPostProcess";
    }
    /**
     * Extracts highlights from the image
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of texture for the post process (default: Engine.TEXTURETYPE_UNSIGNED_BYTE)
     */
    constructor(name, options, camera, samplingMode, engine, reusable, textureType = 0) {
        super(name, "highlights", null, null, options, camera, samplingMode, engine, reusable, null, textureType);
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/highlights.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/highlights.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
}
//# sourceMappingURL=highlightsPostProcess.js.map