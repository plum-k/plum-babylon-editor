import { __decorate } from "../../../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { Vector2, TmpVectors } from "../../../Maths/math.vector.js";
import { Texture } from "../../../Materials/Textures/texture.js";
import { PostProcess } from "../../../PostProcesses/postProcess.js";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect.js";
import { PassPostProcess } from "../../../PostProcesses/passPostProcess.js";
import { BlurPostProcess } from "../../../PostProcesses/blurPostProcess.js";

import { serialize } from "../../../Misc/decorators.js";
import { RawTexture } from "../../../Materials/Textures/rawTexture.js";
import { RandomRange } from "../../../Maths/math.scalar.functions.js";
import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.js";
import "../../../Shaders/ssao.fragment.js";
import "../../../Shaders/ssaoCombine.fragment.js";
/**
 * Render pipeline to produce ssao effect
 */
export class SSAORenderingPipeline extends PostProcessRenderPipeline {
    /**
     * Gets active scene
     */
    get scene() {
        return this._scene;
    }
    /**
     * @constructor
     * @param name - The rendering pipeline name
     * @param scene - The scene linked to this pipeline
     * @param ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
     * @param cameras - The array of cameras that the rendering pipeline will be attached to
     */
    constructor(name, scene, ratio, cameras) {
        super(scene.getEngine(), name);
        // Members
        /**
         * @ignore
         * The PassPostProcess id in the pipeline that contains the original scene color
         */
        this.SSAOOriginalSceneColorEffect = "SSAOOriginalSceneColorEffect";
        /**
         * @ignore
         * The SSAO PostProcess id in the pipeline
         */
        this.SSAORenderEffect = "SSAORenderEffect";
        /**
         * @ignore
         * The horizontal blur PostProcess id in the pipeline
         */
        this.SSAOBlurHRenderEffect = "SSAOBlurHRenderEffect";
        /**
         * @ignore
         * The vertical blur PostProcess id in the pipeline
         */
        this.SSAOBlurVRenderEffect = "SSAOBlurVRenderEffect";
        /**
         * @ignore
         * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
         */
        this.SSAOCombineRenderEffect = "SSAOCombineRenderEffect";
        /**
         * The output strength of the SSAO post-process. Default value is 1.0.
         */
        this.totalStrength = 1.0;
        /**
         * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
         */
        this.radius = 0.0001;
        /**
         * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
         * Must not be equal to fallOff and superior to fallOff.
         * Default value is 0.0075
         */
        this.area = 0.0075;
        /**
         * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
         * Must not be equal to area and inferior to area.
         * Default value is 0.000001
         */
        this.fallOff = 0.000001;
        /**
         * The base color of the SSAO post-process
         * The final result is "base + ssao" between [0, 1]
         */
        this.base = 0.5;
        this._firstUpdate = true;
        this._scene = scene;
        // Set up assets
        this._createRandomTexture();
        const ssaoRatio = ratio.ssaoRatio || ratio;
        const combineRatio = ratio.combineRatio || ratio;
        this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", combineRatio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
        this._createSSAOPostProcess(ssaoRatio);
        this._createBlurPostProcess(ssaoRatio);
        this._createSSAOCombinePostProcess(combineRatio);
        // Set up pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOOriginalSceneColorEffect, () => {
            return this._originalColorPostProcess;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAORenderEffect, () => {
            return this._ssaoPostProcess;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurHRenderEffect, () => {
            return this._blurHPostProcess;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurVRenderEffect, () => {
            return this._blurVPostProcess;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOCombineRenderEffect, () => {
            return this._ssaoCombinePostProcess;
        }, true));
        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        if (cameras) {
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }
    }
    /**
     * @internal
     */
    _attachCameras(cameras, unique) {
        super._attachCameras(cameras, unique);
        for (const camera of this._cameras) {
            this._scene.enableDepthRenderer(camera).getDepthMap(); // Force depth renderer "on"
        }
    }
    // Public Methods
    /**
     * Get the class name
     * @returns "SSAORenderingPipeline"
     */
    getClassName() {
        return "SSAORenderingPipeline";
    }
    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableDepthRender - If the depth renderer should be disabled on the scene
     */
    dispose(disableDepthRender = false) {
        for (let i = 0; i < this._scene.cameras.length; i++) {
            const camera = this._scene.cameras[i];
            this._originalColorPostProcess.dispose(camera);
            this._ssaoPostProcess.dispose(camera);
            this._blurHPostProcess.dispose(camera);
            this._blurVPostProcess.dispose(camera);
            this._ssaoCombinePostProcess.dispose(camera);
        }
        this._randomTexture.dispose();
        if (disableDepthRender) {
            this._scene.disableDepthRenderer();
        }
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
        super.dispose();
    }
    // Private Methods
    _createBlurPostProcess(ratio) {
        const size = 16;
        this._blurHPostProcess = new BlurPostProcess("BlurH", new Vector2(1, 0), size, ratio, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, 0);
        this._blurVPostProcess = new BlurPostProcess("BlurV", new Vector2(0, 1), size, ratio, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, 0);
        this._blurHPostProcess.onActivateObservable.add(() => {
            const dw = this._blurHPostProcess.width / this._scene.getEngine().getRenderWidth();
            this._blurHPostProcess.kernel = size * dw;
        });
        this._blurVPostProcess.onActivateObservable.add(() => {
            const dw = this._blurVPostProcess.height / this._scene.getEngine().getRenderHeight();
            this._blurVPostProcess.kernel = size * dw;
        });
    }
    /** @internal */
    _rebuild() {
        this._firstUpdate = true;
        super._rebuild();
    }
    _createSSAOPostProcess(ratio) {
        const numSamples = 16;
        const sampleSphere = [
            0.5381, 0.1856, -0.4319, 0.1379, 0.2486, 0.443, 0.3371, 0.5679, -0.0057, -0.6999, -0.0451, -0.0019, 0.0689, -0.1598, -0.8547, 0.056, 0.0069, -0.1843, -0.0146, 0.1402,
            0.0762, 0.01, -0.1924, -0.0344, -0.3577, -0.5301, -0.4358, -0.3169, 0.1063, 0.0158, 0.0103, -0.5869, 0.0046, -0.0897, -0.494, 0.3287, 0.7119, -0.0154, -0.0918, -0.0533,
            0.0596, -0.5411, 0.0352, -0.0631, 0.546, -0.4776, 0.2847, -0.0271,
        ];
        const samplesFactor = 1.0 / numSamples;
        this._ssaoPostProcess = new PostProcess("ssao", "ssao", ["sampleSphere", "samplesFactor", "randTextureTiles", "totalStrength", "radius", "area", "fallOff", "base", "range", "viewport"], ["randomSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define SAMPLES " + numSamples + "\n#define SSAO");
        this._ssaoPostProcess.externalTextureSamplerBinding = true;
        this._ssaoPostProcess.onApply = (effect) => {
            if (this._firstUpdate) {
                effect.setArray3("sampleSphere", sampleSphere);
                effect.setFloat("samplesFactor", samplesFactor);
                effect.setFloat("randTextureTiles", 4.0);
            }
            effect.setFloat("totalStrength", this.totalStrength);
            effect.setFloat("radius", this.radius);
            effect.setFloat("area", this.area);
            effect.setFloat("fallOff", this.fallOff);
            effect.setFloat("base", this.base);
            effect.setTexture("textureSampler", this._scene.enableDepthRenderer(this._scene.activeCamera).getDepthMap());
            effect.setTexture("randomSampler", this._randomTexture);
        };
    }
    _createSSAOCombinePostProcess(ratio) {
        this._ssaoCombinePostProcess = new PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor", "viewport"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
        this._ssaoCombinePostProcess.onApply = (effect) => {
            effect.setVector4("viewport", TmpVectors.Vector4[0].copyFromFloats(0, 0, 1.0, 1.0));
            effect.setTextureFromPostProcess("originalColor", this._originalColorPostProcess);
        };
    }
    _createRandomTexture() {
        const size = 512;
        const data = new Uint8Array(size * size * 4);
        for (let index = 0; index < data.length;) {
            data[index++] = Math.floor(Math.max(0.0, RandomRange(-1.0, 1.0)) * 255);
            data[index++] = Math.floor(Math.max(0.0, RandomRange(-1.0, 1.0)) * 255);
            data[index++] = Math.floor(Math.max(0.0, RandomRange(-1.0, 1.0)) * 255);
            data[index++] = 255;
        }
        const texture = RawTexture.CreateRGBATexture(data, size, size, this._scene, false, false, 2);
        texture.name = "SSAORandomTexture";
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        this._randomTexture = texture;
    }
}
__decorate([
    serialize()
], SSAORenderingPipeline.prototype, "totalStrength", void 0);
__decorate([
    serialize()
], SSAORenderingPipeline.prototype, "radius", void 0);
__decorate([
    serialize()
], SSAORenderingPipeline.prototype, "area", void 0);
__decorate([
    serialize()
], SSAORenderingPipeline.prototype, "fallOff", void 0);
__decorate([
    serialize()
], SSAORenderingPipeline.prototype, "base", void 0);
//# sourceMappingURL=ssaoRenderingPipeline.js.map