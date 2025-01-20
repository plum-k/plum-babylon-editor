/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from "../Misc/logger.js";
import { Engine } from "../Engines/engine.js";
import { InternalTexture } from "../Materials/Textures/internalTexture.js";

import { DataBuffer } from "../Buffers/dataBuffer.js";
import { PerformanceConfigurator } from "./performanceConfigurator.js";
import { RenderTargetWrapper } from "./renderTargetWrapper.js";
import { IsWrapper } from "../Materials/drawWrapper.functions.js";
/**
 * Options to create the null engine
 */
export class NullEngineOptions {
    constructor() {
        /**
         * Render width (Default: 512)
         */
        this.renderWidth = 512;
        /**
         * Render height (Default: 256)
         */
        this.renderHeight = 256;
        /**
         * Texture size (Default: 512)
         */
        this.textureSize = 512;
        /**
         * If delta time between frames should be constant
         * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
         */
        this.deterministicLockstep = false;
        /**
         * Maximum about of steps between frames (Default: 4)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
         */
        this.lockstepMaxSteps = 4;
    }
}
/**
 * The null engine class provides support for headless version of babylon.js.
 * This can be used in server side scenario or for testing purposes
 */
export class NullEngine extends Engine {
    /**
     * Gets a boolean indicating that the engine is running in deterministic lock step mode
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns true if engine is in deterministic lock step mode
     */
    isDeterministicLockStep() {
        return this._options.deterministicLockstep;
    }
    /**
     * Gets the max steps when engine is running in deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the max steps
     */
    getLockstepMaxSteps() {
        return this._options.lockstepMaxSteps;
    }
    /**
     * Gets the current hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @returns a number indicating the current hardware scaling level
     */
    getHardwareScalingLevel() {
        return 1.0;
    }
    constructor(options = new NullEngineOptions()) {
        super(null);
        if (options.deterministicLockstep === undefined) {
            options.deterministicLockstep = false;
        }
        if (options.timeStep !== undefined) {
            this._timeStep = options.timeStep;
        }
        if (options.lockstepMaxSteps === undefined) {
            options.lockstepMaxSteps = 4;
        }
        this._options = options;
        PerformanceConfigurator.SetMatrixPrecision(!!options.useHighPrecisionMatrix);
        // Init caps
        // We consider we are on a webgl1 capable device
        this._caps = {
            maxTexturesImageUnits: 16,
            maxVertexTextureImageUnits: 16,
            maxCombinedTexturesImageUnits: 32,
            maxTextureSize: 512,
            maxCubemapTextureSize: 512,
            maxDrawBuffers: 0,
            maxRenderTextureSize: 512,
            maxVertexAttribs: 16,
            maxVaryingVectors: 16,
            maxFragmentUniformVectors: 16,
            maxVertexUniformVectors: 16,
            standardDerivatives: false,
            astc: null,
            pvrtc: null,
            etc1: null,
            etc2: null,
            bptc: null,
            maxAnisotropy: 0,
            uintIndices: false,
            fragmentDepthSupported: false,
            highPrecisionShaderSupported: true,
            colorBufferFloat: false,
            supportFloatTexturesResolve: false,
            rg11b10ufColorRenderable: false,
            textureFloat: false,
            textureFloatLinearFiltering: false,
            textureFloatRender: false,
            textureHalfFloat: false,
            textureHalfFloatLinearFiltering: false,
            textureHalfFloatRender: false,
            textureLOD: false,
            texelFetch: false,
            drawBuffersExtension: false,
            depthTextureExtension: false,
            vertexArrayObject: false,
            instancedArrays: false,
            supportOcclusionQuery: false,
            canUseTimestampForTimerQuery: false,
            maxMSAASamples: 1,
            blendMinMax: false,
            canUseGLInstanceID: false,
            canUseGLVertexID: false,
            supportComputeShaders: false,
            supportSRGBBuffers: false,
            supportTransformFeedbacks: false,
            textureMaxLevel: false,
            texture2DArrayMaxLayerCount: 128,
            disableMorphTargetTexture: false,
            textureNorm16: false,
        };
        this._features = {
            forceBitmapOverHTMLImageElement: false,
            supportRenderAndCopyToLodForFloatTextures: false,
            supportDepthStencilTexture: false,
            supportShadowSamplers: false,
            uniformBufferHardCheckMatrix: false,
            allowTexturePrefiltering: false,
            trackUbosInFrame: false,
            checkUbosContentBeforeUpload: false,
            supportCSM: false,
            basisNeedsPOT: false,
            support3DTextures: false,
            needTypeSuffixInShaderConstants: false,
            supportMSAA: false,
            supportSSAO2: false,
            supportIBLShadows: false,
            supportExtendedTextureFormats: false,
            supportSwitchCaseInShader: false,
            supportSyncTextureRead: false,
            needsInvertingBitmap: false,
            useUBOBindingCache: false,
            needShaderCodeInlining: false,
            needToAlwaysBindUniformBuffers: false,
            supportRenderPasses: true,
            supportSpriteInstancing: false,
            forceVertexBufferStrideAndOffsetMultiple4Bytes: false,
            _checkNonFloatVertexBuffersDontRecreatePipelineContext: false,
            _collectUbosUpdatedInFrame: false,
        };
        if (options.renderingCanvas) {
            this._renderingCanvas = options.renderingCanvas;
        }
        Logger.Log(`Babylon.js v${Engine.Version} - Null engine`);
        // Wrappers
        const theCurrentGlobal = typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : window;
        if (typeof URL === "undefined") {
            theCurrentGlobal.URL = {
                createObjectURL: function () { },
                revokeObjectURL: function () { },
            };
        }
        if (typeof Blob === "undefined") {
            theCurrentGlobal.Blob = function () { };
        }
    }
    /**
     * Creates a vertex buffer
     * @param vertices the data for the vertex buffer
     * @returns the new WebGL static buffer
     */
    createVertexBuffer(vertices) {
        const buffer = new DataBuffer();
        buffer.references = 1;
        return buffer;
    }
    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @returns a new webGL buffer
     */
    createIndexBuffer(indices) {
        const buffer = new DataBuffer();
        buffer.references = 1;
        return buffer;
    }
    /**
     * Clear the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    clear(color, backBuffer, depth, stencil = false) { }
    /**
     * Gets the current render width
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render width
     */
    getRenderWidth(useScreen = false) {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }
        return this._options.renderWidth;
    }
    /**
     * Gets the current render height
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render height
     */
    getRenderHeight(useScreen = false) {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }
        return this._options.renderHeight;
    }
    /**
     * Set the WebGL's viewport
     * @param viewport defines the viewport element to be used
     * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
     * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
     */
    setViewport(viewport, requiredWidth, requiredHeight) {
        this._cachedViewport = viewport;
    }
    createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context) {
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            __SPECTOR_rebuildProgram: null,
        };
    }
    /**
     * Gets the list of webGL uniform locations associated with a specific program based on a list of uniform names
     * @param pipelineContext defines the pipeline context to use
     * @param uniformsNames defines the list of uniform names
     * @returns an array of webGL uniform locations
     */
    getUniforms(pipelineContext, uniformsNames) {
        return [];
    }
    /**
     * Gets the lsit of active attributes for a given webGL program
     * @param pipelineContext defines the pipeline context to use
     * @param attributesNames defines the list of attribute names to get
     * @returns an array of indices indicating the offset of each attribute
     */
    getAttributes(pipelineContext, attributesNames) {
        return [];
    }
    /**
     * Binds an effect to the webGL context
     * @param effect defines the effect to bind
     */
    bindSamplers(effect) {
        this._currentEffect = null;
    }
    /**
     * Activates an effect, making it the current one (ie. the one used for rendering)
     * @param effect defines the effect to activate
     */
    enableEffect(effect) {
        effect = effect !== null && IsWrapper(effect) ? effect.effect : effect; // get only the effect, we don't need a Wrapper in the WebGL engine
        this._currentEffect = effect;
        if (!effect) {
            return;
        }
        if (effect.onBind) {
            effect.onBind(effect);
        }
        if (effect._onBindObservable) {
            effect._onBindObservable.notifyObservers(effect);
        }
    }
    /**
     * Set various states to the webGL context
     * @param culling defines culling state: true to enable culling, false to disable it
     * @param zOffset defines the value to apply to zOffset (0 by default)
     * @param force defines if states must be applied even if cache is up to date
     * @param reverseSide defines if culling must be reversed (CCW if false, CW if true)
     * @param cullBackFaces true to cull back faces, false to cull front faces (if culling is enabled)
     * @param stencil stencil states to set
     * @param zOffsetUnits defines the value to apply to zOffsetUnits (0 by default)
     */
    setState(culling, zOffset = 0, force, reverseSide = false, cullBackFaces, stencil, zOffsetUnits = 0) { }
    /**
     * Set the value of an uniform to an array of int32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if value was set
     */
    setIntArray(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of int32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if value was set
     */
    setIntArray2(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of int32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if value was set
     */
    setIntArray3(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of int32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if value was set
     */
    setIntArray4(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of float32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of float32 to store
     * @returns true if value was set
     */
    setFloatArray(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of float32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of float32 to store
     * @returns true if value was set
     */
    setFloatArray2(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of float32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of float32 to store
     * @returns true if value was set
     */
    setFloatArray3(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of float32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of float32 to store
     * @returns true if value was set
     */
    setFloatArray4(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of number
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if value was set
     */
    setArray(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of number (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if value was set
     */
    setArray2(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of number (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if value was set
     */
    setArray3(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of number (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if value was set
     */
    setArray4(uniform, array) {
        return true;
    }
    /**
     * Set the value of an uniform to an array of float32 (stored as matrices)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrices defines the array of float32 to store
     * @returns true if value was set
     */
    setMatrices(uniform, matrices) {
        return true;
    }
    /**
     * Set the value of an uniform to a matrix (3x3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 3x3 matrix to store
     * @returns true if value was set
     */
    setMatrix3x3(uniform, matrix) {
        return true;
    }
    /**
     * Set the value of an uniform to a matrix (2x2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 2x2 matrix to store
     * @returns true if value was set
     */
    setMatrix2x2(uniform, matrix) {
        return true;
    }
    /**
     * Set the value of an uniform to a number (float)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the float number to store
     * @returns true if value was set
     */
    setFloat(uniform, value) {
        return true;
    }
    /**
     * Set the value of an uniform to a vec2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if value was set
     */
    setFloat2(uniform, x, y) {
        return true;
    }
    /**
     * Set the value of an uniform to a vec3
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @returns true if value was set
     */
    setFloat3(uniform, x, y, z) {
        return true;
    }
    /**
     * Set the value of an uniform to a boolean
     * @param uniform defines the webGL uniform location where to store the value
     * @param bool defines the boolean to store
     * @returns true if value was set
     */
    setBool(uniform, bool) {
        return true;
    }
    /**
     * Set the value of an uniform to a vec4
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @param w defines the 4th component of the value
     * @returns true if value was set
     */
    setFloat4(uniform, x, y, z, w) {
        return true;
    }
    /**
     * Sets the current alpha mode
     * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
     */
    setAlphaMode(mode, noDepthWriteChange = false) {
        if (this._alphaMode === mode) {
            return;
        }
        this.alphaState.alphaBlend = mode !== 0;
        if (!noDepthWriteChange) {
            this.setDepthWrite(mode === 0);
        }
        this._alphaMode = mode;
    }
    /**
     * Bind webGl buffers directly to the webGL context
     * @param vertexBuffers defines the vertex buffer to bind
     * @param indexBuffer defines the index buffer to bind
     * @param effect defines the effect associated with the vertex buffer
     */
    bindBuffers(vertexBuffers, indexBuffer, effect) { }
    /**
     * Force the entire cache to be cleared
     * You should not have to use this function unless your engine needs to share the webGL context with another engine
     * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
     */
    wipeCaches(bruteForce) {
        if (this.preventCacheWipeBetweenFrames) {
            return;
        }
        this.resetTextureCache();
        this._currentEffect = null;
        if (bruteForce) {
            this._currentProgram = null;
            this._stencilStateComposer.reset();
            this.depthCullingState.reset();
            this.alphaState.reset();
        }
        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }
    /**
     * Send a draw order
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    draw(useTriangles, indexStart, indexCount, instancesCount) { }
    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    drawElementsType(fillMode, indexStart, indexCount, instancesCount) { }
    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    drawArraysType(fillMode, verticesStart, verticesCount, instancesCount) { }
    /** @internal */
    _createTexture() {
        return {};
    }
    /**
     * @internal
     */
    _releaseTexture(texture) { }
    /**
     * Usually called from Texture.ts.
     * Passed information to create a WebGLTexture
     * @param urlArg defines a value which contains one of the following:
     * * A conventional http URL, e.g. 'http://...' or 'file://...'
     * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
     * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
     * @param invertY when true, image is flipped when loaded.  You probably want true. Certain compressed textures may invert this if their default is inverted (eg. ktx)
     * @param scene needed for loading to the correct scene
     * @param samplingMode mode with should be used sample / access the texture (Default: Texture.TRILINEAR_SAMPLINGMODE)
     * @param onLoad optional callback to be called upon successful completion
     * @param onError optional callback to be called upon failure
     * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
     * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
     * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param mimeType defines an optional mime type
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    createTexture(urlArg, noMipmap, invertY, scene, samplingMode = 3, onLoad = null, onError = null, buffer = null, fallback = null, format = null, forcedExtension = null, mimeType) {
        const texture = new InternalTexture(this, 1 /* InternalTextureSource.Url */);
        const url = String(urlArg);
        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture.baseWidth = this._options.textureSize;
        texture.baseHeight = this._options.textureSize;
        texture.width = this._options.textureSize;
        texture.height = this._options.textureSize;
        if (format) {
            texture.format = format;
        }
        texture.isReady = true;
        if (onLoad) {
            setTimeout(() => {
                onLoad(texture);
            });
        }
        this._internalTexturesCache.push(texture);
        return texture;
    }
    /**
     * @internal
     */
    _createHardwareRenderTargetWrapper(isMulti, isCube, size) {
        const rtWrapper = new RenderTargetWrapper(isMulti, isCube, size, this);
        this._renderTargetWrapperCache.push(rtWrapper);
        return rtWrapper;
    }
    /**
     * Creates a new render target wrapper
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target wrapper
     */
    createRenderTargetTexture(size, options) {
        const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size);
        const fullOptions = {};
        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
            fullOptions.type = options.type === undefined ? 0 : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? 3 : options.samplingMode;
        }
        else {
            fullOptions.generateMipMaps = options;
            fullOptions.generateDepthBuffer = true;
            fullOptions.generateStencilBuffer = false;
            fullOptions.type = 0;
            fullOptions.samplingMode = 3;
        }
        const texture = new InternalTexture(this, 5 /* InternalTextureSource.RenderTarget */);
        const width = size.width || size;
        const height = size.height || size;
        rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
        rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        this._internalTexturesCache.push(texture);
        return rtWrapper;
    }
    /**
     * Creates a new render target wrapper
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target wrapper
     */
    createRenderTargetCubeTexture(size, options) {
        const rtWrapper = this._createHardwareRenderTargetWrapper(false, true, size);
        const fullOptions = {
            generateMipMaps: true,
            generateDepthBuffer: true,
            generateStencilBuffer: false,
            type: 0,
            samplingMode: 3,
            format: 5,
            ...options,
        };
        fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;
        if (fullOptions.type === 1 && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            fullOptions.samplingMode = 1;
        }
        else if (fullOptions.type === 2 && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            fullOptions.samplingMode = 1;
        }
        rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
        rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;
        const texture = new InternalTexture(this, 5 /* InternalTextureSource.RenderTarget */);
        texture.baseWidth = size;
        texture.baseHeight = size;
        texture.width = size;
        texture.height = size;
        texture.isReady = true;
        texture.isCube = true;
        texture.samples = 1;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        this._internalTexturesCache.push(texture);
        return rtWrapper;
    }
    /**
     * Update the sampling mode of a given texture
     * @param samplingMode defines the required sampling mode
     * @param texture defines the texture to update
     */
    updateTextureSamplingMode(samplingMode, texture) {
        texture.samplingMode = samplingMode;
    }
    /**
     * Creates a raw texture
     * @param data defines the data to store in the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param format defines the format of the data
     * @param generateMipMaps defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
     * @param compression defines the compression used (null by default)
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the raw texture inside an InternalTexture
     */
    createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode, compression = null, type = 0, creationFlags = 0, useSRGBBuffer = false) {
        const texture = new InternalTexture(this, 3 /* InternalTextureSource.Raw */);
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.format = format;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture._compression = compression;
        texture.type = type;
        texture._useSRGBBuffer = useSRGBBuffer;
        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }
        return texture;
    }
    /**
     * Update a raw texture
     * @param texture defines the texture to update
     * @param data defines the data to store in the texture
     * @param format defines the format of the data
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     */
    updateRawTexture(texture, data, format, invertY, compression = null, type = 0, useSRGBBuffer = false) {
        if (texture) {
            texture._bufferView = data;
            texture.format = format;
            texture.invertY = invertY;
            texture._compression = compression;
            texture.type = type;
            texture._useSRGBBuffer = useSRGBBuffer;
        }
    }
    /**
     * Binds the frame buffer to the specified texture.
     * @param rtWrapper The render target wrapper to render to
     * @param faceIndex The face of the texture to render to in case of cube texture
     * @param requiredWidth The width of the target to render to
     * @param requiredHeight The height of the target to render to
     * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
     */
    bindFramebuffer(rtWrapper, faceIndex, requiredWidth, requiredHeight, forceFullscreenViewport) {
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }
        this._currentRenderTarget = rtWrapper;
        this._currentFramebuffer = null;
        if (this._cachedViewport && !forceFullscreenViewport) {
            this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
        }
    }
    /**
     * Unbind the current render target texture from the webGL context
     * @param rtWrapper defines the render target wrapper to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    unBindFramebuffer(rtWrapper, disableGenerateMipMaps = false, onBeforeUnbind) {
        this._currentRenderTarget = null;
        if (onBeforeUnbind) {
            onBeforeUnbind();
        }
        this._currentFramebuffer = null;
    }
    /**
     * Creates a dynamic vertex buffer
     * @param vertices the data for the dynamic vertex buffer
     * @returns the new WebGL dynamic buffer
     */
    createDynamicVertexBuffer(vertices) {
        const buffer = new DataBuffer();
        buffer.references = 1;
        buffer.capacity = 1;
        return buffer;
    }
    /**
     * Update the content of a dynamic texture
     * @param texture defines the texture to update
     * @param canvas defines the canvas containing the source
     * @param invertY defines if data must be stored with Y axis inverted
     * @param premulAlpha defines if alpha is stored as premultiplied
     * @param format defines the format of the data
     */
    updateDynamicTexture(texture, canvas, invertY, premulAlpha = false, format) { }
    /**
     * Gets a boolean indicating if all created effects are ready
     * @returns true if all effects are ready
     */
    areAllEffectsReady() {
        return true;
    }
    /**
     * @internal
     * Get the current error code of the webGL context
     * @returns the error code
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
     */
    getError() {
        return 0;
    }
    /** @internal */
    _getUnpackAlignement() {
        return 1;
    }
    /**
     * @internal
     */
    _unpackFlipY(value) { }
    /**
     * Update a dynamic index buffer
     * @param indexBuffer defines the target index buffer
     * @param indices defines the data to update
     * @param offset defines the offset in the target index buffer where update should start
     */
    updateDynamicIndexBuffer(indexBuffer, indices, offset = 0) { }
    /**
     * Updates a dynamic vertex buffer.
     * @param vertexBuffer the vertex buffer to update
     * @param vertices the data used to update the vertex buffer
     * @param byteOffset the byte offset of the data (optional)
     * @param byteLength the byte length of the data (optional)
     */
    updateDynamicVertexBuffer(vertexBuffer, vertices, byteOffset, byteLength) { }
    /**
     * @internal
     */
    _bindTextureDirectly(target, texture) {
        if (this._boundTexturesCache[this._activeChannel] !== texture) {
            this._boundTexturesCache[this._activeChannel] = texture;
            return true;
        }
        return false;
    }
    /**
     * @internal
     */
    _bindTexture(channel, texture) {
        if (channel < 0) {
            return;
        }
        this._bindTextureDirectly(0, texture);
    }
    _deleteBuffer(buffer) { }
    /**
     * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    releaseEffects() { }
    displayLoadingUI() { }
    hideLoadingUI() { }
    set loadingUIText(_) { }
    flushFramebuffer() { }
    /**
     * @internal
     */
    _uploadCompressedDataToTextureDirectly(texture, internalFormat, width, height, data, faceIndex = 0, lod = 0) { }
    /**
     * @internal
     */
    _uploadDataToTextureDirectly(texture, imageData, faceIndex = 0, lod = 0) { }
    /**
     * @internal
     */
    _uploadArrayBufferViewToTexture(texture, imageData, faceIndex = 0, lod = 0) { }
    /**
     * @internal
     */
    _uploadImageToTexture(texture, image, faceIndex = 0, lod = 0) { }
}
//# sourceMappingURL=nullEngine.js.map