import { Texture } from "../Materials/Textures/texture.js";
import { PostProcess } from "./postProcess.js";

import { RegisterClass } from "../Misc/typeStore.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * Fxaa post process
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#fxaa
 */
export class FxaaPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "FxaaPostProcess" string
     */
    getClassName() {
        return "FxaaPostProcess";
    }
    constructor(name, options, camera = null, samplingMode, engine, reusable, textureType = 0) {
        super(name, "fxaa", ["texelSize"], null, options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "fxaa", undefined, true);
        const defines = this._getDefines();
        this.updateEffect(defines);
        this.onApplyObservable.add((effect) => {
            const texelSize = this.texelSize;
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
        });
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/fxaa.fragment.js"), import("../ShadersWGSL/fxaa.vertex.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/fxaa.fragment.js"), import("../Shaders/fxaa.vertex.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    _getDefines() {
        const engine = this.getEngine();
        if (!engine) {
            return null;
        }
        const driverInfo = engine.extractDriverInfo();
        if (driverInfo.toLowerCase().indexOf("mali") > -1) {
            return "#define MALI 1\n";
        }
        return null;
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new FxaaPostProcess(parsedPostProcess.name, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
RegisterClass("BABYLON.FxaaPostProcess", FxaaPostProcess);
//# sourceMappingURL=fxaaPostProcess.js.map