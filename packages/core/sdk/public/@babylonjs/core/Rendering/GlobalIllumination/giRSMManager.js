import { __decorate } from "../../tslib.es6.js";
import { RawTexture } from "../../Materials/Textures/rawTexture.js";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";
import { Observable } from "../../Misc/observable.js";
import { Layer } from "../../Layers/layer.js";
import { Matrix } from "../../Maths/math.vector.js";

import { MaterialPluginBase } from "../../Materials/materialPluginBase.js";
import { PBRBaseMaterial } from "../../Materials/PBR/pbrBaseMaterial.js";
import { GeometryBufferRenderer } from "../geometryBufferRenderer.js";
import { BaseTexture } from "../../Materials/Textures/baseTexture.js";
import { expandToProperty, serialize } from "../../Misc/decorators.js";
import { MaterialDefines } from "../../Materials/materialDefines.js";
import { RegisterClass } from "../../Misc/typeStore.js";
/**
 * Class used to manage the global illumination contribution calculated from reflective shadow maps (RSM).
 */
export class GIRSMManager {
    /**
     * Enables or disables the manager. Default is false.
     * If disabled, the global illumination won't be calculated and the scene will be rendered normally, without any global illumination contribution.
     */
    get enable() {
        return this._enable;
    }
    set enable(enable) {
        if (this._giRSM.length === 0) {
            enable = false;
        }
        if (enable === this._enable) {
            return;
        }
        this._enable = enable;
        this._debugLayer.isEnabled = this._showOnlyGI && enable;
        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(GIRSMRenderPluginMaterial.Name);
                plugin.isEnabled = enable;
            }
        });
        this.recreateResources(!enable);
    }
    /**
     * Defines if the global illumination contribution should be blurred or not (using a bilateral blur). Default is true.
     */
    get enableBlur() {
        return this._enableBlur;
    }
    set enableBlur(enable) {
        if (enable === this._enableBlur) {
            return;
        }
        this._enableBlur = enable;
        this.recreateResources();
    }
    /**
     * Defines if the blur should be done with a better quality but slower or not. Default is false.
     */
    get useQualityBlur() {
        return this._useQualityBlur;
    }
    set useQualityBlur(enable) {
        if (enable === this._useQualityBlur) {
            return;
        }
        this._useQualityBlur = enable;
        this.recreateResources();
    }
    /**
     * Defines if the blur should be done at full resolution or not. Default is false.
     * If this setting is enabled, upampling will be disabled (ignored) as it is not needed anymore.
     */
    get fullSizeBlur() {
        return this._forceFullSizeBlur;
    }
    set fullSizeBlur(mode) {
        if (this._forceFullSizeBlur === mode) {
            return;
        }
        this._forceFullSizeBlur = mode;
        this.recreateResources();
    }
    /**
     * Defines if the upsampling should be done with a better quality but slower or not. Default is false.
     */
    get useQualityUpsampling() {
        return this._useQualityUpsampling;
    }
    set useQualityUpsampling(enable) {
        if (enable === this._useQualityUpsampling) {
            return;
        }
        this._useQualityUpsampling = enable;
        this.recreateResources();
    }
    /**
     * Defines if the debug layer should be enabled or not. Default is false.
     * Use this setting for debugging purpose, to show the global illumination contribution only.
     */
    get showOnlyGI() {
        return this._showOnlyGI;
    }
    set showOnlyGI(show) {
        if (this._showOnlyGI === show) {
            return;
        }
        this._showOnlyGI = show;
        this._debugLayer.isEnabled = show;
    }
    /**
     * Defines if the depth buffer used by the geometry buffer renderer should be 32 bits or not. Default is false (16 bits).
     */
    get use32BitsDepthBuffer() {
        return this._use32BitsDepthBuffer;
    }
    set use32BitsDepthBuffer(enable) {
        if (this._use32BitsDepthBuffer === enable) {
            return;
        }
        this._use32BitsDepthBuffer = enable;
        this.recreateResources();
    }
    /**
     * Sets the output dimensions of the final process. It should normally be the same as the output dimensions of the screen.
     * @param dimensions The dimensions of the output texture (width and height)
     */
    setOutputDimensions(dimensions) {
        this._outputDimensions = dimensions;
        this.recreateResources();
    }
    /**
     * Sets the dimensions of the GI texture. Try to use the smallest size possible for better performance.
     * @param dimensions The dimensions of the GI texture (width and height)
     */
    setGITextureDimensions(dimensions) {
        this._giTextureDimensions = dimensions;
        this.recreateResources();
    }
    /**
     * Gets or sets the texture type used by the GI texture. Default is 11.
     */
    get giTextureType() {
        return this._giTextureType;
    }
    set giTextureType(textureType) {
        if (this._giTextureType === textureType) {
            return;
        }
        this._giTextureType = textureType;
        this.recreateResources();
    }
    /** Gets the shader language used in this material. */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Gets the list of GIRSM used by the manager.
     */
    get giRSM() {
        return this._giRSM;
    }
    /**
     * Adds a (list of) GIRSM to the manager.
     * @param rsm The GIRSM (or array of GIRSM) to add to the manager
     */
    addGIRSM(rsm) {
        if (Array.isArray(rsm)) {
            this._giRSM.push(...rsm);
        }
        else {
            this._giRSM.push(rsm);
        }
        this.recreateResources();
    }
    /**
     * Removes a (list of) GIRSM from the manager.
     * @param rsm The GIRSM (or array of GIRSM) to remove from the manager
     */
    removeGIRSM(rsm) {
        if (Array.isArray(rsm)) {
            for (let i = 0; i < rsm.length; ++i) {
                const idx = this._giRSM.indexOf(rsm[i]);
                if (idx !== -1) {
                    this._giRSM.splice(idx, 1);
                }
            }
        }
        else {
            const idx = this._giRSM.indexOf(rsm);
            if (idx !== -1) {
                this._giRSM.splice(idx, 1);
            }
        }
        if (this._giRSM.length === 0) {
            this.enable = false;
        }
        else {
            this.recreateResources();
        }
    }
    /**
     * Add a material to the manager. This will enable the global illumination contribution for the material.
     * @param material Material that will be affected by the global illumination contribution. If not provided, all materials of the scene will be affected.
     */
    addMaterial(material) {
        if (material) {
            this._addGISupportToMaterial(material);
        }
        else {
            this._scene.meshes.forEach((mesh) => {
                if (mesh.getTotalVertices() > 0 && mesh.isEnabled() && mesh.material) {
                    this._addGISupportToMaterial(mesh.material);
                }
            });
        }
    }
    /**
     * Gets the list of GPU counters used by the manager.
     * GPU timing measurements must be enabled for the counters to be filled (engine.enableGPUTimingMeasurements = true).
     * Only available with WebGPU. You will still get the list of counters with other engines but the values will always be 0.
     */
    get countersGPU() {
        return this._counters;
    }
    /**
     * Recreates the resources used by the manager.
     * You should normally not have to call this method manually, except if you change the useFullTexture property of a GIRSM, because the manager won't track this change.
     * @param disposeGeometryBufferRenderer Defines if the geometry buffer renderer should be disposed and recreated. Default is false.
     */
    recreateResources(disposeGeometryBufferRenderer = false) {
        if (!this._shadersLoaded) {
            this._onShaderLoadedObservable.addOnce(() => {
                this.recreateResources(disposeGeometryBufferRenderer);
            });
            return;
        }
        this._disposePostProcesses(disposeGeometryBufferRenderer);
        this._createPostProcesses();
        this._setPluginParameters();
    }
    /**
     * Generates the sample texture used by the the global illumination calculation process.
     * @param maxSamples The maximum number of samples to generate in the texture. Default value is 2048. The numSamples property of the GIRSM should be less than or equal to this value!
     */
    generateSampleTexture(maxSamples) {
        this._sampleTexture?.dispose();
        this._maxSamples = maxSamples;
        const data = new Float32Array(this._maxSamples * 4);
        for (let i = 0; i < this._maxSamples; i++) {
            const xi1 = Math.random();
            const xi2 = Math.random();
            const x = xi1 * Math.sin(2 * Math.PI * xi2);
            const y = xi1 * Math.cos(2 * Math.PI * xi2);
            data[i * 4 + 0] = x;
            data[i * 4 + 1] = y;
            data[i * 4 + 2] = xi1 * xi1;
            data[i * 4 + 3] = 1;
        }
        this._sampleTexture = new RawTexture(data, this._maxSamples, 1, 5, this._scene, false, false, 1, 1);
        this._sampleTexture.name = "GIRSMSamples";
    }
    /**
     * Disposes the manager.
     */
    dispose() {
        this._disposePostProcesses(true);
        this._debugLayer.texture?.dispose();
        this._debugLayer.dispose();
        this._scene.onBeforeDrawPhaseObservable.remove(this._drawPhaseObserver);
        this._onShaderLoadedObservable.clear();
    }
    /**
     * Creates a new GIRSMManager
     * @param scene The scene
     * @param outputDimensions The dimensions of the output texture (width and height). Should normally be the same as the output dimensions of the screen.
     * @param giTextureDimensions The dimensions of the GI texture (width and height). Try to use the smallest size possible for better performance.
     * @param maxSamples The maximum number of samples to generate in the sample texture. Default value is 2048. The numSamples property of the GIRSM should be less than or equal to this value!
     * @param giTextureType The texture type used by the GI texture. Default is 11.
     */
    constructor(scene, outputDimensions, giTextureDimensions = { width: 256, height: 256 }, maxSamples = 2048, giTextureType = 11) {
        this._giRSM = [];
        this._blurRTT = null;
        this._blurPostProcesses = null;
        this._blurXPostprocess = null;
        this._blurYPostprocess = null;
        this._upsamplingXPostprocess = null;
        this._upsamplingYPostprocess = null;
        this._ppGlobalIllumination = [];
        this._firstActivation = true;
        this._geomBufferEnabled = false;
        this._geomBufferEnablePosition = false;
        this._tempMatrix = new Matrix();
        this._enable = false;
        /**
         * Defines if the global illumination calculation is paused or not.
         * Use this setting to pause the global illumination calculation when you know that the scene (camera/mesh/light positions) is not changing anymore to save some GPU power.
         * The scene will still be rendered with the latest global illumination contribution.
         */
        this.pause = false;
        this._enableBlur = true;
        this._useQualityBlur = false;
        /**
         * Defines the depth threshold used by the bilateral blur post-processes (also used by the upsampling, if enabled).
         * You may have to change this value, depending on your scene.
         */
        this.blurDepthThreshold = 0.05;
        /**
         * Defines the normal threshold used by the bilateral blur post-processes (also used by the upsampling, if enabled).
         * You may have to change this value, depending on your scene.
         */
        this.blurNormalThreshold = 0.25;
        /**
         * Defines the kernel size used by the bilateral blur post-processes. Default is 12.
         */
        this.blurKernel = 12;
        this._forceFullSizeBlur = false;
        this._useQualityUpsampling = false;
        /**
         * Defines the kernel size used by the bilateral upsampling post-processes. Default is 6.
         */
        this.upsamplerKernel = 6;
        this._showOnlyGI = false;
        this._use32BitsDepthBuffer = false;
        /** Shader language used by the material */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._shadersLoaded = false;
        this._onShaderLoadedObservable = new Observable();
        this._scene = scene;
        this._engine = scene.getEngine();
        this._outputDimensions = outputDimensions;
        this._giTextureDimensions = giTextureDimensions;
        this._giTextureType = giTextureType;
        this._materialsWithRenderPlugin = [];
        this._maxSamples = maxSamples;
        this._debugLayer = new Layer("debug layer", null, this._scene, false);
        this._debugLayer.isEnabled = false;
        this._counters = [];
        this._countersRTW = [];
        this._initShaderSourceAsync();
        this.generateSampleTexture(maxSamples);
        this._drawPhaseObserver = this._scene.onBeforeDrawPhaseObservable.add(() => {
            const currentRenderTarget = this._engine._currentRenderTarget;
            let rebindCurrentRenderTarget = false;
            if (this._enable) {
                if (!this.pause) {
                    this._scene.postProcessManager.directRender(this._ppGlobalIllumination, this._ppGlobalIllumination[0].inputTexture);
                    this._engine.unBindFramebuffer(this._ppGlobalIllumination[0].inputTexture, true);
                    this._engine.setAlphaMode(0);
                    rebindCurrentRenderTarget = true;
                    if (this.enableBlur && this._blurPostProcesses) {
                        this._scene.postProcessManager.directRender(this._blurPostProcesses, this._blurRTT.renderTarget, true);
                        this._engine.unBindFramebuffer(this._blurRTT.renderTarget, true);
                    }
                }
                for (let i = 0; i < this._counters.length; ++i) {
                    const rtws = this._countersRTW[i];
                    for (let t = 0; t < rtws.length; ++t) {
                        if (t === 0) {
                            this._counters[i].value = this.pause ? 0 : (rtws[t].gpuTimeInFrame?.counter.lastSecAverage ?? 0);
                        }
                        else if (!this.pause) {
                            this._counters[i].value += rtws[t].gpuTimeInFrame?.counter.lastSecAverage ?? 0;
                        }
                    }
                }
                if (this._scene.activeCamera) {
                    this._engine.setViewport(this._scene.activeCamera.viewport);
                }
            }
            if (rebindCurrentRenderTarget && currentRenderTarget) {
                this._engine.bindFramebuffer(currentRenderTarget);
            }
        });
    }
    async _initShaderSourceAsync() {
        const engine = this._engine;
        if (engine.isWebGPU) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
            await Promise.all([
                import("../../ShadersWGSL/bilateralBlur.fragment.js"),
                import("../../ShadersWGSL/bilateralBlurQuality.fragment.js"),
                import("../../ShadersWGSL/rsmGlobalIllumination.fragment.js"),
                import("../../ShadersWGSL/rsmFullGlobalIllumination.fragment.js"),
            ]);
        }
        else {
            await Promise.all([
                import("../../Shaders/bilateralBlur.fragment.js"),
                import("../../Shaders/bilateralBlurQuality.fragment.js"),
                import("../../Shaders/rsmGlobalIllumination.fragment.js"),
                import("../../Shaders/rsmFullGlobalIllumination.fragment.js"),
            ]);
        }
        this._shadersLoaded = true;
        this._onShaderLoadedObservable.notifyObservers();
    }
    _disposePostProcesses(disposeGeometryBufferRenderer = false) {
        this._blurRTT?.dispose();
        this._blurRTT = null;
        this._blurPostProcesses = [];
        this._blurXPostprocess?.dispose();
        this._blurXPostprocess = null;
        this._blurYPostprocess?.dispose();
        this._blurYPostprocess = null;
        this._upsamplingXPostprocess?.dispose();
        this._upsamplingXPostprocess = null;
        this._upsamplingYPostprocess?.dispose();
        this._upsamplingYPostprocess = null;
        for (const ppGlobalIllumination of this._ppGlobalIllumination) {
            ppGlobalIllumination.dispose();
        }
        this._ppGlobalIllumination = [];
        if (disposeGeometryBufferRenderer) {
            if (this._geomBufferEnabled) {
                this._scene.enableGeometryBufferRenderer();
                this._scene.geometryBufferRenderer.enablePosition = this._geomBufferEnablePosition;
            }
            else {
                this._scene.disableGeometryBufferRenderer();
            }
        }
        this._counters = [];
        this._countersRTW = [];
    }
    _setPluginParameters() {
        if (!this._enable) {
            return;
        }
        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(GIRSMRenderPluginMaterial.Name);
                plugin.textureGIContrib = this.enableBlur ? this._blurRTT.renderTarget.texture : this._ppGlobalIllumination[0].inputTexture.texture;
                plugin.outputTextureWidth = this._outputDimensions.width;
                plugin.outputTextureHeight = this._outputDimensions.height;
            }
        });
    }
    _createPostProcesses() {
        if (!this._enable) {
            return;
        }
        const textureFormat = this._giTextureType === 13 ? 4 : 5;
        if (this._firstActivation) {
            this._firstActivation = false;
            this._geomBufferEnabled = !!this._scene.geometryBufferRenderer;
            this._geomBufferEnablePosition = this._scene.geometryBufferRenderer?.enablePosition ?? false;
        }
        if (!this._geomBufferEnabled) {
            this._scene.disableGeometryBufferRenderer();
        }
        const geometryBufferRenderer = this._scene.enableGeometryBufferRenderer(this._enableBlur ? this._outputDimensions : this._giTextureDimensions, this._use32BitsDepthBuffer ? 14 : 15, GIRSMManager.GeometryBufferTextureTypesAndFormats);
        if (!geometryBufferRenderer) {
            throw new Error("Geometry buffer renderer is not supported but is required for GIRSMManager.");
        }
        geometryBufferRenderer.enablePosition = true;
        if (!this._geomBufferEnabled) {
            geometryBufferRenderer.generateNormalsInWorldSpace = true;
        }
        const decodeGeometryBufferNormals = geometryBufferRenderer.normalsAreUnsigned;
        const normalsAreInWorldSpace = geometryBufferRenderer.generateNormalsInWorldSpace;
        this._counters.push({ name: "Geometry buffer renderer", value: 0 });
        this._countersRTW.push([this._scene.geometryBufferRenderer.getGBuffer().renderTarget]);
        let defines = "";
        if (decodeGeometryBufferNormals) {
            defines += "#define DECODE_NORMAL\n";
        }
        if (!normalsAreInWorldSpace) {
            defines += "#define TRANSFORM_NORMAL\n";
        }
        for (let i = 0; i < this._giRSM.length; ++i) {
            const giRSM = this._giRSM[i];
            const rsm = giRSM.rsm;
            const ppGlobalIllumination = new PostProcess("RSMGlobalIllumination" + i, giRSM.useFullTexture ? "rsmFullGlobalIllumination" : "rsmGlobalIllumination", {
                ...this._giTextureDimensions,
                uniforms: ["rsmLightMatrix", "rsmInfo", "rsmInfo2", "invView"],
                samplers: ["normalSampler", "rsmPositionW", "rsmNormalW", "rsmFlux", "rsmSamples"],
                defines,
                samplingMode: 2,
                engine: this._engine,
                textureType: this._giTextureType,
                textureFormat,
                shaderLanguage: this._shaderLanguage,
            });
            this._ppGlobalIllumination.push(ppGlobalIllumination);
            if (i !== 0) {
                ppGlobalIllumination.shareOutputWith(this._ppGlobalIllumination[0]);
                ppGlobalIllumination.alphaMode = 1;
            }
            ppGlobalIllumination.autoClear = false;
            ppGlobalIllumination.externalTextureSamplerBinding = true;
            ppGlobalIllumination.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE)]);
                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]);
                effect.setTexture("rsmPositionW", rsm.positionWorldTexture);
                effect.setTexture("rsmNormalW", rsm.normalWorldTexture);
                effect.setTexture("rsmFlux", rsm.fluxTexture);
                effect.setMatrix("rsmLightMatrix", rsm.lightTransformationMatrix);
                if (!giRSM.useFullTexture) {
                    effect.setTexture("rsmSamples", this._sampleTexture);
                    effect.setFloat4("rsmInfo", giRSM.numSamples, giRSM.radius, giRSM.intensity, giRSM.edgeArtifactCorrection);
                    effect.setFloat4("rsmInfo2", giRSM.noiseFactor, giRSM.rotateSample ? 1 : 0, rsm.fluxTexture.getInternalTexture().width, rsm.fluxTexture.getInternalTexture().height);
                }
                else {
                    effect.setFloat4("rsmInfo", rsm.fluxTexture.getInternalTexture().width, rsm.fluxTexture.getInternalTexture().height, giRSM.intensity, giRSM.edgeArtifactCorrection);
                }
                if (!normalsAreInWorldSpace) {
                    this._tempMatrix.copyFrom(this._scene.activeCamera.getViewMatrix());
                    this._tempMatrix.invert();
                    effect.setMatrix("invView", this._tempMatrix);
                }
            });
        }
        for (const ppGlobalIllumination of this._ppGlobalIllumination) {
            if (!ppGlobalIllumination.inputTexture) {
                ppGlobalIllumination.resize(this._giTextureDimensions.width, this._giTextureDimensions.height);
            }
        }
        this._counters.push({ name: "GI generation", value: 0 });
        this._countersRTW.push([this._ppGlobalIllumination[0].inputTexture]);
        if (this._enableBlur) {
            const blurTextureSize = this._forceFullSizeBlur ? this._outputDimensions : this._giTextureDimensions;
            this._blurRTT = new RenderTargetTexture("GIRSMContribution", this._outputDimensions, this._scene, {
                type: this._giTextureType,
                format: textureFormat,
                generateDepthBuffer: false,
            });
            this._blurRTT.wrapU = 0;
            this._blurRTT.wrapV = 0;
            this._blurRTT.updateSamplingMode(1);
            this._blurRTT.skipInitialClear = true;
            const blurRTWs = [];
            this._counters.push({ name: "GI blur", value: 0 });
            this._countersRTW.push(blurRTWs);
            // Bilateral blur
            this._blurXPostprocess = new PostProcess(this._useQualityBlur ? "BilateralBlur" : "BilateralBlurX", this._useQualityBlur ? "bilateralBlurQuality" : "bilateralBlur", {
                uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                samplers: ["depthSampler", "normalSampler"],
                defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                size: blurTextureSize,
                samplingMode: 2,
                engine: this._engine,
                textureType: this._giTextureType,
                textureFormat,
                shaderLanguage: this._shaderLanguage,
            });
            this._blurXPostprocess.onApplyObservable.add((effect) => {
                effect._bindTexture("textureSampler", this._ppGlobalIllumination[0].inputTexture.texture);
                effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]);
                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]);
                effect.setInt("filterSize", this.blurKernel);
                effect.setFloat2("blurDir", 1 / this._giTextureDimensions.width, this._useQualityBlur ? 1 / this._giTextureDimensions.height : 0);
                effect.setFloat("depthThreshold", this.blurDepthThreshold);
                effect.setFloat("normalThreshold", this.blurNormalThreshold);
            });
            this._blurXPostprocess.externalTextureSamplerBinding = true;
            this._blurXPostprocess.autoClear = false;
            if (!this._useQualityBlur) {
                this._blurYPostprocess = new PostProcess("BilateralBlurY", "bilateralBlur", {
                    uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                    samplers: ["depthSampler", "normalSampler"],
                    defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                    size: blurTextureSize,
                    samplingMode: 2,
                    engine: this._engine,
                    textureType: this._giTextureType,
                    textureFormat,
                    shaderLanguage: this._shaderLanguage,
                });
                this._blurYPostprocess.autoClear = false;
                this._blurYPostprocess.onApplyObservable.add((effect) => {
                    effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]);
                    effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]);
                    effect.setInt("filterSize", this.blurKernel);
                    effect.setFloat2("blurDir", 0, 1 / this._giTextureDimensions.height);
                    effect.setFloat("depthThreshold", this.blurDepthThreshold);
                    effect.setFloat("normalThreshold", this.blurNormalThreshold);
                });
                this._blurYPostprocess.resize(blurTextureSize.width, blurTextureSize.height);
                blurRTWs.push(this._blurYPostprocess.inputTexture);
            }
            this._blurPostProcesses = [this._blurXPostprocess];
            if (this._blurYPostprocess) {
                this._blurPostProcesses.push(this._blurYPostprocess);
            }
            // Bilateral upsampling
            const giFullDimensions = this._giTextureDimensions.width >= this._outputDimensions.width && this._giTextureDimensions.height >= this._outputDimensions.height;
            if (!giFullDimensions && !this._forceFullSizeBlur) {
                const upsamplingRTWs = [];
                this._counters.push({ name: "GI upsampling", value: 0 });
                this._countersRTW.push(upsamplingRTWs);
                this._upsamplingXPostprocess = new PostProcess(this._useQualityUpsampling ? "BilateralUpsampling" : "BilateralUpsamplingX", this._useQualityUpsampling ? "bilateralBlurQuality" : "bilateralBlur", {
                    uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                    samplers: ["depthSampler", "normalSampler"],
                    defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                    size: blurTextureSize,
                    samplingMode: 2,
                    engine: this._engine,
                    textureType: this._giTextureType,
                    textureFormat,
                    shaderLanguage: this._shaderLanguage,
                });
                this._upsamplingXPostprocess.autoClear = false;
                this._upsamplingXPostprocess.onApplyObservable.add((effect) => {
                    effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]);
                    effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]);
                    effect.setInt("filterSize", this.upsamplerKernel);
                    effect.setFloat2("blurDir", 1 / this._outputDimensions.width, this._useQualityUpsampling ? 1 / this._outputDimensions.height : 0);
                    effect.setFloat("depthThreshold", this.blurDepthThreshold);
                    effect.setFloat("normalThreshold", this.blurNormalThreshold);
                });
                this._upsamplingXPostprocess.resize(blurTextureSize.width, blurTextureSize.height);
                blurRTWs.push(this._upsamplingXPostprocess.inputTexture);
                if (!this.useQualityUpsampling) {
                    this._upsamplingYPostprocess = new PostProcess("BilateralUpsamplingY", "bilateralBlur", {
                        uniforms: ["filterSize", "blurDir", "depthThreshold", "normalThreshold"],
                        samplers: ["depthSampler", "normalSampler"],
                        defines: decodeGeometryBufferNormals ? "#define DECODE_NORMAL" : undefined,
                        size: this._outputDimensions,
                        samplingMode: 2,
                        engine: this._engine,
                        textureType: this._giTextureType,
                        textureFormat,
                        shaderLanguage: this._shaderLanguage,
                    });
                    this._upsamplingYPostprocess.autoClear = false;
                    this._upsamplingYPostprocess.onApplyObservable.add((effect) => {
                        effect.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)]);
                        effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)]);
                        effect.setInt("filterSize", this.upsamplerKernel);
                        effect.setFloat2("blurDir", 0, 1 / this._outputDimensions.height);
                        effect.setFloat("depthThreshold", this.blurDepthThreshold);
                        effect.setFloat("normalThreshold", this.blurNormalThreshold);
                    });
                    this._upsamplingYPostprocess.resize(this._outputDimensions.width, this._outputDimensions.height);
                    upsamplingRTWs.push(this._upsamplingYPostprocess.inputTexture);
                }
                upsamplingRTWs.push(this._blurRTT.renderTarget);
                this._blurPostProcesses.push(this._upsamplingXPostprocess);
                if (this._upsamplingYPostprocess) {
                    this._blurPostProcesses.push(this._upsamplingYPostprocess);
                }
            }
            else {
                blurRTWs.push(this._blurRTT.renderTarget);
            }
        }
        this._debugLayer.texture?.dispose();
        this._debugLayer.texture = new BaseTexture(this._scene, this._enableBlur ? this._blurRTT.renderTarget.texture : this._ppGlobalIllumination[0].inputTexture.texture);
    }
    _addGISupportToMaterial(material) {
        if (material.pluginManager?.getPlugin(GIRSMRenderPluginMaterial.Name)) {
            return;
        }
        const plugin = new GIRSMRenderPluginMaterial(material);
        if (this._enable && this._ppGlobalIllumination.length > 0) {
            plugin.textureGIContrib = this._ppGlobalIllumination[0].inputTexture.texture;
            plugin.outputTextureWidth = this._outputDimensions.width;
            plugin.outputTextureHeight = this._outputDimensions.height;
        }
        plugin.isEnabled = this._enable;
        this._materialsWithRenderPlugin.push(material);
    }
}
/**
 * Defines the default texture types and formats used by the geometry buffer renderer.
 */
GIRSMManager.GeometryBufferTextureTypesAndFormats = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    0: { textureType: 2, textureFormat: 6 }, // depth
    // eslint-disable-next-line @typescript-eslint/naming-convention
    1: { textureType: 11, textureFormat: 5 }, // normal
    // eslint-disable-next-line @typescript-eslint/naming-convention
    2: { textureType: 2, textureFormat: 5 }, // position
};
/**
 * @internal
 */
class MaterialGIRSMRenderDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.RENDER_WITH_GIRSM = false;
        this.RSMCREATE_PROJTEXTURE = false;
    }
}
/**
 * Plugin used to render the global illumination contribution.
 */
export class GIRSMRenderPluginMaterial extends MaterialPluginBase {
    _markAllSubMeshesAsTexturesDirty() {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a give shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible() {
        return true;
    }
    constructor(material) {
        super(material, GIRSMRenderPluginMaterial.Name, 310, new MaterialGIRSMRenderDefines());
        this._isEnabled = false;
        /**
         * Defines if the plugin is enabled in the material.
         */
        this.isEnabled = false;
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
        this._isPBR = material instanceof PBRBaseMaterial;
    }
    prepareDefines(defines) {
        defines.RENDER_WITH_GIRSM = this._isEnabled;
    }
    getClassName() {
        return "GIRSMRenderPluginMaterial";
    }
    getUniforms() {
        return {
            ubo: [{ name: "girsmTextureOutputSize", size: 2, type: "vec2" }],
            fragment: `#ifdef RENDER_WITH_GIRSM
                    uniform vec2 girsmTextureOutputSize;
                #endif`,
        };
    }
    getSamplers(samplers) {
        samplers.push("girsmTextureGIContrib");
    }
    bindForSubMesh(uniformBuffer) {
        if (this._isEnabled) {
            uniformBuffer.bindTexture("girsmTextureGIContrib", this.textureGIContrib);
            uniformBuffer.updateFloat2("girsmTextureOutputSize", this.outputTextureWidth, this.outputTextureHeight);
        }
    }
    getCustomCode(shaderType, shaderLanguage) {
        let frag;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_GIRSM
                    var girsmTextureGIContribSampler: sampler;
                    var girsmTextureGIContrib: texture_2d<f32>;

                    fn computeIndirect() -> vec3f {
                        var uv = fragmentInputs.position.xy / uniforms.girsmTextureOutputSize;
                        return textureSample(girsmTextureGIContrib, girsmTextureGIContribSampler, uv).rgb;
                    }
                #endif
            `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: `
                #ifdef RENDER_WITH_GIRSM
                    finalDiffuse += computeIndirect() * surfaceAlbedo.rgb;
                #endif
            `,
            };
            if (!this._isPBR) {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_GIRSM
                    color = vec4f(color.rgb + computeIndirect() * baseColor.rgb, color.a);
                #endif
            `;
            }
        }
        else {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_GIRSM
                    uniform sampler2D girsmTextureGIContrib;

                    vec3 computeIndirect() {
                        vec2 uv = gl_FragCoord.xy / girsmTextureOutputSize;
                        return texture2D(girsmTextureGIContrib, uv).rgb;
                    }
                #endif
            `,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: `
                #ifdef RENDER_WITH_GIRSM
                    finalDiffuse += computeIndirect() * surfaceAlbedo.rgb;
                #endif
            `,
            };
            if (!this._isPBR) {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_GIRSM
                    color.rgb += computeIndirect() * baseColor.rgb;
                #endif
            `;
            }
        }
        return shaderType === "vertex" ? null : frag;
    }
}
/**
 * Defines the name of the plugin.
 */
GIRSMRenderPluginMaterial.Name = "GIRSMRender";
__decorate([
    serialize()
], GIRSMRenderPluginMaterial.prototype, "textureGIContrib", void 0);
__decorate([
    serialize()
], GIRSMRenderPluginMaterial.prototype, "outputTextureWidth", void 0);
__decorate([
    serialize()
], GIRSMRenderPluginMaterial.prototype, "outputTextureHeight", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], GIRSMRenderPluginMaterial.prototype, "isEnabled", void 0);
RegisterClass(`BABYLON.GIRSMRenderPluginMaterial`, GIRSMRenderPluginMaterial);
//# sourceMappingURL=giRSMManager.js.map