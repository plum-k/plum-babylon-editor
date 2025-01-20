import { PostProcess } from "./postProcess.js";

/** Defines operator used for tonemapping */
export var TonemappingOperator;
(function (TonemappingOperator) {
    /** Hable */
    TonemappingOperator[TonemappingOperator["Hable"] = 0] = "Hable";
    /** Reinhard */
    TonemappingOperator[TonemappingOperator["Reinhard"] = 1] = "Reinhard";
    /** HejiDawson */
    TonemappingOperator[TonemappingOperator["HejiDawson"] = 2] = "HejiDawson";
    /** Photographic */
    TonemappingOperator[TonemappingOperator["Photographic"] = 3] = "Photographic";
})(TonemappingOperator || (TonemappingOperator = {}));
/**
 * Defines a post process to apply tone mapping
 */
export class TonemapPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "TonemapPostProcess" string
     */
    getClassName() {
        return "TonemapPostProcess";
    }
    /**
     * Creates a new TonemapPostProcess
     * @param name defines the name of the postprocess
     * @param _operator defines the operator to use
     * @param exposureAdjustment defines the required exposure adjustment
     * @param camera defines the camera to use (can be null)
     * @param samplingMode defines the required sampling mode (BABYLON.Texture.BILINEAR_SAMPLINGMODE by default)
     * @param engine defines the hosting engine (can be ignore if camera is set)
     * @param textureFormat defines the texture format to use (BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name, _operator, 
    /** Defines the required exposure adjustment */
    exposureAdjustment, camera, samplingMode = 2, engine, textureFormat = 0, reusable) {
        super(name, "tonemap", ["_ExposureAdjustment"], null, 1.0, camera, samplingMode, engine, reusable, null, textureFormat);
        this._operator = _operator;
        this.exposureAdjustment = exposureAdjustment;
        let defines = "#define ";
        if (this._operator === 0 /* TonemappingOperator.Hable */) {
            defines += "HABLE_TONEMAPPING";
        }
        else if (this._operator === 1 /* TonemappingOperator.Reinhard */) {
            defines += "REINHARD_TONEMAPPING";
        }
        else if (this._operator === 2 /* TonemappingOperator.HejiDawson */) {
            defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
        }
        else if (this._operator === 3 /* TonemappingOperator.Photographic */) {
            defines += "PHOTOGRAPHIC_TONEMAPPING";
        }
        //sadly a second call to create the effect.
        this.updateEffect(defines);
        this.onApply = (effect) => {
            effect.setFloat("_ExposureAdjustment", this.exposureAdjustment);
        };
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/tonemap.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/tonemap.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
}
//# sourceMappingURL=tonemapPostProcess.js.map