
import { Engine } from "../../Engines/engine.js";
import { ShaderMaterial } from "../../Materials/shaderMaterial.js";
import { MultiRenderTarget } from "../../Materials/Textures/multiRenderTarget.js";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.js";
import { Color4 } from "../../Maths/math.color.js";
import { Matrix, Vector3, Vector4 } from "../../Maths/math.vector.js";
import { Texture } from "../../Materials/Textures/texture.js";
import { Logger } from "../../Misc/logger.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture.js";
import { EffectRenderer, EffectWrapper } from "../../Materials/effectRenderer.js";
/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 * #8R5SSE#222
 */
export class _IblShadowsVoxelRenderer {
    /**
     * Return the voxel grid texture.
     * @returns The voxel grid texture.
     */
    getVoxelGrid() {
        if (this._triPlanarVoxelization) {
            return this._voxelGridRT;
        }
        else {
            return this._voxelGridZaxis;
        }
    }
    /**
     * The debug pass post process
     * @returns The debug pass post process
     */
    getDebugPassPP() {
        if (!this._voxelDebugPass) {
            this._createDebugPass();
        }
        return this._voxelDebugPass;
    }
    /**
     * Whether to use tri-planar voxelization. More expensive, but can help with artifacts.
     */
    get triPlanarVoxelization() {
        return this._triPlanarVoxelization;
    }
    /**
     * Whether to use tri-planar voxelization. More expensive, but can help with artifacts.
     */
    set triPlanarVoxelization(enabled) {
        if (this._triPlanarVoxelization === enabled) {
            return;
        }
        this._triPlanarVoxelization = enabled;
        this._disposeVoxelTextures();
        this._createTextures();
    }
    /**
     * Set the matrix to use for scaling the world space to voxel space
     * @param matrix The matrix to use for scaling the world space to voxel space
     */
    setWorldScaleMatrix(matrix) {
        this._invWorldScaleMatrix = matrix;
    }
    /**
     * @returns Whether voxelization is currently happening.
     */
    isVoxelizationInProgress() {
        return this._voxelizationInProgress;
    }
    /**
     * Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     */
    get voxelResolutionExp() {
        return this._voxelResolutionExp;
    }
    /**
     * Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     */
    set voxelResolutionExp(resolutionExp) {
        if (this._voxelResolutionExp === resolutionExp && this._voxelGridZaxis) {
            return;
        }
        this._voxelResolutionExp = Math.round(Math.min(Math.max(resolutionExp, 3), 9));
        this._voxelResolution = Math.pow(2.0, this._voxelResolutionExp);
        this._disposeVoxelTextures();
        this._createTextures();
    }
    /**
     * Shows only the voxels that were rendered along a particular axis (while using triPlanarVoxelization).
     * If not set, the combined voxel grid will be shown.
     * Note: This only works when the debugMipNumber is set to 0 because we don't generate mips for each axis.
     * @param axis The axis to show (0 = x, 1 = y, 2 = z)
     */
    set voxelDebugAxis(axis) {
        this._voxelDebugAxis = axis;
    }
    get voxelDebugAxis() {
        return this._voxelDebugAxis;
    }
    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    setDebugDisplayParams(x, y, widthScale, heightScale) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    /**
     * The mip level to show in the debug display
     * @param mipNum The mip level to show in the debug display
     */
    setDebugMipNumber(mipNum) {
        this._debugMipNumber = mipNum;
    }
    /**
     * Sets the name of the debug pass
     */
    get debugPassName() {
        return this._debugPassName;
    }
    /**
     * Enable or disable the debug view for this pass
     */
    get voxelDebugEnabled() {
        return this._voxelDebugEnabled;
    }
    set voxelDebugEnabled(enabled) {
        if (this._voxelDebugEnabled === enabled) {
            return;
        }
        this._voxelDebugEnabled = enabled;
        if (enabled) {
            this._voxelSlabDebugRT = new RenderTargetTexture("voxelSlabDebug", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this._scene, {
                generateDepthBuffer: true,
                generateMipMaps: false,
                type: 0,
                format: 5,
                samplingMode: 1,
            });
            this._voxelSlabDebugRT.noPrePassRenderer = true;
        }
        if (this._voxelSlabDebugRT) {
            this._removeVoxelRTs([this._voxelSlabDebugRT]);
        }
        // Add the slab debug RT if needed.
        if (this._voxelDebugEnabled) {
            this._addRTsForRender([this._voxelSlabDebugRT], this._includedMeshes, this._voxelDebugAxis, 1, true);
            this._setDebugBindingsBound = this._setDebugBindings.bind(this);
            this._scene.onBeforeRenderObservable.add(this._setDebugBindingsBound);
        }
        else {
            this._scene.onBeforeRenderObservable.removeCallback(this._setDebugBindingsBound);
        }
    }
    /**
     * Creates the debug post process effect for this pass
     */
    _createDebugPass() {
        const isWebGPU = this._engine.isWebGPU;
        if (!this._voxelDebugPass) {
            const debugOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                textureFormat: 5,
                textureType: 0,
                samplingMode: 1,
                uniforms: ["sizeParams", "mipNumber"],
                samplers: ["voxelTexture", "voxelSlabTexture"],
                engine: this._engine,
                reusable: false,
                shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
                extraInitializations: (useWebGPU, list) => {
                    if (this._isVoxelGrid3D) {
                        if (useWebGPU) {
                            list.push(import("../../ShadersWGSL/iblVoxelGrid3dDebug.fragment.js"));
                        }
                        else {
                            list.push(import("../../Shaders/iblVoxelGrid3dDebug.fragment.js"));
                        }
                        return;
                    }
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblVoxelGrid2dArrayDebug.fragment.js"));
                    }
                    else {
                        list.push(import("../../Shaders/iblVoxelGrid2dArrayDebug.fragment.js"));
                    }
                },
            };
            this._voxelDebugPass = new PostProcess(this.debugPassName, this._isVoxelGrid3D ? "iblVoxelGrid3dDebug" : "iblVoxelGrid2dArrayDebug", debugOptions);
            this._voxelDebugPass.onApplyObservable.add((effect) => {
                if (this._voxelDebugAxis === 0) {
                    effect.setTexture("voxelTexture", this._voxelGridXaxis);
                }
                else if (this._voxelDebugAxis === 1) {
                    effect.setTexture("voxelTexture", this._voxelGridYaxis);
                }
                else if (this._voxelDebugAxis === 2) {
                    effect.setTexture("voxelTexture", this._voxelGridZaxis);
                }
                else {
                    effect.setTexture("voxelTexture", this.getVoxelGrid());
                }
                effect.setTexture("voxelSlabTexture", this._voxelSlabDebugRT);
                effect.setVector4("sizeParams", this._debugSizeParams);
                effect.setFloat("mipNumber", this._debugMipNumber);
            });
        }
    }
    /**
     * Instanciates the voxel renderer
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The render pipeline this pass is associated with
     * @param resolutionExp Resolution of the voxel grid. The final resolution will be 2^resolutionExp.
     * @param triPlanarVoxelization Whether to use tri-planar voxelization. More expensive, but can help with artifacts.
     * @returns The voxel renderer
     */
    constructor(scene, iblShadowsRenderPipeline, resolutionExp = 6, triPlanarVoxelization = true) {
        this._voxelMrtsXaxis = [];
        this._voxelMrtsYaxis = [];
        this._voxelMrtsZaxis = [];
        this._isVoxelGrid3D = true;
        this._renderTargets = [];
        this._triPlanarVoxelization = true;
        this._voxelizationInProgress = false;
        this._invWorldScaleMatrix = Matrix.Identity();
        this._voxelResolution = 64;
        this._voxelResolutionExp = 6;
        this._mipArray = [];
        this._voxelDebugEnabled = false;
        this._voxelDebugAxis = -1;
        this._debugSizeParams = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._includedMeshes = [];
        this._debugMipNumber = 0;
        this._debugPassName = "Voxelization Debug Pass";
        this._scene = scene;
        this._engine = scene.getEngine();
        this._triPlanarVoxelization = triPlanarVoxelization;
        if (!this._engine.getCaps().drawBuffersExtension) {
            Logger.Error("Can't do voxel rendering without the draw buffers extension.");
        }
        const isWebGPU = this._engine.isWebGPU;
        this._maxDrawBuffers = this._engine.getCaps().maxDrawBuffers || 0;
        this._copyMipEffectRenderer = new EffectRenderer(this._engine);
        this._copyMipEffectWrapper = new EffectWrapper({
            engine: this._engine,
            fragmentShader: "copyTexture3DLayerToTexture",
            useShaderStore: true,
            uniformNames: ["layerNum"],
            samplerNames: ["textureSampler"],
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../../ShadersWGSL/copyTexture3DLayerToTexture.fragment.js");
                }
                else {
                    await import("../../Shaders/copyTexture3DLayerToTexture.fragment.js");
                }
            },
        });
        this.voxelResolutionExp = resolutionExp;
    }
    _generateMipMaps() {
        const iterations = Math.ceil(Math.log2(this._voxelResolution));
        for (let i = 1; i < iterations + 1; i++) {
            this._generateMipMap(i);
        }
    }
    _generateMipMap(lodLevel) {
        // Generate a mip map for the given level by triggering the render of the procedural mip texture.
        const mipTarget = this._mipArray[lodLevel - 1];
        if (!mipTarget) {
            return;
        }
        mipTarget.setTexture("srcMip", lodLevel === 1 ? this.getVoxelGrid() : this._mipArray[lodLevel - 2]);
        mipTarget.render();
    }
    _copyMipMaps() {
        const iterations = Math.ceil(Math.log2(this._voxelResolution));
        for (let i = 1; i < iterations + 1; i++) {
            this._copyMipMap(i);
        }
    }
    _copyMipMap(lodLevel) {
        // Now, copy this mip into the mip chain of the voxel grid.
        // TODO - this currently isn't working. "textureSampler" isn't being properly set to mipTarget.
        const mipTarget = this._mipArray[lodLevel - 1];
        if (!mipTarget) {
            return;
        }
        const voxelGrid = this.getVoxelGrid();
        let rt;
        if (voxelGrid instanceof RenderTargetTexture && voxelGrid.renderTarget) {
            rt = voxelGrid.renderTarget;
        }
        else {
            rt = voxelGrid._rtWrapper;
        }
        if (rt) {
            this._copyMipEffectRenderer.saveStates();
            const bindSize = mipTarget.getSize().width;
            // Render to each layer of the voxel grid.
            for (let layer = 0; layer < bindSize; layer++) {
                this._engine.bindFramebuffer(rt, 0, bindSize, bindSize, true, lodLevel, layer);
                this._copyMipEffectRenderer.applyEffectWrapper(this._copyMipEffectWrapper);
                this._copyMipEffectWrapper.effect.setTexture("textureSampler", mipTarget);
                this._copyMipEffectWrapper.effect.setInt("layerNum", layer);
                this._copyMipEffectRenderer.draw();
                this._engine.unBindFramebuffer(rt, true);
            }
            this._copyMipEffectRenderer.restoreStates();
        }
    }
    _computeNumberOfSlabs() {
        return Math.ceil(this._voxelResolution / this._maxDrawBuffers);
    }
    _createTextures() {
        const isWebGPU = this._engine.isWebGPU;
        const size = {
            width: this._voxelResolution,
            height: this._voxelResolution,
            layers: this._isVoxelGrid3D ? undefined : this._voxelResolution,
            depth: this._isVoxelGrid3D ? this._voxelResolution : undefined,
        };
        const voxelAxisOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            type: 0,
            format: 6,
            samplingMode: 1,
        };
        // We can render up to maxDrawBuffers voxel slices of the grid per render.
        // We call this a slab.
        const numSlabs = this._computeNumberOfSlabs();
        const voxelCombinedOptions = {
            generateDepthBuffer: false,
            generateMipMaps: true,
            type: 0,
            format: 6,
            samplingMode: 4,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../../ShadersWGSL/iblCombineVoxelGrids.fragment.js");
                }
                else {
                    await import("../../Shaders/iblCombineVoxelGrids.fragment.js");
                }
            },
        };
        if (this._triPlanarVoxelization) {
            this._voxelGridXaxis = new RenderTargetTexture("voxelGridXaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridYaxis = new RenderTargetTexture("voxelGridYaxis", size, this._scene, voxelAxisOptions);
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelAxisOptions);
            this._voxelMrtsXaxis = this._createVoxelMRTs("x_axis_", this._voxelGridXaxis, numSlabs);
            this._voxelMrtsYaxis = this._createVoxelMRTs("y_axis_", this._voxelGridYaxis, numSlabs);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);
            this._voxelGridRT = new ProceduralTexture("combinedVoxelGrid", size, "iblCombineVoxelGrids", this._scene, voxelCombinedOptions, false);
            this._scene.proceduralTextures.splice(this._scene.proceduralTextures.indexOf(this._voxelGridRT), 1);
            this._voxelGridRT.setFloat("layer", 0.0);
            this._voxelGridRT.setTexture("voxelXaxisSampler", this._voxelGridXaxis);
            this._voxelGridRT.setTexture("voxelYaxisSampler", this._voxelGridYaxis);
            this._voxelGridRT.setTexture("voxelZaxisSampler", this._voxelGridZaxis);
            // We will render this only after voxelization is completed for the 3 axes.
            this._voxelGridRT.autoClear = false;
            this._voxelGridRT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._voxelGridRT.wrapV = Texture.CLAMP_ADDRESSMODE;
        }
        else {
            this._voxelGridZaxis = new RenderTargetTexture("voxelGridZaxis", size, this._scene, voxelCombinedOptions);
            this._voxelMrtsZaxis = this._createVoxelMRTs("z_axis_", this._voxelGridZaxis, numSlabs);
        }
        const generateVoxelMipOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            type: 0,
            format: 6,
            samplingMode: 1,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../../ShadersWGSL/iblGenerateVoxelMip.fragment.js");
                }
                else {
                    await import("../../Shaders/iblGenerateVoxelMip.fragment.js");
                }
            },
        };
        this._mipArray = new Array(Math.ceil(Math.log2(this._voxelResolution)));
        for (let mipIdx = 1; mipIdx <= this._mipArray.length; mipIdx++) {
            const mipDim = this._voxelResolution >> mipIdx;
            const mipSize = { width: mipDim, height: mipDim, depth: mipDim };
            this._mipArray[mipIdx - 1] = new ProceduralTexture("voxelMip" + mipIdx, mipSize, "iblGenerateVoxelMip", this._scene, generateVoxelMipOptions, false);
            this._scene.proceduralTextures.splice(this._scene.proceduralTextures.indexOf(this._mipArray[mipIdx - 1]), 1);
            const mipTarget = this._mipArray[mipIdx - 1];
            mipTarget.autoClear = false;
            mipTarget.wrapU = Texture.CLAMP_ADDRESSMODE;
            mipTarget.wrapV = Texture.CLAMP_ADDRESSMODE;
            mipTarget.setTexture("srcMip", mipIdx > 1 ? this._mipArray[mipIdx - 2] : this.getVoxelGrid());
            mipTarget.setInt("layerNum", 0);
        }
        this._createVoxelMaterials();
    }
    _createVoxelMRTs(name, voxelRT, numSlabs) {
        voxelRT.wrapU = Texture.CLAMP_ADDRESSMODE;
        voxelRT.wrapV = Texture.CLAMP_ADDRESSMODE;
        voxelRT.noPrePassRenderer = true;
        const mrtArray = [];
        const targetTypes = new Array(this._maxDrawBuffers).fill(this._isVoxelGrid3D ? 32879 : 35866);
        for (let mrt_index = 0; mrt_index < numSlabs; mrt_index++) {
            let layerIndices = new Array(this._maxDrawBuffers).fill(0);
            layerIndices = layerIndices.map((value, index) => mrt_index * this._maxDrawBuffers + index);
            let textureNames = new Array(this._maxDrawBuffers).fill("");
            textureNames = textureNames.map((value, index) => "voxel_grid_" + name + (mrt_index * this._maxDrawBuffers + index));
            const mrt = new MultiRenderTarget("mrt_" + name + mrt_index, { width: this._voxelResolution, height: this._voxelResolution, depth: this._isVoxelGrid3D ? this._voxelResolution : undefined }, this._maxDrawBuffers, // number of draw buffers
            this._scene, {
                types: new Array(this._maxDrawBuffers).fill(0),
                samplingModes: new Array(this._maxDrawBuffers).fill(3),
                generateMipMaps: false,
                targetTypes,
                formats: new Array(this._maxDrawBuffers).fill(6),
                faceIndex: new Array(this._maxDrawBuffers).fill(0),
                layerIndex: layerIndices,
                layerCounts: new Array(this._maxDrawBuffers).fill(this._voxelResolution),
                generateDepthBuffer: false,
                generateStencilBuffer: false,
            }, textureNames);
            mrt.clearColor = new Color4(0, 0, 0, 1);
            mrt.noPrePassRenderer = true;
            for (let i = 0; i < this._maxDrawBuffers; i++) {
                mrt.setInternalTexture(voxelRT.getInternalTexture(), i);
            }
            mrtArray.push(mrt);
        }
        return mrtArray;
    }
    _disposeVoxelTextures() {
        this._stopVoxelization();
        for (let i = 0; i < this._voxelMrtsZaxis.length; i++) {
            if (this._triPlanarVoxelization) {
                this._voxelMrtsXaxis[i].dispose(true);
                this._voxelMrtsYaxis[i].dispose(true);
            }
            this._voxelMrtsZaxis[i].dispose(true);
        }
        if (this._triPlanarVoxelization) {
            this._voxelGridXaxis?.dispose();
            this._voxelGridYaxis?.dispose();
            this._voxelGridRT?.dispose();
        }
        this._voxelGridZaxis?.dispose();
        this._mipArray.forEach((mip) => {
            mip.dispose();
        });
        this._voxelMaterial?.dispose();
        this._voxelSlabDebugMaterial?.dispose();
        this._mipArray = [];
        this._voxelMrtsXaxis = [];
        this._voxelMrtsYaxis = [];
        this._voxelMrtsZaxis = [];
    }
    _createVoxelMaterials() {
        const isWebGPU = this._engine.isWebGPU;
        this._voxelMaterial = new ShaderMaterial("voxelization", this._scene, "iblVoxelGrid", {
            uniforms: ["world", "viewMatrix", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
            defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblVoxelGrid.fragment.js"), import("../../ShadersWGSL/iblVoxelGrid.vertex.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/iblVoxelGrid.fragment.js"), import("../../Shaders/iblVoxelGrid.vertex.js")]);
                }
            },
        });
        this._voxelMaterial.cullBackFaces = false;
        this._voxelMaterial.backFaceCulling = false;
        this._voxelMaterial.depthFunction = Engine.ALWAYS;
        this._voxelSlabDebugMaterial = new ShaderMaterial("voxelSlabDebug", this._scene, "iblVoxelSlabDebug", {
            uniforms: ["world", "viewMatrix", "cameraViewMatrix", "projection", "invWorldScale", "nearPlane", "farPlane", "stepSize"],
            defines: ["MAX_DRAW_BUFFERS " + this._maxDrawBuffers],
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblVoxelSlabDebug.fragment.js"), import("../../ShadersWGSL/iblVoxelSlabDebug.vertex.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/iblVoxelSlabDebug.fragment.js"), import("../../Shaders/iblVoxelSlabDebug.vertex.js")]);
                }
            },
        });
    }
    _setDebugBindings() {
        this._voxelSlabDebugMaterial.setMatrix("projection", this._scene.activeCamera.getProjectionMatrix());
        this._voxelSlabDebugMaterial.setMatrix("cameraViewMatrix", this._scene.activeCamera.getViewMatrix());
    }
    /**
     * Checks if the voxel renderer is ready to voxelize scene
     * @returns true if the voxel renderer is ready to voxelize scene
     */
    isReady() {
        let allReady = this.getVoxelGrid().isReady();
        for (let i = 0; i < this._mipArray.length; i++) {
            const mipReady = this._mipArray[i].isReady();
            allReady && (allReady = mipReady);
        }
        if (!allReady || this._voxelizationInProgress) {
            return false;
        }
        return true;
    }
    /**
     * If the MRT's are already in the list of render targets, this will
     * remove them so that they don't get rendered again.
     */
    _stopVoxelization() {
        // If the MRT's are already in the list of render targets, remove them.
        this._removeVoxelRTs(this._voxelMrtsXaxis);
        this._removeVoxelRTs(this._voxelMrtsYaxis);
        this._removeVoxelRTs(this._voxelMrtsZaxis);
    }
    _removeVoxelRTs(rts) {
        // const currentRTs = this._scene.customRenderTargets;
        const rtIdx = this._renderTargets.findIndex((rt) => {
            if (rt === rts[0])
                return true;
            return false;
        });
        if (rtIdx >= 0) {
            this._renderTargets.splice(rtIdx, rts.length);
        }
        else {
            const rtIdx = this._scene.customRenderTargets.findIndex((rt) => {
                if (rt === rts[0])
                    return true;
                return false;
            });
            if (rtIdx >= 0) {
                this._scene.customRenderTargets.splice(rtIdx, rts.length);
            }
        }
    }
    /**
     * Renders voxel grid of scene for IBL shadows
     * @param includedMeshes
     */
    updateVoxelGrid(includedMeshes) {
        this._stopVoxelization();
        this._includedMeshes = includedMeshes;
        this._voxelizationInProgress = true;
        if (this._triPlanarVoxelization) {
            this._addRTsForRender(this._voxelMrtsXaxis, includedMeshes, 0);
            this._addRTsForRender(this._voxelMrtsYaxis, includedMeshes, 1);
            this._addRTsForRender(this._voxelMrtsZaxis, includedMeshes, 2);
        }
        else {
            this._addRTsForRender(this._voxelMrtsZaxis, includedMeshes, 2);
        }
        if (this._voxelDebugEnabled) {
            this._addRTsForRender([this._voxelSlabDebugRT], includedMeshes, this._voxelDebugAxis, 1, true);
        }
        this._renderVoxelGridBound = this._renderVoxelGrid.bind(this);
        this._scene.onAfterRenderObservable.add(this._renderVoxelGridBound);
    }
    _renderVoxelGrid() {
        if (this._voxelizationInProgress) {
            let allReady = this.getVoxelGrid().isReady();
            for (let i = 0; i < this._mipArray.length; i++) {
                const mipReady = this._mipArray[i].isReady();
                allReady && (allReady = mipReady);
            }
            for (let i = 0; i < this._renderTargets.length; i++) {
                const rttReady = this._renderTargets[i].isReadyForRendering();
                allReady && (allReady = rttReady);
            }
            if (allReady) {
                this._renderTargets.forEach((rt) => {
                    rt.render();
                });
                this._stopVoxelization();
                if (this._triPlanarVoxelization) {
                    this._voxelGridRT.render();
                }
                this._generateMipMaps();
                this._copyMipMaps();
                this._scene.onAfterRenderObservable.removeCallback(this._renderVoxelGridBound);
                this._voxelizationInProgress = false;
            }
        }
    }
    _addRTsForRender(mrts, includedMeshes, axis, shaderType = 0, continuousRender = false) {
        const slabSize = 1.0 / this._computeNumberOfSlabs();
        let voxelMaterial;
        if (shaderType === 0) {
            voxelMaterial = this._voxelMaterial;
        }
        else {
            voxelMaterial = this._voxelSlabDebugMaterial;
        }
        // We need to update the world scale uniform for every mesh being rendered to the voxel grid.
        mrts.forEach((mrt, mrtIndex) => {
            mrt.renderList = [];
            const nearPlane = mrtIndex * slabSize;
            const farPlane = (mrtIndex + 1) * slabSize;
            const stepSize = slabSize / this._maxDrawBuffers;
            const cameraPosition = new Vector3(0, 0, 0);
            let targetPosition = new Vector3(0, 0, 1);
            if (axis === 0) {
                targetPosition = new Vector3(1, 0, 0);
            }
            else if (axis === 1) {
                targetPosition = new Vector3(0, 1, 0);
            }
            let upDirection = new Vector3(0, 1, 0);
            if (axis === 1) {
                upDirection = new Vector3(1, 0, 0);
            }
            mrt.onBeforeRenderObservable.add(() => {
                voxelMaterial.setMatrix("viewMatrix", Matrix.LookAtLH(cameraPosition, targetPosition, upDirection));
                voxelMaterial.setMatrix("invWorldScale", this._invWorldScaleMatrix);
                voxelMaterial.setFloat("nearPlane", nearPlane);
                voxelMaterial.setFloat("farPlane", farPlane);
                voxelMaterial.setFloat("stepSize", stepSize);
            });
            // Set this material on every mesh in the scene (for this RT)
            if (includedMeshes.length === 0) {
                return;
            }
            includedMeshes.forEach((mesh) => {
                if (mesh) {
                    if (mesh.subMeshes && mesh.subMeshes.length > 0) {
                        mrt.renderList?.push(mesh);
                        mrt.setMaterialForRendering(mesh, voxelMaterial);
                    }
                    mesh.getChildMeshes().forEach((childMesh) => {
                        if (childMesh.subMeshes && childMesh.subMeshes.length > 0) {
                            mrt.renderList?.push(childMesh);
                            mrt.setMaterialForRendering(childMesh, voxelMaterial);
                        }
                    });
                }
            });
        });
        // Add the MRT's to render.
        if (continuousRender) {
            mrts.forEach((mrt) => {
                if (this._scene.customRenderTargets.indexOf(mrt) === -1) {
                    this._scene.customRenderTargets.push(mrt);
                }
            });
        }
        else {
            this._renderTargets = this._renderTargets.concat(mrts);
        }
    }
    /**
     * Called by the pipeline to resize resources.
     */
    resize() {
        this._voxelSlabDebugRT?.resize({ width: this._scene.getEngine().getRenderWidth(), height: this._scene.getEngine().getRenderHeight() });
    }
    /**
     * Disposes the voxel renderer and associated resources
     */
    dispose() {
        this._disposeVoxelTextures();
        if (this._voxelSlabDebugRT) {
            this._removeVoxelRTs([this._voxelSlabDebugRT]);
            this._voxelSlabDebugRT.dispose();
        }
        if (this._voxelDebugPass) {
            this._voxelDebugPass.dispose();
        }
        // TODO - dispose all created voxel materials.
    }
}
//# sourceMappingURL=iblShadowsVoxelRenderer.js.map