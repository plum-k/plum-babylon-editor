import { __decorate } from "../tslib.es6.js";
import { Vector2 } from "../Maths/math.vector.js";
import { PostProcess } from "./postProcess.js";

import { RegisterClass } from "../Misc/typeStore.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * The ChromaticAberrationPostProcess separates the rgb channels in an image to produce chromatic distortion around the edges of the screen
 */
export class ChromaticAberrationPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "ChromaticAberrationPostProcess" string
     */
    getClassName() {
        return "ChromaticAberrationPostProcess";
    }
    /**
     * Creates a new instance ChromaticAberrationPostProcess
     * @param name The name of the effect.
     * @param screenWidth The width of the screen to apply the effect on.
     * @param screenHeight The height of the screen to apply the effect on.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name, screenWidth, screenHeight, options, camera, samplingMode, engine, reusable, textureType = 0, blockCompilation = false) {
        super(name, "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"], [], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);
        /**
         * The amount of separation of rgb channels (default: 30)
         */
        this.aberrationAmount = 30;
        /**
         * The amount the effect will increase for pixels closer to the edge of the screen. (default: 0)
         */
        this.radialIntensity = 0;
        /**
         * The normalized direction in which the rgb channels should be separated. If set to 0,0 radial direction will be used. (default: Vector2(0.707,0.707))
         */
        this.direction = new Vector2(0.707, 0.707);
        /**
         * The center position where the radialIntensity should be around. [0.5,0.5 is center of screen, 1,1 is top right corner] (default: Vector2(0.5 ,0.5))
         */
        this.centerPosition = new Vector2(0.5, 0.5);
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.onApplyObservable.add((effect) => {
            effect.setFloat("chromatic_aberration", this.aberrationAmount);
            effect.setFloat("screen_width", screenWidth);
            effect.setFloat("screen_height", screenHeight);
            effect.setFloat("radialIntensity", this.radialIntensity);
            effect.setFloat2("direction", this.direction.x, this.direction.y);
            effect.setFloat2("centerPosition", this.centerPosition.x, this.centerPosition.y);
        });
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/chromaticAberration.fragment.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/chromaticAberration.fragment.js")]));
        }
        super._gatherImports(useWebGPU, list);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new ChromaticAberrationPostProcess(parsedPostProcess.name, parsedPostProcess.screenWidth, parsedPostProcess.screenHeight, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable, parsedPostProcess.textureType, false);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], ChromaticAberrationPostProcess.prototype, "aberrationAmount", void 0);
__decorate([
    serialize()
], ChromaticAberrationPostProcess.prototype, "radialIntensity", void 0);
__decorate([
    serialize()
], ChromaticAberrationPostProcess.prototype, "direction", void 0);
__decorate([
    serialize()
], ChromaticAberrationPostProcess.prototype, "centerPosition", void 0);
__decorate([
    serialize()
], ChromaticAberrationPostProcess.prototype, "screenWidth", void 0);
__decorate([
    serialize()
], ChromaticAberrationPostProcess.prototype, "screenHeight", void 0);
RegisterClass("BABYLON.ChromaticAberrationPostProcess", ChromaticAberrationPostProcess);
//# sourceMappingURL=chromaticAberrationPostProcess.js.map