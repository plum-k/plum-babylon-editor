import { PostProcess } from "./postProcess.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * DisplayPassPostProcess which produces an output the same as it's input
 */
export class DisplayPassPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "DisplayPassPostProcess" string
     */
    getClassName() {
        return "DisplayPassPostProcess";
    }
    /**
     * Creates the DisplayPassPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name, options, camera, samplingMode, engine, reusable) {
        super(name, "displayPass", ["passSampler"], ["passSampler"], options, camera, samplingMode, engine, reusable);
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/displayPass.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/displayPass.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new DisplayPassPostProcess(parsedPostProcess.name, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
RegisterClass("BABYLON.DisplayPassPostProcess", DisplayPassPostProcess);
//# sourceMappingURL=displayPassPostProcess.js.map