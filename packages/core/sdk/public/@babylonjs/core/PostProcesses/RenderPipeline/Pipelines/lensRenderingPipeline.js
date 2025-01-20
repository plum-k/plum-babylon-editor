import { Texture } from "../../../Materials/Textures/texture.js";
import { PostProcess } from "../../../PostProcesses/postProcess.js";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect.js";
import { RawTexture } from "../../../Materials/Textures/rawTexture.js";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.js";
import "../../../Shaders/chromaticAberration.fragment.js";
import "../../../Shaders/lensHighlights.fragment.js";
import "../../../Shaders/depthOfField.fragment.js";
import { RandomRange } from "../../../Maths/math.scalar.functions.js";
/**
 * BABYLON.JS Chromatic Aberration GLSL Shader
 * Author: Olivier Guyot
 * Separates very slightly R, G and B colors on the edges of the screen
 * Inspired by Francois Tarlier & Martins Upitis
 */
export class LensRenderingPipeline extends PostProcessRenderPipeline {
    /**
     * @constructor
     *
     * Effect parameters are as follow:
     * {
     *      chromatic_aberration: number;       // from 0 to x (1 for realism)
     *      edge_blur: number;                  // from 0 to x (1 for realism)
     *      distortion: number;                 // from 0 to x (1 for realism), note that this will effect the pointer position precision
     *      grain_amount: number;               // from 0 to 1
     *      grain_texture: BABYLON.Texture;     // texture to use for grain effect; if unset, use random B&W noise
     *      dof_focus_distance: number;         // depth-of-field: focus distance; unset to disable (disabled by default)
     *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
     *      dof_darken: number;                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
     *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
     *      dof_gain: number;                   // depth-of-field: highlights gain; unset to disable (disabled by default)
     *      dof_threshold: number;              // depth-of-field: highlights threshold (default: 1)
     *      blur_noise: boolean;                // add a little bit of noise to the blur (default: true)
     * }
     * Note: if an effect parameter is unset, effect is disabled
     *
     * @param name The rendering pipeline name
     * @param parameters - An object containing all parameters (see above)
     * @param scene The scene linked to this pipeline
     * @param ratio The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     */
    constructor(name, parameters, scene, ratio = 1.0, cameras) {
        super(scene.getEngine(), name);
        // Lens effects can be of the following:
        // - chromatic aberration (slight shift of RGB colors)
        // - blur on the edge of the lens
        // - lens distortion
        // - depth-of-field blur & highlights enhancing
        // - depth-of-field 'bokeh' effect (shapes appearing in blurred areas)
        // - grain effect (noise or custom texture)
        // Two additional texture samplers are needed:
        // - depth map (for depth-of-field)
        // - grain texture
        /**
         * @ignore
         * The chromatic aberration PostProcess id in the pipeline
         */
        this.LensChromaticAberrationEffect = "LensChromaticAberrationEffect";
        /**
         * @ignore
         * The highlights enhancing PostProcess id in the pipeline
         */
        this.HighlightsEnhancingEffect = "HighlightsEnhancingEffect";
        /**
         * @ignore
         * The depth-of-field PostProcess id in the pipeline
         */
        this.LensDepthOfFieldEffect = "LensDepthOfFieldEffect";
        this._pentagonBokehIsEnabled = false;
        this._scene = scene;
        // Fetch texture samplers
        this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
        if (parameters.grain_texture) {
            this._grainTexture = parameters.grain_texture;
        }
        else {
            this._createGrainTexture();
        }
        // save parameters
        this._edgeBlur = parameters.edge_blur ? parameters.edge_blur : 0;
        this._grainAmount = parameters.grain_amount ? parameters.grain_amount : 0;
        this._chromaticAberration = parameters.chromatic_aberration ? parameters.chromatic_aberration : 0;
        this._distortion = parameters.distortion ? parameters.distortion : 0;
        this._highlightsGain = parameters.dof_gain !== undefined ? parameters.dof_gain : -1;
        this._highlightsThreshold = parameters.dof_threshold ? parameters.dof_threshold : 1;
        this._dofDistance = parameters.dof_focus_distance !== undefined ? parameters.dof_focus_distance : -1;
        this._dofAperture = parameters.dof_aperture ? parameters.dof_aperture : 1;
        this._dofDarken = parameters.dof_darken ? parameters.dof_darken : 0;
        this._dofPentagon = parameters.dof_pentagon !== undefined ? parameters.dof_pentagon : true;
        this._blurNoise = parameters.blur_noise !== undefined ? parameters.blur_noise : true;
        // Create effects
        this._createChromaticAberrationPostProcess(ratio);
        this._createHighlightsPostProcess(ratio);
        this._createDepthOfFieldPostProcess(ratio / 4);
        // Set up pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.LensChromaticAberrationEffect, () => {
            return this._chromaticAberrationPostProcess;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.HighlightsEnhancingEffect, () => {
            return this._highlightsPostProcess;
        }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.LensDepthOfFieldEffect, () => {
            return this._depthOfFieldPostProcess;
        }, true));
        if (this._highlightsGain === -1) {
            this._disableEffect(this.HighlightsEnhancingEffect, null);
        }
        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        if (cameras) {
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }
    }
    /**
     * Get the class name
     * @returns "LensRenderingPipeline"
     */
    getClassName() {
        return "LensRenderingPipeline";
    }
    // Properties
    /**
     * Gets associated scene
     */
    get scene() {
        return this._scene;
    }
    /**
     * Gets or sets the edge blur
     */
    get edgeBlur() {
        return this._edgeBlur;
    }
    set edgeBlur(value) {
        this.setEdgeBlur(value);
    }
    /**
     * Gets or sets the grain amount
     */
    get grainAmount() {
        return this._grainAmount;
    }
    set grainAmount(value) {
        this.setGrainAmount(value);
    }
    /**
     * Gets or sets the chromatic aberration amount
     */
    get chromaticAberration() {
        return this._chromaticAberration;
    }
    set chromaticAberration(value) {
        this.setChromaticAberration(value);
    }
    /**
     * Gets or sets the depth of field aperture
     */
    get dofAperture() {
        return this._dofAperture;
    }
    set dofAperture(value) {
        this.setAperture(value);
    }
    /**
     * Gets or sets the edge distortion
     */
    get edgeDistortion() {
        return this._distortion;
    }
    set edgeDistortion(value) {
        this.setEdgeDistortion(value);
    }
    /**
     * Gets or sets the depth of field distortion
     */
    get dofDistortion() {
        return this._dofDistance;
    }
    set dofDistortion(value) {
        this.setFocusDistance(value);
    }
    /**
     * Gets or sets the darken out of focus amount
     */
    get darkenOutOfFocus() {
        return this._dofDarken;
    }
    set darkenOutOfFocus(value) {
        this.setDarkenOutOfFocus(value);
    }
    /**
     * Gets or sets a boolean indicating if blur noise is enabled
     */
    get blurNoise() {
        return this._blurNoise;
    }
    set blurNoise(value) {
        this._blurNoise = value;
    }
    /**
     * Gets or sets a boolean indicating if pentagon bokeh is enabled
     */
    get pentagonBokeh() {
        return this._pentagonBokehIsEnabled;
    }
    set pentagonBokeh(value) {
        if (value) {
            this.enablePentagonBokeh();
        }
        else {
            this.disablePentagonBokeh();
        }
    }
    /**
     * Gets or sets the highlight grain amount
     */
    get highlightsGain() {
        return this._highlightsGain;
    }
    set highlightsGain(value) {
        this.setHighlightsGain(value);
    }
    /**
     * Gets or sets the highlight threshold
     */
    get highlightsThreshold() {
        return this._highlightsThreshold;
    }
    set highlightsThreshold(value) {
        this.setHighlightsThreshold(value);
    }
    // public methods (self explanatory)
    /**
     * Sets the amount of blur at the edges
     * @param amount blur amount
     */
    setEdgeBlur(amount) {
        this._edgeBlur = amount;
    }
    /**
     * Sets edge blur to 0
     */
    disableEdgeBlur() {
        this._edgeBlur = 0;
    }
    /**
     * Sets the amount of grain
     * @param amount Amount of grain
     */
    setGrainAmount(amount) {
        this._grainAmount = amount;
    }
    /**
     * Set grain amount to 0
     */
    disableGrain() {
        this._grainAmount = 0;
    }
    /**
     * Sets the chromatic aberration amount
     * @param amount amount of chromatic aberration
     */
    setChromaticAberration(amount) {
        this._chromaticAberration = amount;
    }
    /**
     * Sets chromatic aberration amount to 0
     */
    disableChromaticAberration() {
        this._chromaticAberration = 0;
    }
    /**
     * Sets the EdgeDistortion amount
     * @param amount amount of EdgeDistortion
     */
    setEdgeDistortion(amount) {
        this._distortion = amount;
    }
    /**
     * Sets edge distortion to 0
     */
    disableEdgeDistortion() {
        this._distortion = 0;
    }
    /**
     * Sets the FocusDistance amount
     * @param amount amount of FocusDistance
     */
    setFocusDistance(amount) {
        this._dofDistance = amount;
    }
    /**
     * Disables depth of field
     */
    disableDepthOfField() {
        this._dofDistance = -1;
    }
    /**
     * Sets the Aperture amount
     * @param amount amount of Aperture
     */
    setAperture(amount) {
        this._dofAperture = amount;
    }
    /**
     * Sets the DarkenOutOfFocus amount
     * @param amount amount of DarkenOutOfFocus
     */
    setDarkenOutOfFocus(amount) {
        this._dofDarken = amount;
    }
    /**
     * Creates a pentagon bokeh effect
     */
    enablePentagonBokeh() {
        this._highlightsPostProcess.updateEffect("#define PENTAGON\n");
        this._pentagonBokehIsEnabled = true;
    }
    /**
     * Disables the pentagon bokeh effect
     */
    disablePentagonBokeh() {
        this._pentagonBokehIsEnabled = false;
        this._highlightsPostProcess.updateEffect();
    }
    /**
     * Enables noise blur
     */
    enableNoiseBlur() {
        this._blurNoise = true;
    }
    /**
     * Disables noise blur
     */
    disableNoiseBlur() {
        this._blurNoise = false;
    }
    /**
     * Sets the HighlightsGain amount
     * @param amount amount of HighlightsGain
     */
    setHighlightsGain(amount) {
        this._highlightsGain = amount;
    }
    /**
     * Sets the HighlightsThreshold amount
     * @param amount amount of HighlightsThreshold
     */
    setHighlightsThreshold(amount) {
        if (this._highlightsGain === -1) {
            this._highlightsGain = 1.0;
        }
        this._highlightsThreshold = amount;
    }
    /**
     * Disables highlights
     */
    disableHighlights() {
        this._highlightsGain = -1;
    }
    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableDepthRender If the scene's depth rendering should be disabled (default: false)
     */
    dispose(disableDepthRender = false) {
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
        this._chromaticAberrationPostProcess = null;
        this._highlightsPostProcess = null;
        this._depthOfFieldPostProcess = null;
        this._grainTexture.dispose();
        if (disableDepthRender) {
            this._scene.disableDepthRenderer();
        }
    }
    // colors shifting and distortion
    _createChromaticAberrationPostProcess(ratio) {
        this._chromaticAberrationPostProcess = new PostProcess("LensChromaticAberration", "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"], // uniforms
        [], // samplers
        ratio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
        this._chromaticAberrationPostProcess.onApply = (effect) => {
            effect.setFloat("chromatic_aberration", this._chromaticAberration);
            effect.setFloat("screen_width", this._scene.getEngine().getRenderWidth());
            effect.setFloat("screen_height", this._scene.getEngine().getRenderHeight());
            effect.setFloat("radialIntensity", 1);
            effect.setFloat2("direction", 17, 17);
            effect.setFloat2("centerPosition", 0.5, 0.5);
        };
    }
    // highlights enhancing
    _createHighlightsPostProcess(ratio) {
        this._highlightsPostProcess = new PostProcess("LensHighlights", "lensHighlights", ["gain", "threshold", "screen_width", "screen_height"], // uniforms
        [], // samplers
        ratio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, this._dofPentagon ? "#define PENTAGON\n" : "");
        this._highlightsPostProcess.externalTextureSamplerBinding = true;
        this._highlightsPostProcess.onApply = (effect) => {
            effect.setFloat("gain", this._highlightsGain);
            effect.setFloat("threshold", this._highlightsThreshold);
            effect.setTextureFromPostProcess("textureSampler", this._chromaticAberrationPostProcess);
            effect.setFloat("screen_width", this._scene.getEngine().getRenderWidth());
            effect.setFloat("screen_height", this._scene.getEngine().getRenderHeight());
        };
    }
    // colors shifting and distortion
    _createDepthOfFieldPostProcess(ratio) {
        this._depthOfFieldPostProcess = new PostProcess("LensDepthOfField", "depthOfField", [
            "grain_amount",
            "blur_noise",
            "screen_width",
            "screen_height",
            "distortion",
            "dof_enabled",
            "screen_distance",
            "aperture",
            "darken",
            "edge_blur",
            "highlights",
            "near",
            "far",
        ], ["depthSampler", "grainSampler", "highlightsSampler"], ratio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
        this._depthOfFieldPostProcess.externalTextureSamplerBinding = true;
        this._depthOfFieldPostProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", this._depthTexture);
            effect.setTexture("grainSampler", this._grainTexture);
            effect.setTextureFromPostProcess("textureSampler", this._highlightsPostProcess);
            effect.setTextureFromPostProcess("highlightsSampler", this._depthOfFieldPostProcess);
            effect.setFloat("grain_amount", this._grainAmount);
            effect.setBool("blur_noise", this._blurNoise);
            effect.setFloat("screen_width", this._scene.getEngine().getRenderWidth());
            effect.setFloat("screen_height", this._scene.getEngine().getRenderHeight());
            effect.setFloat("distortion", this._distortion);
            effect.setBool("dof_enabled", this._dofDistance !== -1);
            effect.setFloat("screen_distance", 1.0 / (0.1 - 1.0 / this._dofDistance));
            effect.setFloat("aperture", this._dofAperture);
            effect.setFloat("darken", this._dofDarken);
            effect.setFloat("edge_blur", this._edgeBlur);
            effect.setBool("highlights", this._highlightsGain !== -1);
            if (this._scene.activeCamera) {
                effect.setFloat("near", this._scene.activeCamera.minZ);
                effect.setFloat("far", this._scene.activeCamera.maxZ);
            }
        };
    }
    // creates a black and white random noise texture, 512x512
    _createGrainTexture() {
        const size = 512;
        const data = new Uint8Array(size * size * 4);
        for (let index = 0; index < data.length;) {
            const value = Math.floor(RandomRange(0.42, 0.58) * 255);
            data[index++] = value;
            data[index++] = value;
            data[index++] = value;
            data[index++] = 255;
        }
        const texture = RawTexture.CreateRGBATexture(data, size, size, this._scene, false, false, 2);
        texture.name = "LensNoiseTexture";
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        this._grainTexture = texture;
    }
}
//# sourceMappingURL=lensRenderingPipeline.js.map