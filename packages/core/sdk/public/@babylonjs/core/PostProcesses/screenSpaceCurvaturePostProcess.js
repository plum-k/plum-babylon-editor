import { __decorate } from "../tslib.es6.js";
import { Logger } from "../Misc/logger.js";
import { PostProcess } from "./postProcess.js";

import "../Rendering/geometryBufferRendererSceneComponent.js";
import "../Shaders/screenSpaceCurvature.fragment.js";
import { EngineStore } from "../Engines/engineStore.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * The Screen Space curvature effect can help highlighting ridge and valley of a model.
 */
export class ScreenSpaceCurvaturePostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "ScreenSpaceCurvaturePostProcess" string
     */
    getClassName() {
        return "ScreenSpaceCurvaturePostProcess";
    }
    /**
     * Creates a new instance ScreenSpaceCurvaturePostProcess
     * @param name The name of the effect.
     * @param scene The scene containing the objects to blur according to their velocity.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name, scene, options, camera, samplingMode, engine, reusable, textureType = 0, blockCompilation = false) {
        super(name, "screenSpaceCurvature", ["curvature_ridge", "curvature_valley"], ["textureSampler", "normalSampler"], options, camera, samplingMode, engine, reusable, undefined, textureType, undefined, null, blockCompilation);
        /**
         * Defines how much ridge the curvature effect displays.
         */
        this.ridge = 1;
        /**
         * Defines how much valley the curvature effect displays.
         */
        this.valley = 1;
        this._geometryBufferRenderer = scene.enableGeometryBufferRenderer();
        if (!this._geometryBufferRenderer) {
            // Geometry buffer renderer is not supported. So, work as a passthrough.
            Logger.Error("Multiple Render Target support needed for screen space curvature post process. Please use IsSupported test first.");
        }
        else {
            if (this._geometryBufferRenderer.generateNormalsInWorldSpace) {
                Logger.Error("ScreenSpaceCurvaturePostProcess does not support generateNormalsInWorldSpace=true for the geometry buffer renderer!");
            }
            // Geometry buffer renderer is supported.
            this.onApply = (effect) => {
                effect.setFloat("curvature_ridge", 0.5 / Math.max(this.ridge * this.ridge, 1e-4));
                effect.setFloat("curvature_valley", 0.7 / Math.max(this.valley * this.valley, 1e-4));
                const normalTexture = this._geometryBufferRenderer.getGBuffer().textures[1];
                effect.setTexture("normalSampler", normalTexture);
            };
        }
    }
    /**
     * Support test.
     */
    static get IsSupported() {
        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }
        return engine.getCaps().drawBuffersExtension;
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new ScreenSpaceCurvaturePostProcess(parsedPostProcess.name, scene, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.textureType, parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], ScreenSpaceCurvaturePostProcess.prototype, "ridge", void 0);
__decorate([
    serialize()
], ScreenSpaceCurvaturePostProcess.prototype, "valley", void 0);
RegisterClass("BABYLON.ScreenSpaceCurvaturePostProcess", ScreenSpaceCurvaturePostProcess);
//# sourceMappingURL=screenSpaceCurvaturePostProcess.js.map