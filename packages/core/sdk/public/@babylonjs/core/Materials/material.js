import { __decorate } from "../tslib.es6.js";
import { serialize } from "../Misc/decorators.js";
import { Tools } from "../Misc/tools.js";
import { Observable } from "../Misc/observable.js";
import { EngineStore } from "../Engines/engineStore.js";
import { SubMesh } from "../Meshes/subMesh.js";
import { UniformBuffer } from "./uniformBuffer.js";

import { Logger } from "../Misc/logger.js";
import { Plane } from "../Maths/math.plane.js";
import { DrawWrapper } from "./drawWrapper.js";
import { MaterialStencilState } from "./materialStencilState.js";
import { BindSceneUniformBuffer } from "./materialHelper.functions.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * Base class for the main features of a material in Babylon.js
 */
export class Material {
    /** @internal */
    get _supportGlowLayer() {
        return false;
    }
    /** @internal */
    set _glowModeEnabled(value) {
        // Do nothing here
    }
    /**
     * Gets the shader language used in this material.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * If the material can be rendered to several textures with MRT extension
     */
    get canRenderToMRT() {
        // By default, shaders are not compatible with MRTs
        // Base classes should override that if their shader supports MRT
        return false;
    }
    /**
     * Sets the alpha value of the material
     */
    set alpha(value) {
        if (this._alpha === value) {
            return;
        }
        const oldValue = this._alpha;
        this._alpha = value;
        // Only call dirty when there is a state change (no alpha / alpha)
        if (oldValue === 1 || value === 1) {
            this.markAsDirty(Material.MiscDirtyFlag + Material.PrePassDirtyFlag);
        }
    }
    /**
     * Gets the alpha value of the material
     */
    get alpha() {
        return this._alpha;
    }
    /**
     * Sets the culling state (true to enable culling, false to disable)
     */
    set backFaceCulling(value) {
        if (this._backFaceCulling === value) {
            return;
        }
        this._backFaceCulling = value;
        this.markAsDirty(Material.TextureDirtyFlag);
    }
    /**
     * Gets the culling state
     */
    get backFaceCulling() {
        return this._backFaceCulling;
    }
    /**
     * Sets the type of faces that should be culled (true for back faces, false for front faces)
     */
    set cullBackFaces(value) {
        if (this._cullBackFaces === value) {
            return;
        }
        this._cullBackFaces = value;
        this.markAsDirty(Material.TextureDirtyFlag);
    }
    /**
     * Gets the type of faces that should be culled
     */
    get cullBackFaces() {
        return this._cullBackFaces;
    }
    /**
     * Block the dirty-mechanism for this specific material
     * When set to false after being true the material will be marked as dirty.
     */
    get blockDirtyMechanism() {
        return this._blockDirtyMechanism;
    }
    set blockDirtyMechanism(value) {
        if (this._blockDirtyMechanism === value) {
            return;
        }
        this._blockDirtyMechanism = value;
        if (!value) {
            this.markDirty();
        }
    }
    /**
     * This allows you to modify the material without marking it as dirty after every change.
     * This function should be used if you need to make more than one dirty-enabling change to the material - adding a texture, setting a new fill mode and so on.
     * The callback will pass the material as an argument, so you can make your changes to it.
     * @param callback the callback to be executed that will update the material
     */
    atomicMaterialsUpdate(callback) {
        this.blockDirtyMechanism = true;
        try {
            callback(this);
        }
        finally {
            this.blockDirtyMechanism = false;
        }
    }
    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    get hasRenderTargetTextures() {
        this._eventInfo.hasRenderTargetTextures = false;
        this._callbackPluginEventHasRenderTargetTextures(this._eventInfo);
        return this._eventInfo.hasRenderTargetTextures;
    }
    /**
     * Called during a dispose event
     */
    set onDispose(callback) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }
    /**
     * An event triggered when the material is bound
     */
    get onBindObservable() {
        if (!this._onBindObservable) {
            this._onBindObservable = new Observable();
        }
        return this._onBindObservable;
    }
    /**
     * Called during a bind event
     */
    set onBind(callback) {
        if (this._onBindObserver) {
            this.onBindObservable.remove(this._onBindObserver);
        }
        this._onBindObserver = this.onBindObservable.add(callback);
    }
    /**
     * An event triggered when the material is unbound
     */
    get onUnBindObservable() {
        if (!this._onUnBindObservable) {
            this._onUnBindObservable = new Observable();
        }
        return this._onUnBindObservable;
    }
    /**
     * An event triggered when the effect is (re)created
     */
    get onEffectCreatedObservable() {
        if (!this._onEffectCreatedObservable) {
            this._onEffectCreatedObservable = new Observable();
        }
        return this._onEffectCreatedObservable;
    }
    /**
     * Sets the value of the alpha mode.
     *
     * | Value | Type | Description |
     * | --- | --- | --- |
     * | 0 | ALPHA_DISABLE |   |
     * | 1 | ALPHA_ADD |   |
     * | 2 | ALPHA_COMBINE |   |
     * | 3 | ALPHA_SUBTRACT |   |
     * | 4 | ALPHA_MULTIPLY |   |
     * | 5 | ALPHA_MAXIMIZED |   |
     * | 6 | ALPHA_ONEONE |   |
     * | 7 | ALPHA_PREMULTIPLIED |   |
     * | 8 | ALPHA_PREMULTIPLIED_PORTERDUFF |   |
     * | 9 | ALPHA_INTERPOLATE |   |
     * | 10 | ALPHA_SCREENMODE |   |
     *
     */
    set alphaMode(value) {
        if (this._alphaMode === value) {
            return;
        }
        this._alphaMode = value;
        this.markAsDirty(Material.TextureDirtyFlag);
    }
    /**
     * Gets the value of the alpha mode
     */
    get alphaMode() {
        return this._alphaMode;
    }
    /**
     * Sets the need depth pre-pass value
     */
    set needDepthPrePass(value) {
        if (this._needDepthPrePass === value) {
            return;
        }
        this._needDepthPrePass = value;
        if (this._needDepthPrePass) {
            this.checkReadyOnEveryCall = true;
        }
    }
    /**
     * Gets the depth pre-pass value
     */
    get needDepthPrePass() {
        return this._needDepthPrePass;
    }
    /**
     * Can this material render to prepass
     */
    get isPrePassCapable() {
        return false;
    }
    /**
     * Sets the state for enabling fog
     */
    set fogEnabled(value) {
        if (this._fogEnabled === value) {
            return;
        }
        this._fogEnabled = value;
        this.markAsDirty(Material.MiscDirtyFlag);
    }
    /**
     * Gets the value of the fog enabled state
     */
    get fogEnabled() {
        return this._fogEnabled;
    }
    get wireframe() {
        switch (this._fillMode) {
            case Material.WireFrameFillMode:
            case Material.LineListDrawMode:
            case Material.LineLoopDrawMode:
            case Material.LineStripDrawMode:
                return true;
        }
        return this._scene.forceWireframe;
    }
    /**
     * Sets the state of wireframe mode
     */
    set wireframe(value) {
        this.fillMode = value ? Material.WireFrameFillMode : Material.TriangleFillMode;
    }
    /**
     * Gets the value specifying if point clouds are enabled
     */
    get pointsCloud() {
        switch (this._fillMode) {
            case Material.PointFillMode:
            case Material.PointListDrawMode:
                return true;
        }
        return this._scene.forcePointsCloud;
    }
    /**
     * Sets the state of point cloud mode
     */
    set pointsCloud(value) {
        this.fillMode = value ? Material.PointFillMode : Material.TriangleFillMode;
    }
    /**
     * Gets the material fill mode
     */
    get fillMode() {
        return this._fillMode;
    }
    /**
     * Sets the material fill mode
     */
    set fillMode(value) {
        if (this._fillMode === value) {
            return;
        }
        this._fillMode = value;
        this.markAsDirty(Material.MiscDirtyFlag);
    }
    /**
     * In case the depth buffer does not allow enough depth precision for your scene (might be the case in large scenes)
     * You can try switching to logarithmic depth.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/logarithmicDepthBuffer
     */
    get useLogarithmicDepth() {
        return this._useLogarithmicDepth;
    }
    set useLogarithmicDepth(value) {
        const fragmentDepthSupported = this.getScene().getEngine().getCaps().fragmentDepthSupported;
        if (value && !fragmentDepthSupported) {
            Logger.Warn("Logarithmic depth has been requested for a material on a device that doesn't support it.");
        }
        this._useLogarithmicDepth = value && fragmentDepthSupported;
        this._markAllSubMeshesAsMiscDirty();
    }
    /** @internal */
    _getDrawWrapper() {
        return this._drawWrapper;
    }
    /**
     * @internal
     */
    _setDrawWrapper(drawWrapper) {
        this._drawWrapper = drawWrapper;
    }
    /**
     * Creates a material instance
     * @param name defines the name of the material
     * @param scene defines the scene to reference
     * @param doNotAdd specifies if the material should be added to the scene
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name, scene, doNotAdd, forceGLSL = false) {
        /**
         * Custom shadow depth material to use for shadow rendering instead of the in-built one
         */
        this.shadowDepthWrapper = null;
        /**
         * Gets or sets a boolean indicating that the material is allowed (if supported) to do shader hot swapping.
         * This means that the material can keep using a previous shader while a new one is being compiled.
         * This is mostly used when shader parallel compilation is supported (true by default)
         */
        this.allowShaderHotSwapping = true;
        /** Shader language used by the material */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._forceGLSL = false;
        /**
         * Gets or sets user defined metadata
         */
        this.metadata = null;
        /**
         * For internal use only. Please do not use.
         */
        this.reservedDataStore = null;
        /**
         * Specifies if the ready state should be checked on each call
         */
        this.checkReadyOnEveryCall = false;
        /**
         * Specifies if the ready state should be checked once
         */
        this.checkReadyOnlyOnce = false;
        /**
         * The state of the material
         */
        this.state = "";
        /**
         * The alpha value of the material
         */
        this._alpha = 1.0;
        /**
         * Specifies if back face culling is enabled
         */
        this._backFaceCulling = true;
        /**
         * Specifies if back or front faces should be culled (when culling is enabled)
         */
        this._cullBackFaces = true;
        this._blockDirtyMechanism = false;
        /**
         * Stores the value for side orientation
         */
        this.sideOrientation = null;
        /**
         * Callback triggered when the material is compiled
         */
        this.onCompiled = null;
        /**
         * Callback triggered when an error occurs
         */
        this.onError = null;
        /**
         * Callback triggered to get the render target textures
         */
        this.getRenderTargetTextures = null;
        /**
         * Specifies if the material should be serialized
         */
        this.doNotSerialize = false;
        /**
         * @internal
         */
        this._storeEffectOnSubMeshes = false;
        /**
         * Stores the animations for the material
         */
        this.animations = null;
        /**
         * An event triggered when the material is disposed
         */
        this.onDisposeObservable = new Observable();
        /**
         * An observer which watches for dispose events
         */
        this._onDisposeObserver = null;
        this._onUnBindObservable = null;
        /**
         * An observer which watches for bind events
         */
        this._onBindObserver = null;
        /**
         * Stores the value of the alpha mode
         */
        this._alphaMode = 2;
        /**
         * Stores the state of the need depth pre-pass value
         */
        this._needDepthPrePass = false;
        /**
         * Specifies if depth writing should be disabled
         */
        this.disableDepthWrite = false;
        /**
         * Specifies if color writing should be disabled
         */
        this.disableColorWrite = false;
        /**
         * Specifies if depth writing should be forced
         */
        this.forceDepthWrite = false;
        /**
         * Specifies the depth function that should be used. 0 means the default engine function
         */
        this.depthFunction = 0;
        /**
         * Specifies if there should be a separate pass for culling
         */
        this.separateCullingPass = false;
        /**
         * Stores the state specifying if fog should be enabled
         */
        this._fogEnabled = true;
        /**
         * Stores the size of points
         */
        this.pointSize = 1.0;
        /**
         * Stores the z offset Factor value
         */
        this.zOffset = 0;
        /**
         * Stores the z offset Units value
         */
        this.zOffsetUnits = 0;
        /**
         * Gives access to the stencil properties of the material
         */
        this.stencil = new MaterialStencilState();
        /**
         * Specifies if uniform buffers should be used
         */
        this._useUBO = false;
        /**
         * Stores the fill mode state
         */
        this._fillMode = Material.TriangleFillMode;
        /**
         * Specifies if the depth write state should be cached
         */
        this._cachedDepthWriteState = false;
        /**
         * Specifies if the color write state should be cached
         */
        this._cachedColorWriteState = false;
        /**
         * Specifies if the depth function state should be cached
         */
        this._cachedDepthFunctionState = 0;
        /** @internal */
        this._indexInSceneMaterialArray = -1;
        /** @internal */
        this.meshMap = null;
        /** @internal */
        this._parentContainer = null;
        /** @internal */
        this._uniformBufferLayoutBuilt = false;
        this._eventInfo = {}; // will be initialized before each event notification
        /** @internal */
        this._callbackPluginEventGeneric = () => void 0;
        /** @internal */
        this._callbackPluginEventIsReadyForSubMesh = () => void 0;
        /** @internal */
        this._callbackPluginEventPrepareDefines = () => void 0;
        /** @internal */
        this._callbackPluginEventPrepareDefinesBeforeAttributes = () => void 0;
        /** @internal */
        this._callbackPluginEventHardBindForSubMesh = () => void 0;
        /** @internal */
        this._callbackPluginEventBindForSubMesh = () => void 0;
        /** @internal */
        this._callbackPluginEventHasRenderTargetTextures = () => void 0;
        /** @internal */
        this._callbackPluginEventFillRenderTargetTextures = () => void 0;
        /**
         * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
         */
        this._forceAlphaTest = false;
        /**
         * The transparency mode of the material.
         */
        this._transparencyMode = null;
        this.name = name;
        const setScene = scene || EngineStore.LastCreatedScene;
        if (!setScene) {
            return;
        }
        this._scene = setScene;
        this._dirtyCallbacks = {};
        this._forceGLSL = forceGLSL;
        this._dirtyCallbacks[1] = this._markAllSubMeshesAsTexturesDirty.bind(this);
        this._dirtyCallbacks[2] = this._markAllSubMeshesAsLightsDirty.bind(this);
        this._dirtyCallbacks[4] = this._markAllSubMeshesAsFresnelDirty.bind(this);
        this._dirtyCallbacks[8] = this._markAllSubMeshesAsAttributesDirty.bind(this);
        this._dirtyCallbacks[16] = this._markAllSubMeshesAsMiscDirty.bind(this);
        this._dirtyCallbacks[32] = this._markAllSubMeshesAsPrePassDirty.bind(this);
        this._dirtyCallbacks[63] = this._markAllSubMeshesAsAllDirty.bind(this);
        this.id = name || Tools.RandomId();
        this.uniqueId = this._scene.getUniqueId();
        this._materialContext = this._scene.getEngine().createMaterialContext();
        this._drawWrapper = new DrawWrapper(this._scene.getEngine(), false);
        this._drawWrapper.materialContext = this._materialContext;
        this._uniformBuffer = new UniformBuffer(this._scene.getEngine(), undefined, undefined, name);
        this._useUBO = this.getScene().getEngine().supportsUniformBuffers;
        this._createUniformBuffer();
        if (!doNotAdd) {
            this._scene.addMaterial(this);
        }
        if (this._scene.useMaterialMeshMap) {
            this.meshMap = {};
        }
        Material.OnEventObservable.notifyObservers(this, 1 /* MaterialPluginEvent.Created */);
    }
    /** @internal */
    _createUniformBuffer() {
        const engine = this.getScene().getEngine();
        this._uniformBuffer?.dispose();
        if (engine.isWebGPU && !this._forceGLSL) {
            // Switch main UBO to non UBO to connect to leftovers UBO in webgpu
            this._uniformBuffer = new UniformBuffer(engine, undefined, undefined, this.name, true);
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
        else {
            this._uniformBuffer = new UniformBuffer(this._scene.getEngine(), undefined, undefined, this.name);
        }
        this._uniformBufferLayoutBuilt = false;
    }
    /**
     * Returns a string representation of the current material
     * @param fullDetails defines a boolean indicating which levels of logging is desired
     * @returns a string with material information
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toString(fullDetails) {
        const ret = "Name: " + this.name;
        return ret;
    }
    /**
     * Gets the class name of the material
     * @returns a string with the class name of the material
     */
    getClassName() {
        return "Material";
    }
    /** @internal */
    get _isMaterial() {
        return true;
    }
    /**
     * Specifies if updates for the material been locked
     */
    get isFrozen() {
        return this.checkReadyOnlyOnce;
    }
    /**
     * Locks updates for the material
     */
    freeze() {
        this.markDirty();
        this.checkReadyOnlyOnce = true;
    }
    /**
     * Unlocks updates for the material
     */
    unfreeze() {
        this.markDirty();
        this.checkReadyOnlyOnce = false;
    }
    /**
     * Specifies if the material is ready to be used
     * @param mesh defines the mesh to check
     * @param useInstances specifies if instances should be used
     * @returns a boolean indicating if the material is ready to be used
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isReady(mesh, useInstances) {
        return true;
    }
    /**
     * Specifies that the submesh is ready to be used
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isReadyForSubMesh(mesh, subMesh, useInstances) {
        const defines = subMesh.materialDefines;
        if (!defines) {
            return false;
        }
        this._eventInfo.isReadyForSubMesh = true;
        this._eventInfo.defines = defines;
        this._callbackPluginEventIsReadyForSubMesh(this._eventInfo);
        return this._eventInfo.isReadyForSubMesh;
    }
    /**
     * Returns the material effect
     * @returns the effect associated with the material
     */
    getEffect() {
        return this._drawWrapper.effect;
    }
    /**
     * Returns the current scene
     * @returns a Scene
     */
    getScene() {
        return this._scene;
    }
    /** @internal */
    _getEffectiveOrientation(mesh) {
        return this.sideOrientation !== null ? this.sideOrientation : mesh.sideOrientation;
    }
    /**
     * Gets the current transparency mode.
     */
    get transparencyMode() {
        return this._transparencyMode;
    }
    /**
     * Sets the transparency mode of the material.
     *
     * | Value | Type                                | Description |
     * | ----- | ----------------------------------- | ----------- |
     * | 0     | OPAQUE                              |             |
     * | 1     | ALPHATEST                           |             |
     * | 2     | ALPHABLEND                          |             |
     * | 3     | ALPHATESTANDBLEND                   |             |
     *
     */
    set transparencyMode(value) {
        if (this._transparencyMode === value) {
            return;
        }
        this._transparencyMode = value;
        this._forceAlphaTest = value === Material.MATERIAL_ALPHATESTANDBLEND;
        this._markAllSubMeshesAsTexturesAndMiscDirty();
    }
    /**
     * Returns true if alpha blending should be disabled.
     */
    get _disableAlphaBlending() {
        return this._transparencyMode === Material.MATERIAL_OPAQUE || this._transparencyMode === Material.MATERIAL_ALPHATEST;
    }
    /**
     * Specifies whether or not this material should be rendered in alpha blend mode.
     * @returns a boolean specifying if alpha blending is needed
     */
    needAlphaBlending() {
        if (this._disableAlphaBlending) {
            return false;
        }
        return this.alpha < 1.0;
    }
    /**
     * Specifies if the mesh will require alpha blending
     * @param mesh defines the mesh to check
     * @returns a boolean specifying if alpha blending is needed for the mesh
     */
    needAlphaBlendingForMesh(mesh) {
        if (mesh.visibility < 1.0) {
            return true;
        }
        if (this._disableAlphaBlending) {
            return false;
        }
        return mesh.hasVertexAlpha || this.needAlphaBlending();
    }
    /**
     * Specifies whether or not this material should be rendered in alpha test mode.
     * @returns a boolean specifying if an alpha test is needed.
     */
    needAlphaTesting() {
        if (this._forceAlphaTest) {
            return true;
        }
        return false;
    }
    /**
     * Specifies if material alpha testing should be turned on for the mesh
     * @param mesh defines the mesh to check
     * @returns a boolean specifying if alpha testing should be turned on for the mesh
     */
    _shouldTurnAlphaTestOn(mesh) {
        return !this.needAlphaBlendingForMesh(mesh) && this.needAlphaTesting();
    }
    /**
     * Gets the texture used for the alpha test
     * @returns the texture to use for alpha testing
     */
    getAlphaTestTexture() {
        return null;
    }
    /**
     * Marks the material to indicate that it needs to be re-calculated
     * @param forceMaterialDirty - Forces the material to be marked as dirty for all components (same as this.markAsDirty(Material.AllDirtyFlag)). You should use this flag if the material is frozen and you want to force a recompilation.
     */
    markDirty(forceMaterialDirty = false) {
        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                if (subMesh.getMaterial() !== this) {
                    continue;
                }
                for (const drawWrapper of subMesh._drawWrappers) {
                    if (!drawWrapper) {
                        continue;
                    }
                    if (this._materialContext === drawWrapper.materialContext) {
                        drawWrapper._wasPreviouslyReady = false;
                        drawWrapper._wasPreviouslyUsingInstances = null;
                        drawWrapper._forceRebindOnNextCall = forceMaterialDirty;
                    }
                }
            }
        }
        if (forceMaterialDirty) {
            this.markAsDirty(Material.AllDirtyFlag);
        }
    }
    /**
     * @internal
     */
    _preBind(effect, overrideOrientation = null) {
        const engine = this._scene.getEngine();
        const orientation = overrideOrientation == null ? this.sideOrientation : overrideOrientation;
        const reverse = orientation === Material.ClockWiseSideOrientation;
        engine.enableEffect(effect ? effect : this._getDrawWrapper());
        engine.setState(this.backFaceCulling, this.zOffset, false, reverse, this._scene._mirroredCameraPosition ? !this.cullBackFaces : this.cullBackFaces, this.stencil, this.zOffsetUnits);
        return reverse;
    }
    /**
     * Binds the material to the mesh
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh to bind the material to
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bind(world, mesh) { }
    /**
     * Initializes the uniform buffer layout for the shader.
     */
    buildUniformLayout() {
        const ubo = this._uniformBuffer;
        this._eventInfo.ubo = ubo;
        this._callbackPluginEventGeneric(8 /* MaterialPluginEvent.PrepareUniformBuffer */, this._eventInfo);
        ubo.create();
        this._uniformBufferLayoutBuilt = true;
    }
    /**
     * Binds the submesh to the material
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    bindForSubMesh(world, mesh, subMesh) {
        const drawWrapper = subMesh._drawWrapper;
        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventBindForSubMesh(this._eventInfo);
        drawWrapper._forceRebindOnNextCall = false;
    }
    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bindOnlyWorldMatrix(world) { }
    /**
     * Binds the view matrix to the effect
     * @param effect defines the effect to bind the view matrix to
     */
    bindView(effect) {
        if (!this._useUBO) {
            effect.setMatrix("view", this.getScene().getViewMatrix());
        }
        else {
            this._needToBindSceneUbo = true;
        }
    }
    /**
     * Binds the view projection and projection matrices to the effect
     * @param effect defines the effect to bind the view projection and projection matrices to
     */
    bindViewProjection(effect) {
        if (!this._useUBO) {
            effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
            effect.setMatrix("projection", this.getScene().getProjectionMatrix());
        }
        else {
            this._needToBindSceneUbo = true;
        }
    }
    /**
     * Binds the view matrix to the effect
     * @param effect defines the effect to bind the view matrix to
     * @param variableName name of the shader variable that will hold the eye position
     */
    bindEyePosition(effect, variableName) {
        if (!this._useUBO) {
            this._scene.bindEyePosition(effect, variableName);
        }
        else {
            this._needToBindSceneUbo = true;
        }
    }
    /**
     * Processes to execute after binding the material to a mesh
     * @param mesh defines the rendered mesh
     * @param effect defines the effect used to bind the material
     * @param _subMesh defines the subMesh that the material has been bound for
     */
    _afterBind(mesh, effect = null, _subMesh) {
        this._scene._cachedMaterial = this;
        if (this._needToBindSceneUbo) {
            if (effect) {
                this._needToBindSceneUbo = false;
                BindSceneUniformBuffer(effect, this.getScene().getSceneUniformBuffer());
                this._scene.finalizeSceneUbo();
            }
        }
        if (mesh) {
            this._scene._cachedVisibility = mesh.visibility;
        }
        else {
            this._scene._cachedVisibility = 1;
        }
        if (this._onBindObservable && mesh) {
            this._onBindObservable.notifyObservers(mesh);
        }
        if (this.disableDepthWrite) {
            const engine = this._scene.getEngine();
            this._cachedDepthWriteState = engine.getDepthWrite();
            engine.setDepthWrite(false);
        }
        if (this.disableColorWrite) {
            const engine = this._scene.getEngine();
            this._cachedColorWriteState = engine.getColorWrite();
            engine.setColorWrite(false);
        }
        if (this.depthFunction !== 0) {
            const engine = this._scene.getEngine();
            this._cachedDepthFunctionState = engine.getDepthFunction() || 0;
            engine.setDepthFunction(this.depthFunction);
        }
    }
    /**
     * Unbinds the material from the mesh
     */
    unbind() {
        if (this._onUnBindObservable) {
            this._onUnBindObservable.notifyObservers(this);
        }
        if (this.depthFunction !== 0) {
            const engine = this._scene.getEngine();
            engine.setDepthFunction(this._cachedDepthFunctionState);
        }
        if (this.disableDepthWrite) {
            const engine = this._scene.getEngine();
            engine.setDepthWrite(this._cachedDepthWriteState);
        }
        if (this.disableColorWrite) {
            const engine = this._scene.getEngine();
            engine.setColorWrite(this._cachedColorWriteState);
        }
    }
    /**
     * Returns the animatable textures.
     * @returns - Array of animatable textures.
     */
    getAnimatables() {
        this._eventInfo.animatables = [];
        this._callbackPluginEventGeneric(256 /* MaterialPluginEvent.GetAnimatables */, this._eventInfo);
        return this._eventInfo.animatables;
    }
    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    getActiveTextures() {
        this._eventInfo.activeTextures = [];
        this._callbackPluginEventGeneric(512 /* MaterialPluginEvent.GetActiveTextures */, this._eventInfo);
        return this._eventInfo.activeTextures;
    }
    /**
     * Specifies if the material uses a texture
     * @param texture defines the texture to check against the material
     * @returns a boolean specifying if the material uses the texture
     */
    hasTexture(texture) {
        this._eventInfo.hasTexture = false;
        this._eventInfo.texture = texture;
        this._callbackPluginEventGeneric(1024 /* MaterialPluginEvent.HasTexture */, this._eventInfo);
        return this._eventInfo.hasTexture;
    }
    /**
     * Makes a duplicate of the material, and gives it a new name
     * @param name defines the new name for the duplicated material
     * @returns the cloned material
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clone(name) {
        return null;
    }
    _clonePlugins(targetMaterial, rootUrl) {
        const serializationObject = {};
        // Create plugins in targetMaterial in case they don't exist
        this._serializePlugins(serializationObject);
        Material._ParsePlugins(serializationObject, targetMaterial, this._scene, rootUrl);
        // Copy the properties of the current plugins to the cloned material's plugins
        if (this.pluginManager) {
            for (const plugin of this.pluginManager._plugins) {
                const targetPlugin = targetMaterial.pluginManager.getPlugin(plugin.name);
                if (targetPlugin) {
                    plugin.copyTo(targetPlugin);
                }
            }
        }
    }
    /**
     * Gets the meshes bound to the material
     * @returns an array of meshes bound to the material
     */
    getBindedMeshes() {
        if (this.meshMap) {
            const result = [];
            for (const meshId in this.meshMap) {
                const mesh = this.meshMap[meshId];
                if (mesh) {
                    result.push(mesh);
                }
            }
            return result;
        }
        else {
            const meshes = this._scene.meshes;
            return meshes.filter((mesh) => mesh.material === this);
        }
    }
    /**
     * Force shader compilation
     * @param mesh defines the mesh associated with this material
     * @param onCompiled defines a function to execute once the material is compiled
     * @param options defines the options to configure the compilation
     * @param onError defines a function to execute if the material fails compiling
     */
    forceCompilation(mesh, onCompiled, options, onError) {
        const localOptions = {
            clipPlane: false,
            useInstances: false,
            ...options,
        };
        const scene = this.getScene();
        const currentHotSwapingState = this.allowShaderHotSwapping;
        this.allowShaderHotSwapping = false; // Turned off to let us evaluate the real compilation state
        const checkReady = () => {
            if (!this._scene || !this._scene.getEngine()) {
                return;
            }
            const clipPlaneState = scene.clipPlane;
            if (localOptions.clipPlane) {
                scene.clipPlane = new Plane(0, 0, 0, 1);
            }
            if (this._storeEffectOnSubMeshes) {
                let allDone = true, lastError = null;
                if (mesh.subMeshes) {
                    const tempSubMesh = new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false, false);
                    if (tempSubMesh.materialDefines) {
                        tempSubMesh.materialDefines._renderId = -1;
                    }
                    if (!this.isReadyForSubMesh(mesh, tempSubMesh, localOptions.useInstances)) {
                        if (tempSubMesh.effect && tempSubMesh.effect.getCompilationError() && tempSubMesh.effect.allFallbacksProcessed()) {
                            lastError = tempSubMesh.effect.getCompilationError();
                        }
                        else {
                            allDone = false;
                            setTimeout(checkReady, 16);
                        }
                    }
                }
                if (allDone) {
                    this.allowShaderHotSwapping = currentHotSwapingState;
                    if (lastError) {
                        if (onError) {
                            onError(lastError);
                        }
                    }
                    if (onCompiled) {
                        onCompiled(this);
                    }
                }
            }
            else {
                if (this.isReady()) {
                    this.allowShaderHotSwapping = currentHotSwapingState;
                    if (onCompiled) {
                        onCompiled(this);
                    }
                }
                else {
                    setTimeout(checkReady, 16);
                }
            }
            if (localOptions.clipPlane) {
                scene.clipPlane = clipPlaneState;
            }
        };
        checkReady();
    }
    /**
     * Force shader compilation
     * @param mesh defines the mesh that will use this material
     * @param options defines additional options for compiling the shaders
     * @returns a promise that resolves when the compilation completes
     */
    forceCompilationAsync(mesh, options) {
        return new Promise((resolve, reject) => {
            this.forceCompilation(mesh, () => {
                resolve();
            }, options, (reason) => {
                reject(reason);
            });
        });
    }
    /**
     * Marks a define in the material to indicate that it needs to be re-computed
     * @param flag defines a flag used to determine which parts of the material have to be marked as dirty
     */
    markAsDirty(flag) {
        if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism) {
            return;
        }
        Material._DirtyCallbackArray.length = 0;
        if (flag & Material.TextureDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._TextureDirtyCallBack);
        }
        if (flag & Material.LightDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._LightsDirtyCallBack);
        }
        if (flag & Material.FresnelDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._FresnelDirtyCallBack);
        }
        if (flag & Material.AttributesDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._AttributeDirtyCallBack);
        }
        if (flag & Material.MiscDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._MiscDirtyCallBack);
        }
        if (flag & Material.PrePassDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._PrePassDirtyCallBack);
        }
        if (Material._DirtyCallbackArray.length) {
            this._markAllSubMeshesAsDirty(Material._RunDirtyCallBacks);
        }
        this.getScene().resetCachedMaterial();
    }
    /**
     * Resets the draw wrappers cache for all submeshes that are using this material
     */
    resetDrawCache() {
        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                if (subMesh.getMaterial() !== this) {
                    continue;
                }
                subMesh.resetDrawCache();
            }
        }
    }
    /**
     * Marks all submeshes of a material to indicate that their material defines need to be re-calculated
     * @param func defines a function which checks material defines against the submeshes
     */
    _markAllSubMeshesAsDirty(func) {
        if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism) {
            return;
        }
        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                // We want to skip the submeshes which are not using this material or which have not yet rendered at least once
                if (subMesh.getMaterial(false) !== this) {
                    continue;
                }
                for (const drawWrapper of subMesh._drawWrappers) {
                    if (!drawWrapper || !drawWrapper.defines || !drawWrapper.defines.markAllAsDirty) {
                        continue;
                    }
                    if (this._materialContext === drawWrapper.materialContext) {
                        func(drawWrapper.defines);
                    }
                }
            }
        }
    }
    /**
     * Indicates that the scene should check if the rendering now needs a prepass
     */
    _markScenePrePassDirty() {
        if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism) {
            return;
        }
        const prePassRenderer = this.getScene().enablePrePassRenderer();
        if (prePassRenderer) {
            prePassRenderer.markAsDirty();
        }
    }
    /**
     * Indicates that we need to re-calculated for all submeshes
     */
    _markAllSubMeshesAsAllDirty() {
        this._markAllSubMeshesAsDirty(Material._AllDirtyCallBack);
    }
    /**
     * Indicates that image processing needs to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsImageProcessingDirty() {
        this._markAllSubMeshesAsDirty(Material._ImageProcessingDirtyCallBack);
    }
    /**
     * Indicates that textures need to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsTexturesDirty() {
        this._markAllSubMeshesAsDirty(Material._TextureDirtyCallBack);
    }
    /**
     * Indicates that fresnel needs to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsFresnelDirty() {
        this._markAllSubMeshesAsDirty(Material._FresnelDirtyCallBack);
    }
    /**
     * Indicates that fresnel and misc need to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsFresnelAndMiscDirty() {
        this._markAllSubMeshesAsDirty(Material._FresnelAndMiscDirtyCallBack);
    }
    /**
     * Indicates that lights need to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsLightsDirty() {
        this._markAllSubMeshesAsDirty(Material._LightsDirtyCallBack);
    }
    /**
     * Indicates that attributes need to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsAttributesDirty() {
        this._markAllSubMeshesAsDirty(Material._AttributeDirtyCallBack);
    }
    /**
     * Indicates that misc needs to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsMiscDirty() {
        this._markAllSubMeshesAsDirty(Material._MiscDirtyCallBack);
    }
    /**
     * Indicates that prepass needs to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsPrePassDirty() {
        this._markAllSubMeshesAsDirty(Material._MiscDirtyCallBack);
    }
    /**
     * Indicates that textures and misc need to be re-calculated for all submeshes
     */
    _markAllSubMeshesAsTexturesAndMiscDirty() {
        this._markAllSubMeshesAsDirty(Material._TextureAndMiscDirtyCallBack);
    }
    _checkScenePerformancePriority() {
        if (this._scene.performancePriority !== 0 /* ScenePerformancePriority.BackwardCompatible */) {
            this.checkReadyOnlyOnce = true;
            // re-set the flag when the perf priority changes
            const observer = this._scene.onScenePerformancePriorityChangedObservable.addOnce(() => {
                this.checkReadyOnlyOnce = false;
            });
            // if this material is disposed before the scene is disposed, cleanup the observer
            this.onDisposeObservable.add(() => {
                this._scene.onScenePerformancePriorityChangedObservable.remove(observer);
            });
        }
    }
    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup.
     * @returns true if the pre pass is needed.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPrePassRenderer(prePassRenderer) {
        // Do Nothing by default
        return false;
    }
    /**
     * Disposes the material
     * @param _forceDisposeEffect kept for backward compat. We reference count the effect now.
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
     */
    dispose(_forceDisposeEffect, forceDisposeTextures, notBoundToMesh) {
        const scene = this.getScene();
        // Animations
        scene.stopAnimation(this);
        scene.freeProcessedMaterials();
        // Remove from scene
        scene.removeMaterial(this);
        this._eventInfo.forceDisposeTextures = forceDisposeTextures;
        this._callbackPluginEventGeneric(2 /* MaterialPluginEvent.Disposed */, this._eventInfo);
        if (this._parentContainer) {
            const index = this._parentContainer.materials.indexOf(this);
            if (index > -1) {
                this._parentContainer.materials.splice(index, 1);
            }
            this._parentContainer = null;
        }
        if (notBoundToMesh !== true) {
            // Remove from meshes
            if (this.meshMap) {
                for (const meshId in this.meshMap) {
                    const mesh = this.meshMap[meshId];
                    this._disposeMeshResources(mesh);
                }
            }
            else {
                const meshes = scene.meshes;
                for (const mesh of meshes) {
                    this._disposeMeshResources(mesh);
                }
            }
        }
        this._uniformBuffer.dispose();
        // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
        if (this._drawWrapper.effect) {
            if (!this._storeEffectOnSubMeshes) {
                this._drawWrapper.effect.dispose();
            }
            this._drawWrapper.effect = null;
        }
        this.metadata = null;
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        if (this._onBindObservable) {
            this._onBindObservable.clear();
        }
        if (this._onUnBindObservable) {
            this._onUnBindObservable.clear();
        }
        if (this._onEffectCreatedObservable) {
            this._onEffectCreatedObservable.clear();
        }
        if (this._eventInfo) {
            this._eventInfo = {};
        }
    }
    _disposeMeshResources(mesh) {
        if (!mesh) {
            return;
        }
        const geometry = mesh.geometry;
        const materialForRenderPass = mesh._internalAbstractMeshDataInfo._materialForRenderPass;
        if (this._storeEffectOnSubMeshes) {
            if (mesh.subMeshes && materialForRenderPass) {
                for (const subMesh of mesh.subMeshes) {
                    const drawWrappers = subMesh._drawWrappers;
                    for (let renderPassIndex = 0; renderPassIndex < drawWrappers.length; renderPassIndex++) {
                        const effect = drawWrappers[renderPassIndex]?.effect;
                        if (!effect) {
                            continue;
                        }
                        const material = materialForRenderPass[renderPassIndex];
                        if (material === this) {
                            geometry?._releaseVertexArrayObject(effect);
                            subMesh._removeDrawWrapper(renderPassIndex, true, true);
                        }
                    }
                }
            }
        }
        else {
            geometry?._releaseVertexArrayObject(this._drawWrapper.effect);
        }
        if (mesh.material === this && !mesh.sourceMesh) {
            mesh.material = null;
        }
    }
    /**
     * Serializes this material
     * @returns the serialized material object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.stencil = this.stencil.serialize();
        serializationObject.uniqueId = this.uniqueId;
        this._serializePlugins(serializationObject);
        return serializationObject;
    }
    _serializePlugins(serializationObject) {
        serializationObject.plugins = {};
        if (this.pluginManager) {
            for (const plugin of this.pluginManager._plugins) {
                if (!plugin.doNotSerialize) {
                    serializationObject.plugins[plugin.getClassName()] = plugin.serialize();
                }
            }
        }
    }
    /**
     * Creates a material from parsed material data
     * @param parsedMaterial defines parsed material data
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures
     * @returns a new material
     */
    static Parse(parsedMaterial, scene, rootUrl) {
        if (!parsedMaterial.customType) {
            parsedMaterial.customType = "BABYLON.StandardMaterial";
        }
        else if (parsedMaterial.customType === "BABYLON.PBRMaterial" && parsedMaterial.overloadedAlbedo) {
            parsedMaterial.customType = "BABYLON.LegacyPBRMaterial";
            if (!BABYLON.LegacyPBRMaterial) {
                Logger.Error("Your scene is trying to load a legacy version of the PBRMaterial, please, include it from the materials library.");
                return null;
            }
        }
        const materialType = Tools.Instantiate(parsedMaterial.customType);
        const material = materialType.Parse(parsedMaterial, scene, rootUrl);
        material._loadedUniqueId = parsedMaterial.uniqueId;
        return material;
    }
    static _ParsePlugins(serializationObject, material, scene, rootUrl) {
        if (!serializationObject.plugins) {
            return;
        }
        for (const pluginClassName in serializationObject.plugins) {
            const pluginData = serializationObject.plugins[pluginClassName];
            let plugin = material.pluginManager?.getPlugin(pluginData.name);
            if (!plugin) {
                const pluginClassType = Tools.Instantiate("BABYLON." + pluginClassName);
                if (pluginClassType) {
                    plugin = new pluginClassType(material);
                }
            }
            plugin?.parse(pluginData, scene, rootUrl);
        }
    }
}
/**
 * Returns the triangle fill mode
 */
Material.TriangleFillMode = 0;
/**
 * Returns the wireframe mode
 */
Material.WireFrameFillMode = 1;
/**
 * Returns the point fill mode
 */
Material.PointFillMode = 2;
/**
 * Returns the point list draw mode
 */
Material.PointListDrawMode = 3;
/**
 * Returns the line list draw mode
 */
Material.LineListDrawMode = 4;
/**
 * Returns the line loop draw mode
 */
Material.LineLoopDrawMode = 5;
/**
 * Returns the line strip draw mode
 */
Material.LineStripDrawMode = 6;
/**
 * Returns the triangle strip draw mode
 */
Material.TriangleStripDrawMode = 7;
/**
 * Returns the triangle fan draw mode
 */
Material.TriangleFanDrawMode = 8;
/**
 * Stores the clock-wise side orientation
 */
Material.ClockWiseSideOrientation = 0;
/**
 * Stores the counter clock-wise side orientation
 */
Material.CounterClockWiseSideOrientation = 1;
/**
 * The dirty texture flag value
 */
Material.TextureDirtyFlag = 1;
/**
 * The dirty light flag value
 */
Material.LightDirtyFlag = 2;
/**
 * The dirty fresnel flag value
 */
Material.FresnelDirtyFlag = 4;
/**
 * The dirty attribute flag value
 */
Material.AttributesDirtyFlag = 8;
/**
 * The dirty misc flag value
 */
Material.MiscDirtyFlag = 16;
/**
 * The dirty prepass flag value
 */
Material.PrePassDirtyFlag = 32;
/**
 * The all dirty flag value
 */
Material.AllDirtyFlag = 63;
/**
 * MaterialTransparencyMode: No transparency mode, Alpha channel is not use.
 */
Material.MATERIAL_OPAQUE = 0;
/**
 * MaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
 */
Material.MATERIAL_ALPHATEST = 1;
/**
 * MaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
 */
Material.MATERIAL_ALPHABLEND = 2;
/**
 * MaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
 * They are also discarded below the alpha cutoff threshold to improve performances.
 */
Material.MATERIAL_ALPHATESTANDBLEND = 3;
/**
 * The Whiteout method is used to blend normals.
 * Details of the algorithm can be found here: https://blog.selfshadow.com/publications/blending-in-detail/
 */
Material.MATERIAL_NORMALBLENDMETHOD_WHITEOUT = 0;
/**
 * The Reoriented Normal Mapping method is used to blend normals.
 * Details of the algorithm can be found here: https://blog.selfshadow.com/publications/blending-in-detail/
 */
Material.MATERIAL_NORMALBLENDMETHOD_RNM = 1;
/**
 * Event observable which raises global events common to all materials (like MaterialPluginEvent.Created)
 */
Material.OnEventObservable = new Observable();
Material._AllDirtyCallBack = (defines) => defines.markAllAsDirty();
Material._ImageProcessingDirtyCallBack = (defines) => defines.markAsImageProcessingDirty();
Material._TextureDirtyCallBack = (defines) => defines.markAsTexturesDirty();
Material._FresnelDirtyCallBack = (defines) => defines.markAsFresnelDirty();
Material._MiscDirtyCallBack = (defines) => defines.markAsMiscDirty();
Material._PrePassDirtyCallBack = (defines) => defines.markAsPrePassDirty();
Material._LightsDirtyCallBack = (defines) => defines.markAsLightDirty();
Material._AttributeDirtyCallBack = (defines) => defines.markAsAttributesDirty();
Material._FresnelAndMiscDirtyCallBack = (defines) => {
    Material._FresnelDirtyCallBack(defines);
    Material._MiscDirtyCallBack(defines);
};
Material._TextureAndMiscDirtyCallBack = (defines) => {
    Material._TextureDirtyCallBack(defines);
    Material._MiscDirtyCallBack(defines);
};
Material._DirtyCallbackArray = [];
Material._RunDirtyCallBacks = (defines) => {
    for (const cb of Material._DirtyCallbackArray) {
        cb(defines);
    }
};
__decorate([
    serialize()
], Material.prototype, "id", void 0);
__decorate([
    serialize()
], Material.prototype, "uniqueId", void 0);
__decorate([
    serialize()
], Material.prototype, "name", void 0);
__decorate([
    serialize()
], Material.prototype, "metadata", void 0);
__decorate([
    serialize()
], Material.prototype, "checkReadyOnEveryCall", void 0);
__decorate([
    serialize()
], Material.prototype, "checkReadyOnlyOnce", void 0);
__decorate([
    serialize()
], Material.prototype, "state", void 0);
__decorate([
    serialize("alpha")
], Material.prototype, "_alpha", void 0);
__decorate([
    serialize("backFaceCulling")
], Material.prototype, "_backFaceCulling", void 0);
__decorate([
    serialize("cullBackFaces")
], Material.prototype, "_cullBackFaces", void 0);
__decorate([
    serialize()
], Material.prototype, "sideOrientation", void 0);
__decorate([
    serialize("alphaMode")
], Material.prototype, "_alphaMode", void 0);
__decorate([
    serialize()
], Material.prototype, "_needDepthPrePass", void 0);
__decorate([
    serialize()
], Material.prototype, "disableDepthWrite", void 0);
__decorate([
    serialize()
], Material.prototype, "disableColorWrite", void 0);
__decorate([
    serialize()
], Material.prototype, "forceDepthWrite", void 0);
__decorate([
    serialize()
], Material.prototype, "depthFunction", void 0);
__decorate([
    serialize()
], Material.prototype, "separateCullingPass", void 0);
__decorate([
    serialize("fogEnabled")
], Material.prototype, "_fogEnabled", void 0);
__decorate([
    serialize()
], Material.prototype, "pointSize", void 0);
__decorate([
    serialize()
], Material.prototype, "zOffset", void 0);
__decorate([
    serialize()
], Material.prototype, "zOffsetUnits", void 0);
__decorate([
    serialize()
], Material.prototype, "pointsCloud", null);
__decorate([
    serialize()
], Material.prototype, "fillMode", null);
__decorate([
    serialize()
], Material.prototype, "useLogarithmicDepth", null);
__decorate([
    serialize()
], Material.prototype, "transparencyMode", null);
//# sourceMappingURL=material.js.map