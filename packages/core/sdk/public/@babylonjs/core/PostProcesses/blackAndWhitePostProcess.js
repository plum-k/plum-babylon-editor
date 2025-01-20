import { __decorate } from "../tslib.es6.js";
import { PostProcess } from "./postProcess.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { ThinBlackAndWhitePostProcess } from "./thinBlackAndWhitePostProcess.js";
/**
 * Post process used to render in black and white
 */
export class BlackAndWhitePostProcess extends PostProcess {
    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    get degree() {
        return this._effectWrapper.degree;
    }
    set degree(value) {
        this._effectWrapper.degree = value;
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "BlackAndWhitePostProcess" string
     */
    getClassName() {
        return "BlackAndWhitePostProcess";
    }
    /**
     * Creates a black and white post process
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#black-and-white
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name, options, camera = null, samplingMode, engine, reusable) {
        const localOptions = {
            uniforms: ThinBlackAndWhitePostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            ...options,
        };
        super(name, ThinBlackAndWhitePostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinBlackAndWhitePostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new BlackAndWhitePostProcess(parsedPostProcess.name, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], BlackAndWhitePostProcess.prototype, "degree", null);
RegisterClass("BABYLON.BlackAndWhitePostProcess", BlackAndWhitePostProcess);
//# sourceMappingURL=blackAndWhitePostProcess.js.map