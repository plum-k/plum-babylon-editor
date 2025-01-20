import { ThinBlurPostProcess } from "./thinBlurPostProcess.js";
import { ThinCircleOfConfusionPostProcess } from "./thinCircleOfConfusionPostProcess.js";
import { ThinDepthOfFieldMergePostProcess } from "./thinDepthOfFieldMergePostProcess.js";
import { Vector2 } from "../Maths/math.vector.js";
/**
 * Specifies the level of blur that should be applied when using the depth of field effect
 */
export var ThinDepthOfFieldEffectBlurLevel;
(function (ThinDepthOfFieldEffectBlurLevel) {
    /**
     * Subtle blur
     */
    ThinDepthOfFieldEffectBlurLevel[ThinDepthOfFieldEffectBlurLevel["Low"] = 0] = "Low";
    /**
     * Medium blur
     */
    ThinDepthOfFieldEffectBlurLevel[ThinDepthOfFieldEffectBlurLevel["Medium"] = 1] = "Medium";
    /**
     * Large blur
     */
    ThinDepthOfFieldEffectBlurLevel[ThinDepthOfFieldEffectBlurLevel["High"] = 2] = "High";
})(ThinDepthOfFieldEffectBlurLevel || (ThinDepthOfFieldEffectBlurLevel = {}));
export class ThinDepthOfFieldEffect {
    /**
     * The focal the length of the camera used in the effect in scene units/1000 (eg. millimeter)
     */
    set focalLength(value) {
        this._circleOfConfusion.focalLength = value;
    }
    get focalLength() {
        return this._circleOfConfusion.focalLength;
    }
    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    set fStop(value) {
        this._circleOfConfusion.fStop = value;
    }
    get fStop() {
        return this._circleOfConfusion.fStop;
    }
    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    set focusDistance(value) {
        this._circleOfConfusion.focusDistance = value;
    }
    get focusDistance() {
        return this._circleOfConfusion.focusDistance;
    }
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    set lensSize(value) {
        this._circleOfConfusion.lensSize = value;
    }
    get lensSize() {
        return this._circleOfConfusion.lensSize;
    }
    /**
     * Creates a new instance of @see ThinDepthOfFieldEffect
     * @param name The name of the depth of field render effect
     * @param engine The engine which the render effect will be applied. (default: current engine)
     * @param blurLevel The quality of the effect. (default: DepthOfFieldEffectBlurLevel.Low)
     * @param depthNotNormalized If the (view) depth used in circle of confusion post-process is normalized (0.0 to 1.0 from near to far) or not (0 to camera max distance) (default: false)
     * @param blockCompilation If shaders should not be compiled when the effect is created (default: false)
     */
    constructor(name, engine, blurLevel = 0 /* ThinDepthOfFieldEffectBlurLevel.Low */, depthNotNormalized = false, blockCompilation = false) {
        /** @internal */
        this._depthOfFieldBlurX = [];
        /** @internal */
        this._depthOfFieldBlurY = [];
        this._circleOfConfusion = new ThinCircleOfConfusionPostProcess(name, engine, { depthNotNormalized, blockCompilation });
        this.blurLevel = blurLevel;
        let blurCount = 1;
        let kernelSize = 15;
        switch (blurLevel) {
            case 2 /* ThinDepthOfFieldEffectBlurLevel.High */: {
                blurCount = 3;
                kernelSize = 51;
                break;
            }
            case 1 /* ThinDepthOfFieldEffectBlurLevel.Medium */: {
                blurCount = 2;
                kernelSize = 31;
                break;
            }
            default: {
                kernelSize = 15;
                blurCount = 1;
                break;
            }
        }
        const adjustedKernelSize = kernelSize / Math.pow(2, blurCount - 1);
        let ratio = 1.0;
        for (let i = 0; i < blurCount; i++) {
            this._depthOfFieldBlurY.push([new ThinBlurPostProcess(name, engine, new Vector2(0, 1), adjustedKernelSize, { blockCompilation }), ratio]);
            ratio = 0.75 / Math.pow(2, i);
            this._depthOfFieldBlurX.push([new ThinBlurPostProcess(name, engine, new Vector2(1, 0), adjustedKernelSize, { blockCompilation }), ratio]);
        }
        this._dofMerge = new ThinDepthOfFieldMergePostProcess(name, engine, { blockCompilation });
    }
    /**
     * Checks if the effect is ready to be used
     * @returns if the effect is ready
     */
    isReady() {
        let isReady = this._circleOfConfusion.isReady() && this._dofMerge.isReady();
        for (let i = 0; i < this._depthOfFieldBlurX.length; i++) {
            isReady = isReady && this._depthOfFieldBlurX[i][0].isReady() && this._depthOfFieldBlurY[i][0].isReady();
        }
        return isReady;
    }
}
//# sourceMappingURL=thinDepthOfFieldEffect.js.map