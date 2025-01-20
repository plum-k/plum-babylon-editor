import { PostProcessRenderEffect } from "../PostProcesses/RenderPipeline/postProcessRenderEffect.js";
import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess.js";
import { BlurPostProcess } from "./blurPostProcess.js";
import { BloomMergePostProcess } from "./bloomMergePostProcess.js";
import { Texture } from "../Materials/Textures/texture.js";
import { ThinBloomEffect } from "./thinBloomEffect.js";
/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class BloomEffect extends PostProcessRenderEffect {
    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    get threshold() {
        return this._thinBloomEffect.threshold;
    }
    set threshold(value) {
        this._thinBloomEffect.threshold = value;
    }
    /**
     * The strength of the bloom.
     */
    get weight() {
        return this._thinBloomEffect.weight;
    }
    set weight(value) {
        this._thinBloomEffect.weight = value;
    }
    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    get kernel() {
        return this._thinBloomEffect.kernel;
    }
    set kernel(value) {
        this._thinBloomEffect.kernel = value;
    }
    get bloomScale() {
        return this._thinBloomEffect.scale;
    }
    /**
     * Creates a new instance of @see BloomEffect
     * @param sceneOrEngine The scene or engine the effect belongs to.
     * @param bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param bloomWeight The strength of bloom.
     * @param bloomKernel The size of the kernel to be used when applying the blur.
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(sceneOrEngine, bloomScale, bloomWeight, bloomKernel, pipelineTextureType = 0, blockCompilation = false) {
        const engine = sceneOrEngine._renderForCamera ? sceneOrEngine.getEngine() : sceneOrEngine;
        super(engine, "bloom", () => {
            return this._effects;
        }, true);
        /**
         * @internal Internal
         */
        this._effects = [];
        this._thinBloomEffect = new ThinBloomEffect("bloom", engine, bloomScale, blockCompilation);
        this._downscale = new ExtractHighlightsPostProcess("highlights", {
            size: 1.0,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._downscale,
        });
        this._blurX = new BlurPostProcess("horizontal blur", this._thinBloomEffect._blurX.direction, this._thinBloomEffect._blurX.kernel, {
            size: bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._blurX,
        });
        this._blurX.alwaysForcePOT = true;
        this._blurX.autoClear = false;
        this._blurY = new BlurPostProcess("vertical blur", this._thinBloomEffect._blurY.direction, this._thinBloomEffect._blurY.kernel, {
            size: bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._blurY,
        });
        this._blurY.alwaysForcePOT = true;
        this._blurY.autoClear = false;
        this.kernel = bloomKernel;
        this._effects = [this._downscale, this._blurX, this._blurY];
        this._merge = new BloomMergePostProcess("bloomMerge", this._downscale, this._blurY, bloomWeight, {
            size: bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._merge,
        });
        this._merge.autoClear = false;
        this._effects.push(this._merge);
    }
    /**
     * Disposes each of the internal effects for a given camera.
     * @param camera The camera to dispose the effect on.
     */
    disposeEffects(camera) {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].dispose(camera);
        }
    }
    /**
     * @internal Internal
     */
    _updateEffects() {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].updateEffect();
        }
    }
    /**
     * Internal
     * @returns if all the contained post processes are ready.
     * @internal
     */
    _isReady() {
        return this._thinBloomEffect.isReady();
    }
}
//# sourceMappingURL=bloomEffect.js.map