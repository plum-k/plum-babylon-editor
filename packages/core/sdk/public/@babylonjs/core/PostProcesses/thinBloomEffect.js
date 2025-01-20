import { ThinBloomMergePostProcess } from "./thinBloomMergePostProcess.js";
import { Vector2 } from "../Maths/math.vector.js";
import { ThinBlurPostProcess } from "./thinBlurPostProcess.js";
import { ThinExtractHighlightsPostProcess } from "./thinExtractHighlightsPostProcess.js";
/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class ThinBloomEffect {
    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    get threshold() {
        return this._downscale.threshold;
    }
    set threshold(value) {
        this._downscale.threshold = value;
    }
    /**
     * The strength of the bloom.
     */
    get weight() {
        return this._merge.weight;
    }
    set weight(value) {
        this._merge.weight = value;
    }
    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    get kernel() {
        return this._blurX.kernel / this.scale;
    }
    set kernel(value) {
        this._blurX.kernel = value * this.scale;
        this._blurY.kernel = value * this.scale;
    }
    /**
     * Creates a new instance of @see ThinBloomEffect
     * @param name The name of the bloom render effect
     * @param engine The engine which the render effect will be applied. (default: current engine)
     * @param scale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param blockCompilation If shaders should not be compiled when the effect is created (default: false)
     */
    constructor(name, engine, scale, blockCompilation = false) {
        this.scale = scale;
        this._downscale = new ThinExtractHighlightsPostProcess(name + "_downscale", engine, { blockCompilation });
        this._blurX = new ThinBlurPostProcess(name + "_blurX", engine, new Vector2(1, 0), 10, { blockCompilation });
        this._blurY = new ThinBlurPostProcess(name + "_blurY", engine, new Vector2(0, 1), 10, { blockCompilation });
        this._merge = new ThinBloomMergePostProcess(name + "_merge", engine, { blockCompilation });
    }
    /**
     * Checks if the effect is ready to be used
     * @returns if the effect is ready
     */
    isReady() {
        return this._downscale.isReady() && this._blurX.isReady() && this._blurY.isReady() && this._merge.isReady();
    }
}
//# sourceMappingURL=thinBloomEffect.js.map