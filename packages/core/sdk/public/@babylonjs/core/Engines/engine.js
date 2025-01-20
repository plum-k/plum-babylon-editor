import { InternalTexture } from "../Materials/Textures/internalTexture.js";
import { EngineStore } from "./engineStore.js";
import { ThinEngine } from "./thinEngine.js";

import { PerformanceMonitor } from "../Misc/performanceMonitor.js";
import { WebGLDataBuffer } from "../Meshes/WebGL/webGLDataBuffer.js";
import { Logger } from "../Misc/logger.js";
import { WebGLHardwareTexture } from "./WebGL/webGLHardwareTexture.js";
import "./Extensions/engine.alpha.js";
import "./Extensions/engine.rawTexture.js";
import "./Extensions/engine.readTexture.js";
import "./Extensions/engine.dynamicBuffer.js";
import "./Extensions/engine.cubeTexture.js";
import "./Extensions/engine.renderTarget.js";
import "./Extensions/engine.renderTargetTexture.js";
import "./Extensions/engine.renderTargetCube.js";
import "./Extensions/engine.prefilteredCubeTexture.js";
import "./Extensions/engine.uniformBuffer.js";
import "./AbstractEngine/abstractEngine.loadingScreen.js";
import "./AbstractEngine/abstractEngine.dom.js";
import "./AbstractEngine/abstractEngine.states.js";
import "./AbstractEngine/abstractEngine.renderPass.js";
import "./AbstractEngine/abstractEngine.texture.js";
import { AbstractEngine } from "./abstractEngine.js";
import { CreateImageBitmapFromSource, ExitFullscreen, ExitPointerlock, GetFontOffset, RequestFullscreen, RequestPointerlock, ResizeImageBitmap, _CommonDispose, _CommonInit, } from "./engine.common.js";
import { PerfCounter } from "../Misc/perfCounter.js";
import "../Audio/audioEngine.js";
import { _retryWithInterval } from "../Misc/timingTools.js";
/**
 * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio
 */
export class Engine extends ThinEngine {
    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    static get NpmPackage() {
        return AbstractEngine.NpmPackage;
    }
    /**
     * Returns the current version of the framework
     */
    static get Version() {
        return AbstractEngine.Version;
    }
    /** Gets the list of created engines */
    static get Instances() {
        return EngineStore.Instances;
    }
    /**
     * Gets the latest created engine
     */
    static get LastCreatedEngine() {
        return EngineStore.LastCreatedEngine;
    }
    /**
     * Gets the latest created scene
     */
    static get LastCreatedScene() {
        return EngineStore.LastCreatedScene;
    }
    /** @internal */
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static DefaultLoadingScreenFactory(canvas) {
        return AbstractEngine.DefaultLoadingScreenFactory(canvas);
    }
    get _supportsHardwareTextureRescaling() {
        return !!Engine._RescalePostProcessFactory;
    }
    _measureFps() {
        this._performanceMonitor.sampleFrame();
        this._fps = this._performanceMonitor.averageFPS;
        this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
    }
    /**
     * Gets the performance monitor attached to this engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
     */
    get performanceMonitor() {
        return this._performanceMonitor;
    }
    // Events
    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which already used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(canvasOrContext, antialias, options, adaptToDeviceRatio = false) {
        super(canvasOrContext, antialias, options, adaptToDeviceRatio);
        // Members
        /**
         * If set, will be used to request the next animation frame for the render loop
         */
        this.customAnimationFrameRequester = null;
        this._performanceMonitor = new PerformanceMonitor();
        this._drawCalls = new PerfCounter();
        if (!canvasOrContext) {
            return;
        }
        this._features.supportRenderPasses = true;
        options = this._creationOptions;
    }
    _initGLContext() {
        super._initGLContext();
        this._rescalePostProcess = null;
    }
    /**
     * Shared initialization across engines types.
     * @param canvas The canvas associated with this instance of the engine.
     */
    _sharedInit(canvas) {
        super._sharedInit(canvas);
        _CommonInit(this, canvas, this._creationOptions);
    }
    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    resizeImageBitmap(image, bufferWidth, bufferHeight) {
        return ResizeImageBitmap(this, image, bufferWidth, bufferHeight);
    }
    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    _createImageBitmapFromSource(imageSource, options) {
        return CreateImageBitmapFromSource(this, imageSource, options);
    }
    /**
     * Toggle full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    switchFullscreen(requestPointerLock) {
        if (this.isFullscreen) {
            this.exitFullscreen();
        }
        else {
            this.enterFullscreen(requestPointerLock);
        }
    }
    /**
     * Enters full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    enterFullscreen(requestPointerLock) {
        if (!this.isFullscreen) {
            this._pointerLockRequested = requestPointerLock;
            if (this._renderingCanvas) {
                RequestFullscreen(this._renderingCanvas);
            }
        }
    }
    /**
     * Exits full screen mode
     */
    exitFullscreen() {
        if (this.isFullscreen) {
            ExitFullscreen();
        }
    }
    /** States */
    /**
     * Sets a boolean indicating if the dithering state is enabled or disabled
     * @param value defines the dithering state
     */
    setDitheringState(value) {
        if (value) {
            this._gl.enable(this._gl.DITHER);
        }
        else {
            this._gl.disable(this._gl.DITHER);
        }
    }
    /**
     * Sets a boolean indicating if the rasterizer state is enabled or disabled
     * @param value defines the rasterizer state
     */
    setRasterizerState(value) {
        if (value) {
            this._gl.disable(this._gl.RASTERIZER_DISCARD);
        }
        else {
            this._gl.enable(this._gl.RASTERIZER_DISCARD);
        }
    }
    /**
     * Directly set the WebGL Viewport
     * @param x defines the x coordinate of the viewport (in screen space)
     * @param y defines the y coordinate of the viewport (in screen space)
     * @param width defines the width of the viewport (in screen space)
     * @param height defines the height of the viewport (in screen space)
     * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
     */
    setDirectViewport(x, y, width, height) {
        const currentViewport = this._cachedViewport;
        this._cachedViewport = null;
        this._viewport(x, y, width, height);
        return currentViewport;
    }
    /**
     * Executes a scissor clear (ie. a clear on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     * @param clearColor defines the clear color
     */
    scissorClear(x, y, width, height, clearColor) {
        this.enableScissor(x, y, width, height);
        this.clear(clearColor, true, true, true);
        this.disableScissor();
    }
    /**
     * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     */
    enableScissor(x, y, width, height) {
        const gl = this._gl;
        // Change state
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, width, height);
    }
    /**
     * Disable previously set scissor test rectangle
     */
    disableScissor() {
        const gl = this._gl;
        gl.disable(gl.SCISSOR_TEST);
    }
    /**
     * @internal
     */
    _loadFileAsync(url, offlineProvider, useArrayBuffer) {
        return new Promise((resolve, reject) => {
            this._loadFile(url, (data) => {
                resolve(data);
            }, undefined, offlineProvider, useArrayBuffer, (request, exception) => {
                reject(exception);
            });
        });
    }
    /**
     * Gets the source code of the vertex shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the vertex shader associated with the program
     */
    getVertexShaderSource(program) {
        const shaders = this._gl.getAttachedShaders(program);
        if (!shaders) {
            return null;
        }
        return this._gl.getShaderSource(shaders[0]);
    }
    /**
     * Gets the source code of the fragment shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the fragment shader associated with the program
     */
    getFragmentShaderSource(program) {
        const shaders = this._gl.getAttachedShaders(program);
        if (!shaders) {
            return null;
        }
        return this._gl.getShaderSource(shaders[1]);
    }
    /**
     * sets the object from which width and height will be taken from when getting render width and height
     * Will fallback to the gl object
     * @param dimensions the framebuffer width and height that will be used.
     */
    set framebufferDimensionsObject(dimensions) {
        this._framebufferDimensionsObject = dimensions;
        if (this._framebufferDimensionsObject) {
            this.onResizeObservable.notifyObservers(this);
        }
    }
    _rebuildBuffers() {
        // Index / Vertex
        for (const scene of this.scenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
        }
        for (const scene of this._virtualScenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
        }
        super._rebuildBuffers();
    }
    /**
     * Get Font size information
     * @param font font name
     * @returns an object containing ascent, height and descent
     */
    getFontOffset(font) {
        return GetFontOffset(font);
    }
    _cancelFrame() {
        if (this.customAnimationFrameRequester) {
            if (this._frameHandler !== 0) {
                this._frameHandler = 0;
                const { cancelAnimationFrame } = this.customAnimationFrameRequester;
                if (cancelAnimationFrame) {
                    cancelAnimationFrame(this.customAnimationFrameRequester.requestID);
                }
            }
        }
        else {
            super._cancelFrame();
        }
    }
    _renderLoop() {
        // Reset the frame handler before rendering a frame to determine if a new frame has been queued.
        this._frameHandler = 0;
        if (!this._contextWasLost) {
            let shouldRender = true;
            if (this.isDisposed || (!this.renderEvenInBackground && this._windowIsBackground)) {
                shouldRender = false;
            }
            if (shouldRender) {
                // Start new frame
                this.beginFrame();
                // Child canvases
                if (!this._renderViews()) {
                    // Main frame
                    this._renderFrame();
                }
                // Present
                this.endFrame();
            }
        }
        // The first condition prevents queuing another frame if we no longer have active render loops (e.g., if
        // `stopRenderLoop` is called mid frame). The second condition prevents queuing another frame if one has
        // already been queued (e.g., if `stopRenderLoop` and `runRenderLoop` is called mid frame).
        if (this._activeRenderLoops.length > 0 && this._frameHandler === 0) {
            if (this.customAnimationFrameRequester) {
                this.customAnimationFrameRequester.requestID = this._queueNewFrame(this.customAnimationFrameRequester.renderFunction || this._boundRenderFunction, this.customAnimationFrameRequester);
                this._frameHandler = this.customAnimationFrameRequester.requestID;
            }
            else {
                this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
            }
        }
    }
    /**
     * Enters Pointerlock mode
     */
    enterPointerlock() {
        if (this._renderingCanvas) {
            RequestPointerlock(this._renderingCanvas);
        }
    }
    /**
     * Exits Pointerlock mode
     */
    exitPointerlock() {
        ExitPointerlock();
    }
    /**
     * Begin a new frame
     */
    beginFrame() {
        this._measureFps();
        super.beginFrame();
    }
    _deletePipelineContext(pipelineContext) {
        const webGLPipelineContext = pipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            if (webGLPipelineContext.transformFeedback) {
                this.deleteTransformFeedback(webGLPipelineContext.transformFeedback);
                webGLPipelineContext.transformFeedback = null;
            }
        }
        super._deletePipelineContext(pipelineContext);
    }
    createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings = null) {
        context = context || this._gl;
        this.onBeforeShaderCompilationObservable.notifyObservers(this);
        const program = super.createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
        this.onAfterShaderCompilationObservable.notifyObservers(this);
        return program;
    }
    _createShaderProgram(pipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings = null) {
        const shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;
        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }
        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);
        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            const transformFeedback = this.createTransformFeedback();
            this.bindTransformFeedback(transformFeedback);
            this.setTranformFeedbackVaryings(shaderProgram, transformFeedbackVaryings);
            pipelineContext.transformFeedback = transformFeedback;
        }
        context.linkProgram(shaderProgram);
        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            this.bindTransformFeedback(null);
        }
        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;
        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }
        return shaderProgram;
    }
    /**
     * @internal
     */
    _releaseTexture(texture) {
        super._releaseTexture(texture);
    }
    /**
     * @internal
     */
    _releaseRenderTargetWrapper(rtWrapper) {
        super._releaseRenderTargetWrapper(rtWrapper);
        // Set output texture of post process to null if the framebuffer has been released/disposed
        this.scenes.forEach((scene) => {
            scene.postProcesses.forEach((postProcess) => {
                if (postProcess._outputTexture === rtWrapper) {
                    postProcess._outputTexture = null;
                }
            });
            scene.cameras.forEach((camera) => {
                camera._postProcesses.forEach((postProcess) => {
                    if (postProcess) {
                        if (postProcess._outputTexture === rtWrapper) {
                            postProcess._outputTexture = null;
                        }
                    }
                });
            });
        });
    }
    /**
     * @internal
     * Rescales a texture
     * @param source input texture
     * @param destination destination texture
     * @param scene scene to use to render the resize
     * @param internalFormat format to use when resizing
     * @param onComplete callback to be called when resize has completed
     */
    _rescaleTexture(source, destination, scene, internalFormat, onComplete) {
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        const rtt = this.createRenderTargetTexture({
            width: destination.width,
            height: destination.height,
        }, {
            generateMipMaps: false,
            type: 0,
            samplingMode: 2,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
        });
        if (!this._rescalePostProcess && Engine._RescalePostProcessFactory) {
            this._rescalePostProcess = Engine._RescalePostProcessFactory(this);
        }
        if (this._rescalePostProcess) {
            this._rescalePostProcess.externalTextureSamplerBinding = true;
            const onCompiled = () => {
                this._rescalePostProcess.onApply = function (effect) {
                    effect._bindTexture("textureSampler", source);
                };
                let hostingScene = scene;
                if (!hostingScene) {
                    hostingScene = this.scenes[this.scenes.length - 1];
                }
                hostingScene.postProcessManager.directRender([this._rescalePostProcess], rtt, true);
                this._bindTextureDirectly(this._gl.TEXTURE_2D, destination, true);
                this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);
                this.unBindFramebuffer(rtt);
                rtt.dispose();
                if (onComplete) {
                    onComplete();
                }
            };
            const effect = this._rescalePostProcess.getEffect();
            if (effect) {
                effect.executeWhenCompiled(onCompiled);
            }
            else {
                this._rescalePostProcess.onEffectCreatedObservable.addOnce((effect) => {
                    effect.executeWhenCompiled(onCompiled);
                });
            }
        }
    }
    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @param texture defines the external texture
     * @param hasMipMaps defines whether the external texture has mip maps (default: false)
     * @param samplingMode defines the sampling mode for the external texture (default: 3)
     * @param width defines the width for the external texture (default: 0)
     * @param height defines the height for the external texture (default: 0)
     * @returns the babylon internal texture
     */
    wrapWebGLTexture(texture, hasMipMaps = false, samplingMode = 3, width = 0, height = 0) {
        const hardwareTexture = new WebGLHardwareTexture(texture, this._gl);
        const internalTexture = new InternalTexture(this, 0 /* InternalTextureSource.Unknown */, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.baseWidth = width;
        internalTexture.baseHeight = height;
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture.isReady = true;
        internalTexture.useMipMaps = hasMipMaps;
        this.updateTextureSamplingMode(samplingMode, internalTexture);
        return internalTexture;
    }
    /**
     * @internal
     */
    _uploadImageToTexture(texture, image, faceIndex = 0, lod = 0) {
        const gl = this._gl;
        const textureType = this._getWebGLTextureType(texture.type);
        const format = this._getInternalFormat(texture.format);
        const internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, format);
        const bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
        this._bindTextureDirectly(bindTarget, texture, true);
        this._unpackFlipY(texture.invertY);
        let target = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }
        gl.texImage2D(target, lod, internalFormat, format, textureType, image);
        this._bindTextureDirectly(bindTarget, null, true);
    }
    /**
     * Updates a depth texture Comparison Mode and Function.
     * If the comparison Function is equal to 0, the mode will be set to none.
     * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
     * @param texture The texture to set the comparison function for
     * @param comparisonFunction The comparison function to set, 0 if no comparison required
     */
    updateTextureComparisonFunction(texture, comparisonFunction) {
        if (this.webGLVersion === 1) {
            Logger.Error("WebGL 1 does not support texture comparison.");
            return;
        }
        const gl = this._gl;
        if (texture.isCube) {
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);
            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, 515);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            }
            else {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
        }
        else {
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);
            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, 515);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
        }
        texture._comparisonFunction = comparisonFunction;
    }
    /**
     * Creates a webGL buffer to use with instantiation
     * @param capacity defines the size of the buffer
     * @returns the webGL buffer
     */
    createInstancesBuffer(capacity) {
        const buffer = this._gl.createBuffer();
        if (!buffer) {
            throw new Error("Unable to create instance buffer");
        }
        const result = new WebGLDataBuffer(buffer);
        result.capacity = capacity;
        this.bindArrayBuffer(result);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
        result.references = 1;
        return result;
    }
    /**
     * Delete a webGL buffer used with instantiation
     * @param buffer defines the webGL buffer to delete
     */
    deleteInstancesBuffer(buffer) {
        this._gl.deleteBuffer(buffer);
    }
    _clientWaitAsync(sync, flags = 0, intervalms = 10) {
        const gl = this._gl;
        return new Promise((resolve, reject) => {
            _retryWithInterval(() => {
                const res = gl.clientWaitSync(sync, flags, 0);
                if (res == gl.WAIT_FAILED) {
                    throw new Error("clientWaitSync failed");
                }
                if (res == gl.TIMEOUT_EXPIRED) {
                    return false;
                }
                return true;
            }, resolve, reject, intervalms);
        });
    }
    /**
     * @internal
     */
    _readPixelsAsync(x, y, w, h, format, type, outputBuffer) {
        if (this._webGLVersion < 2) {
            throw new Error("_readPixelsAsync only work on WebGL2+");
        }
        const gl = this._gl;
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, outputBuffer.byteLength, gl.STREAM_READ);
        gl.readPixels(x, y, w, h, format, type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
            return null;
        }
        gl.flush();
        return this._clientWaitAsync(sync, 0, 10).then(() => {
            gl.deleteSync(sync);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
            gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, outputBuffer);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
            gl.deleteBuffer(buf);
            return outputBuffer;
        });
    }
    dispose() {
        this.hideLoadingUI();
        // Rescale PP
        if (this._rescalePostProcess) {
            this._rescalePostProcess.dispose();
        }
        _CommonDispose(this, this._renderingCanvas);
        super.dispose();
    }
}
// Const statics
/** Defines that alpha blending is disabled */
Engine.ALPHA_DISABLE = 0;
/** Defines that alpha blending to SRC ALPHA * SRC + DEST */
Engine.ALPHA_ADD = 1;
/** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
Engine.ALPHA_COMBINE = 2;
/** Defines that alpha blending to DEST - SRC * DEST */
Engine.ALPHA_SUBTRACT = 3;
/** Defines that alpha blending to SRC * DEST */
Engine.ALPHA_MULTIPLY = 4;
/** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC) * DEST */
Engine.ALPHA_MAXIMIZED = 5;
/** Defines that alpha blending to SRC + DEST */
Engine.ALPHA_ONEONE = 6;
/** Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST */
Engine.ALPHA_PREMULTIPLIED = 7;
/**
 * Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST
 * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
 */
Engine.ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
/** Defines that alpha blending to CST * SRC + (1 - CST) * DEST */
Engine.ALPHA_INTERPOLATE = 9;
/**
 * Defines that alpha blending to SRC + (1 - SRC) * DEST
 * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
 */
Engine.ALPHA_SCREENMODE = 10;
/** Defines that the resource is not delayed*/
Engine.DELAYLOADSTATE_NONE = 0;
/** Defines that the resource was successfully delay loaded */
Engine.DELAYLOADSTATE_LOADED = 1;
/** Defines that the resource is currently delay loading */
Engine.DELAYLOADSTATE_LOADING = 2;
/** Defines that the resource is delayed and has not started loading */
Engine.DELAYLOADSTATE_NOTLOADED = 4;
// Depht or Stencil test Constants.
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
Engine.NEVER = 512;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
Engine.ALWAYS = 519;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
Engine.LESS = 513;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
Engine.EQUAL = 514;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
Engine.LEQUAL = 515;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
Engine.GREATER = 516;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
Engine.GEQUAL = 518;
/** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
Engine.NOTEQUAL = 517;
// Stencil Actions Constants.
/** Passed to stencilOperation to specify that stencil value must be kept */
Engine.KEEP = 7680;
/** Passed to stencilOperation to specify that stencil value must be replaced */
Engine.REPLACE = 7681;
/** Passed to stencilOperation to specify that stencil value must be incremented */
Engine.INCR = 7682;
/** Passed to stencilOperation to specify that stencil value must be decremented */
Engine.DECR = 7683;
/** Passed to stencilOperation to specify that stencil value must be inverted */
Engine.INVERT = 5386;
/** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
Engine.INCR_WRAP = 34055;
/** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
Engine.DECR_WRAP = 34056;
/** Texture is not repeating outside of 0..1 UVs */
Engine.TEXTURE_CLAMP_ADDRESSMODE = 0;
/** Texture is repeating outside of 0..1 UVs */
Engine.TEXTURE_WRAP_ADDRESSMODE = 1;
/** Texture is repeating and mirrored */
Engine.TEXTURE_MIRROR_ADDRESSMODE = 2;
/** ALPHA */
Engine.TEXTUREFORMAT_ALPHA = 0;
/** LUMINANCE */
Engine.TEXTUREFORMAT_LUMINANCE = 1;
/** LUMINANCE_ALPHA */
Engine.TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
/** RGB */
Engine.TEXTUREFORMAT_RGB = 4;
/** RGBA */
Engine.TEXTUREFORMAT_RGBA = 5;
/** RED */
Engine.TEXTUREFORMAT_RED = 6;
/** RED (2nd reference) */
Engine.TEXTUREFORMAT_R = 6;
/** RED unsigned short normed to [0, 1] **/
Engine.TEXTUREFORMAT_R16_UNORM = 33322;
/** RG unsigned short normed to [0, 1] **/
Engine.TEXTUREFORMAT_RG16_UNORM = 33324;
/** RGB unsigned short normed to [0, 1] **/
Engine.TEXTUREFORMAT_RGB16_UNORM = 32852;
/** RGBA unsigned short normed to [0, 1] **/
Engine.TEXTUREFORMAT_RGBA16_UNORM = 32859;
/** RED signed short normed to [-1, 1] **/
Engine.TEXTUREFORMAT_R16_SNORM = 36760;
/** RG signed short normed to [-1, 1] **/
Engine.TEXTUREFORMAT_RG16_SNORM = 36761;
/** RGB signed short normed to [-1, 1] **/
Engine.TEXTUREFORMAT_RGB16_SNORM = 36762;
/** RGBA signed short normed to [-1, 1] **/
Engine.TEXTUREFORMAT_RGBA16_SNORM = 36763;
/** RG */
Engine.TEXTUREFORMAT_RG = 7;
/** RED_INTEGER */
Engine.TEXTUREFORMAT_RED_INTEGER = 8;
/** RED_INTEGER (2nd reference) */
Engine.TEXTUREFORMAT_R_INTEGER = 8;
/** RG_INTEGER */
Engine.TEXTUREFORMAT_RG_INTEGER = 9;
/** RGB_INTEGER */
Engine.TEXTUREFORMAT_RGB_INTEGER = 10;
/** RGBA_INTEGER */
Engine.TEXTUREFORMAT_RGBA_INTEGER = 11;
/** UNSIGNED_BYTE */
Engine.TEXTURETYPE_UNSIGNED_BYTE = 0;
/** @deprecated use more explicit TEXTURETYPE_UNSIGNED_BYTE instead. Use TEXTURETYPE_UNSIGNED_INTEGER for 32bits values.*/
Engine.TEXTURETYPE_UNSIGNED_INT = 0;
/** FLOAT */
Engine.TEXTURETYPE_FLOAT = 1;
/** HALF_FLOAT */
Engine.TEXTURETYPE_HALF_FLOAT = 2;
/** BYTE */
Engine.TEXTURETYPE_BYTE = 3;
/** SHORT */
Engine.TEXTURETYPE_SHORT = 4;
/** UNSIGNED_SHORT */
Engine.TEXTURETYPE_UNSIGNED_SHORT = 5;
/** INT */
Engine.TEXTURETYPE_INT = 6;
/** UNSIGNED_INT */
Engine.TEXTURETYPE_UNSIGNED_INTEGER = 7;
/** UNSIGNED_SHORT_4_4_4_4 */
Engine.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = 8;
/** UNSIGNED_SHORT_5_5_5_1 */
Engine.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = 9;
/** UNSIGNED_SHORT_5_6_5 */
Engine.TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = 10;
/** UNSIGNED_INT_2_10_10_10_REV */
Engine.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = 11;
/** UNSIGNED_INT_24_8 */
Engine.TEXTURETYPE_UNSIGNED_INT_24_8 = 12;
/** UNSIGNED_INT_10F_11F_11F_REV */
Engine.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = 13;
/** UNSIGNED_INT_5_9_9_9_REV */
Engine.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = 14;
/** FLOAT_32_UNSIGNED_INT_24_8_REV */
Engine.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;
/** nearest is mag = nearest and min = nearest and mip = none */
Engine.TEXTURE_NEAREST_SAMPLINGMODE = 1;
/** Bilinear is mag = linear and min = linear and mip = nearest */
Engine.TEXTURE_BILINEAR_SAMPLINGMODE = 2;
/** Trilinear is mag = linear and min = linear and mip = linear */
Engine.TEXTURE_TRILINEAR_SAMPLINGMODE = 3;
/** nearest is mag = nearest and min = nearest and mip = linear */
Engine.TEXTURE_NEAREST_NEAREST_MIPLINEAR = 8;
/** Bilinear is mag = linear and min = linear and mip = nearest */
Engine.TEXTURE_LINEAR_LINEAR_MIPNEAREST = 11;
/** Trilinear is mag = linear and min = linear and mip = linear */
Engine.TEXTURE_LINEAR_LINEAR_MIPLINEAR = 3;
/** mag = nearest and min = nearest and mip = nearest */
Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST = 4;
/** mag = nearest and min = linear and mip = nearest */
Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST = 5;
/** mag = nearest and min = linear and mip = linear */
Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR = 6;
/** mag = nearest and min = linear and mip = none */
Engine.TEXTURE_NEAREST_LINEAR = 7;
/** mag = nearest and min = nearest and mip = none */
Engine.TEXTURE_NEAREST_NEAREST = 1;
/** mag = linear and min = nearest and mip = nearest */
Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST = 9;
/** mag = linear and min = nearest and mip = linear */
Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR = 10;
/** mag = linear and min = linear and mip = none */
Engine.TEXTURE_LINEAR_LINEAR = 2;
/** mag = linear and min = nearest and mip = none */
Engine.TEXTURE_LINEAR_NEAREST = 12;
/** Explicit coordinates mode */
Engine.TEXTURE_EXPLICIT_MODE = 0;
/** Spherical coordinates mode */
Engine.TEXTURE_SPHERICAL_MODE = 1;
/** Planar coordinates mode */
Engine.TEXTURE_PLANAR_MODE = 2;
/** Cubic coordinates mode */
Engine.TEXTURE_CUBIC_MODE = 3;
/** Projection coordinates mode */
Engine.TEXTURE_PROJECTION_MODE = 4;
/** Skybox coordinates mode */
Engine.TEXTURE_SKYBOX_MODE = 5;
/** Inverse Cubic coordinates mode */
Engine.TEXTURE_INVCUBIC_MODE = 6;
/** Equirectangular coordinates mode */
Engine.TEXTURE_EQUIRECTANGULAR_MODE = 7;
/** Equirectangular Fixed coordinates mode */
Engine.TEXTURE_FIXED_EQUIRECTANGULAR_MODE = 8;
/** Equirectangular Fixed Mirrored coordinates mode */
Engine.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;
// Texture rescaling mode
/** Defines that texture rescaling will use a floor to find the closer power of 2 size */
Engine.SCALEMODE_FLOOR = 1;
/** Defines that texture rescaling will look for the nearest power of 2 size */
Engine.SCALEMODE_NEAREST = 2;
/** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
Engine.SCALEMODE_CEILING = 3;
//# sourceMappingURL=engine.js.map