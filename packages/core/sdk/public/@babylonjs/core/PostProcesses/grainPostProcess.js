import { __decorate } from "../tslib.es6.js";
import { PostProcess } from "./postProcess.js";

import { RegisterClass } from "../Misc/typeStore.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * The GrainPostProcess adds noise to the image at mid luminance levels
 */
export class GrainPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "GrainPostProcess" string
     */
    getClassName() {
        return "GrainPostProcess";
    }
    /**
     * Creates a new instance of @see GrainPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name, options, camera, samplingMode, engine, reusable, textureType = 0, blockCompilation = false) {
        super(name, "grain", ["intensity", "animatedSeed"], [], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);
        /**
         * The intensity of the grain added (default: 30)
         */
        this.intensity = 30;
        /**
         * If the grain should be randomized on every frame
         */
        this.animated = false;
        this.onApplyObservable.add((effect) => {
            effect.setFloat("intensity", this.intensity);
            effect.setFloat("animatedSeed", this.animated ? Math.random() + 1 : 1);
        });
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/grain.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/grain.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new GrainPostProcess(parsedPostProcess.name, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], GrainPostProcess.prototype, "intensity", void 0);
__decorate([
    serialize()
], GrainPostProcess.prototype, "animated", void 0);
RegisterClass("BABYLON.GrainPostProcess", GrainPostProcess);
//# sourceMappingURL=grainPostProcess.js.map