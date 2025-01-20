import { __decorate } from "../tslib.es6.js";
import { SmartArray } from "../Misc/smartArray.js";
import { Observable } from "../Misc/observable.js";
import { Vector2 } from "../Maths/math.vector.js";
import { Effect } from "../Materials/effect.js";

import { serialize, serializeAsColor4 } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { GetClass, RegisterClass } from "../Misc/typeStore.js";
import { AbstractEngine } from "../Engines/abstractEngine.js";
import { GetExponentOfTwo } from "../Misc/tools.functions.js";
import { EffectWrapper } from "../Materials/effectRenderer.js";
AbstractEngine.prototype.setTextureFromPostProcess = function (channel, postProcess, name) {
    let postProcessInput = null;
    if (postProcess) {
        if (postProcess._forcedOutputTexture) {
            postProcessInput = postProcess._forcedOutputTexture;
        }
        else if (postProcess._textures.data[postProcess._currentRenderTextureInd]) {
            postProcessInput = postProcess._textures.data[postProcess._currentRenderTextureInd];
        }
    }
    this._bindTexture(channel, postProcessInput?.texture ?? null, name);
};
AbstractEngine.prototype.setTextureFromPostProcessOutput = function (channel, postProcess, name) {
    this._bindTexture(channel, postProcess?._outputTexture?.texture ?? null, name);
};
/**
 * Sets a texture to be the input of the specified post process. (To use the output, pass in the next post process in the pipeline)
 * @param channel Name of the sampler variable.
 * @param postProcess Post process to get the input texture from.
 */
Effect.prototype.setTextureFromPostProcess = function (channel, postProcess) {
    this._engine.setTextureFromPostProcess(this._samplers[channel], postProcess, channel);
};
/**
 * (Warning! setTextureFromPostProcessOutput may be desired instead)
 * Sets the input texture of the passed in post process to be input of this effect. (To use the output of the passed in post process use setTextureFromPostProcessOutput)
 * @param channel Name of the sampler variable.
 * @param postProcess Post process to get the output texture from.
 */
Effect.prototype.setTextureFromPostProcessOutput = function (channel, postProcess) {
    this._engine.setTextureFromPostProcessOutput(this._samplers[channel], postProcess, channel);
};
/**
 * PostProcess can be used to apply a shader to a texture after it has been rendered
 * See https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses
 */
export class PostProcess {
    /**
     * Force all the postprocesses to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    static get ForceGLSL() {
        return EffectWrapper.ForceGLSL;
    }
    static set ForceGLSL(force) {
        EffectWrapper.ForceGLSL = force;
    }
    /**
     * Registers a shader code processing with a post process name.
     * @param postProcessName name of the post process. Use null for the fallback shader code processing. This is the shader code processing that will be used in case no specific shader code processing has been associated to a post process name
     * @param customShaderCodeProcessing shader code processing to associate to the post process name
     */
    static RegisterShaderCodeProcessing(postProcessName, customShaderCodeProcessing) {
        EffectWrapper.RegisterShaderCodeProcessing(postProcessName, customShaderCodeProcessing);
    }
    /** Name of the PostProcess. */
    get name() {
        return this._effectWrapper.name;
    }
    set name(value) {
        this._effectWrapper.name = value;
    }
    /**
     * Type of alpha mode to use when performing the post process (default: Engine.ALPHA_DISABLE)
     */
    get alphaMode() {
        return this._effectWrapper.alphaMode;
    }
    set alphaMode(value) {
        this._effectWrapper.alphaMode = value;
    }
    /**
     * Number of sample textures (default: 1)
     */
    get samples() {
        return this._samples;
    }
    set samples(n) {
        this._samples = Math.min(n, this._engine.getCaps().maxMSAASamples);
        this._textures.forEach((texture) => {
            texture.setSamples(this._samples);
        });
    }
    /**
     * Gets the shader language type used to generate vertex and fragment source code.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Returns the fragment url or shader name used in the post process.
     * @returns the fragment url or name in the shader store.
     */
    getEffectName() {
        return this._fragmentUrl;
    }
    /**
     * A function that is added to the onActivateObservable
     */
    set onActivate(callback) {
        if (this._onActivateObserver) {
            this.onActivateObservable.remove(this._onActivateObserver);
        }
        if (callback) {
            this._onActivateObserver = this.onActivateObservable.add(callback);
        }
    }
    /**
     * A function that is added to the onSizeChangedObservable
     */
    set onSizeChanged(callback) {
        if (this._onSizeChangedObserver) {
            this.onSizeChangedObservable.remove(this._onSizeChangedObserver);
        }
        this._onSizeChangedObserver = this.onSizeChangedObservable.add(callback);
    }
    /**
     * A function that is added to the onApplyObservable
     */
    set onApply(callback) {
        if (this._onApplyObserver) {
            this.onApplyObservable.remove(this._onApplyObserver);
        }
        this._onApplyObserver = this.onApplyObservable.add(callback);
    }
    /**
     * A function that is added to the onBeforeRenderObservable
     */
    set onBeforeRender(callback) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
    }
    /**
     * A function that is added to the onAfterRenderObservable
     */
    set onAfterRender(callback) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
    }
    /**
     * The input texture for this post process and the output texture of the previous post process. When added to a pipeline the previous post process will
     * render it's output into this texture and this texture will be used as textureSampler in the fragment shader of this post process.
     */
    get inputTexture() {
        return this._textures.data[this._currentRenderTextureInd];
    }
    set inputTexture(value) {
        this._forcedOutputTexture = value;
    }
    /**
     * Since inputTexture should always be defined, if we previously manually set `inputTexture`,
     * the only way to unset it is to use this function to restore its internal state
     */
    restoreDefaultInputTexture() {
        if (this._forcedOutputTexture) {
            this._forcedOutputTexture = null;
            this.markTextureDirty();
        }
    }
    /**
     * Gets the camera which post process is applied to.
     * @returns The camera the post process is applied to.
     */
    getCamera() {
        return this._camera;
    }
    /**
     * Gets the texel size of the postprocess.
     * See https://en.wikipedia.org/wiki/Texel_(graphics)
     */
    get texelSize() {
        if (this._shareOutputWithPostProcess) {
            return this._shareOutputWithPostProcess.texelSize;
        }
        if (this._forcedOutputTexture) {
            this._texelSize.copyFromFloats(1.0 / this._forcedOutputTexture.width, 1.0 / this._forcedOutputTexture.height);
        }
        return this._texelSize;
    }
    /** @internal */
    constructor(name, fragmentUrl, parameters, samplers, _size, camera, samplingMode = 1, engine, reusable, defines = null, textureType = 0, vertexUrl = "postprocess", indexParameters, blockCompilation = false, textureFormat = 5, shaderLanguage, extraInitializations) {
        /** @internal */
        this._parentContainer = null;
        /**
         * Width of the texture to apply the post process on
         */
        this.width = -1;
        /**
         * Height of the texture to apply the post process on
         */
        this.height = -1;
        /**
         * Gets the node material used to create this postprocess (null if the postprocess was manually created)
         */
        this.nodeMaterialSource = null;
        /**
         * Internal, reference to the location where this postprocess was output to. (Typically the texture on the next postprocess in the chain)
         * @internal
         */
        this._outputTexture = null;
        /**
         * If the buffer needs to be cleared before applying the post process. (default: true)
         * Should be set to false if shader will overwrite all previous pixels.
         */
        this.autoClear = true;
        /**
         * If clearing the buffer should be forced in autoClear mode, even when alpha mode is enabled (default: false).
         * By default, the buffer will only be cleared if alpha mode is disabled (and autoClear is true).
         */
        this.forceAutoClearInAlphaMode = false;
        /**
         * Animations to be used for the post processing
         */
        this.animations = [];
        /**
         * Enable Pixel Perfect mode where texture is not scaled to be power of 2.
         * Can only be used on a single postprocess or on the last one of a chain. (default: false)
         */
        this.enablePixelPerfectMode = false;
        /**
         * Force the postprocess to be applied without taking in account viewport
         */
        this.forceFullscreenViewport = true;
        /**
         * Scale mode for the post process (default: Engine.SCALEMODE_FLOOR)
         *
         * | Value | Type                                | Description |
         * | ----- | ----------------------------------- | ----------- |
         * | 1     | SCALEMODE_FLOOR                     | [engine.scalemode_floor](https://doc.babylonjs.com/api/classes/babylon.engine#scalemode_floor) |
         * | 2     | SCALEMODE_NEAREST                   | [engine.scalemode_nearest](https://doc.babylonjs.com/api/classes/babylon.engine#scalemode_nearest) |
         * | 3     | SCALEMODE_CEILING                   | [engine.scalemode_ceiling](https://doc.babylonjs.com/api/classes/babylon.engine#scalemode_ceiling) |
         *
         */
        this.scaleMode = 1;
        /**
         * Force textures to be a power of two (default: false)
         */
        this.alwaysForcePOT = false;
        this._samples = 1;
        /**
         * Modify the scale of the post process to be the same as the viewport (default: false)
         */
        this.adaptScaleToCurrentViewport = false;
        this._webGPUReady = false;
        this._reusable = false;
        this._renderId = 0;
        /**
         * if externalTextureSamplerBinding is true, the "apply" method won't bind the textureSampler texture, it is expected to be done by the "outside" (by the onApplyObservable observer most probably).
         * counter-productive in some cases because if the texture bound by "apply" is different from the currently texture bound, (the one set by the onApplyObservable observer, for eg) some
         * internal structures (materialContext) will be dirtified, which may impact performances
         */
        this.externalTextureSamplerBinding = false;
        /**
         * Smart array of input and output textures for the post process.
         * @internal
         */
        this._textures = new SmartArray(2);
        /**
         * Smart array of input and output textures for the post process.
         * @internal
         */
        this._textureCache = [];
        /**
         * The index in _textures that corresponds to the output texture.
         * @internal
         */
        this._currentRenderTextureInd = 0;
        this._scaleRatio = new Vector2(1, 1);
        this._texelSize = Vector2.Zero();
        // Events
        /**
         * An event triggered when the postprocess is activated.
         */
        this.onActivateObservable = new Observable();
        /**
         * An event triggered when the postprocess changes its size.
         */
        this.onSizeChangedObservable = new Observable();
        /**
         * An event triggered when the postprocess applies its effect.
         */
        this.onApplyObservable = new Observable();
        /**
         * An event triggered before rendering the postprocess
         */
        this.onBeforeRenderObservable = new Observable();
        /**
         * An event triggered after rendering the postprocess
         */
        this.onAfterRenderObservable = new Observable();
        let size = 1;
        let uniformBuffers = null;
        let effectWrapper;
        if (parameters && !Array.isArray(parameters)) {
            const options = parameters;
            parameters = options.uniforms ?? null;
            samplers = options.samplers ?? null;
            size = options.size ?? 1;
            camera = options.camera ?? null;
            samplingMode = options.samplingMode ?? 1;
            engine = options.engine;
            reusable = options.reusable;
            defines = Array.isArray(options.defines) ? options.defines.join("\n") : (options.defines ?? null);
            textureType = options.textureType ?? 0;
            vertexUrl = options.vertexUrl ?? "postprocess";
            indexParameters = options.indexParameters;
            blockCompilation = options.blockCompilation ?? false;
            textureFormat = options.textureFormat ?? 5;
            shaderLanguage = options.shaderLanguage ?? 0 /* ShaderLanguage.GLSL */;
            uniformBuffers = options.uniformBuffers ?? null;
            extraInitializations = options.extraInitializations;
            effectWrapper = options.effectWrapper;
        }
        else if (_size) {
            if (typeof _size === "number") {
                size = _size;
            }
            else {
                size = { width: _size.width, height: _size.height };
            }
        }
        const useExistingThinPostProcess = !!effectWrapper;
        this._effectWrapper =
            effectWrapper ??
                new EffectWrapper({
                    name,
                    useShaderStore: true,
                    useAsPostProcess: true,
                    fragmentShader: fragmentUrl,
                    engine: engine || camera?.getScene().getEngine(),
                    uniforms: parameters,
                    samplers,
                    uniformBuffers,
                    defines,
                    vertexUrl,
                    indexParameters,
                    blockCompilation: true,
                    shaderLanguage,
                    extraInitializations: undefined,
                });
        this.name = name;
        this.onEffectCreatedObservable = this._effectWrapper.onEffectCreatedObservable;
        if (camera != null) {
            this._camera = camera;
            this._scene = camera.getScene();
            camera.attachPostProcess(this);
            this._engine = this._scene.getEngine();
            this._scene.postProcesses.push(this);
            this.uniqueId = this._scene.getUniqueId();
        }
        else if (engine) {
            this._engine = engine;
            this._engine.postProcesses.push(this);
        }
        this._options = size;
        this.renderTargetSamplingMode = samplingMode ? samplingMode : 1;
        this._reusable = reusable || false;
        this._textureType = textureType;
        this._textureFormat = textureFormat;
        this._shaderLanguage = shaderLanguage || 0 /* ShaderLanguage.GLSL */;
        this._samplers = samplers || [];
        if (this._samplers.indexOf("textureSampler") === -1) {
            this._samplers.push("textureSampler");
        }
        this._fragmentUrl = fragmentUrl;
        this._vertexUrl = vertexUrl;
        this._parameters = parameters || [];
        if (this._parameters.indexOf("scale") === -1) {
            this._parameters.push("scale");
        }
        this._uniformBuffers = uniformBuffers || [];
        this._indexParameters = indexParameters;
        if (!useExistingThinPostProcess) {
            this._webGPUReady = this._shaderLanguage === 1 /* ShaderLanguage.WGSL */;
            const importPromises = [];
            this._gatherImports(this._engine.isWebGPU && !PostProcess.ForceGLSL, importPromises);
            this._effectWrapper._webGPUReady = this._webGPUReady;
            this._effectWrapper._postConstructor(blockCompilation, defines, extraInitializations, importPromises);
        }
    }
    _gatherImports(useWebGPU = false, list) {
        // this._webGPUReady is used to detect when a postprocess is intended to be used with WebGPU
        if (useWebGPU && this._webGPUReady) {
            list.push(Promise.all([import("../ShadersWGSL/postprocess.vertex.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/postprocess.vertex.js")]));
        }
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "PostProcess" string
     */
    getClassName() {
        return "PostProcess";
    }
    /**
     * Gets the engine which this post process belongs to.
     * @returns The engine the post process was enabled with.
     */
    getEngine() {
        return this._engine;
    }
    /**
     * The effect that is created when initializing the post process.
     * @returns The created effect corresponding to the postprocess.
     */
    getEffect() {
        return this._effectWrapper.drawWrapper.effect;
    }
    /**
     * To avoid multiple redundant textures for multiple post process, the output the output texture for this post process can be shared with another.
     * @param postProcess The post process to share the output with.
     * @returns This post process.
     */
    shareOutputWith(postProcess) {
        this._disposeTextures();
        this._shareOutputWithPostProcess = postProcess;
        return this;
    }
    /**
     * Reverses the effect of calling shareOutputWith and returns the post process back to its original state.
     * This should be called if the post process that shares output with this post process is disabled/disposed.
     */
    useOwnOutput() {
        if (this._textures.length == 0) {
            this._textures = new SmartArray(2);
        }
        this._shareOutputWithPostProcess = null;
    }
    /**
     * Updates the effect with the current post process compile time values and recompiles the shader.
     * @param defines Define statements that should be added at the beginning of the shader. (default: null)
     * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
     * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
     * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     * @param onCompiled Called when the shader has been compiled.
     * @param onError Called if there is an error when compiling a shader.
     * @param vertexUrl The url of the vertex shader to be used (default: the one given at construction time)
     * @param fragmentUrl The url of the fragment shader to be used (default: the one given at construction time)
     */
    updateEffect(defines = null, uniforms = null, samplers = null, indexParameters, onCompiled, onError, vertexUrl, fragmentUrl) {
        this._effectWrapper.updateEffect(defines, uniforms, samplers, indexParameters, onCompiled, onError, vertexUrl, fragmentUrl);
        this._postProcessDefines = Array.isArray(this._effectWrapper.options.defines) ? this._effectWrapper.options.defines.join("\n") : this._effectWrapper.options.defines;
    }
    /**
     * The post process is reusable if it can be used multiple times within one frame.
     * @returns If the post process is reusable
     */
    isReusable() {
        return this._reusable;
    }
    /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
    markTextureDirty() {
        this.width = -1;
    }
    _createRenderTargetTexture(textureSize, textureOptions, channel = 0) {
        for (let i = 0; i < this._textureCache.length; i++) {
            if (this._textureCache[i].texture.width === textureSize.width &&
                this._textureCache[i].texture.height === textureSize.height &&
                this._textureCache[i].postProcessChannel === channel &&
                this._textureCache[i].texture._generateDepthBuffer === textureOptions.generateDepthBuffer &&
                this._textureCache[i].texture.samples === textureOptions.samples) {
                return this._textureCache[i].texture;
            }
        }
        const tex = this._engine.createRenderTargetTexture(textureSize, textureOptions);
        this._textureCache.push({ texture: tex, postProcessChannel: channel, lastUsedRenderId: -1 });
        return tex;
    }
    _flushTextureCache() {
        const currentRenderId = this._renderId;
        for (let i = this._textureCache.length - 1; i >= 0; i--) {
            if (currentRenderId - this._textureCache[i].lastUsedRenderId > 100) {
                let currentlyUsed = false;
                for (let j = 0; j < this._textures.length; j++) {
                    if (this._textures.data[j] === this._textureCache[i].texture) {
                        currentlyUsed = true;
                        break;
                    }
                }
                if (!currentlyUsed) {
                    this._textureCache[i].texture.dispose();
                    this._textureCache.splice(i, 1);
                }
            }
        }
    }
    /**
     * Resizes the post-process texture
     * @param width Width of the texture
     * @param height Height of the texture
     * @param camera The camera this post-process is applied to. Pass null if the post-process is used outside the context of a camera post-process chain (default: null)
     * @param needMipMaps True if mip maps need to be generated after render (default: false)
     * @param forceDepthStencil True to force post-process texture creation with stencil depth and buffer (default: false)
     */
    resize(width, height, camera = null, needMipMaps = false, forceDepthStencil = false) {
        if (this._textures.length > 0) {
            this._textures.reset();
        }
        this.width = width;
        this.height = height;
        let firstPP = null;
        if (camera) {
            for (let i = 0; i < camera._postProcesses.length; i++) {
                if (camera._postProcesses[i] !== null) {
                    firstPP = camera._postProcesses[i];
                    break;
                }
            }
        }
        const textureSize = { width: this.width, height: this.height };
        const textureOptions = {
            generateMipMaps: needMipMaps,
            generateDepthBuffer: forceDepthStencil || firstPP === this,
            generateStencilBuffer: (forceDepthStencil || firstPP === this) && this._engine.isStencilEnable,
            samplingMode: this.renderTargetSamplingMode,
            type: this._textureType,
            format: this._textureFormat,
            samples: this._samples,
            label: "PostProcessRTT-" + this.name,
        };
        this._textures.push(this._createRenderTargetTexture(textureSize, textureOptions, 0));
        if (this._reusable) {
            this._textures.push(this._createRenderTargetTexture(textureSize, textureOptions, 1));
        }
        this._texelSize.copyFromFloats(1.0 / this.width, 1.0 / this.height);
        this.onSizeChangedObservable.notifyObservers(this);
    }
    _getTarget() {
        let target;
        if (this._shareOutputWithPostProcess) {
            target = this._shareOutputWithPostProcess.inputTexture;
        }
        else if (this._forcedOutputTexture) {
            target = this._forcedOutputTexture;
            this.width = this._forcedOutputTexture.width;
            this.height = this._forcedOutputTexture.height;
        }
        else {
            target = this.inputTexture;
            let cache;
            for (let i = 0; i < this._textureCache.length; i++) {
                if (this._textureCache[i].texture === target) {
                    cache = this._textureCache[i];
                    break;
                }
            }
            if (cache) {
                cache.lastUsedRenderId = this._renderId;
            }
        }
        return target;
    }
    /**
     * Activates the post process by intializing the textures to be used when executed. Notifies onActivateObservable.
     * When this post process is used in a pipeline, this is call will bind the input texture of this post process to the output of the previous.
     * @param cameraOrScene The camera that will be used in the post process. This camera will be used when calling onActivateObservable. You can also pass the scene if no camera is available.
     * @param sourceTexture The source texture to be inspected to get the width and height if not specified in the post process constructor. (default: null)
     * @param forceDepthStencil If true, a depth and stencil buffer will be generated. (default: false)
     * @returns The render target wrapper that was bound to be written to.
     */
    activate(cameraOrScene, sourceTexture = null, forceDepthStencil) {
        const camera = cameraOrScene === null || cameraOrScene.cameraRigMode !== undefined ? cameraOrScene || this._camera : null;
        const scene = camera?.getScene() ?? cameraOrScene;
        const engine = scene.getEngine();
        const maxSize = engine.getCaps().maxTextureSize;
        const requiredWidth = ((sourceTexture ? sourceTexture.width : this._engine.getRenderWidth(true)) * this._options) | 0;
        const requiredHeight = ((sourceTexture ? sourceTexture.height : this._engine.getRenderHeight(true)) * this._options) | 0;
        let desiredWidth = this._options.width || requiredWidth;
        let desiredHeight = this._options.height || requiredHeight;
        const needMipMaps = this.renderTargetSamplingMode !== 7 &&
            this.renderTargetSamplingMode !== 1 &&
            this.renderTargetSamplingMode !== 2;
        let target = null;
        if (!this._shareOutputWithPostProcess && !this._forcedOutputTexture) {
            if (this.adaptScaleToCurrentViewport) {
                const currentViewport = engine.currentViewport;
                if (currentViewport) {
                    desiredWidth *= currentViewport.width;
                    desiredHeight *= currentViewport.height;
                }
            }
            if (needMipMaps || this.alwaysForcePOT) {
                if (!this._options.width) {
                    desiredWidth = engine.needPOTTextures ? GetExponentOfTwo(desiredWidth, maxSize, this.scaleMode) : desiredWidth;
                }
                if (!this._options.height) {
                    desiredHeight = engine.needPOTTextures ? GetExponentOfTwo(desiredHeight, maxSize, this.scaleMode) : desiredHeight;
                }
            }
            if (this.width !== desiredWidth || this.height !== desiredHeight || !(target = this._getTarget())) {
                this.resize(desiredWidth, desiredHeight, camera, needMipMaps, forceDepthStencil);
            }
            this._textures.forEach((texture) => {
                if (texture.samples !== this.samples) {
                    this._engine.updateRenderTargetTextureSampleCount(texture, this.samples);
                }
            });
            this._flushTextureCache();
            this._renderId++;
        }
        if (!target) {
            target = this._getTarget();
        }
        // Bind the input of this post process to be used as the output of the previous post process.
        if (this.enablePixelPerfectMode) {
            this._scaleRatio.copyFromFloats(requiredWidth / desiredWidth, requiredHeight / desiredHeight);
            this._engine.bindFramebuffer(target, 0, requiredWidth, requiredHeight, this.forceFullscreenViewport);
        }
        else {
            this._scaleRatio.copyFromFloats(1, 1);
            this._engine.bindFramebuffer(target, 0, undefined, undefined, this.forceFullscreenViewport);
        }
        this._engine._debugInsertMarker?.(`post process ${this.name} input`);
        this.onActivateObservable.notifyObservers(camera);
        // Clear
        if (this.autoClear && (this.alphaMode === 0 || this.forceAutoClearInAlphaMode)) {
            this._engine.clear(this.clearColor ? this.clearColor : scene.clearColor, scene._allowPostProcessClearColor, true, true);
        }
        if (this._reusable) {
            this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
        }
        return target;
    }
    /**
     * If the post process is supported.
     */
    get isSupported() {
        return this._effectWrapper.drawWrapper.effect.isSupported;
    }
    /**
     * The aspect ratio of the output texture.
     */
    get aspectRatio() {
        if (this._shareOutputWithPostProcess) {
            return this._shareOutputWithPostProcess.aspectRatio;
        }
        if (this._forcedOutputTexture) {
            return this._forcedOutputTexture.width / this._forcedOutputTexture.height;
        }
        return this.width / this.height;
    }
    /**
     * Get a value indicating if the post-process is ready to be used
     * @returns true if the post-process is ready (shader is compiled)
     */
    isReady() {
        return this._effectWrapper.isReady();
    }
    /**
     * Binds all textures and uniforms to the shader, this will be run on every pass.
     * @returns the effect corresponding to this post process. Null if not compiled or not ready.
     */
    apply() {
        // Check
        if (!this._effectWrapper.isReady()) {
            return null;
        }
        // States
        this._engine.enableEffect(this._effectWrapper.drawWrapper);
        this._engine.setState(false);
        this._engine.setDepthBuffer(false);
        this._engine.setDepthWrite(false);
        // Alpha
        if (this.alphaConstants) {
            this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a);
        }
        // Bind the output texture of the preivous post process as the input to this post process.
        let source;
        if (this._shareOutputWithPostProcess) {
            source = this._shareOutputWithPostProcess.inputTexture;
        }
        else if (this._forcedOutputTexture) {
            source = this._forcedOutputTexture;
        }
        else {
            source = this.inputTexture;
        }
        if (!this.externalTextureSamplerBinding) {
            this._effectWrapper.drawWrapper.effect._bindTexture("textureSampler", source?.texture);
        }
        // Parameters
        this._effectWrapper.drawWrapper.effect.setVector2("scale", this._scaleRatio);
        this.onApplyObservable.notifyObservers(this._effectWrapper.drawWrapper.effect);
        this._effectWrapper.bind();
        return this._effectWrapper.drawWrapper.effect;
    }
    _disposeTextures() {
        if (this._shareOutputWithPostProcess || this._forcedOutputTexture) {
            this._disposeTextureCache();
            return;
        }
        this._disposeTextureCache();
        this._textures.dispose();
    }
    _disposeTextureCache() {
        for (let i = this._textureCache.length - 1; i >= 0; i--) {
            this._textureCache[i].texture.dispose();
        }
        this._textureCache.length = 0;
    }
    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup.
     * @returns true if the pre pass is needed.
     */
    setPrePassRenderer(prePassRenderer) {
        if (this._prePassEffectConfiguration) {
            this._prePassEffectConfiguration = prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
            this._prePassEffectConfiguration.enabled = true;
            return true;
        }
        return false;
    }
    /**
     * Disposes the post process.
     * @param camera The camera to dispose the post process on.
     */
    dispose(camera) {
        camera = camera || this._camera;
        this._disposeTextures();
        let index;
        if (this._scene) {
            index = this._scene.postProcesses.indexOf(this);
            if (index !== -1) {
                this._scene.postProcesses.splice(index, 1);
            }
        }
        if (this._parentContainer) {
            const index = this._parentContainer.postProcesses.indexOf(this);
            if (index > -1) {
                this._parentContainer.postProcesses.splice(index, 1);
            }
            this._parentContainer = null;
        }
        index = this._engine.postProcesses.indexOf(this);
        if (index !== -1) {
            this._engine.postProcesses.splice(index, 1);
        }
        if (!camera) {
            return;
        }
        camera.detachPostProcess(this);
        index = camera._postProcesses.indexOf(this);
        if (index === 0 && camera._postProcesses.length > 0) {
            const firstPostProcess = this._camera._getFirstPostProcess();
            if (firstPostProcess) {
                firstPostProcess.markTextureDirty();
            }
        }
        this.onActivateObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onApplyObservable.clear();
        this.onBeforeRenderObservable.clear();
        this.onSizeChangedObservable.clear();
        this.onEffectCreatedObservable.clear();
    }
    /**
     * Serializes the post process to a JSON object
     * @returns the JSON object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        const camera = this.getCamera() || (this._scene && this._scene.activeCamera);
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.cameraId = camera ? camera.id : null;
        serializationObject.reusable = this._reusable;
        serializationObject.textureType = this._textureType;
        serializationObject.fragmentUrl = this._fragmentUrl;
        serializationObject.parameters = this._parameters;
        serializationObject.samplers = this._samplers;
        serializationObject.uniformBuffers = this._uniformBuffers;
        serializationObject.options = this._options;
        serializationObject.defines = this._postProcessDefines;
        serializationObject.textureFormat = this._textureFormat;
        serializationObject.vertexUrl = this._vertexUrl;
        serializationObject.indexParameters = this._indexParameters;
        return serializationObject;
    }
    /**
     * Clones this post process
     * @returns a new post process similar to this one
     */
    clone() {
        const serializationObject = this.serialize();
        serializationObject._engine = this._engine;
        serializationObject.cameraId = null;
        const result = PostProcess.Parse(serializationObject, this._scene, "");
        if (!result) {
            return null;
        }
        result.onActivateObservable = this.onActivateObservable.clone();
        result.onSizeChangedObservable = this.onSizeChangedObservable.clone();
        result.onApplyObservable = this.onApplyObservable.clone();
        result.onBeforeRenderObservable = this.onBeforeRenderObservable.clone();
        result.onAfterRenderObservable = this.onAfterRenderObservable.clone();
        result._prePassEffectConfiguration = this._prePassEffectConfiguration;
        return result;
    }
    /**
     * Creates a material from parsed material data
     * @param parsedPostProcess defines parsed post process data
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures
     * @returns a new post process
     */
    static Parse(parsedPostProcess, scene, rootUrl) {
        const postProcessType = GetClass(parsedPostProcess.customType);
        if (!postProcessType || !postProcessType._Parse) {
            return null;
        }
        const camera = scene ? scene.getCameraById(parsedPostProcess.cameraId) : null;
        return postProcessType._Parse(parsedPostProcess, camera, scene, rootUrl);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new PostProcess(parsedPostProcess.name, parsedPostProcess.fragmentUrl, parsedPostProcess.parameters, parsedPostProcess.samplers, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, parsedPostProcess._engine, parsedPostProcess.reusable, parsedPostProcess.defines, parsedPostProcess.textureType, parsedPostProcess.vertexUrl, parsedPostProcess.indexParameters, false, parsedPostProcess.textureFormat);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], PostProcess.prototype, "uniqueId", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "name", null);
__decorate([
    serialize()
], PostProcess.prototype, "width", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "height", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "renderTargetSamplingMode", void 0);
__decorate([
    serializeAsColor4()
], PostProcess.prototype, "clearColor", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "autoClear", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "forceAutoClearInAlphaMode", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "alphaMode", null);
__decorate([
    serialize()
], PostProcess.prototype, "alphaConstants", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "enablePixelPerfectMode", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "forceFullscreenViewport", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "scaleMode", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "alwaysForcePOT", void 0);
__decorate([
    serialize("samples")
], PostProcess.prototype, "_samples", void 0);
__decorate([
    serialize()
], PostProcess.prototype, "adaptScaleToCurrentViewport", void 0);
RegisterClass("BABYLON.PostProcess", PostProcess);
//# sourceMappingURL=postProcess.js.map