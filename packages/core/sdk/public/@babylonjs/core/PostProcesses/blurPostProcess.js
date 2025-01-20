import { __decorate } from "../tslib.es6.js";
import { PostProcess } from "./postProcess.js";
import { Texture } from "../Materials/Textures/texture.js";

import { RegisterClass } from "../Misc/typeStore.js";
import { serialize, serializeAsVector2 } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { ThinBlurPostProcess } from "./thinBlurPostProcess.js";
/**
 * The Blur Post Process which blurs an image based on a kernel and direction.
 * Can be used twice in x and y directions to perform a gaussian blur in two passes.
 */
export class BlurPostProcess extends PostProcess {
    /** The direction in which to blur the image. */
    get direction() {
        return this._effectWrapper.direction;
    }
    set direction(value) {
        this._effectWrapper.direction = value;
    }
    /**
     * Sets the length in pixels of the blur sample region
     */
    set kernel(v) {
        this._effectWrapper.kernel = v;
    }
    /**
     * Gets the length in pixels of the blur sample region
     */
    get kernel() {
        return this._effectWrapper.kernel;
    }
    /**
     * Sets whether or not the blur needs to unpack/repack floats
     */
    set packedFloat(v) {
        this._effectWrapper.packedFloat = v;
    }
    /**
     * Gets whether or not the blur is unpacking/repacking floats
     */
    get packedFloat() {
        return this._effectWrapper.packedFloat;
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "BlurPostProcess" string
     */
    getClassName() {
        return "BlurPostProcess";
    }
    /**
     * Creates a new instance BlurPostProcess
     * @param name The name of the effect.
     * @param direction The direction in which to blur the image.
     * @param kernel The size of the kernel to be used when computing the blur. eg. Size of 3 will blur the center pixel by 2 pixels surrounding it.
     * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param defines
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
     */
    constructor(name, direction, kernel, options, camera = null, samplingMode = Texture.BILINEAR_SAMPLINGMODE, engine, reusable, textureType = 0, defines = "", blockCompilation = false, textureFormat = 5) {
        const blockCompilationFinal = typeof options === "number" ? blockCompilation : !!options.blockCompilation;
        const localOptions = {
            uniforms: ThinBlurPostProcess.Uniforms,
            samplers: ThinBlurPostProcess.Samplers,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            vertexUrl: ThinBlurPostProcess.VertexUrl,
            indexParameters: { varyingCount: 0, depCount: 0 },
            textureFormat,
            defines,
            ...options,
            blockCompilation: true,
        };
        super(name, ThinBlurPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinBlurPostProcess(name, engine, undefined, undefined, localOptions) : undefined,
            ...localOptions,
        });
        this._effectWrapper.options.blockCompilation = blockCompilationFinal;
        this.direction = direction;
        this.onApplyObservable.add(() => {
            this._effectWrapper.textureWidth = this._outputTexture ? this._outputTexture.width : this.width;
            this._effectWrapper.textureHeight = this._outputTexture ? this._outputTexture.height : this.height;
        });
        this.kernel = kernel;
    }
    updateEffect(_defines = null, _uniforms = null, _samplers = null, _indexParameters, onCompiled, onError) {
        this._effectWrapper._updateParameters(onCompiled, onError);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new BlurPostProcess(parsedPostProcess.name, parsedPostProcess.direction, parsedPostProcess.kernel, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable, parsedPostProcess.textureType, undefined, false);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serializeAsVector2()
], BlurPostProcess.prototype, "direction", null);
__decorate([
    serialize()
], BlurPostProcess.prototype, "kernel", null);
__decorate([
    serialize()
], BlurPostProcess.prototype, "packedFloat", null);
RegisterClass("BABYLON.BlurPostProcess", BlurPostProcess);
//# sourceMappingURL=blurPostProcess.js.map