import { EngineStore } from "./engineStore.js";
import { Logger } from "../Misc/logger.js";
import { Effect } from "../Materials/effect.js";
import { PerformanceConfigurator } from "./performanceConfigurator.js";
import { PrecisionDate } from "../Misc/precisionDate.js";
import { DepthCullingState } from "../States/depthCullingState.js";
import { StencilStateComposer } from "../States/stencilStateComposer.js";
import { StencilState } from "../States/stencilState.js";
import { AlphaState } from "../States/alphaCullingState.js";
import { _WarnImport } from "../Misc/devTools.js";
import { InternalTexture } from "../Materials/Textures/internalTexture.js";
import { IsDocumentAvailable, IsNavigatorAvailable, IsWindowObjectExist } from "../Misc/domManagement.js";

import { Observable } from "../Misc/observable.js";
import { EngineFunctionContext, _loadFile } from "./abstractEngine.functions.js";
import { _GetCompatibleTextureLoader } from "../Materials/Textures/Loaders/textureLoaderManager.js";
/**
 * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
 * @param func - the function to be called
 * @param requester - the object that will request the next frame. Falls back to window.
 * @returns frame number
 */
export function QueueNewFrame(func, requester) {
    // Note that there is kind of a typing issue here, as `setTimeout` might return something else than a number (NodeJs returns a NodeJS.Timeout object).
    // Also if the global `requestAnimationFrame`'s returnType is number, `requester.requestPostAnimationFrame` and `requester.requestAnimationFrame` types
    // are `any`.
    if (!IsWindowObjectExist()) {
        if (typeof requestAnimationFrame === "function") {
            return requestAnimationFrame(func);
        }
    }
    else {
        const { requestAnimationFrame } = requester || window;
        if (typeof requestAnimationFrame === "function") {
            return requestAnimationFrame(func);
        }
    }
    // fallback to the global `setTimeout`.
    // In most cases (aka in the browser), `window` is the global object, so instead of calling `window.setTimeout` we could call the global `setTimeout`.
    return setTimeout(func, 16);
}
/**
 * The parent class for specialized engines (WebGL, WebGPU)
 */
export class AbstractEngine {
    /**
     * Gets the current frame id
     */
    get frameId() {
        return this._frameId;
    }
    /**
     * Gets a boolean indicating if the engine runs in WebGPU or not.
     */
    get isWebGPU() {
        return this._isWebGPU;
    }
    /**
     * @internal
     */
    _getShaderProcessor(shaderLanguage) {
        return this._shaderProcessor;
    }
    /**
     * Gets the shader platform name used by the effects.
     */
    get shaderPlatformName() {
        return this._shaderPlatformName;
    }
    _clearEmptyResources() {
        this._emptyTexture = null;
        this._emptyCubeTexture = null;
        this._emptyTexture3D = null;
        this._emptyTexture2DArray = null;
    }
    /**
     * Gets or sets a boolean indicating if depth buffer should be reverse, going from far to near.
     * This can provide greater z depth for distant objects.
     */
    get useReverseDepthBuffer() {
        return this._useReverseDepthBuffer;
    }
    set useReverseDepthBuffer(useReverse) {
        if (useReverse === this._useReverseDepthBuffer) {
            return;
        }
        this._useReverseDepthBuffer = useReverse;
        if (useReverse) {
            this._depthCullingState.depthFunc = 518;
        }
        else {
            this._depthCullingState.depthFunc = 515;
        }
    }
    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    setColorWrite(enable) {
        if (enable !== this._colorWrite) {
            this._colorWriteChanged = true;
            this._colorWrite = enable;
        }
    }
    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    getColorWrite() {
        return this._colorWrite;
    }
    /**
     * Gets the depth culling state manager
     */
    get depthCullingState() {
        return this._depthCullingState;
    }
    /**
     * Gets the alpha state manager
     */
    get alphaState() {
        return this._alphaState;
    }
    /**
     * Gets the stencil state manager
     */
    get stencilState() {
        return this._stencilState;
    }
    /**
     * Gets the stencil state composer
     */
    get stencilStateComposer() {
        return this._stencilStateComposer;
    }
    /** @internal */
    _getGlobalDefines(defines) {
        if (defines) {
            if (this.isNDCHalfZRange) {
                defines["IS_NDC_HALF_ZRANGE"] = "";
            }
            else {
                delete defines["IS_NDC_HALF_ZRANGE"];
            }
            if (this.useReverseDepthBuffer) {
                defines["USE_REVERSE_DEPTHBUFFER"] = "";
            }
            else {
                delete defines["USE_REVERSE_DEPTHBUFFER"];
            }
            if (this.useExactSrgbConversions) {
                defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
            }
            else {
                delete defines["USE_EXACT_SRGB_CONVERSIONS"];
            }
            return;
        }
        else {
            let s = "";
            if (this.isNDCHalfZRange) {
                s += "#define IS_NDC_HALF_ZRANGE";
            }
            if (this.useReverseDepthBuffer) {
                if (s) {
                    s += "\n";
                }
                s += "#define USE_REVERSE_DEPTHBUFFER";
            }
            if (this.useExactSrgbConversions) {
                if (s) {
                    s += "\n";
                }
                s += "#define USE_EXACT_SRGB_CONVERSIONS";
            }
            return s;
        }
    }
    _rebuildInternalTextures() {
        const currentState = this._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies
        for (const internalTexture of currentState) {
            internalTexture._rebuild();
        }
    }
    _rebuildRenderTargetWrappers() {
        const currentState = this._renderTargetWrapperCache.slice(); // Do a copy because the rebuild will add proxies
        for (const renderTargetWrapper of currentState) {
            renderTargetWrapper._rebuild();
        }
    }
    _rebuildEffects() {
        for (const key in this._compiledEffects) {
            const effect = this._compiledEffects[key];
            effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
            effect._prepareEffect();
        }
        Effect.ResetCache();
    }
    _rebuildGraphicsResources() {
        // Ensure webgl and engine states are matching
        this.wipeCaches(true);
        // Rebuild effects
        this._rebuildEffects();
        this._rebuildComputeEffects?.();
        // Note:
        //  The call to _rebuildBuffers must be made before the call to _rebuildInternalTextures because in the process of _rebuildBuffers the buffers used by the post process managers will be rebuilt
        //  and we may need to use the post process manager of the scene during _rebuildInternalTextures (in WebGL1, non-POT textures are rescaled using a post process + post process manager of the scene)
        // Rebuild buffers
        this._rebuildBuffers();
        // Rebuild textures
        this._rebuildInternalTextures();
        // Rebuild textures
        this._rebuildTextures();
        // Rebuild textures
        this._rebuildRenderTargetWrappers();
        // Reset engine states after all the buffer/textures/... have been rebuilt
        this.wipeCaches(true);
    }
    _flagContextRestored() {
        Logger.Warn(this.name + " context successfully restored.");
        this.onContextRestoredObservable.notifyObservers(this);
        this._contextWasLost = false;
    }
    _restoreEngineAfterContextLost(initEngine) {
        // Adding a timeout to avoid race condition at browser level
        setTimeout(async () => {
            this._clearEmptyResources();
            const depthTest = this._depthCullingState.depthTest; // backup those values because the call to initEngine / wipeCaches will reset them
            const depthFunc = this._depthCullingState.depthFunc;
            const depthMask = this._depthCullingState.depthMask;
            const stencilTest = this._stencilState.stencilTest;
            // Rebuild context
            await initEngine();
            this._rebuildGraphicsResources();
            this._depthCullingState.depthTest = depthTest;
            this._depthCullingState.depthFunc = depthFunc;
            this._depthCullingState.depthMask = depthMask;
            this._stencilState.stencilTest = stencilTest;
            this._flagContextRestored();
        }, 0);
    }
    /** Gets a boolean indicating if the engine was disposed */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Enables or disables the snapshot rendering mode
     * Note that the WebGL engine does not support snapshot rendering so setting the value won't have any effect for this engine
     */
    get snapshotRendering() {
        return false;
    }
    set snapshotRendering(activate) {
        // Do nothing
    }
    /**
     * Gets or sets the snapshot rendering mode
     */
    get snapshotRenderingMode() {
        return 0;
    }
    set snapshotRenderingMode(mode) { }
    /**
     * Returns the string "AbstractEngine"
     * @returns "AbstractEngine"
     */
    getClassName() {
        return "AbstractEngine";
    }
    /**
     * Gets the default empty texture
     */
    get emptyTexture() {
        if (!this._emptyTexture) {
            this._emptyTexture = this.createRawTexture(new Uint8Array(4), 1, 1, 5, false, false, 1);
        }
        return this._emptyTexture;
    }
    /**
     * Gets the default empty 3D texture
     */
    get emptyTexture3D() {
        if (!this._emptyTexture3D) {
            this._emptyTexture3D = this.createRawTexture3D(new Uint8Array(4), 1, 1, 1, 5, false, false, 1);
        }
        return this._emptyTexture3D;
    }
    /**
     * Gets the default empty 2D array texture
     */
    get emptyTexture2DArray() {
        if (!this._emptyTexture2DArray) {
            this._emptyTexture2DArray = this.createRawTexture2DArray(new Uint8Array(4), 1, 1, 1, 5, false, false, 1);
        }
        return this._emptyTexture2DArray;
    }
    /**
     * Gets the default empty cube texture
     */
    get emptyCubeTexture() {
        if (!this._emptyCubeTexture) {
            const faceData = new Uint8Array(4);
            const cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
            this._emptyCubeTexture = this.createRawCubeTexture(cubeData, 1, 5, 0, false, false, 1);
        }
        return this._emptyCubeTexture;
    }
    /**
     * Gets the list of current active render loop functions
     * @returns a read only array with the current render loop functions
     */
    get activeRenderLoops() {
        return this._activeRenderLoops;
    }
    /**
     * stop executing a render loop function and remove it from the execution array
     * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
     */
    stopRenderLoop(renderFunction) {
        if (!renderFunction) {
            this._activeRenderLoops.length = 0;
            this._cancelFrame();
            return;
        }
        const index = this._activeRenderLoops.indexOf(renderFunction);
        if (index >= 0) {
            this._activeRenderLoops.splice(index, 1);
            if (this._activeRenderLoops.length == 0) {
                this._cancelFrame();
            }
        }
    }
    _cancelFrame() {
        if (this._frameHandler !== 0) {
            const handlerToCancel = this._frameHandler;
            this._frameHandler = 0;
            if (!IsWindowObjectExist()) {
                if (typeof cancelAnimationFrame === "function") {
                    return cancelAnimationFrame(handlerToCancel);
                }
            }
            else {
                const { cancelAnimationFrame } = this.getHostWindow() || window;
                if (typeof cancelAnimationFrame === "function") {
                    return cancelAnimationFrame(handlerToCancel);
                }
            }
            return clearTimeout(handlerToCancel);
        }
    }
    /**
     * Begin a new frame
     */
    beginFrame() {
        this.onBeginFrameObservable.notifyObservers(this);
    }
    /**
     * End the current frame
     */
    endFrame() {
        this._frameId++;
        this.onEndFrameObservable.notifyObservers(this);
    }
    /** Gets or sets max frame per second allowed. Will return undefined if not capped */
    get maxFPS() {
        return this._maxFPS;
    }
    set maxFPS(value) {
        this._maxFPS = value;
        if (value === undefined) {
            return;
        }
        if (value <= 0) {
            this._minFrameTime = Number.MAX_VALUE;
            return;
        }
        this._minFrameTime = 1000 / (value + 1); // We need to provide a bit of leeway to ensure we don't go under because of vbl sync
    }
    _isOverFrameTime(timestamp) {
        if (!timestamp) {
            return false;
        }
        const elapsedTime = timestamp - this._lastFrameTime;
        if (this._maxFPS === undefined || elapsedTime >= this._minFrameTime) {
            this._lastFrameTime = timestamp;
            return false;
        }
        return true;
    }
    _processFrame(timestamp) {
        this._frameHandler = 0;
        if (!this._contextWasLost && !this._isOverFrameTime(timestamp)) {
            let shouldRender = true;
            if (this.isDisposed || (!this.renderEvenInBackground && this._windowIsBackground)) {
                shouldRender = false;
            }
            if (shouldRender) {
                // Start new frame
                this.beginFrame();
                // Child canvases
                if (!this.skipFrameRender && !this._renderViews()) {
                    // Main frame
                    this._renderFrame();
                }
                // Present
                this.endFrame();
            }
        }
    }
    /** @internal */
    _renderLoop(timestamp) {
        this._processFrame(timestamp);
        // The first condition prevents queuing another frame if we no longer have active render loops (e.g., if
        // `stopRenderLoop` is called mid frame). The second condition prevents queuing another frame if one has
        // already been queued (e.g., if `stopRenderLoop` and `runRenderLoop` is called mid frame).
        if (this._activeRenderLoops.length > 0 && this._frameHandler === 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        }
    }
    /** @internal */
    _renderFrame() {
        for (let index = 0; index < this._activeRenderLoops.length; index++) {
            const renderFunction = this._activeRenderLoops[index];
            renderFunction();
        }
    }
    /** @internal */
    _renderViews() {
        return false;
    }
    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @internal
     */
    _queueNewFrame(bindedRenderFunction, requester) {
        return QueueNewFrame(bindedRenderFunction, requester);
    }
    /**
     * Register and execute a render loop. The engine can have more than one render function
     * @param renderFunction defines the function to continuously execute
     */
    runRenderLoop(renderFunction) {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) {
            return;
        }
        this._activeRenderLoops.push(renderFunction);
        // On the first added function, start the render loop.
        if (this._activeRenderLoops.length === 1 && this._frameHandler === 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        }
    }
    /**
     * Gets a boolean indicating if depth testing is enabled
     * @returns the current state
     */
    getDepthBuffer() {
        return this._depthCullingState.depthTest;
    }
    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    setDepthBuffer(enable) {
        this._depthCullingState.depthTest = enable;
    }
    /**
     * Set the z offset Factor to apply to current rendering
     * @param value defines the offset to apply
     */
    setZOffset(value) {
        this._depthCullingState.zOffset = this.useReverseDepthBuffer ? -value : value;
    }
    /**
     * Gets the current value of the zOffset Factor
     * @returns the current zOffset Factor state
     */
    getZOffset() {
        const zOffset = this._depthCullingState.zOffset;
        return this.useReverseDepthBuffer ? -zOffset : zOffset;
    }
    /**
     * Set the z offset Units to apply to current rendering
     * @param value defines the offset to apply
     */
    setZOffsetUnits(value) {
        this._depthCullingState.zOffsetUnits = this.useReverseDepthBuffer ? -value : value;
    }
    /**
     * Gets the current value of the zOffset Units
     * @returns the current zOffset Units state
     */
    getZOffsetUnits() {
        const zOffsetUnits = this._depthCullingState.zOffsetUnits;
        return this.useReverseDepthBuffer ? -zOffsetUnits : zOffsetUnits;
    }
    /**
     * Gets host window
     * @returns the host window object
     */
    getHostWindow() {
        if (!IsWindowObjectExist()) {
            return null;
        }
        if (this._renderingCanvas && this._renderingCanvas.ownerDocument && this._renderingCanvas.ownerDocument.defaultView) {
            return this._renderingCanvas.ownerDocument.defaultView;
        }
        return window;
    }
    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    get compatibilityMode() {
        return this._compatibilityMode;
    }
    set compatibilityMode(mode) {
        // not supported in WebGL
        this._compatibilityMode = true;
    }
    _rebuildTextures() {
        for (const scene of this.scenes) {
            scene._rebuildTextures();
        }
        for (const scene of this._virtualScenes) {
            scene._rebuildTextures();
        }
    }
    /**
     * @internal
     */
    _releaseRenderTargetWrapper(rtWrapper) {
        const index = this._renderTargetWrapperCache.indexOf(rtWrapper);
        if (index !== -1) {
            this._renderTargetWrapperCache.splice(index, 1);
        }
    }
    /**
     * Gets the current viewport
     */
    get currentViewport() {
        return this._cachedViewport;
    }
    /**
     * Set the WebGL's viewport
     * @param viewport defines the viewport element to be used
     * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
     * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
     */
    setViewport(viewport, requiredWidth, requiredHeight) {
        const width = requiredWidth || this.getRenderWidth();
        const height = requiredHeight || this.getRenderHeight();
        const x = viewport.x || 0;
        const y = viewport.y || 0;
        this._cachedViewport = viewport;
        this._viewport(x * width, y * height, width * viewport.width, height * viewport.height);
    }
    /**
     * Create an image to use with canvas
     * @returns IImage interface
     */
    createCanvasImage() {
        return document.createElement("img");
    }
    /**
     * Returns a string describing the current engine
     */
    get description() {
        let description = this.name + this.version;
        if (this._caps.parallelShaderCompile) {
            description += " - Parallel shader compilation";
        }
        return description;
    }
    _createTextureBase(url, noMipmap, invertY, scene, samplingMode = 3, onLoad = null, onError = null, prepareTexture, prepareTextureProcess, buffer = null, fallback = null, format = null, forcedExtension = null, mimeType, loaderOptions, useSRGBBuffer) {
        url = url || "";
        const fromData = url.substr(0, 5) === "data:";
        const fromBlob = url.substr(0, 5) === "blob:";
        const isBase64 = fromData && url.indexOf(";base64,") !== -1;
        const texture = fallback ? fallback : new InternalTexture(this, 1 /* InternalTextureSource.Url */);
        if (texture !== fallback) {
            texture.label = url.substring(0, 60); // default label, can be overriden by the caller
        }
        const originalUrl = url;
        if (this._transformTextureUrl && !isBase64 && !fallback && !buffer) {
            url = this._transformTextureUrl(url);
        }
        if (originalUrl !== url) {
            texture._originalUrl = originalUrl;
        }
        // establish the file extension, if possible
        const lastDot = url.lastIndexOf(".");
        let extension = forcedExtension ? forcedExtension : lastDot > -1 ? url.substring(lastDot).toLowerCase() : "";
        // Remove query string
        const queryStringIndex = extension.indexOf("?");
        if (queryStringIndex > -1) {
            extension = extension.split("?")[0];
        }
        const loaderPromise = _GetCompatibleTextureLoader(extension, mimeType);
        if (scene) {
            scene.addPendingData(texture);
        }
        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture._useSRGBBuffer = this._getUseSRGBBuffer(!!useSRGBBuffer, noMipmap);
        if (!this._doNotHandleContextLost) {
            // Keep a link to the buffer only if we plan to handle context lost
            texture._buffer = buffer;
        }
        let onLoadObserver = null;
        if (onLoad && !fallback) {
            onLoadObserver = texture.onLoadedObservable.add(onLoad);
        }
        if (!fallback) {
            this._internalTexturesCache.push(texture);
        }
        const onInternalError = (message, exception) => {
            if (scene) {
                scene.removePendingData(texture);
            }
            if (url === originalUrl) {
                if (onLoadObserver) {
                    texture.onLoadedObservable.remove(onLoadObserver);
                }
                if (EngineStore.UseFallbackTexture && url !== EngineStore.FallbackTexture) {
                    this._createTextureBase(EngineStore.FallbackTexture, noMipmap, texture.invertY, scene, samplingMode, null, onError, prepareTexture, prepareTextureProcess, buffer, texture);
                }
                message = (message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : "");
                texture.onErrorObservable.notifyObservers({ message, exception });
                if (onError) {
                    onError(message, exception);
                }
            }
            else {
                // fall back to the original url if the transformed url fails to load
                Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
                this._createTextureBase(originalUrl, noMipmap, texture.invertY, scene, samplingMode, onLoad, onError, prepareTexture, prepareTextureProcess, buffer, texture, format, forcedExtension, mimeType, loaderOptions, useSRGBBuffer);
            }
        };
        // processing for non-image formats
        if (loaderPromise) {
            const callback = async (data) => {
                const loader = await loaderPromise;
                loader.loadData(data, texture, (width, height, loadMipmap, isCompressed, done, loadFailed) => {
                    if (loadFailed) {
                        onInternalError("TextureLoader failed to load data");
                    }
                    else {
                        prepareTexture(texture, extension, scene, { width, height }, texture.invertY, !loadMipmap, isCompressed, () => {
                            done();
                            return false;
                        }, samplingMode);
                    }
                }, loaderOptions);
            };
            if (!buffer) {
                this._loadFile(url, (data) => callback(new Uint8Array(data)), undefined, scene ? scene.offlineProvider : undefined, true, (request, exception) => {
                    onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                });
            }
            else {
                if (buffer instanceof ArrayBuffer) {
                    callback(new Uint8Array(buffer));
                }
                else if (ArrayBuffer.isView(buffer)) {
                    callback(buffer);
                }
                else {
                    if (onError) {
                        onError("Unable to load: only ArrayBuffer or ArrayBufferView is supported", null);
                    }
                }
            }
        }
        else {
            const onload = (img) => {
                if (fromBlob && !this._doNotHandleContextLost) {
                    // We need to store the image if we need to rebuild the texture
                    // in case of a webgl context lost
                    texture._buffer = img;
                }
                prepareTexture(texture, extension, scene, img, texture.invertY, noMipmap, false, prepareTextureProcess, samplingMode);
            };
            // According to the WebGL spec section 6.10, ImageBitmaps must be inverted on creation.
            // So, we pass imageOrientation to _FileToolsLoadImage() as it may create an ImageBitmap.
            if (!fromData || isBase64) {
                if (buffer && (typeof buffer.decoding === "string" || buffer.close)) {
                    onload(buffer);
                }
                else {
                    AbstractEngine._FileToolsLoadImage(url || "", onload, onInternalError, scene ? scene.offlineProvider : null, mimeType, texture.invertY && this._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined);
                }
            }
            else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer) || buffer instanceof Blob) {
                AbstractEngine._FileToolsLoadImage(buffer, onload, onInternalError, scene ? scene.offlineProvider : null, mimeType, texture.invertY && this._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined);
            }
            else if (buffer) {
                onload(buffer);
            }
        }
        return texture;
    }
    _rebuildBuffers() {
        // Uniforms
        for (const uniformBuffer of this._uniformBuffers) {
            uniformBuffer._rebuildAfterContextLost();
        }
    }
    /** @internal */
    get _shouldUseHighPrecisionShader() {
        return !!(this._caps.highPrecisionShaderSupported && this._highPrecisionShadersAllowed);
    }
    /**
     * Gets host document
     * @returns the host document object
     */
    getHostDocument() {
        if (this._renderingCanvas && this._renderingCanvas.ownerDocument) {
            return this._renderingCanvas.ownerDocument;
        }
        return IsDocumentAvailable() ? document : null;
    }
    /**
     * Gets the list of loaded textures
     * @returns an array containing all loaded textures
     */
    getLoadedTexturesCache() {
        return this._internalTexturesCache;
    }
    /**
     * Clears the list of texture accessible through engine.
     * This can help preventing texture load conflict due to name collision.
     */
    clearInternalTexturesCache() {
        this._internalTexturesCache.length = 0;
    }
    /**
     * Gets the object containing all engine capabilities
     * @returns the EngineCapabilities object
     */
    getCaps() {
        return this._caps;
    }
    /**
     * Reset the texture cache to empty state
     */
    resetTextureCache() {
        for (const key in this._boundTexturesCache) {
            if (!Object.prototype.hasOwnProperty.call(this._boundTexturesCache, key)) {
                continue;
            }
            this._boundTexturesCache[key] = null;
        }
        this._currentTextureChannel = -1;
    }
    /**
     * Gets or sets the name of the engine
     */
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    static get NpmPackage() {
        return "babylonjs@7.45.0";
    }
    /**
     * Returns the current version of the framework
     */
    static get Version() {
        return "7.45.0";
    }
    /**
     * Gets the HTML canvas attached with the current webGL context
     * @returns a HTML canvas
     */
    getRenderingCanvas() {
        return this._renderingCanvas;
    }
    /**
     * Gets the audio context specified in engine initialization options
     * @returns an Audio Context
     */
    getAudioContext() {
        return this._audioContext;
    }
    /**
     * Gets the audio destination specified in engine initialization options
     * @returns an audio destination node
     */
    getAudioDestination() {
        return this._audioDestination;
    }
    /**
     * Defines the hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @param level defines the level to use
     */
    setHardwareScalingLevel(level) {
        this._hardwareScalingLevel = level;
        this.resize();
    }
    /**
     * Gets the current hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @returns a number indicating the current hardware scaling level
     */
    getHardwareScalingLevel() {
        return this._hardwareScalingLevel;
    }
    /**
     * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#handling-webgl-context-lost
     */
    get doNotHandleContextLost() {
        return this._doNotHandleContextLost;
    }
    set doNotHandleContextLost(value) {
        this._doNotHandleContextLost = value;
    }
    /**
     * Returns true if the stencil buffer has been enabled through the creation option of the context.
     */
    get isStencilEnable() {
        return this._isStencilEnable;
    }
    /**
     * Gets the options used for engine creation
     * @returns EngineOptions object
     */
    getCreationOptions() {
        return this._creationOptions;
    }
    /**
     * Creates a new engine
     * @param antialias defines whether anti-aliasing should be enabled. If undefined, it means that the underlying engine is free to enable it or not
     * @param options defines further options to be sent to the creation context
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(antialias, options, adaptToDeviceRatio) {
        // States
        /** @internal */
        this._colorWrite = true;
        /** @internal */
        this._colorWriteChanged = true;
        /** @internal */
        this._depthCullingState = new DepthCullingState();
        /** @internal */
        this._stencilStateComposer = new StencilStateComposer();
        /** @internal */
        this._stencilState = new StencilState();
        /** @internal */
        this._alphaState = new AlphaState();
        /** @internal */
        this._alphaMode = 1;
        /** @internal */
        this._alphaEquation = 0;
        this._activeRequests = [];
        /** @internal */
        this._badOS = false;
        /** @internal */
        this._badDesktopOS = false;
        this._compatibilityMode = true;
        /** @internal */
        this._internalTexturesCache = new Array();
        /** @internal */
        this._currentRenderTarget = null;
        /** @internal */
        this._boundTexturesCache = {};
        /** @internal */
        this._activeChannel = 0;
        /** @internal */
        this._currentTextureChannel = -1;
        /** @internal */
        this._viewportCached = { x: 0, y: 0, z: 0, w: 0 };
        /** @internal */
        this._isWebGPU = false;
        /**
         * Observable event triggered each time the canvas loses focus
         */
        this.onCanvasBlurObservable = new Observable();
        /**
         * Observable event triggered each time the canvas gains focus
         */
        this.onCanvasFocusObservable = new Observable();
        /**
         * Event raised when a new scene is created
         */
        this.onNewSceneAddedObservable = new Observable();
        /**
         * Observable event triggered each time the rendering canvas is resized
         */
        this.onResizeObservable = new Observable();
        /**
         * Observable event triggered each time the canvas receives pointerout event
         */
        this.onCanvasPointerOutObservable = new Observable();
        /**
         * Observable event triggered each time an effect compilation fails
         */
        this.onEffectErrorObservable = new Observable();
        /**
         * Turn this value on if you want to pause FPS computation when in background
         */
        this.disablePerformanceMonitorInBackground = false;
        /**
         * Gets or sets a boolean indicating that vertex array object must be disabled even if they are supported
         */
        this.disableVertexArrayObjects = false;
        /** @internal */
        this._frameId = 0;
        /**
         * Gets information about the current host
         */
        this.hostInformation = {
            isMobile: false,
        };
        /**
         * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
         */
        this.isFullscreen = false;
        /**
         * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
         **/
        this.enableOfflineSupport = false;
        /**
         * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (js will always consider the database is up to date)
         **/
        this.disableManifestCheck = false;
        /**
         * Gets or sets a boolean to enable/disable the context menu (right-click) from appearing on the main canvas
         */
        this.disableContextMenu = true;
        /**
         * Gets or sets the current render pass id
         */
        this.currentRenderPassId = 0;
        /**
         * Gets a boolean indicating if the pointer is currently locked
         */
        this.isPointerLock = false;
        /**
         * Gets the list of created postprocesses
         */
        this.postProcesses = [];
        /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
        this.canvasTabIndex = 1;
        /** @internal */
        this._contextWasLost = false;
        this._useReverseDepthBuffer = false;
        /**
         * Indicates if the z range in NDC space is 0..1 (value: true) or -1..1 (value: false)
         */
        this.isNDCHalfZRange = false;
        /**
         * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
         */
        this.hasOriginBottomLeft = true;
        /** @internal */
        this._renderTargetWrapperCache = new Array();
        /** @internal */
        this._compiledEffects = {};
        /** @internal */
        this._isDisposed = false;
        /**
         * Gets the list of created scenes
         */
        this.scenes = [];
        /** @internal */
        this._virtualScenes = new Array();
        /**
         * Observable event triggered before each texture is initialized
         */
        this.onBeforeTextureInitObservable = new Observable();
        /**
         * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foreground
         */
        this.renderEvenInBackground = true;
        /**
         * Gets or sets a boolean indicating that cache can be kept between frames
         */
        this.preventCacheWipeBetweenFrames = false;
        /** @internal */
        this._frameHandler = 0;
        /** @internal */
        this._activeRenderLoops = new Array();
        /** @internal */
        this._windowIsBackground = false;
        /** @internal */
        this._boundRenderFunction = (timestamp) => this._renderLoop(timestamp);
        this._lastFrameTime = 0;
        /**
         * Skip frame rendering but keep the frame heartbeat (begin/end frame).
         * This is useful if you need all the plumbing but not the rendering work.
         * (for instance when capturing a screenshot where you do not want to mix rendering to the screen and to the screenshot)
         */
        this.skipFrameRender = false;
        /**
         * Observable raised when the engine is about to compile a shader
         */
        this.onBeforeShaderCompilationObservable = new Observable();
        /**
         * Observable raised when the engine has just compiled a shader
         */
        this.onAfterShaderCompilationObservable = new Observable();
        /**
         * Observable raised when the engine begins a new frame
         */
        this.onBeginFrameObservable = new Observable();
        /**
         * Observable raised when the engine ends the current frame
         */
        this.onEndFrameObservable = new Observable();
        /** @internal */
        this._transformTextureUrl = null;
        /** @internal */
        this._uniformBuffers = new Array();
        /** @internal */
        this._storageBuffers = new Array();
        this._highPrecisionShadersAllowed = true;
        // Lost context
        /**
         * Observable signaled when a context lost event is raised
         */
        this.onContextLostObservable = new Observable();
        /**
         * Observable signaled when a context restored event is raised
         */
        this.onContextRestoredObservable = new Observable();
        /** @internal */
        this._name = "";
        /**
         * Defines whether the engine has been created with the premultipliedAlpha option on or not.
         */
        this.premultipliedAlpha = true;
        /**
         * If set to true zooming in and out in the browser will rescale the hardware-scaling correctly.
         */
        this.adaptToDeviceRatio = false;
        /** @internal */
        this._lastDevicePixelRatio = 1.0;
        /** @internal */
        this._doNotHandleContextLost = false;
        /**
         * Gets or sets a boolean indicating if back faces must be culled. If false, front faces are culled instead (true by default)
         * If non null, this takes precedence over the value from the material
         */
        this.cullBackFaces = null;
        /** @internal */
        this._renderPassNames = ["main"];
        // FPS
        this._fps = 60;
        this._deltaTime = 0;
        // Deterministic lockstepMaxSteps
        /** @internal */
        this._deterministicLockstep = false;
        /** @internal */
        this._lockstepMaxSteps = 4;
        /** @internal */
        this._timeStep = 1 / 60;
        /**
         * An event triggered when the engine is disposed.
         */
        this.onDisposeObservable = new Observable();
        /**
         * An event triggered when a global cleanup of all effects is required
         */
        this.onReleaseEffectsObservable = new Observable();
        EngineStore.Instances.push(this);
        this.startTime = PrecisionDate.Now;
        this._stencilStateComposer.stencilGlobal = this._stencilState;
        PerformanceConfigurator.SetMatrixPrecision(!!options.useHighPrecisionMatrix);
        if (IsNavigatorAvailable() && navigator.userAgent) {
            // Detect if we are running on a faulty buggy OS.
            this._badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);
            // Detect if we are running on a faulty buggy desktop OS.
            this._badDesktopOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        }
        // Save this off for use in resize().
        this.adaptToDeviceRatio = adaptToDeviceRatio ?? false;
        options.antialias = antialias ?? options.antialias;
        options.deterministicLockstep = options.deterministicLockstep ?? false;
        options.lockstepMaxSteps = options.lockstepMaxSteps ?? 4;
        options.timeStep = options.timeStep ?? 1 / 60;
        options.audioEngine = options.audioEngine ?? true;
        options.stencil = options.stencil ?? true;
        this._audioContext = options.audioEngineOptions?.audioContext ?? null;
        this._audioDestination = options.audioEngineOptions?.audioDestination ?? null;
        this.premultipliedAlpha = options.premultipliedAlpha ?? true;
        this._doNotHandleContextLost = !!options.doNotHandleContextLost;
        this._isStencilEnable = options.stencil ? true : false;
        this.useExactSrgbConversions = options.useExactSrgbConversions ?? false;
        const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;
        const limitDeviceRatio = options.limitDeviceRatio || devicePixelRatio;
        // Viewport
        adaptToDeviceRatio = adaptToDeviceRatio || options.adaptToDeviceRatio || false;
        this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, devicePixelRatio) : 1.0;
        this._lastDevicePixelRatio = devicePixelRatio;
        this._creationOptions = options;
    }
    /**
     * Resize the view according to the canvas' size
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     */
    resize(forceSetSize = false) {
        let width;
        let height;
        // Re-query hardware scaling level to handle zoomed-in resizing.
        if (this.adaptToDeviceRatio) {
            const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;
            const changeRatio = this._lastDevicePixelRatio / devicePixelRatio;
            this._lastDevicePixelRatio = devicePixelRatio;
            this._hardwareScalingLevel *= changeRatio;
        }
        if (IsWindowObjectExist() && IsDocumentAvailable()) {
            // make sure it is a Node object, and is a part of the document.
            if (this._renderingCanvas) {
                const boundingRect = this._renderingCanvas.getBoundingClientRect
                    ? this._renderingCanvas.getBoundingClientRect()
                    : {
                        // fallback to last solution in case the function doesn't exist
                        width: this._renderingCanvas.width * this._hardwareScalingLevel,
                        height: this._renderingCanvas.height * this._hardwareScalingLevel,
                    };
                width = this._renderingCanvas.clientWidth || boundingRect.width || this._renderingCanvas.width || 100;
                height = this._renderingCanvas.clientHeight || boundingRect.height || this._renderingCanvas.height || 100;
            }
            else {
                width = window.innerWidth;
                height = window.innerHeight;
            }
        }
        else {
            width = this._renderingCanvas ? this._renderingCanvas.width : 100;
            height = this._renderingCanvas ? this._renderingCanvas.height : 100;
        }
        this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel, forceSetSize);
    }
    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     * @returns true if the size was changed
     */
    setSize(width, height, forceSetSize = false) {
        if (!this._renderingCanvas) {
            return false;
        }
        width = width | 0;
        height = height | 0;
        if (!forceSetSize && this._renderingCanvas.width === width && this._renderingCanvas.height === height) {
            return false;
        }
        this._renderingCanvas.width = width;
        this._renderingCanvas.height = height;
        if (this.scenes) {
            for (let index = 0; index < this.scenes.length; index++) {
                const scene = this.scenes[index];
                for (let camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    const cam = scene.cameras[camIndex];
                    cam._currentRenderId = 0;
                }
            }
            if (this.onResizeObservable.hasObservers()) {
                this.onResizeObservable.notifyObservers(this);
            }
        }
        return true;
    }
    // eslint-disable-next-line jsdoc/require-returns-check
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
    createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode, compression, type, creationFlags, useSRGBBuffer) {
        throw _WarnImport("engine.rawTexture");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a new raw cube texture
     * @param data defines the array of data to use to create each face
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
     * @param generateMipMaps  defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compression used (null by default)
     * @returns the cube texture as an InternalTexture
     */
    createRawCubeTexture(data, size, format, type, generateMipMaps, invertY, samplingMode, compression) {
        throw _WarnImport("engine.rawTexture");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a new raw 3D texture
     * @param data defines the data used to create the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the depth of the texture
     * @param format defines the format of the texture
     * @param generateMipMaps defines if the engine must generate mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compressed used (can be null)
     * @param textureType defines the compressed used (can be null)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @returns a new raw 3D texture (stored in an InternalTexture)
     */
    createRawTexture3D(data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression, textureType, creationFlags) {
        throw _WarnImport("engine.rawTexture");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a new raw 2D array texture
     * @param data defines the data used to create the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the number of layers of the texture
     * @param format defines the format of the texture
     * @param generateMipMaps defines if the engine must generate mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compressed used (can be null)
     * @param textureType defines the compressed used (can be null)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @returns a new raw 2D array texture (stored in an InternalTexture)
     */
    createRawTexture2DArray(data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression, textureType, creationFlags) {
        throw _WarnImport("engine.rawTexture");
    }
    /**
     * Shared initialization across engines types.
     * @param canvas The canvas associated with this instance of the engine.
     */
    _sharedInit(canvas) {
        this._renderingCanvas = canvas;
    }
    _setupMobileChecks() {
        if (!(navigator && navigator.userAgent)) {
            return;
        }
        // Function to check if running on mobile device
        this._checkForMobile = () => {
            const currentUA = navigator.userAgent;
            this.hostInformation.isMobile =
                currentUA.indexOf("Mobile") !== -1 ||
                    // Needed for iOS 13+ detection on iPad (inspired by solution from https://stackoverflow.com/questions/9038625/detect-if-device-is-ios)
                    (currentUA.indexOf("Mac") !== -1 && IsDocumentAvailable() && "ontouchend" in document);
        };
        // Set initial isMobile value
        this._checkForMobile();
        // Set up event listener to check when window is resized (used to get emulator activation to work properly)
        if (IsWindowObjectExist()) {
            window.addEventListener("resize", this._checkForMobile);
        }
    }
    /**
     * creates and returns a new video element
     * @param constraints video constraints
     * @returns video element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createVideoElement(constraints) {
        return document.createElement("video");
    }
    /**
     * @internal
     */
    _reportDrawCall(numDrawCalls = 1) {
        this._drawCalls?.addCount(numDrawCalls, false);
    }
    /**
     * Gets the current framerate
     * @returns a number representing the framerate
     */
    getFps() {
        return this._fps;
    }
    /**
     * Gets the time spent between current and previous frame
     * @returns a number representing the delta time in ms
     */
    getDeltaTime() {
        return this._deltaTime;
    }
    /**
     * Gets a boolean indicating that the engine is running in deterministic lock step mode
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns true if engine is in deterministic lock step mode
     */
    isDeterministicLockStep() {
        return this._deterministicLockstep;
    }
    /**
     * Gets the max steps when engine is running in deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the max steps
     */
    getLockstepMaxSteps() {
        return this._lockstepMaxSteps;
    }
    /**
     * Returns the time in ms between steps when using deterministic lock step.
     * @returns time step in (ms)
     */
    getTimeStep() {
        return this._timeStep * 1000;
    }
    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     */
    _createImageBitmapFromSource(imageSource, options) {
        throw new Error("createImageBitmapFromSource is not implemented");
    }
    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    createImageBitmap(image, options) {
        return createImageBitmap(image, options);
    }
    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     */
    resizeImageBitmap(image, bufferWidth, bufferHeight) {
        throw new Error("resizeImageBitmap is not implemented");
    }
    /**
     * Get Font size information
     * @param font font name
     */
    getFontOffset(font) {
        throw new Error("getFontOffset is not implemented");
    }
    static _CreateCanvas(width, height) {
        if (typeof document === "undefined") {
            return new OffscreenCanvas(width, height);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    /**
     * Create a canvas. This method is overridden by other engines
     * @param width width
     * @param height height
     * @returns ICanvas interface
     */
    createCanvas(width, height) {
        return AbstractEngine._CreateCanvas(width, height);
    }
    /**
     * Loads an image as an HTMLImageElement.
     * @param input url string, ArrayBuffer, or Blob to load
     * @param onLoad callback called when the image successfully loads
     * @param onError callback called when the image fails to load
     * @param offlineProvider offline provider for caching
     * @param mimeType optional mime type
     * @param imageBitmapOptions optional the options to use when creating an ImageBitmap
     * @returns the HTMLImageElement of the loaded image
     * @internal
     */
    static _FileToolsLoadImage(input, onLoad, onError, offlineProvider, mimeType, imageBitmapOptions) {
        throw _WarnImport("FileTools");
    }
    /**
     * @internal
     */
    _loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError) {
        const request = _loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add(() => {
            const index = this._activeRequests.indexOf(request);
            if (index !== -1) {
                this._activeRequests.splice(index, 1);
            }
        });
        return request;
    }
    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     * @internal
     */
    static _FileToolsLoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError) {
        if (EngineFunctionContext.loadFile) {
            return EngineFunctionContext.loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        }
        throw _WarnImport("FileTools");
    }
    /**
     * Dispose and release all associated resources
     */
    dispose() {
        this.releaseEffects();
        this._isDisposed = true;
        this.stopRenderLoop();
        // Empty texture
        if (this._emptyTexture) {
            this._releaseTexture(this._emptyTexture);
            this._emptyTexture = null;
        }
        if (this._emptyCubeTexture) {
            this._releaseTexture(this._emptyCubeTexture);
            this._emptyCubeTexture = null;
        }
        this._renderingCanvas = null;
        // Clear observables
        if (this.onBeforeTextureInitObservable) {
            this.onBeforeTextureInitObservable.clear();
        }
        // Release postProcesses
        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }
        // Release scenes
        while (this.scenes.length) {
            this.scenes[0].dispose();
        }
        while (this._virtualScenes.length) {
            this._virtualScenes[0].dispose();
        }
        // Release effects
        this.releaseComputeEffects?.();
        Effect.ResetCache();
        // Abort active requests
        for (const request of this._activeRequests) {
            request.abort();
        }
        this._boundRenderFunction = null;
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this.onResizeObservable.clear();
        this.onCanvasBlurObservable.clear();
        this.onCanvasFocusObservable.clear();
        this.onCanvasPointerOutObservable.clear();
        this.onNewSceneAddedObservable.clear();
        this.onEffectErrorObservable.clear();
        if (IsWindowObjectExist()) {
            window.removeEventListener("resize", this._checkForMobile);
        }
        // Remove from Instances
        const index = EngineStore.Instances.indexOf(this);
        if (index >= 0) {
            EngineStore.Instances.splice(index, 1);
        }
        // no more engines left in the engine store? Notify!
        if (!EngineStore.Instances.length) {
            EngineStore.OnEnginesDisposedObservable.notifyObservers(this);
            EngineStore.OnEnginesDisposedObservable.clear();
        }
        // Observables
        this.onBeginFrameObservable.clear();
        this.onEndFrameObservable.clear();
    }
    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static DefaultLoadingScreenFactory(canvas) {
        throw _WarnImport("LoadingScreen");
    }
    /**
     * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
     * @param flag defines which part of the materials must be marked as dirty
     * @param predicate defines a predicate used to filter which materials should be affected
     */
    static MarkAllMaterialsAsDirty(flag, predicate) {
        for (let engineIndex = 0; engineIndex < EngineStore.Instances.length; engineIndex++) {
            const engine = EngineStore.Instances[engineIndex];
            for (let sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
            }
        }
    }
}
// eslint-disable-next-line @typescript-eslint/naming-convention
/** @internal */
AbstractEngine._RenderPassIdCounter = 0;
/**
 * Method called to create the default rescale post process on each engine.
 */
AbstractEngine._RescalePostProcessFactory = null;
// Updatable statics so stick with vars here
/**
 * Gets or sets the epsilon value used by collision engine
 */
AbstractEngine.CollisionsEpsilon = 0.001;
/**
 * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
 * @param func - the function to be called
 * @param requester - the object that will request the next frame. Falls back to window.
 * @returns frame number
 */
AbstractEngine.QueueNewFrame = QueueNewFrame;
//# sourceMappingURL=abstractEngine.js.map