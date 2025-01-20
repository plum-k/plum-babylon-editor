import { __decorate } from "../tslib.es6.js";
import { PostProcess } from "./postProcess.js";

import { RegisterClass } from "../Misc/typeStore.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * The ConvolutionPostProcess applies a 3x3 kernel to every pixel of the
 * input texture to perform effects such as edge detection or sharpening
 * See http://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
export class ConvolutionPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "ConvolutionPostProcess" string
     */
    getClassName() {
        return "ConvolutionPostProcess";
    }
    /**
     * Creates a new instance ConvolutionPostProcess
     * @param name The name of the effect.
     * @param kernel Array of 9 values corresponding to the 3x3 kernel to be applied
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     */
    constructor(name, kernel, options, camera, samplingMode, engine, reusable, textureType = 0) {
        super(name, "convolution", ["kernel", "screenSize"], null, options, camera, samplingMode, engine, reusable, null, textureType);
        this.kernel = kernel;
        this.onApply = (effect) => {
            effect.setFloat2("screenSize", this.width, this.height);
            effect.setArray("kernel", this.kernel);
        };
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/convolution.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/convolution.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new ConvolutionPostProcess(parsedPostProcess.name, parsedPostProcess.kernel, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable, parsedPostProcess.textureType);
        }, parsedPostProcess, scene, rootUrl);
    }
}
// Statics
/**
 * Edge detection 0 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
ConvolutionPostProcess.EdgeDetect0Kernel = [1, 0, -1, 0, 0, 0, -1, 0, 1];
/**
 * Edge detection 1 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
ConvolutionPostProcess.EdgeDetect1Kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
/**
 * Edge detection 2 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
ConvolutionPostProcess.EdgeDetect2Kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
/**
 * Kernel to sharpen an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
ConvolutionPostProcess.SharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
/**
 * Kernel to emboss an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
ConvolutionPostProcess.EmbossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
/**
 * Kernel to blur an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
ConvolutionPostProcess.GaussianKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];
__decorate([
    serialize()
], ConvolutionPostProcess.prototype, "kernel", void 0);
RegisterClass("BABYLON.ConvolutionPostProcess", ConvolutionPostProcess);
//# sourceMappingURL=convolutionPostProcess.js.map