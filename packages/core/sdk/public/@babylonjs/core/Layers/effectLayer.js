import { __decorate } from "../tslib.es6.js";
import { serialize, serializeAsColor4, serializeAsCameraReference } from "../Misc/decorators.js";
import { Tools } from "../Misc/tools.js";
import { Observable } from "../Misc/observable.js";
import { EngineStore } from "../Engines/engineStore.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";

import { _WarnImport } from "../Misc/devTools.js";
import { GetExponentOfTwo } from "../Misc/tools.functions.js";
import { ThinEffectLayer } from "./thinEffectLayer.js";
/**
 * The effect layer Helps adding post process effect blended with the main pass.
 *
 * This can be for instance use to generate glow or highlight effects on the scene.
 *
 * The effect layer class can not be used directly and is intented to inherited from to be
 * customized per effects.
 */
export class EffectLayer {
    get _shouldRender() {
        return this._thinEffectLayer._shouldRender;
    }
    set _shouldRender(value) {
        this._thinEffectLayer._shouldRender = value;
    }
    get _emissiveTextureAndColor() {
        return this._thinEffectLayer._emissiveTextureAndColor;
    }
    set _emissiveTextureAndColor(value) {
        this._thinEffectLayer._emissiveTextureAndColor = value;
    }
    get _effectIntensity() {
        return this._thinEffectLayer._effectIntensity;
    }
    set _effectIntensity(value) {
        this._thinEffectLayer._effectIntensity = value;
    }
    /**
     * Force all the effect layers to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    static get ForceGLSL() {
        return ThinEffectLayer.ForceGLSL;
    }
    static set ForceGLSL(value) {
        ThinEffectLayer.ForceGLSL = value;
    }
    /**
     * The name of the layer
     */
    get name() {
        return this._thinEffectLayer.name;
    }
    set name(value) {
        this._thinEffectLayer.name = value;
    }
    /**
     * The clear color of the texture used to generate the glow map.
     */
    get neutralColor() {
        return this._thinEffectLayer.neutralColor;
    }
    set neutralColor(value) {
        this._thinEffectLayer.neutralColor = value;
    }
    /**
     * Specifies whether the highlight layer is enabled or not.
     */
    get isEnabled() {
        return this._thinEffectLayer.isEnabled;
    }
    set isEnabled(value) {
        this._thinEffectLayer.isEnabled = value;
    }
    /**
     * Gets the camera attached to the layer.
     */
    get camera() {
        return this._thinEffectLayer.camera;
    }
    /**
     * Gets the rendering group id the layer should render in.
     */
    get renderingGroupId() {
        return this._thinEffectLayer.renderingGroupId;
    }
    set renderingGroupId(renderingGroupId) {
        this._thinEffectLayer.renderingGroupId = renderingGroupId;
    }
    /**
     * Specifies if the bounding boxes should be rendered normally or if they should undergo the effect of the layer
     */
    get disableBoundingBoxesFromEffectLayer() {
        return this._thinEffectLayer.disableBoundingBoxesFromEffectLayer;
    }
    set disableBoundingBoxesFromEffectLayer(value) {
        this._thinEffectLayer.disableBoundingBoxesFromEffectLayer = value;
    }
    /**
     * Gets the main texture where the effect is rendered
     */
    get mainTexture() {
        return this._mainTexture;
    }
    get _shaderLanguage() {
        return this._thinEffectLayer.shaderLanguage;
    }
    /**
     * Gets the shader language used in this material.
     */
    get shaderLanguage() {
        return this._thinEffectLayer.shaderLanguage;
    }
    /**
     * Sets a specific material to be used to render a mesh/a list of meshes in the layer
     * @param mesh mesh or array of meshes
     * @param material material to use by the layer when rendering the mesh(es). If undefined is passed, the specific material created by the layer will be used.
     */
    setMaterialForRendering(mesh, material) {
        this._thinEffectLayer.setMaterialForRendering(mesh, material);
    }
    /**
     * Gets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to get the effect intensity for
     * @returns The intensity of the effect for the mesh
     */
    getEffectIntensity(mesh) {
        return this._thinEffectLayer.getEffectIntensity(mesh);
    }
    /**
     * Sets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to set the effect intensity for
     * @param intensity The intensity of the effect for the mesh
     */
    setEffectIntensity(mesh, intensity) {
        this._thinEffectLayer.setEffectIntensity(mesh, intensity);
    }
    /**
     * Instantiates a new effect Layer and references it in the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     * @param thinEffectLayer The thin instance of the effect layer (optional)
     */
    constructor(
    /** The Friendly of the effect in the scene */
    name, scene, forceGLSL = false, thinEffectLayer) {
        this._maxSize = 0;
        this._mainTextureDesiredSize = { width: 0, height: 0 };
        this._postProcesses = [];
        this._textures = [];
        /**
         * An event triggered when the effect layer has been disposed.
         */
        this.onDisposeObservable = new Observable();
        /**
         * An event triggered when the effect layer is about rendering the main texture with the glowy parts.
         */
        this.onBeforeRenderMainTextureObservable = new Observable();
        /**
         * An event triggered when the generated texture is being merged in the scene.
         */
        this.onBeforeComposeObservable = new Observable();
        /**
         * An event triggered when the mesh is rendered into the effect render target.
         */
        this.onBeforeRenderMeshToEffect = new Observable();
        /**
         * An event triggered after the mesh has been rendered into the effect render target.
         */
        this.onAfterRenderMeshToEffect = new Observable();
        /**
         * An event triggered when the generated texture has been merged in the scene.
         */
        this.onAfterComposeObservable = new Observable();
        /**
         * An event triggered when the effect layer changes its size.
         */
        this.onSizeChangedObservable = new Observable();
        this._internalThinEffectLayer = !thinEffectLayer;
        if (!thinEffectLayer) {
            thinEffectLayer = new ThinEffectLayer(name, scene, forceGLSL, false, this._importShadersAsync.bind(this));
            thinEffectLayer.getEffectName = this.getEffectName.bind(this);
            thinEffectLayer.isReady = this.isReady.bind(this);
            thinEffectLayer._createMergeEffect = this._createMergeEffect.bind(this);
            thinEffectLayer._createTextureAndPostProcesses = this._createTextureAndPostProcesses.bind(this);
            thinEffectLayer._internalCompose = this._internalRender.bind(this);
            thinEffectLayer._setEmissiveTextureAndColor = this._setEmissiveTextureAndColor.bind(this);
            thinEffectLayer._numInternalDraws = this._numInternalDraws.bind(this);
            thinEffectLayer._addCustomEffectDefines = this._addCustomEffectDefines.bind(this);
            thinEffectLayer.hasMesh = this.hasMesh.bind(this);
            thinEffectLayer.shouldRender = this.shouldRender.bind(this);
            thinEffectLayer._shouldRenderMesh = this._shouldRenderMesh.bind(this);
            thinEffectLayer._canRenderMesh = this._canRenderMesh.bind(this);
            thinEffectLayer._useMeshMaterial = this._useMeshMaterial.bind(this);
        }
        this._thinEffectLayer = thinEffectLayer;
        this.name = name;
        this._scene = scene || EngineStore.LastCreatedScene;
        EffectLayer._SceneComponentInitialization(this._scene);
        this._engine = this._scene.getEngine();
        this._maxSize = this._engine.getCaps().maxTextureSize;
        this._scene.effectLayers.push(this);
        this._thinEffectLayer.onDisposeObservable.add(() => {
            this.onDisposeObservable.notifyObservers(this);
        });
        this._thinEffectLayer.onBeforeRenderLayerObservable.add(() => {
            this.onBeforeRenderMainTextureObservable.notifyObservers(this);
        });
        this._thinEffectLayer.onBeforeComposeObservable.add(() => {
            this.onBeforeComposeObservable.notifyObservers(this);
        });
        this._thinEffectLayer.onBeforeRenderMeshToEffect.add((mesh) => {
            this.onBeforeRenderMeshToEffect.notifyObservers(mesh);
        });
        this._thinEffectLayer.onAfterRenderMeshToEffect.add((mesh) => {
            this.onAfterRenderMeshToEffect.notifyObservers(mesh);
        });
        this._thinEffectLayer.onAfterComposeObservable.add(() => {
            this.onAfterComposeObservable.notifyObservers(this);
        });
    }
    get _shadersLoaded() {
        return this._thinEffectLayer._shadersLoaded;
    }
    set _shadersLoaded(value) {
        this._thinEffectLayer._shadersLoaded = value;
    }
    /**
     * Number of times _internalRender will be called. Some effect layers need to render the mesh several times, so they should override this method with the number of times the mesh should be rendered
     * @returns Number of times a mesh must be rendered in the layer
     */
    _numInternalDraws() {
        return this._internalThinEffectLayer ? 1 : this._thinEffectLayer._numInternalDraws();
    }
    /**
     * Initializes the effect layer with the required options.
     * @param options Sets of none mandatory options to use with the layer (see IEffectLayerOptions for more information)
     */
    _init(options) {
        // Adapt options
        this._effectLayerOptions = {
            mainTextureRatio: 0.5,
            alphaBlendingMode: 2,
            camera: null,
            renderingGroupId: -1,
            mainTextureType: 0,
            generateStencilBuffer: false,
            ...options,
        };
        this._setMainTextureSize();
        this._thinEffectLayer._init(options);
        this._createMainTexture();
        this._createTextureAndPostProcesses();
    }
    /**
     * Sets the main texture desired size which is the closest power of two
     * of the engine canvas size.
     */
    _setMainTextureSize() {
        if (this._effectLayerOptions.mainTextureFixedSize) {
            this._mainTextureDesiredSize.width = this._effectLayerOptions.mainTextureFixedSize;
            this._mainTextureDesiredSize.height = this._effectLayerOptions.mainTextureFixedSize;
        }
        else {
            this._mainTextureDesiredSize.width = this._engine.getRenderWidth() * this._effectLayerOptions.mainTextureRatio;
            this._mainTextureDesiredSize.height = this._engine.getRenderHeight() * this._effectLayerOptions.mainTextureRatio;
            this._mainTextureDesiredSize.width = this._engine.needPOTTextures
                ? GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize)
                : this._mainTextureDesiredSize.width;
            this._mainTextureDesiredSize.height = this._engine.needPOTTextures
                ? GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize)
                : this._mainTextureDesiredSize.height;
        }
        this._mainTextureDesiredSize.width = Math.floor(this._mainTextureDesiredSize.width);
        this._mainTextureDesiredSize.height = Math.floor(this._mainTextureDesiredSize.height);
    }
    /**
     * Creates the main texture for the effect layer.
     */
    _createMainTexture() {
        this._mainTexture = new RenderTargetTexture("EffectLayerMainRTT", {
            width: this._mainTextureDesiredSize.width,
            height: this._mainTextureDesiredSize.height,
        }, this._scene, {
            type: this._effectLayerOptions.mainTextureType,
            samplingMode: Texture.TRILINEAR_SAMPLINGMODE,
            generateStencilBuffer: this._effectLayerOptions.generateStencilBuffer,
            existingObjectRenderer: this._thinEffectLayer.objectRenderer,
        });
        this._mainTexture.activeCamera = this._effectLayerOptions.camera;
        this._mainTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._mainTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._mainTexture.anisotropicFilteringLevel = 1;
        this._mainTexture.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._mainTexture.renderParticles = false;
        this._mainTexture.renderList = null;
        this._mainTexture.ignoreCameraViewport = true;
        this._mainTexture.onClearObservable.add((engine) => {
            engine.clear(this.neutralColor, true, true, true);
        });
    }
    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _addCustomEffectDefines(defines) {
        // Nothing to add by default.
    }
    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @param emissiveTexture the associated emissive texture used to generate the glow
     * @returns true if ready otherwise, false
     */
    _isReady(subMesh, useInstances, emissiveTexture) {
        return this._internalThinEffectLayer
            ? this._thinEffectLayer._internalIsSubMeshReady(subMesh, useInstances, emissiveTexture)
            : this._thinEffectLayer._isSubMeshReady(subMesh, useInstances, emissiveTexture);
    }
    async _importShadersAsync() { }
    _arePostProcessAndMergeReady() {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalIsLayerReady() : this._thinEffectLayer.isLayerReady();
    }
    /**
     * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
     */
    render() {
        if (!this._thinEffectLayer.compose()) {
            return;
        }
        // Handle size changes.
        const size = this._mainTexture.getSize();
        this._setMainTextureSize();
        if ((size.width !== this._mainTextureDesiredSize.width || size.height !== this._mainTextureDesiredSize.height) &&
            this._mainTextureDesiredSize.width !== 0 &&
            this._mainTextureDesiredSize.height !== 0) {
            // Recreate RTT and post processes on size change.
            this.onSizeChangedObservable.notifyObservers(this);
            this._disposeTextureAndPostProcesses();
            this._createMainTexture();
            this._createTextureAndPostProcesses();
        }
    }
    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    hasMesh(mesh) {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalHasMesh(mesh) : this._thinEffectLayer.hasMesh(mesh);
    }
    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    shouldRender() {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalShouldRender() : this._thinEffectLayer.shouldRender();
    }
    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRenderMesh(mesh) {
        return this._internalThinEffectLayer ? true : this._thinEffectLayer._shouldRenderMesh(mesh);
    }
    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    _canRenderMesh(mesh, material) {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalCanRenderMesh(mesh, material) : this._thinEffectLayer._canRenderMesh(mesh, material);
    }
    /**
     * Returns true if the mesh should render, otherwise false.
     * @returns true if it should render otherwise false
     */
    _shouldRenderEmissiveTextureForMesh() {
        return true;
    }
    /**
     * Defines whether the current material of the mesh should be use to render the effect.
     * @param mesh defines the current mesh to render
     * @returns true if the mesh material should be use
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _useMeshMaterial(mesh) {
        return this._internalThinEffectLayer ? false : this._thinEffectLayer._useMeshMaterial(mesh);
    }
    /**
     * Rebuild the required buffers.
     * @internal Internal use only.
     */
    _rebuild() {
        this._thinEffectLayer._rebuild();
    }
    /**
     * Dispose only the render target textures and post process.
     */
    _disposeTextureAndPostProcesses() {
        this._mainTexture.dispose();
        for (let i = 0; i < this._postProcesses.length; i++) {
            if (this._postProcesses[i]) {
                this._postProcesses[i].dispose();
            }
        }
        this._postProcesses = [];
        for (let i = 0; i < this._textures.length; i++) {
            if (this._textures[i]) {
                this._textures[i].dispose();
            }
        }
        this._textures = [];
    }
    /**
     * Dispose the highlight layer and free resources.
     */
    dispose() {
        this._thinEffectLayer.dispose();
        // Clean textures and post processes
        this._disposeTextureAndPostProcesses();
        // Remove from scene
        const index = this._scene.effectLayers.indexOf(this, 0);
        if (index > -1) {
            this._scene.effectLayers.splice(index, 1);
        }
        // Callback
        this.onDisposeObservable.clear();
        this.onBeforeRenderMainTextureObservable.clear();
        this.onBeforeComposeObservable.clear();
        this.onBeforeRenderMeshToEffect.clear();
        this.onAfterRenderMeshToEffect.clear();
        this.onAfterComposeObservable.clear();
        this.onSizeChangedObservable.clear();
    }
    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    getClassName() {
        return "EffectLayer";
    }
    /**
     * Creates an effect layer from parsed effect layer data
     * @param parsedEffectLayer defines effect layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the effect layer information
     * @returns a parsed effect Layer
     */
    static Parse(parsedEffectLayer, scene, rootUrl) {
        const effectLayerType = Tools.Instantiate(parsedEffectLayer.customType);
        return effectLayerType.Parse(parsedEffectLayer, scene, rootUrl);
    }
}
/**
 * @internal
 */
EffectLayer._SceneComponentInitialization = (_) => {
    throw _WarnImport("EffectLayerSceneComponent");
};
__decorate([
    serialize()
], EffectLayer.prototype, "name", null);
__decorate([
    serializeAsColor4()
], EffectLayer.prototype, "neutralColor", null);
__decorate([
    serialize()
], EffectLayer.prototype, "isEnabled", null);
__decorate([
    serializeAsCameraReference()
], EffectLayer.prototype, "camera", null);
__decorate([
    serialize()
], EffectLayer.prototype, "renderingGroupId", null);
__decorate([
    serialize()
], EffectLayer.prototype, "disableBoundingBoxesFromEffectLayer", null);
//# sourceMappingURL=effectLayer.js.map