import { __decorate } from "../tslib.es6.js";

import { PostProcess } from "./postProcess.js";
import { AbstractEngine } from "../Engines/abstractEngine.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "./thinPassPostProcess.js";
import { serialize } from "../Misc/decorators.js";
/**
 * PassPostProcess which produces an output the same as it's input
 */
export class PassPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "PassPostProcess" string
     */
    getClassName() {
        return "PassPostProcess";
    }
    /**
     * Creates the PassPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name, options, camera = null, samplingMode, engine, reusable, textureType = 0, blockCompilation = false) {
        const localOptions = {
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...options,
        };
        super(name, ThinPassPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinPassPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new PassPostProcess(parsedPostProcess.name, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, parsedPostProcess._engine, parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
RegisterClass("BABYLON.PassPostProcess", PassPostProcess);
/**
 * PassCubePostProcess which produces an output the same as it's input (which must be a cube texture)
 */
export class PassCubePostProcess extends PostProcess {
    /**
     * Gets or sets the cube face to display.
     *  * 0 is +X
     *  * 1 is -X
     *  * 2 is +Y
     *  * 3 is -Y
     *  * 4 is +Z
     *  * 5 is -Z
     */
    get face() {
        return this._effectWrapper.face;
    }
    set face(value) {
        this._effectWrapper.face = value;
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "PassCubePostProcess" string
     */
    getClassName() {
        return "PassCubePostProcess";
    }
    /**
     * Creates the PassCubePostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name, options, camera = null, samplingMode, engine, reusable, textureType = 0, blockCompilation = false) {
        const localOptions = {
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...options,
        };
        super(name, ThinPassPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinPassCubePostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new PassCubePostProcess(parsedPostProcess.name, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, parsedPostProcess._engine, parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], PassCubePostProcess.prototype, "face", null);
AbstractEngine._RescalePostProcessFactory = (engine) => {
    return new PassPostProcess("rescale", 1, null, 2, engine, false, 0);
};
//# sourceMappingURL=passPostProcess.js.map