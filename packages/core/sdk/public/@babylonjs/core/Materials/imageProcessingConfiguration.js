import { __decorate } from "../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serialize, serializeAsTexture, serializeAsColorCurves, serializeAsColor4 } from "../Misc/decorators.js";
import { Observable } from "../Misc/observable.js";
import { Color4 } from "../Maths/math.color.js";
import { ColorCurves } from "../Materials/colorCurves.js";
import { Mix } from "../Misc/tools.functions.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { PrepareSamplersForImageProcessing, PrepareUniformsForImageProcessing } from "./imageProcessingConfiguration.functions.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * This groups together the common properties used for image processing either in direct forward pass
 * or through post processing effect depending on the use of the image processing pipeline in your scene
 * or not.
 */
export class ImageProcessingConfiguration {
    constructor() {
        /**
         * Color curves setup used in the effect if colorCurvesEnabled is set to true
         */
        this.colorCurves = new ColorCurves();
        this._colorCurvesEnabled = false;
        this._colorGradingEnabled = false;
        this._colorGradingWithGreenDepth = true;
        this._colorGradingBGR = true;
        /** @internal */
        this._exposure = 1.0;
        this._toneMappingEnabled = false;
        this._toneMappingType = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
        this._contrast = 1.0;
        /**
         * Vignette stretch size.
         */
        this.vignetteStretch = 0;
        /**
         * Vignette center X Offset.
         */
        this.vignetteCenterX = 0;
        /**
         * Vignette center Y Offset.
         */
        this.vignetteCenterY = 0;
        /**
         * Vignette weight or intensity of the vignette effect.
         */
        this.vignetteWeight = 1.5;
        /**
         * Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
         * if vignetteEnabled is set to true.
         */
        this.vignetteColor = new Color4(0, 0, 0, 0);
        /**
         * Camera field of view used by the Vignette effect.
         */
        this.vignetteCameraFov = 0.5;
        this._vignetteBlendMode = ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
        this._vignetteEnabled = false;
        this._ditheringEnabled = false;
        this._ditheringIntensity = 1.0 / 255.0;
        /** @internal */
        this._skipFinalColorClamp = false;
        /** @internal */
        this._applyByPostProcess = false;
        this._isEnabled = true;
        /**
         * An event triggered when the configuration changes and requires Shader to Update some parameters.
         */
        this.onUpdateParameters = new Observable();
    }
    /**
     * Gets whether the color curves effect is enabled.
     */
    get colorCurvesEnabled() {
        return this._colorCurvesEnabled;
    }
    /**
     * Sets whether the color curves effect is enabled.
     */
    set colorCurvesEnabled(value) {
        if (this._colorCurvesEnabled === value) {
            return;
        }
        this._colorCurvesEnabled = value;
        this._updateParameters();
    }
    /**
     * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
     */
    get colorGradingTexture() {
        return this._colorGradingTexture;
    }
    /**
     * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
     */
    set colorGradingTexture(value) {
        if (this._colorGradingTexture === value) {
            return;
        }
        this._colorGradingTexture = value;
        this._updateParameters();
    }
    /**
     * Gets whether the color grading effect is enabled.
     */
    get colorGradingEnabled() {
        return this._colorGradingEnabled;
    }
    /**
     * Sets whether the color grading effect is enabled.
     */
    set colorGradingEnabled(value) {
        if (this._colorGradingEnabled === value) {
            return;
        }
        this._colorGradingEnabled = value;
        this._updateParameters();
    }
    /**
     * Gets whether the color grading effect is using a green depth for the 3d Texture.
     */
    get colorGradingWithGreenDepth() {
        return this._colorGradingWithGreenDepth;
    }
    /**
     * Sets whether the color grading effect is using a green depth for the 3d Texture.
     */
    set colorGradingWithGreenDepth(value) {
        if (this._colorGradingWithGreenDepth === value) {
            return;
        }
        this._colorGradingWithGreenDepth = value;
        this._updateParameters();
    }
    /**
     * Gets whether the color grading texture contains BGR values.
     */
    get colorGradingBGR() {
        return this._colorGradingBGR;
    }
    /**
     * Sets whether the color grading texture contains BGR values.
     */
    set colorGradingBGR(value) {
        if (this._colorGradingBGR === value) {
            return;
        }
        this._colorGradingBGR = value;
        this._updateParameters();
    }
    /**
     * Gets the Exposure used in the effect.
     */
    get exposure() {
        return this._exposure;
    }
    /**
     * Sets the Exposure used in the effect.
     */
    set exposure(value) {
        if (this._exposure === value) {
            return;
        }
        this._exposure = value;
        this._updateParameters();
    }
    /**
     * Gets whether the tone mapping effect is enabled.
     */
    get toneMappingEnabled() {
        return this._toneMappingEnabled;
    }
    /**
     * Sets whether the tone mapping effect is enabled.
     */
    set toneMappingEnabled(value) {
        if (this._toneMappingEnabled === value) {
            return;
        }
        this._toneMappingEnabled = value;
        this._updateParameters();
    }
    /**
     * Gets the type of tone mapping effect.
     */
    get toneMappingType() {
        return this._toneMappingType;
    }
    /**
     * Sets the type of tone mapping effect used in BabylonJS.
     */
    set toneMappingType(value) {
        if (this._toneMappingType === value) {
            return;
        }
        this._toneMappingType = value;
        this._updateParameters();
    }
    /**
     * Gets the contrast used in the effect.
     */
    get contrast() {
        return this._contrast;
    }
    /**
     * Sets the contrast used in the effect.
     */
    set contrast(value) {
        if (this._contrast === value) {
            return;
        }
        this._contrast = value;
        this._updateParameters();
    }
    /**
     * Back Compat: Vignette center Y Offset.
     * @deprecated use vignetteCenterY instead
     */
    get vignetteCentreY() {
        return this.vignetteCenterY;
    }
    set vignetteCentreY(value) {
        this.vignetteCenterY = value;
    }
    /**
     * Back Compat: Vignette center X Offset.
     * @deprecated use vignetteCenterX instead
     */
    get vignetteCentreX() {
        return this.vignetteCenterX;
    }
    set vignetteCentreX(value) {
        this.vignetteCenterX = value;
    }
    /**
     * Gets the vignette blend mode allowing different kind of effect.
     */
    get vignetteBlendMode() {
        return this._vignetteBlendMode;
    }
    /**
     * Sets the vignette blend mode allowing different kind of effect.
     */
    set vignetteBlendMode(value) {
        if (this._vignetteBlendMode === value) {
            return;
        }
        this._vignetteBlendMode = value;
        this._updateParameters();
    }
    /**
     * Gets whether the vignette effect is enabled.
     */
    get vignetteEnabled() {
        return this._vignetteEnabled;
    }
    /**
     * Sets whether the vignette effect is enabled.
     */
    set vignetteEnabled(value) {
        if (this._vignetteEnabled === value) {
            return;
        }
        this._vignetteEnabled = value;
        this._updateParameters();
    }
    /**
     * Gets whether the dithering effect is enabled.
     * The dithering effect can be used to reduce banding.
     */
    get ditheringEnabled() {
        return this._ditheringEnabled;
    }
    /**
     * Sets whether the dithering effect is enabled.
     * The dithering effect can be used to reduce banding.
     */
    set ditheringEnabled(value) {
        if (this._ditheringEnabled === value) {
            return;
        }
        this._ditheringEnabled = value;
        this._updateParameters();
    }
    /**
     * Gets the dithering intensity. 0 is no dithering. Default is 1.0 / 255.0.
     */
    get ditheringIntensity() {
        return this._ditheringIntensity;
    }
    /**
     * Sets the dithering intensity. 0 is no dithering. Default is 1.0 / 255.0.
     */
    set ditheringIntensity(value) {
        if (this._ditheringIntensity === value) {
            return;
        }
        this._ditheringIntensity = value;
        this._updateParameters();
    }
    /**
     * If apply by post process is set to true, setting this to true will skip the final color clamp step in the fragment shader
     * Applies to PBR materials.
     */
    get skipFinalColorClamp() {
        return this._skipFinalColorClamp;
    }
    /**
     * If apply by post process is set to true, setting this to true will skip the final color clamp step in the fragment shader
     * Applies to PBR materials.
     */
    set skipFinalColorClamp(value) {
        if (this._skipFinalColorClamp === value) {
            return;
        }
        this._skipFinalColorClamp = value;
        this._updateParameters();
    }
    /**
     * Gets whether the image processing is applied through a post process or not.
     */
    get applyByPostProcess() {
        return this._applyByPostProcess;
    }
    /**
     * Sets whether the image processing is applied through a post process or not.
     */
    set applyByPostProcess(value) {
        if (this._applyByPostProcess === value) {
            return;
        }
        this._applyByPostProcess = value;
        this._updateParameters();
    }
    /**
     * Gets whether the image processing is enabled or not.
     */
    get isEnabled() {
        return this._isEnabled;
    }
    /**
     * Sets whether the image processing is enabled or not.
     */
    set isEnabled(value) {
        if (this._isEnabled === value) {
            return;
        }
        this._isEnabled = value;
        this._updateParameters();
    }
    /**
     * Method called each time the image processing information changes requires to recompile the effect.
     */
    _updateParameters() {
        this.onUpdateParameters.notifyObservers(this);
    }
    /**
     * Gets the current class name.
     * @returns "ImageProcessingConfiguration"
     */
    getClassName() {
        return "ImageProcessingConfiguration";
    }
    /**
     * Prepare the list of defines associated to the shader.
     * @param defines the list of defines to complete
     * @param forPostProcess Define if we are currently in post process mode or not
     */
    prepareDefines(defines, forPostProcess = false) {
        if (forPostProcess !== this.applyByPostProcess || !this._isEnabled) {
            defines.VIGNETTE = false;
            defines.TONEMAPPING = 0;
            defines.CONTRAST = false;
            defines.EXPOSURE = false;
            defines.COLORCURVES = false;
            defines.COLORGRADING = false;
            defines.COLORGRADING3D = false;
            defines.DITHER = false;
            defines.IMAGEPROCESSING = false;
            defines.SKIPFINALCOLORCLAMP = this.skipFinalColorClamp;
            defines.IMAGEPROCESSINGPOSTPROCESS = this.applyByPostProcess && this._isEnabled;
            return;
        }
        defines.VIGNETTE = this.vignetteEnabled;
        defines.VIGNETTEBLENDMODEMULTIPLY = this.vignetteBlendMode === ImageProcessingConfiguration._VIGNETTEMODE_MULTIPLY;
        defines.VIGNETTEBLENDMODEOPAQUE = !defines.VIGNETTEBLENDMODEMULTIPLY;
        if (!this._toneMappingEnabled) {
            defines.TONEMAPPING = 0;
        }
        else {
            switch (this._toneMappingType) {
                case ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL:
                    defines.TONEMAPPING = 3;
                    break;
                case ImageProcessingConfiguration.TONEMAPPING_ACES:
                    defines.TONEMAPPING = 2;
                    break;
                default:
                    defines.TONEMAPPING = 1;
                    break;
            }
        }
        defines.CONTRAST = this.contrast !== 1.0;
        defines.EXPOSURE = this.exposure !== 1.0;
        defines.COLORCURVES = this.colorCurvesEnabled && !!this.colorCurves;
        defines.COLORGRADING = this.colorGradingEnabled && !!this.colorGradingTexture;
        if (defines.COLORGRADING) {
            defines.COLORGRADING3D = this.colorGradingTexture.is3D;
        }
        else {
            defines.COLORGRADING3D = false;
        }
        defines.SAMPLER3DGREENDEPTH = this.colorGradingWithGreenDepth;
        defines.SAMPLER3DBGRMAP = this.colorGradingBGR;
        defines.DITHER = this._ditheringEnabled;
        defines.IMAGEPROCESSINGPOSTPROCESS = this.applyByPostProcess;
        defines.SKIPFINALCOLORCLAMP = this.skipFinalColorClamp;
        defines.IMAGEPROCESSING =
            defines.VIGNETTE || !!defines.TONEMAPPING || defines.CONTRAST || defines.EXPOSURE || defines.COLORCURVES || defines.COLORGRADING || defines.DITHER;
    }
    /**
     * Returns true if all the image processing information are ready.
     * @returns True if ready, otherwise, false
     */
    isReady() {
        // Color Grading texture can not be none blocking.
        return !this.colorGradingEnabled || !this.colorGradingTexture || this.colorGradingTexture.isReady();
    }
    /**
     * Binds the image processing to the shader.
     * @param effect The effect to bind to
     * @param overrideAspectRatio Override the aspect ratio of the effect
     */
    bind(effect, overrideAspectRatio) {
        // Color Curves
        if (this._colorCurvesEnabled && this.colorCurves) {
            ColorCurves.Bind(this.colorCurves, effect);
        }
        // Vignette and dither handled together due to common uniform.
        if (this._vignetteEnabled || this._ditheringEnabled) {
            const inverseWidth = 1 / effect.getEngine().getRenderWidth();
            const inverseHeight = 1 / effect.getEngine().getRenderHeight();
            effect.setFloat2("vInverseScreenSize", inverseWidth, inverseHeight);
            if (this._ditheringEnabled) {
                effect.setFloat("ditherIntensity", 0.5 * this._ditheringIntensity);
            }
            if (this._vignetteEnabled) {
                const aspectRatio = overrideAspectRatio != null ? overrideAspectRatio : inverseHeight / inverseWidth;
                let vignetteScaleY = Math.tan(this.vignetteCameraFov * 0.5);
                let vignetteScaleX = vignetteScaleY * aspectRatio;
                const vignetteScaleGeometricMean = Math.sqrt(vignetteScaleX * vignetteScaleY);
                vignetteScaleX = Mix(vignetteScaleX, vignetteScaleGeometricMean, this.vignetteStretch);
                vignetteScaleY = Mix(vignetteScaleY, vignetteScaleGeometricMean, this.vignetteStretch);
                effect.setFloat4("vignetteSettings1", vignetteScaleX, vignetteScaleY, -vignetteScaleX * this.vignetteCenterX, -vignetteScaleY * this.vignetteCenterY);
                const vignettePower = -2.0 * this.vignetteWeight;
                effect.setFloat4("vignetteSettings2", this.vignetteColor.r, this.vignetteColor.g, this.vignetteColor.b, vignettePower);
            }
        }
        // Exposure
        effect.setFloat("exposureLinear", this.exposure);
        // Contrast
        effect.setFloat("contrast", this.contrast);
        // Color transform settings
        if (this.colorGradingTexture) {
            effect.setTexture("txColorTransform", this.colorGradingTexture);
            const textureSize = this.colorGradingTexture.getSize().height;
            effect.setFloat4("colorTransformSettings", (textureSize - 1) / textureSize, // textureScale
            0.5 / textureSize, // textureOffset
            textureSize, // textureSize
            this.colorGradingTexture.level // weight
            );
        }
    }
    /**
     * Clones the current image processing instance.
     * @returns The cloned image processing
     */
    clone() {
        return SerializationHelper.Clone(() => new ImageProcessingConfiguration(), this);
    }
    /**
     * Serializes the current image processing instance to a json representation.
     * @returns a JSON representation
     */
    serialize() {
        return SerializationHelper.Serialize(this);
    }
    /**
     * Parses the image processing from a json representation.
     * @param source the JSON source to parse
     * @returns The parsed image processing
     */
    static Parse(source) {
        const parsed = SerializationHelper.Parse(() => new ImageProcessingConfiguration(), source, null, null);
        // Backward compatibility
        if (source.vignetteCentreX !== undefined) {
            parsed.vignetteCenterX = source.vignetteCentreX;
        }
        if (source.vignetteCentreY !== undefined) {
            parsed.vignetteCenterY = source.vignetteCentreY;
        }
        return parsed;
    }
    /**
     * Used to apply the vignette as a mix with the pixel color.
     */
    static get VIGNETTEMODE_MULTIPLY() {
        return this._VIGNETTEMODE_MULTIPLY;
    }
    /**
     * Used to apply the vignette as a replacement of the pixel color.
     */
    static get VIGNETTEMODE_OPAQUE() {
        return this._VIGNETTEMODE_OPAQUE;
    }
}
/**
 * Default tone mapping applied in BabylonJS.
 */
ImageProcessingConfiguration.TONEMAPPING_STANDARD = 0;
/**
 * ACES Tone mapping (used by default in unreal and unity). This can help getting closer
 * to other engines rendering to increase portability.
 */
ImageProcessingConfiguration.TONEMAPPING_ACES = 1;
/**
 * Neutral Tone mapping developped by the Khronos group in order to constrain
 * values between 0 and 1 without shifting Hue.
 */
ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL = 2;
/**
 * Prepare the list of uniforms associated with the Image Processing effects.
 * @param uniforms The list of uniforms used in the effect
 * @param defines the list of defines currently in use
 */
ImageProcessingConfiguration.PrepareUniforms = PrepareUniformsForImageProcessing;
/**
 * Prepare the list of samplers associated with the Image Processing effects.
 * @param samplersList The list of uniforms used in the effect
 * @param defines the list of defines currently in use
 */
ImageProcessingConfiguration.PrepareSamplers = PrepareSamplersForImageProcessing;
// Static constants associated to the image processing.
ImageProcessingConfiguration._VIGNETTEMODE_MULTIPLY = 0;
ImageProcessingConfiguration._VIGNETTEMODE_OPAQUE = 1;
__decorate([
    serializeAsColorCurves()
], ImageProcessingConfiguration.prototype, "colorCurves", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_colorCurvesEnabled", void 0);
__decorate([
    serializeAsTexture("colorGradingTexture")
], ImageProcessingConfiguration.prototype, "_colorGradingTexture", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_colorGradingEnabled", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_colorGradingWithGreenDepth", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_colorGradingBGR", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_exposure", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_toneMappingEnabled", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_toneMappingType", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_contrast", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "vignetteStretch", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "vignetteCenterX", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "vignetteCenterY", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "vignetteWeight", void 0);
__decorate([
    serializeAsColor4()
], ImageProcessingConfiguration.prototype, "vignetteColor", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "vignetteCameraFov", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_vignetteBlendMode", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_vignetteEnabled", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_ditheringEnabled", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_ditheringIntensity", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_skipFinalColorClamp", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_applyByPostProcess", void 0);
__decorate([
    serialize()
], ImageProcessingConfiguration.prototype, "_isEnabled", void 0);
// References the dependencies.
SerializationHelper._ImageProcessingConfigurationParser = ImageProcessingConfiguration.Parse;
// Register Class Name
RegisterClass("BABYLON.ImageProcessingConfiguration", ImageProcessingConfiguration);
//# sourceMappingURL=imageProcessingConfiguration.js.map