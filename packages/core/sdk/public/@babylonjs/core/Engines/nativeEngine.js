import { Engine } from "../Engines/engine.js";
import { InternalTexture } from "../Materials/Textures/internalTexture.js";
import { Texture } from "../Materials/Textures/texture.js";
import { DataBuffer } from "../Buffers/dataBuffer.js";
import { Tools } from "../Misc/tools.js";
import { Observable } from "../Misc/observable.js";
import { CreateImageDataArrayBufferViews, GetEnvInfo, UploadEnvSpherical } from "../Misc/environmentTextureTools.js";
import { Logger } from "../Misc/logger.js";

import { ThinEngine } from "./thinEngine.js";
import { EngineStore } from "./engineStore.js";
import { ShaderCodeInliner } from "./Processors/shaderCodeInliner.js";
import { NativeShaderProcessor } from "./Native/nativeShaderProcessors.js";
import { NativeDataStream } from "./Native/nativeDataStream.js";
import { NativePipelineContext } from "./Native/nativePipelineContext.js";
import { NativeRenderTargetWrapper } from "./Native/nativeRenderTargetWrapper.js";
import { NativeHardwareTexture } from "./Native/nativeHardwareTexture.js";
import { getNativeAlphaMode, getNativeAttribType, getNativeSamplingMode, getNativeTextureFormat, getNativeStencilDepthFail, getNativeStencilDepthPass, getNativeStencilFunc, getNativeStencilOpFail, getNativeAddressMode, } from "./Native/nativeHelpers.js";
import { checkNonFloatVertexBuffers } from "../Buffers/buffer.nonFloatVertexBuffers.js";
import { NativeShaderProcessingContext } from "./Native/nativeShaderProcessingContext.js";
import "../Buffers/buffer.align.js";
import { _GetCompatibleTextureLoader } from "../Materials/Textures/Loaders/textureLoaderManager.js";
const onNativeObjectInitialized = new Observable();
if (typeof self !== "undefined" && !Object.prototype.hasOwnProperty.call(self, "_native")) {
    let __native;
    Object.defineProperty(self, "_native", {
        get: () => __native,
        set: (value) => {
            __native = value;
            if (__native) {
                onNativeObjectInitialized.notifyObservers(__native);
            }
        },
    });
}
/**
 * Returns _native only after it has been defined by BabylonNative.
 * @internal
 */
export function AcquireNativeObjectAsync() {
    return new Promise((resolve) => {
        if (typeof _native === "undefined") {
            onNativeObjectInitialized.addOnce((nativeObject) => resolve(nativeObject));
        }
        else {
            resolve(_native);
        }
    });
}
/**
 * Registers a constructor on the _native object. See NativeXRFrame for an example.
 * @internal
 */
export async function RegisterNativeTypeAsync(typeName, constructor) {
    (await AcquireNativeObjectAsync())[typeName] = constructor;
}
/**
 * Container for accessors for natively-stored mesh data buffers.
 */
class NativeDataBuffer extends DataBuffer {
}
/** @internal */
class CommandBufferEncoder {
    constructor(_engine) {
        this._engine = _engine;
        this._pending = new Array();
        this._isCommandBufferScopeActive = false;
        this._commandStream = NativeEngine._createNativeDataStream();
        this._engine.setCommandDataStream(this._commandStream);
    }
    beginCommandScope() {
        if (this._isCommandBufferScopeActive) {
            throw new Error("Command scope already active.");
        }
        this._isCommandBufferScopeActive = true;
    }
    endCommandScope() {
        if (!this._isCommandBufferScopeActive) {
            throw new Error("Command scope is not active.");
        }
        this._isCommandBufferScopeActive = false;
        this._submit();
    }
    startEncodingCommand(command) {
        this._commandStream.writeNativeData(command);
    }
    encodeCommandArgAsUInt32(commandArg) {
        this._commandStream.writeUint32(commandArg);
    }
    encodeCommandArgAsUInt32s(commandArg) {
        this._commandStream.writeUint32Array(commandArg);
    }
    encodeCommandArgAsInt32(commandArg) {
        this._commandStream.writeInt32(commandArg);
    }
    encodeCommandArgAsInt32s(commandArg) {
        this._commandStream.writeInt32Array(commandArg);
    }
    encodeCommandArgAsFloat32(commandArg) {
        this._commandStream.writeFloat32(commandArg);
    }
    encodeCommandArgAsFloat32s(commandArg) {
        this._commandStream.writeFloat32Array(commandArg);
    }
    encodeCommandArgAsNativeData(commandArg) {
        this._commandStream.writeNativeData(commandArg);
        this._pending.push(commandArg);
    }
    finishEncodingCommand() {
        if (!this._isCommandBufferScopeActive) {
            this._submit();
        }
    }
    _submit() {
        this._engine.submitCommands();
        this._pending.length = 0;
    }
}
const remappedAttributesNames = [];
/** @internal */
export class NativeEngine extends Engine {
    setHardwareScalingLevel(level) {
        super.setHardwareScalingLevel(level);
        this._engine.setHardwareScalingLevel(level);
    }
    constructor(options = {}) {
        super(null, false, undefined, options.adaptToDeviceRatio);
        this._engine = new _native.Engine({
            version: Engine.Version,
            nonFloatVertexBuffers: true,
        });
        this._camera = _native.Camera ? new _native.Camera() : null;
        this._commandBufferEncoder = new CommandBufferEncoder(this._engine);
        this._boundBuffersVertexArray = null;
        this._currentDepthTest = _native.Engine.DEPTH_TEST_LEQUAL;
        this._stencilTest = false;
        this._stencilMask = 255;
        this._stencilFunc = 519;
        this._stencilFuncRef = 0;
        this._stencilFuncMask = 255;
        this._stencilOpStencilFail = 7680;
        this._stencilOpDepthFail = 7680;
        this._stencilOpStencilDepthPass = 7681;
        this._zOffset = 0;
        this._zOffsetUnits = 0;
        this._depthWrite = true;
        // warning for non supported fill mode has already been displayed
        this._fillModeWarningDisplayed = false;
        if (_native.Engine.PROTOCOL_VERSION !== NativeEngine.PROTOCOL_VERSION) {
            throw new Error(`Protocol version mismatch: ${_native.Engine.PROTOCOL_VERSION} (Native) !== ${NativeEngine.PROTOCOL_VERSION} (JS)`);
        }
        if (this._engine.setDeviceLostCallback) {
            this._engine.setDeviceLostCallback(() => {
                this.onContextLostObservable.notifyObservers(this);
                this._contextWasLost = true;
                this._restoreEngineAfterContextLost();
            });
        }
        this._webGLVersion = 2;
        this.disableUniformBuffers = true;
        this._shaderPlatformName = "NATIVE";
        // TODO: Initialize this more correctly based on the hardware capabilities.
        // Init caps
        this._caps = {
            maxTexturesImageUnits: 16,
            maxVertexTextureImageUnits: 16,
            maxCombinedTexturesImageUnits: 32,
            maxTextureSize: _native.Engine.CAPS_LIMITS_MAX_TEXTURE_SIZE,
            maxCubemapTextureSize: 512,
            maxRenderTextureSize: 512,
            maxVertexAttribs: 16,
            maxVaryingVectors: 16,
            maxDrawBuffers: 8,
            maxFragmentUniformVectors: 16,
            maxVertexUniformVectors: 16,
            standardDerivatives: true,
            astc: null,
            pvrtc: null,
            etc1: null,
            etc2: null,
            bptc: null,
            maxAnisotropy: 16, // TODO: Retrieve this smartly. Currently set to D3D11 maximum allowable value.
            uintIndices: true,
            fragmentDepthSupported: false,
            highPrecisionShaderSupported: true,
            colorBufferFloat: false,
            supportFloatTexturesResolve: false,
            rg11b10ufColorRenderable: false,
            textureFloat: true,
            textureFloatLinearFiltering: true,
            textureFloatRender: true,
            textureHalfFloat: true,
            textureHalfFloatLinearFiltering: true,
            textureHalfFloatRender: true,
            textureLOD: true,
            texelFetch: false,
            drawBuffersExtension: false,
            depthTextureExtension: false,
            vertexArrayObject: true,
            instancedArrays: true,
            supportOcclusionQuery: false,
            canUseTimestampForTimerQuery: false,
            blendMinMax: false,
            maxMSAASamples: 16,
            canUseGLInstanceID: true,
            canUseGLVertexID: true,
            supportComputeShaders: false,
            supportSRGBBuffers: true,
            supportTransformFeedbacks: false,
            textureMaxLevel: false,
            texture2DArrayMaxLayerCount: _native.Engine.CAPS_LIMITS_MAX_TEXTURE_LAYERS,
            disableMorphTargetTexture: false,
            parallelShaderCompile: { COMPLETION_STATUS_KHR: 0 },
            textureNorm16: false,
        };
        this._features = {
            forceBitmapOverHTMLImageElement: true,
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
            supportMSAA: true,
            supportSSAO2: false,
            supportIBLShadows: false,
            supportExtendedTextureFormats: false,
            supportSwitchCaseInShader: false,
            supportSyncTextureRead: false,
            needsInvertingBitmap: true,
            useUBOBindingCache: true,
            needShaderCodeInlining: true,
            needToAlwaysBindUniformBuffers: false,
            supportRenderPasses: true,
            supportSpriteInstancing: false,
            forceVertexBufferStrideAndOffsetMultiple4Bytes: true,
            _checkNonFloatVertexBuffersDontRecreatePipelineContext: false,
            _collectUbosUpdatedInFrame: false,
        };
        Tools.Log("Babylon Native (v" + Engine.Version + ") launched");
        Tools.LoadScript = function (scriptUrl, onSuccess, onError, scriptId) {
            Tools.LoadFile(scriptUrl, (data) => {
                Function(data).apply(null);
                if (onSuccess) {
                    onSuccess();
                }
            }, undefined, undefined, false, (request, exception) => {
                if (onError) {
                    onError("LoadScript Error", exception);
                }
            });
        };
        // Wrappers
        if (typeof URL === "undefined") {
            window.URL = {
                createObjectURL: function () { },
                revokeObjectURL: function () { },
            };
        }
        if (typeof Blob === "undefined") {
            window.Blob = function (v) {
                return v;
            };
        }
        // polyfill for Chakra
        if (!Array.prototype.flat) {
            Object.defineProperty(Array.prototype, "flat", {
                configurable: true,
                value: function flat() {
                    const depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);
                    return depth
                        ? Array.prototype.reduce.call(this, function (acc, cur) {
                            if (Array.isArray(cur)) {
                                acc.push.apply(acc, flat.call(cur, depth - 1));
                            }
                            else {
                                acc.push(cur);
                            }
                            return acc;
                        }, [])
                        : Array.prototype.slice.call(this);
                },
                writable: true,
            });
        }
        // Currently we do not fully configure the ThinEngine on construction of NativeEngine.
        // Setup resolution scaling based on display settings.
        const devicePixelRatio = window ? window.devicePixelRatio || 1.0 : 1.0;
        this._hardwareScalingLevel = options.adaptToDeviceRatio ? 1.0 / devicePixelRatio : 1.0;
        this._engine.setHardwareScalingLevel(this._hardwareScalingLevel);
        this._lastDevicePixelRatio = devicePixelRatio;
        this.resize();
        const currentDepthFunction = this.getDepthFunction();
        if (currentDepthFunction) {
            this.setDepthFunction(currentDepthFunction);
        }
        // Shader processor
        this._shaderProcessor = new NativeShaderProcessor();
        this.onNewSceneAddedObservable.add((scene) => {
            const originalRender = scene.render;
            scene.render = (...args) => {
                this._commandBufferEncoder.beginCommandScope();
                originalRender.apply(scene, args);
                this._commandBufferEncoder.endCommandScope();
            };
        });
    }
    dispose() {
        super.dispose();
        if (this._boundBuffersVertexArray) {
            this._deleteVertexArray(this._boundBuffersVertexArray);
        }
        this._engine.dispose();
    }
    /** @internal */
    static _createNativeDataStream() {
        return new NativeDataStream();
    }
    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @internal
     */
    _queueNewFrame(bindedRenderFunction, requester) {
        // Use the provided requestAnimationFrame, unless the requester is the window. In that case, we will default to the Babylon Native version of requestAnimationFrame.
        if (requester.requestAnimationFrame && requester !== window) {
            requester.requestAnimationFrame(bindedRenderFunction);
        }
        else {
            this._engine.requestAnimationFrame(bindedRenderFunction);
        }
        return 0;
    }
    _restoreEngineAfterContextLost() {
        this._clearEmptyResources();
        const depthTest = this._depthCullingState.depthTest; // backup those values because the call to initEngine / wipeCaches will reset them
        const depthFunc = this._depthCullingState.depthFunc;
        const depthMask = this._depthCullingState.depthMask;
        const stencilTest = this._stencilState.stencilTest;
        this._rebuildGraphicsResources();
        this._depthCullingState.depthTest = depthTest;
        this._depthCullingState.depthFunc = depthFunc;
        this._depthCullingState.depthMask = depthMask;
        this._stencilState.stencilTest = stencilTest;
        this._flagContextRestored();
    }
    /**
     * Override default engine behavior.
     * @param framebuffer
     */
    _bindUnboundFramebuffer(framebuffer) {
        if (this._currentFramebuffer !== framebuffer) {
            if (this._currentFramebuffer) {
                this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_UNBINDFRAMEBUFFER);
                this._commandBufferEncoder.encodeCommandArgAsNativeData(this._currentFramebuffer);
                this._commandBufferEncoder.finishEncodingCommand();
            }
            if (framebuffer) {
                this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_BINDFRAMEBUFFER);
                this._commandBufferEncoder.encodeCommandArgAsNativeData(framebuffer);
                this._commandBufferEncoder.finishEncodingCommand();
            }
            this._currentFramebuffer = framebuffer;
        }
    }
    /**
     * Gets host document
     * @returns the host document object
     */
    getHostDocument() {
        return null;
    }
    clear(color, backBuffer, depth, stencil = false) {
        if (this.useReverseDepthBuffer) {
            throw new Error("reverse depth buffer is not currently implemented");
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_CLEAR);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(backBuffer && color ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.r : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.g : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.b : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.a : 1);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(depth ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(1);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(stencil ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(0);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    createIndexBuffer(indices, updateable, _label) {
        const data = this._normalizeIndexData(indices);
        const buffer = new NativeDataBuffer();
        buffer.references = 1;
        buffer.is32Bits = data.BYTES_PER_ELEMENT === 4;
        if (data.byteLength) {
            buffer.nativeIndexBuffer = this._engine.createIndexBuffer(data.buffer, data.byteOffset, data.byteLength, buffer.is32Bits, updateable ?? false);
        }
        return buffer;
    }
    createVertexBuffer(vertices, updateable, _label) {
        const data = ArrayBuffer.isView(vertices) ? vertices : new Float32Array(vertices);
        const buffer = new NativeDataBuffer();
        buffer.references = 1;
        if (data.byteLength) {
            buffer.nativeVertexBuffer = this._engine.createVertexBuffer(data.buffer, data.byteOffset, data.byteLength, updateable ?? false);
        }
        return buffer;
    }
    _recordVertexArrayObject(vertexArray, vertexBuffers, indexBuffer, effect, overrideVertexBuffers) {
        if (!effect._checkedNonFloatVertexBuffers) {
            checkNonFloatVertexBuffers(vertexBuffers, effect);
            effect._checkedNonFloatVertexBuffers = true;
        }
        if (indexBuffer) {
            this._engine.recordIndexBuffer(vertexArray, indexBuffer.nativeIndexBuffer);
        }
        const attributes = effect.getAttributesNames();
        for (let index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);
            if (location >= 0) {
                const kind = attributes[index];
                let vertexBuffer = null;
                if (overrideVertexBuffers) {
                    vertexBuffer = overrideVertexBuffers[kind];
                }
                if (!vertexBuffer) {
                    vertexBuffer = vertexBuffers[kind];
                }
                if (vertexBuffer) {
                    const buffer = vertexBuffer.effectiveBuffer;
                    if (buffer && buffer.nativeVertexBuffer) {
                        this._engine.recordVertexBuffer(vertexArray, buffer.nativeVertexBuffer, location, vertexBuffer.effectiveByteOffset, vertexBuffer.effectiveByteStride, vertexBuffer.getSize(), getNativeAttribType(vertexBuffer.type), vertexBuffer.normalized, vertexBuffer.getInstanceDivisor());
                    }
                }
            }
        }
    }
    bindBuffers(vertexBuffers, indexBuffer, effect) {
        if (this._boundBuffersVertexArray) {
            this._deleteVertexArray(this._boundBuffersVertexArray);
        }
        this._boundBuffersVertexArray = this._engine.createVertexArray();
        this._recordVertexArrayObject(this._boundBuffersVertexArray, vertexBuffers, indexBuffer, effect);
        this.bindVertexArrayObject(this._boundBuffersVertexArray);
    }
    recordVertexArrayObject(vertexBuffers, indexBuffer, effect, overrideVertexBuffers) {
        const vertexArray = this._engine.createVertexArray();
        this._recordVertexArrayObject(vertexArray, vertexBuffers, indexBuffer, effect, overrideVertexBuffers);
        return vertexArray;
    }
    _deleteVertexArray(vertexArray) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEVERTEXARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(vertexArray);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    bindVertexArrayObject(vertexArray) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_BINDVERTEXARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(vertexArray);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    releaseVertexArrayObject(vertexArray) {
        this._deleteVertexArray(vertexArray);
    }
    getAttributes(pipelineContext, attributesNames) {
        const nativePipelineContext = pipelineContext;
        const nativeShaderProcessingContext = nativePipelineContext.shaderProcessingContext;
        remappedAttributesNames.length = 0;
        for (let index = 0; index < attributesNames.length; index++) {
            const origAttributeName = attributesNames[index];
            const attributeName = nativeShaderProcessingContext.remappedAttributeNames[origAttributeName] ?? origAttributeName;
            remappedAttributesNames[index] = attributeName;
        }
        return this._engine.getAttributes(nativePipelineContext.program, remappedAttributesNames);
    }
    /**
     * Triangle Fan and Line Loop are not supported by modern rendering API
     * @param fillMode  defines the primitive to use
     * @returns true if supported
     */
    _checkSupportedFillMode(fillMode) {
        if (fillMode == 5 || fillMode == 8) {
            if (!this._fillModeWarningDisplayed) {
                Logger.Warn("Line Loop and Triangle Fan are not supported fill modes with Babylon Native. Elements with these fill mode will not be visible.");
                this._fillModeWarningDisplayed = true;
            }
            return false;
        }
        return true;
    }
    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    drawElementsType(fillMode, indexStart, indexCount, instancesCount) {
        if (!this._checkSupportedFillMode(fillMode)) {
            return;
        }
        // Apply states
        this._drawCalls.addCount(1, false);
        if (instancesCount && _native.Engine.COMMAND_DRAWINDEXEDINSTANCED) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWINDEXEDINSTANCED);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexCount);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(instancesCount);
        }
        else {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWINDEXED);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexCount);
        }
        this._commandBufferEncoder.finishEncodingCommand();
        // }
    }
    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    drawArraysType(fillMode, verticesStart, verticesCount, instancesCount) {
        if (!this._checkSupportedFillMode(fillMode)) {
            return;
        }
        // Apply states
        this._drawCalls.addCount(1, false);
        if (instancesCount && _native.Engine.COMMAND_DRAWINSTANCED) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWINSTANCED);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesCount);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(instancesCount);
        }
        else {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAW);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesCount);
        }
        this._commandBufferEncoder.finishEncodingCommand();
        // }
    }
    createPipelineContext(shaderProcessingContext) {
        const isAsync = !!(this._caps.parallelShaderCompile && this._engine.createProgramAsync);
        return new NativePipelineContext(this, isAsync, shaderProcessingContext);
    }
    createMaterialContext() {
        return undefined;
    }
    createDrawContext() {
        return undefined;
    }
    /**
     * @internal
     */
    _preparePipelineContext(pipelineContext, vertexSourceCode, fragmentSourceCode, createAsRaw, _rawVertexSourceCode, _rawFragmentSourceCode, _rebuildRebind, defines, _transformFeedbackVaryings, _key, onReady) {
        if (createAsRaw) {
            this.createRawShaderProgram();
        }
        else {
            this.createShaderProgram(pipelineContext, vertexSourceCode, fragmentSourceCode, defines);
        }
        onReady();
    }
    /**
     * @internal
     */
    _getShaderProcessingContext(_shaderLanguage) {
        return new NativeShaderProcessingContext();
    }
    /**
     * @internal
     */
    _executeWhenRenderingStateIsCompiled(pipelineContext, action) {
        const nativePipelineContext = pipelineContext;
        if (nativePipelineContext.isAsync) {
            if (nativePipelineContext.onCompiled) {
                const oldHandler = nativePipelineContext.onCompiled;
                nativePipelineContext.onCompiled = () => {
                    oldHandler();
                    action();
                };
            }
            else {
                nativePipelineContext.onCompiled = action;
            }
        }
        else {
            action();
        }
    }
    createRawShaderProgram() {
        throw new Error("Not Supported");
    }
    createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines) {
        const nativePipelineContext = pipelineContext;
        this.onBeforeShaderCompilationObservable.notifyObservers(this);
        const vertexInliner = new ShaderCodeInliner(vertexCode);
        vertexInliner.processCode();
        vertexCode = vertexInliner.code;
        const fragmentInliner = new ShaderCodeInliner(fragmentCode);
        fragmentInliner.processCode();
        fragmentCode = fragmentInliner.code;
        vertexCode = ThinEngine._ConcatenateShader(vertexCode, defines);
        fragmentCode = ThinEngine._ConcatenateShader(fragmentCode, defines);
        const onSuccess = () => {
            nativePipelineContext.isCompiled = true;
            nativePipelineContext.onCompiled?.();
            this.onAfterShaderCompilationObservable.notifyObservers(this);
        };
        if (pipelineContext.isAsync) {
            nativePipelineContext.program = this._engine.createProgramAsync(vertexCode, fragmentCode, onSuccess, (error) => {
                nativePipelineContext.compilationError = error;
            });
        }
        else {
            try {
                nativePipelineContext.program = this._engine.createProgram(vertexCode, fragmentCode);
                onSuccess();
            }
            catch (e) {
                const message = e?.message;
                throw new Error("SHADER ERROR" + (typeof message === "string" ? "\n" + message : ""));
            }
        }
        return nativePipelineContext.program;
    }
    /**
     * Inline functions in shader code that are marked to be inlined
     * @param code code to inline
     * @returns inlined code
     */
    inlineShaderCode(code) {
        const sci = new ShaderCodeInliner(code);
        sci.debug = false;
        sci.processCode();
        return sci.code;
    }
    _setProgram(program) {
        if (this._currentProgram !== program) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETPROGRAM);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(program);
            this._commandBufferEncoder.finishEncodingCommand();
            this._currentProgram = program;
        }
    }
    _deletePipelineContext(pipelineContext) {
        const nativePipelineContext = pipelineContext;
        if (nativePipelineContext && nativePipelineContext.program) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEPROGRAM);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(nativePipelineContext.program);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }
    getUniforms(pipelineContext, uniformsNames) {
        const nativePipelineContext = pipelineContext;
        return this._engine.getUniforms(nativePipelineContext.program, uniformsNames);
    }
    bindUniformBlock(pipelineContext, blockName, index) {
        // TODO
        throw new Error("Not Implemented");
    }
    bindSamplers(effect) {
        const nativePipelineContext = effect.getPipelineContext();
        this._setProgram(nativePipelineContext.program);
        // TODO: share this with engine?
        const samplers = effect.getSamplers();
        for (let index = 0; index < samplers.length; index++) {
            const uniform = effect.getUniform(samplers[index]);
            if (uniform) {
                this._boundUniforms[index] = uniform;
            }
        }
        this._currentEffect = null;
    }
    getRenderWidth(useScreen = false) {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }
        return this._engine.getRenderWidth();
    }
    getRenderHeight(useScreen = false) {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }
        return this._engine.getRenderHeight();
    }
    setViewport(viewport, requiredWidth, requiredHeight) {
        this._cachedViewport = viewport;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETVIEWPORT);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.width);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.height);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    enableScissor(x, y, width, height) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSCISSOR);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(width);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(height);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    disableScissor() {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSCISSOR);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    setState(culling, zOffset = 0, force, reverseSide = false, cullBackFaces, stencil, zOffsetUnits = 0) {
        this._zOffset = zOffset;
        this._zOffsetUnits = zOffsetUnits;
        if (this._zOffset !== 0) {
            Tools.Warn("zOffset is not supported in Native engine.");
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSTATE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(culling ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(zOffset);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(zOffsetUnits);
        this._commandBufferEncoder.encodeCommandArgAsUInt32((this.cullBackFaces ?? cullBackFaces ?? true) ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(reverseSide ? 1 : 0);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    /**
     * Gets the client rect of native canvas.  Needed for InputManager.
     * @returns a client rectangle
     */
    getInputElementClientRect() {
        const rect = {
            bottom: this.getRenderHeight(),
            height: this.getRenderHeight(),
            left: 0,
            right: this.getRenderWidth(),
            top: 0,
            width: this.getRenderWidth(),
            x: 0,
            y: 0,
            toJSON: () => { },
        };
        return rect;
    }
    /**
     * Set the z offset Factor to apply to current rendering
     * @param value defines the offset to apply
     */
    setZOffset(value) {
        if (value !== this._zOffset) {
            this._zOffset = value;
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETZOFFSET);
            this._commandBufferEncoder.encodeCommandArgAsFloat32(this.useReverseDepthBuffer ? -value : value);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }
    /**
     * Gets the current value of the zOffset Factor
     * @returns the current zOffset Factor state
     */
    getZOffset() {
        return this._zOffset;
    }
    /**
     * Set the z offset Units to apply to current rendering
     * @param value defines the offset to apply
     */
    setZOffsetUnits(value) {
        if (value !== this._zOffsetUnits) {
            this._zOffsetUnits = value;
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETZOFFSETUNITS);
            this._commandBufferEncoder.encodeCommandArgAsFloat32(this.useReverseDepthBuffer ? -value : value);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }
    /**
     * Gets the current value of the zOffset Units
     * @returns the current zOffset Units state
     */
    getZOffsetUnits() {
        return this._zOffsetUnits;
    }
    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    setDepthBuffer(enable) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETDEPTHTEST);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(enable ? this._currentDepthTest : _native.Engine.DEPTH_TEST_ALWAYS);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    getDepthWrite() {
        return this._depthWrite;
    }
    getDepthFunction() {
        switch (this._currentDepthTest) {
            case _native.Engine.DEPTH_TEST_NEVER:
                return 512;
            case _native.Engine.DEPTH_TEST_ALWAYS:
                return 519;
            case _native.Engine.DEPTH_TEST_GREATER:
                return 516;
            case _native.Engine.DEPTH_TEST_GEQUAL:
                return 518;
            case _native.Engine.DEPTH_TEST_NOTEQUAL:
                return 517;
            case _native.Engine.DEPTH_TEST_EQUAL:
                return 514;
            case _native.Engine.DEPTH_TEST_LESS:
                return 513;
            case _native.Engine.DEPTH_TEST_LEQUAL:
                return 515;
        }
        return null;
    }
    setDepthFunction(depthFunc) {
        let nativeDepthFunc = 0;
        switch (depthFunc) {
            case 512:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_NEVER;
                break;
            case 519:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_ALWAYS;
                break;
            case 516:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_GREATER;
                break;
            case 518:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_GEQUAL;
                break;
            case 517:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_NOTEQUAL;
                break;
            case 514:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_EQUAL;
                break;
            case 513:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_LESS;
                break;
            case 515:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_LEQUAL;
                break;
        }
        this._currentDepthTest = nativeDepthFunc;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETDEPTHTEST);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(this._currentDepthTest);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    setDepthWrite(enable) {
        this._depthWrite = enable;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETDEPTHWRITE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(Number(enable));
        this._commandBufferEncoder.finishEncodingCommand();
    }
    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    setColorWrite(enable) {
        this._colorWrite = enable;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETCOLORWRITE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(Number(enable));
        this._commandBufferEncoder.finishEncodingCommand();
    }
    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    getColorWrite() {
        return this._colorWrite;
    }
    applyStencil() {
        this._setStencil(this._stencilMask, getNativeStencilOpFail(this._stencilOpStencilFail), getNativeStencilDepthFail(this._stencilOpDepthFail), getNativeStencilDepthPass(this._stencilOpStencilDepthPass), getNativeStencilFunc(this._stencilFunc), this._stencilFuncRef);
    }
    _setStencil(mask, stencilOpFail, depthOpFail, depthOpPass, func, ref) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSTENCIL);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(mask);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(stencilOpFail);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(depthOpFail);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(depthOpPass);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(func);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(ref);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    /**
     * Enable or disable the stencil buffer
     * @param enable defines if the stencil buffer must be enabled or disabled
     */
    setStencilBuffer(enable) {
        this._stencilTest = enable;
        if (enable) {
            this.applyStencil();
        }
        else {
            this._setStencil(255, _native.Engine.STENCIL_OP_FAIL_S_KEEP, _native.Engine.STENCIL_OP_FAIL_Z_KEEP, _native.Engine.STENCIL_OP_PASS_Z_KEEP, _native.Engine.STENCIL_TEST_ALWAYS, 0);
        }
    }
    /**
     * Gets a boolean indicating if stencil buffer is enabled
     * @returns the current stencil buffer state
     */
    getStencilBuffer() {
        return this._stencilTest;
    }
    /**
     * Gets the current stencil operation when stencil passes
     * @returns a number defining stencil operation to use when stencil passes
     */
    getStencilOperationPass() {
        return this._stencilOpStencilDepthPass;
    }
    /**
     * Sets the stencil operation to use when stencil passes
     * @param operation defines the stencil operation to use when stencil passes
     */
    setStencilOperationPass(operation) {
        this._stencilOpStencilDepthPass = operation;
        this.applyStencil();
    }
    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    setStencilMask(mask) {
        this._stencilMask = mask;
        this.applyStencil();
    }
    /**
     * Sets the current stencil function
     * @param stencilFunc defines the new stencil function to use
     */
    setStencilFunction(stencilFunc) {
        this._stencilFunc = stencilFunc;
        this.applyStencil();
    }
    /**
     * Sets the current stencil reference
     * @param reference defines the new stencil reference to use
     */
    setStencilFunctionReference(reference) {
        this._stencilFuncRef = reference;
        this.applyStencil();
    }
    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    setStencilFunctionMask(mask) {
        this._stencilFuncMask = mask;
    }
    /**
     * Sets the stencil operation to use when stencil fails
     * @param operation defines the stencil operation to use when stencil fails
     */
    setStencilOperationFail(operation) {
        this._stencilOpStencilFail = operation;
        this.applyStencil();
    }
    /**
     * Sets the stencil operation to use when depth fails
     * @param operation defines the stencil operation to use when depth fails
     */
    setStencilOperationDepthFail(operation) {
        this._stencilOpDepthFail = operation;
        this.applyStencil();
    }
    /**
     * Gets the current stencil mask
     * @returns a number defining the new stencil mask to use
     */
    getStencilMask() {
        return this._stencilMask;
    }
    /**
     * Gets the current stencil function
     * @returns a number defining the stencil function to use
     */
    getStencilFunction() {
        return this._stencilFunc;
    }
    /**
     * Gets the current stencil reference value
     * @returns a number defining the stencil reference value to use
     */
    getStencilFunctionReference() {
        return this._stencilFuncRef;
    }
    /**
     * Gets the current stencil mask
     * @returns a number defining the stencil mask to use
     */
    getStencilFunctionMask() {
        return this._stencilFuncMask;
    }
    /**
     * Gets the current stencil operation when stencil fails
     * @returns a number defining stencil operation to use when stencil fails
     */
    getStencilOperationFail() {
        return this._stencilOpStencilFail;
    }
    /**
     * Gets the current stencil operation when depth fails
     * @returns a number defining stencil operation to use when depth fails
     */
    getStencilOperationDepthFail() {
        return this._stencilOpDepthFail;
    }
    /**
     * Sets alpha constants used by some alpha blending modes
     * @param r defines the red component
     * @param g defines the green component
     * @param b defines the blue component
     * @param a defines the alpha component
     */
    setAlphaConstants(r, g, b, a) {
        throw new Error("Setting alpha blend constant color not yet implemented.");
    }
    /**
     * Sets the current alpha mode
     * @param mode defines the mode to use (one of the BABYLON.undefined)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
     */
    setAlphaMode(mode, noDepthWriteChange = false) {
        if (this._alphaMode === mode) {
            return;
        }
        const nativeMode = getNativeAlphaMode(mode);
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETBLENDMODE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(nativeMode);
        this._commandBufferEncoder.finishEncodingCommand();
        if (!noDepthWriteChange) {
            this.setDepthWrite(mode === 0);
        }
        this._alphaMode = mode;
    }
    setInt(uniform, int) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINT);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsInt32(int);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setIntArray(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setIntArray2(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setIntArray3(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setIntArray4(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY4);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloatArray(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloatArray2(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloatArray3(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloatArray4(uniform, array) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY4);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setArray(uniform, array) {
        if (!uniform) {
            return false;
        }
        return this.setFloatArray(uniform, new Float32Array(array));
    }
    setArray2(uniform, array) {
        if (!uniform) {
            return false;
        }
        return this.setFloatArray2(uniform, new Float32Array(array));
    }
    setArray3(uniform, array) {
        if (!uniform) {
            return false;
        }
        return this.setFloatArray3(uniform, new Float32Array(array));
    }
    setArray4(uniform, array) {
        if (!uniform) {
            return false;
        }
        return this.setFloatArray4(uniform, new Float32Array(array));
    }
    setMatrices(uniform, matrices) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETMATRICES);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(matrices);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setMatrix3x3(uniform, matrix) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETMATRIX3X3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(matrix);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setMatrix2x2(uniform, matrix) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETMATRIX2X2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(matrix);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloat(uniform, value) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(value);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloat2(uniform, x, y) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloat3(uniform, x, y, z) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(z);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setFloat4(uniform, x, y, z, w) {
        if (!uniform) {
            return false;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT4);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(z);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(w);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }
    setColor3(uniform, color3) {
        if (!uniform) {
            return false;
        }
        this.setFloat3(uniform, color3.r, color3.g, color3.b);
        return true;
    }
    setColor4(uniform, color3, alpha) {
        if (!uniform) {
            return false;
        }
        this.setFloat4(uniform, color3.r, color3.g, color3.b, alpha);
        return true;
    }
    wipeCaches(bruteForce) {
        if (this.preventCacheWipeBetweenFrames) {
            return;
        }
        this.resetTextureCache();
        this._currentEffect = null;
        if (bruteForce) {
            this._currentProgram = null;
            this._stencilStateComposer.reset();
            this._depthCullingState.reset();
            this._alphaState.reset();
        }
        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }
    _createTexture() {
        return this._engine.createTexture();
    }
    _deleteTexture(texture) {
        if (texture) {
            this._engine.deleteTexture(texture.underlyingResource);
        }
    }
    /**
     * Update the content of a dynamic texture
     * @param texture defines the texture to update
     * @param canvas defines the canvas containing the source
     * @param invertY defines if data must be stored with Y axis inverted
     * @param premulAlpha defines if alpha is stored as premultiplied
     * @param format defines the format of the data
     */
    updateDynamicTexture(texture, canvas, invertY, premulAlpha = false, format) {
        if (premulAlpha === void 0) {
            premulAlpha = false;
        }
        if (!!texture && !!texture._hardwareTexture) {
            const source = canvas.getCanvasTexture();
            const destination = texture._hardwareTexture.underlyingResource;
            this._engine.copyTexture(destination, source);
            texture.isReady = true;
        }
    }
    createDynamicTexture(width, height, generateMipMaps, samplingMode) {
        // it's not possible to create 0x0 texture sized. Many bgfx methods assume texture size is at least 1x1(best case).
        // Worst case is getting a crash/assert.
        width = Math.max(width, 1);
        height = Math.max(height, 1);
        return this.createRawTexture(new Uint8Array(width * height * 4), width, height, 5, false, false, samplingMode);
    }
    createVideoElement(constraints) {
        // create native object depending on stream. Only NativeCamera is supported for now.
        if (this._camera) {
            return this._camera.createVideo(constraints);
        }
        return null;
    }
    updateVideoTexture(texture, video, invertY) {
        if (texture && texture._hardwareTexture && this._camera) {
            const webGLTexture = texture._hardwareTexture.underlyingResource;
            this._camera.updateVideoTexture(webGLTexture, video, invertY);
        }
    }
    createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode, compression = null, type = 0, creationFlags = 0, useSRGBBuffer = false) {
        const texture = new InternalTexture(this, 3 /* InternalTextureSource.Raw */);
        texture.format = format;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = texture.baseWidth;
        texture.height = texture.baseHeight;
        texture._compression = compression;
        texture.type = type;
        texture._useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, !generateMipMaps);
        this.updateRawTexture(texture, data, format, invertY, compression, type, texture._useSRGBBuffer);
        if (texture._hardwareTexture) {
            const webGLTexture = texture._hardwareTexture.underlyingResource;
            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(webGLTexture, filter);
        }
        this._internalTexturesCache.push(texture);
        return texture;
    }
    createRawTexture2DArray(data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression = null, textureType = 0) {
        const texture = new InternalTexture(this, 11 /* InternalTextureSource.Raw2DArray */);
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.is2DArray = true;
        if (texture._hardwareTexture) {
            const nativeTexture = texture._hardwareTexture.underlyingResource;
            this._engine.loadRawTexture2DArray(nativeTexture, data, width, height, depth, getNativeTextureFormat(format, textureType), generateMipMaps, invertY);
            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(nativeTexture, filter);
        }
        texture.isReady = true;
        this._internalTexturesCache.push(texture);
        return texture;
    }
    updateRawTexture(texture, bufferView, format, invertY, compression = null, type = 0, useSRGBBuffer = false) {
        if (!texture) {
            return;
        }
        if (bufferView && texture._hardwareTexture) {
            const underlyingResource = texture._hardwareTexture.underlyingResource;
            this._engine.loadRawTexture(underlyingResource, bufferView, texture.width, texture.height, getNativeTextureFormat(format, type), texture.generateMipMaps, texture.invertY);
        }
        texture.isReady = true;
    }
    // TODO: Refactor to share more logic with babylon.engine.ts version.
    /**
     * Usually called from Texture.ts.
     * Passed information to create a NativeTexture
     * @param url defines a value which contains one of the following:
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
     * @param loaderOptions options to be passed to the loader
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    createTexture(url, noMipmap, invertY, scene, samplingMode = 3, onLoad = null, onError = null, buffer = null, fallback = null, format = null, forcedExtension = null, mimeType, loaderOptions, creationFlags, useSRGBBuffer = false) {
        url = url || "";
        const fromData = url.substring(0, 5) === "data:";
        //const fromBlob = url.substring(0, 5) === "blob:";
        const isBase64 = fromData && url.indexOf(";base64,") !== -1;
        const texture = fallback ? fallback : new InternalTexture(this, 1 /* InternalTextureSource.Url */);
        const originalUrl = url;
        if (this._transformTextureUrl && !isBase64 && !fallback && !buffer) {
            url = this._transformTextureUrl(url);
        }
        // establish the file extension, if possible
        const lastDot = url.lastIndexOf(".");
        const extension = forcedExtension ? forcedExtension : lastDot > -1 ? url.substring(lastDot).toLowerCase() : "";
        // some formats are already supported by bimg, no need to try to load them with JS
        // leaving TextureLoader extension check for future use
        let loaderPromise = null;
        if (extension.endsWith(".basis") || extension.endsWith(".ktx") || extension.endsWith(".ktx2") || mimeType === "image/ktx" || mimeType === "image/ktx2") {
            loaderPromise = _GetCompatibleTextureLoader(extension);
        }
        if (scene) {
            scene.addPendingData(texture);
        }
        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture._useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, noMipmap);
        if (!this.doNotHandleContextLost) {
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
                if (EngineStore.UseFallbackTexture) {
                    this.createTexture(EngineStore.FallbackTexture, noMipmap, texture.invertY, scene, samplingMode, null, onError, buffer, texture);
                }
                if (onError) {
                    onError((message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : ""), exception);
                }
            }
            else {
                // fall back to the original url if the transformed url fails to load
                Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
                this.createTexture(originalUrl, noMipmap, texture.invertY, scene, samplingMode, onLoad, onError, buffer, texture, format, forcedExtension, mimeType, loaderOptions);
            }
        };
        // processing for non-image formats
        if (loaderPromise) {
            throw new Error("Loading textures from IInternalTextureLoader not yet implemented.");
        }
        else {
            const onload = (data) => {
                if (!texture._hardwareTexture) {
                    if (scene) {
                        scene.removePendingData(texture);
                    }
                    return;
                }
                const underlyingResource = texture._hardwareTexture.underlyingResource;
                this._engine.loadTexture(underlyingResource, data, !noMipmap, invertY, texture._useSRGBBuffer, () => {
                    texture.baseWidth = this._engine.getTextureWidth(underlyingResource);
                    texture.baseHeight = this._engine.getTextureHeight(underlyingResource);
                    texture.width = texture.baseWidth;
                    texture.height = texture.baseHeight;
                    texture.isReady = true;
                    const filter = getNativeSamplingMode(samplingMode);
                    this._setTextureSampling(underlyingResource, filter);
                    if (scene) {
                        scene.removePendingData(texture);
                    }
                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();
                }, () => {
                    throw new Error("Could not load a native texture.");
                });
            };
            if (fromData && buffer) {
                if (buffer instanceof ArrayBuffer) {
                    onload(new Uint8Array(buffer));
                }
                else if (ArrayBuffer.isView(buffer)) {
                    onload(buffer);
                }
                else if (typeof buffer === "string") {
                    onload(new Uint8Array(Tools.DecodeBase64(buffer)));
                }
                else {
                    throw new Error("Unsupported buffer type");
                }
            }
            else {
                if (isBase64) {
                    onload(new Uint8Array(Tools.DecodeBase64(url)));
                }
                else {
                    this._loadFile(url, (data) => onload(new Uint8Array(data)), undefined, undefined, true, (request, exception) => {
                        onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                    });
                }
            }
        }
        return texture;
    }
    /**
     * Wraps an external native texture in a Babylon texture.
     * @param texture defines the external texture
     * @param hasMipMaps defines whether the external texture has mip maps
     * @param samplingMode defines the sampling mode for the external texture (default: 3)
     * @returns the babylon internal texture
     */
    wrapNativeTexture(texture, hasMipMaps = false, samplingMode = 3) {
        const hardwareTexture = new NativeHardwareTexture(texture, this._engine);
        const internalTexture = new InternalTexture(this, 0 /* InternalTextureSource.Unknown */, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.baseWidth = this._engine.getTextureWidth(texture);
        internalTexture.baseHeight = this._engine.getTextureHeight(texture);
        internalTexture.width = internalTexture.baseWidth;
        internalTexture.height = internalTexture.baseHeight;
        internalTexture.isReady = true;
        internalTexture.useMipMaps = hasMipMaps;
        this.updateTextureSamplingMode(samplingMode, internalTexture);
        return internalTexture;
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @returns the babylon internal texture
     */
    wrapWebGLTexture() {
        throw new Error("wrapWebGLTexture is not supported, use wrapNativeTexture instead.");
    }
    _createDepthStencilTexture(size, options, rtWrapper) {
        // TODO: handle other options?
        const generateStencil = options.generateStencil || false;
        const samples = options.samples || 1;
        const nativeRTWrapper = rtWrapper;
        const texture = new InternalTexture(this, 12 /* InternalTextureSource.DepthStencil */);
        const width = size.width ?? size;
        const height = size.height ?? size;
        const framebuffer = this._engine.createFrameBuffer(texture._hardwareTexture.underlyingResource, width, height, generateStencil, true, samples);
        nativeRTWrapper._framebufferDepthStencil = framebuffer;
        return texture;
    }
    /**
     * @internal
     */
    _releaseFramebufferObjects(framebuffer) {
        if (framebuffer) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEFRAMEBUFFER);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(framebuffer);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }
    /**
     * @internal Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    _createImageBitmapFromSource(imageSource, options) {
        const promise = new Promise((resolve, reject) => {
            const image = this.createCanvasImage();
            image.onload = () => {
                try {
                    const imageBitmap = this._engine.createImageBitmap(image);
                    resolve(imageBitmap);
                }
                catch (error) {
                    reject(`Error loading image ${image.src} with exception: ${error}`);
                }
            };
            image.onerror = (error) => {
                reject(`Error loading image ${image.src} with exception: ${error}`);
            };
            image.src = imageSource;
        });
        return promise;
    }
    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    createImageBitmap(image, options) {
        return new Promise((resolve, reject) => {
            if (Array.isArray(image)) {
                const arr = image;
                if (arr.length) {
                    const image = this._engine.createImageBitmap(arr[0]);
                    if (image) {
                        resolve(image);
                        return;
                    }
                }
            }
            reject(`Unsupported data for createImageBitmap.`);
        });
    }
    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    resizeImageBitmap(image, bufferWidth, bufferHeight) {
        return this._engine.resizeImageBitmap(image, bufferWidth, bufferHeight);
    }
    /**
     * Creates a cube texture
     * @param rootUrl defines the url where the files to load is located
     * @param scene defines the current scene
     * @param files defines the list of files to load (1 per face)
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
     * @param onLoad defines an optional callback raised when the texture is loaded
     * @param onError defines an optional callback raised if there is an issue to load the texture
     * @param format defines the format of the data
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param createPolynomials if a polynomial sphere should be created for the cube texture
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @param fallback defines texture to use while falling back when (compressed) texture file not found.
     * @param loaderOptions options to be passed to the loader
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @param buffer defines the data buffer to load instead of loading the rootUrl
     * @returns the cube texture as an InternalTexture
     */
    createCubeTexture(rootUrl, scene, files, noMipmap, onLoad = null, onError = null, format, forcedExtension = null, createPolynomials = false, lodScale = 0, lodOffset = 0, fallback = null, loaderOptions, useSRGBBuffer = false, buffer = null) {
        const texture = fallback ? fallback : new InternalTexture(this, 7 /* InternalTextureSource.Cube */);
        texture.isCube = true;
        texture.url = rootUrl;
        texture.generateMipMaps = !noMipmap;
        texture._lodGenerationScale = lodScale;
        texture._lodGenerationOffset = lodOffset;
        texture._useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, !!noMipmap);
        if (!this._doNotHandleContextLost) {
            texture._extension = forcedExtension;
            texture._files = files;
            texture._buffer = buffer;
        }
        const lastDot = rootUrl.lastIndexOf(".");
        const extension = forcedExtension ? forcedExtension : lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "";
        // TODO: use texture loader to load env files?
        if (extension === ".env") {
            const onloaddata = (data) => {
                const info = GetEnvInfo(data);
                texture.width = info.width;
                texture.height = info.width;
                UploadEnvSpherical(texture, info);
                const specularInfo = info.specular;
                if (!specularInfo) {
                    throw new Error(`Nothing else parsed so far`);
                }
                texture._lodGenerationScale = specularInfo.lodGenerationScale;
                const imageData = CreateImageDataArrayBufferViews(data, info);
                texture.format = 5;
                texture.type = 0;
                texture.generateMipMaps = true;
                texture.getEngine().updateTextureSamplingMode(Texture.TRILINEAR_SAMPLINGMODE, texture);
                texture._isRGBD = true;
                texture.invertY = true;
                this._engine.loadCubeTextureWithMips(texture._hardwareTexture.underlyingResource, imageData, false, texture._useSRGBBuffer, () => {
                    texture.isReady = true;
                    if (onLoad) {
                        onLoad();
                    }
                }, () => {
                    throw new Error("Could not load a native cube texture.");
                });
            };
            if (buffer) {
                onloaddata(buffer);
            }
            else if (files && files.length === 6) {
                throw new Error(`Multi-file loading not allowed on env files.`);
            }
            else {
                const onInternalError = (request, exception) => {
                    if (onError && request) {
                        onError(request.status + " " + request.statusText, exception);
                    }
                };
                this._loadFile(rootUrl, (data) => {
                    onloaddata(new Uint8Array(data, 0, data.byteLength));
                }, undefined, undefined, true, onInternalError);
            }
        }
        else {
            if (!files || files.length !== 6) {
                throw new Error("Cannot load cubemap because 6 files were not defined");
            }
            // Reorder from [+X, +Y, +Z, -X, -Y, -Z] to [+X, -X, +Y, -Y, +Z, -Z].
            const reorderedFiles = [files[0], files[3], files[1], files[4], files[2], files[5]];
            Promise.all(reorderedFiles.map((file) => this._loadFileAsync(file, undefined, true).then((data) => new Uint8Array(data, 0, data.byteLength))))
                .then((data) => {
                return new Promise((resolve, reject) => {
                    this._engine.loadCubeTexture(texture._hardwareTexture.underlyingResource, data, !noMipmap, true, texture._useSRGBBuffer, resolve, reject);
                });
            })
                .then(() => {
                texture.isReady = true;
                if (onLoad) {
                    onLoad();
                }
            }, (error) => {
                if (onError) {
                    onError(`Failed to load cubemap: ${error.message}`, error);
                }
            });
        }
        this._internalTexturesCache.push(texture);
        return texture;
    }
    /** @internal */
    _createHardwareTexture() {
        return new NativeHardwareTexture(this._createTexture(), this._engine);
    }
    /** @internal */
    _createHardwareRenderTargetWrapper(isMulti, isCube, size) {
        const rtWrapper = new NativeRenderTargetWrapper(isMulti, isCube, size, this);
        this._renderTargetWrapperCache.push(rtWrapper);
        return rtWrapper;
    }
    /** @internal */
    _createInternalTexture(size, options, _delayGPUTextureCreation = true, source = 0 /* InternalTextureSource.Unknown */) {
        let generateMipMaps = false;
        let type = 0;
        let samplingMode = 3;
        let format = 5;
        let useSRGBBuffer = false;
        let samples = 1;
        let label;
        if (options !== undefined && typeof options === "object") {
            generateMipMaps = !!options.generateMipMaps;
            type = options.type === undefined ? 0 : options.type;
            samplingMode = options.samplingMode === undefined ? 3 : options.samplingMode;
            format = options.format === undefined ? 5 : options.format;
            useSRGBBuffer = options.useSRGBBuffer === undefined ? false : options.useSRGBBuffer;
            samples = options.samples ?? 1;
            label = options.label;
        }
        else {
            generateMipMaps = !!options;
        }
        useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, !generateMipMaps);
        if (type === 1 && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = 1;
        }
        else if (type === 2 && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = 1;
        }
        if (type === 1 && !this._caps.textureFloat) {
            type = 0;
            Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
        }
        const texture = new InternalTexture(this, source);
        const width = size.width ?? size;
        const height = size.height ?? size;
        const layers = size.layers || 0;
        if (layers !== 0) {
            throw new Error("Texture layers are not supported in Babylon Native");
        }
        const nativeTexture = texture._hardwareTexture.underlyingResource;
        const nativeTextureFormat = getNativeTextureFormat(format, type);
        // REVIEW: We are always setting the renderTarget flag as we don't know whether the texture will be used as a render target.
        this._engine.initializeTexture(nativeTexture, width, height, generateMipMaps, nativeTextureFormat, true, useSRGBBuffer, samples);
        this._setTextureSampling(nativeTexture, getNativeSamplingMode(samplingMode));
        texture._useSRGBBuffer = useSRGBBuffer;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.depth = layers;
        texture.isReady = true;
        texture.samples = samples;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture.format = format;
        texture.label = label;
        this._internalTexturesCache.push(texture);
        return texture;
    }
    createRenderTargetTexture(size, options) {
        const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size);
        let generateDepthBuffer = true;
        let generateStencilBuffer = false;
        let noColorAttachment = false;
        let colorAttachment = undefined;
        let samples = 1;
        if (options !== undefined && typeof options === "object") {
            generateDepthBuffer = options.generateDepthBuffer ?? true;
            generateStencilBuffer = !!options.generateStencilBuffer;
            noColorAttachment = !!options.noColorAttachment;
            colorAttachment = options.colorAttachment;
            samples = options.samples ?? 1;
        }
        const texture = colorAttachment || (noColorAttachment ? null : this._createInternalTexture(size, options, true, 5 /* InternalTextureSource.RenderTarget */));
        const width = size.width ?? size;
        const height = size.height ?? size;
        const framebuffer = this._engine.createFrameBuffer(texture ? texture._hardwareTexture.underlyingResource : null, width, height, generateStencilBuffer, generateDepthBuffer, samples);
        rtWrapper._framebuffer = framebuffer;
        rtWrapper._generateDepthBuffer = generateDepthBuffer;
        rtWrapper._generateStencilBuffer = generateStencilBuffer;
        rtWrapper._samples = samples;
        rtWrapper.setTextures(texture);
        return rtWrapper;
    }
    updateRenderTargetTextureSampleCount(rtWrapper, samples) {
        Logger.Warn("Updating render target sample count is not currently supported");
        return rtWrapper.samples;
    }
    updateTextureSamplingMode(samplingMode, texture) {
        if (texture._hardwareTexture) {
            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(texture._hardwareTexture.underlyingResource, filter);
        }
        texture.samplingMode = samplingMode;
    }
    bindFramebuffer(texture, faceIndex, requiredWidth, requiredHeight, forceFullscreenViewport) {
        const nativeRTWrapper = texture;
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }
        this._currentRenderTarget = texture;
        if (faceIndex) {
            throw new Error("Cuboid frame buffers are not yet supported in NativeEngine.");
        }
        if (requiredWidth || requiredHeight) {
            throw new Error("Required width/height for frame buffers not yet supported in NativeEngine.");
        }
        if (nativeRTWrapper._framebufferDepthStencil) {
            this._bindUnboundFramebuffer(nativeRTWrapper._framebufferDepthStencil);
        }
        else {
            this._bindUnboundFramebuffer(nativeRTWrapper._framebuffer);
        }
    }
    unBindFramebuffer(texture, disableGenerateMipMaps = false, onBeforeUnbind) {
        // NOTE: Disabling mipmap generation is not yet supported in NativeEngine.
        this._currentRenderTarget = null;
        if (onBeforeUnbind) {
            onBeforeUnbind();
        }
        this._bindUnboundFramebuffer(null);
    }
    createDynamicVertexBuffer(data) {
        return this.createVertexBuffer(data, true);
    }
    updateDynamicIndexBuffer(indexBuffer, indices, offset = 0) {
        const buffer = indexBuffer;
        const data = this._normalizeIndexData(indices);
        buffer.is32Bits = data.BYTES_PER_ELEMENT === 4;
        this._engine.updateDynamicIndexBuffer(buffer.nativeIndexBuffer, data.buffer, data.byteOffset, data.byteLength, offset);
    }
    updateDynamicVertexBuffer(vertexBuffer, data, byteOffset = 0, byteLength) {
        const buffer = vertexBuffer;
        const dataView = data instanceof Array ? new Float32Array(data) : data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        const byteView = new Uint8Array(dataView.buffer, dataView.byteOffset, byteLength ?? dataView.byteLength);
        this._engine.updateDynamicVertexBuffer(buffer.nativeVertexBuffer, byteView.buffer, byteView.byteOffset, byteView.byteLength, byteOffset);
    }
    // TODO: Refactor to share more logic with base Engine implementation.
    /**
     * @internal
     */
    _setTexture(channel, texture, isPartOfTextureArray = false, depthStencilTexture = false) {
        const uniform = this._boundUniforms[channel];
        if (!uniform) {
            return false;
        }
        // Not ready?
        if (!texture) {
            if (this._boundTexturesCache[channel] != null) {
                this._activeChannel = channel;
                this._boundTexturesCache[channel] = null;
                this._unsetNativeTexture(uniform);
            }
            return false;
        }
        // Video
        if (texture.video) {
            this._activeChannel = channel;
            texture.update();
        }
        else if (texture.delayLoadState === 4) {
            // Delay loading
            texture.delayLoad();
            return false;
        }
        let internalTexture;
        if (depthStencilTexture) {
            internalTexture = texture.depthStencilTexture;
        }
        else if (texture.isReady()) {
            internalTexture = texture.getInternalTexture();
        }
        else if (texture.isCube) {
            internalTexture = this.emptyCubeTexture;
        }
        else if (texture.is3D) {
            internalTexture = this.emptyTexture3D;
        }
        else if (texture.is2DArray) {
            internalTexture = this.emptyTexture2DArray;
        }
        else {
            internalTexture = this.emptyTexture;
        }
        this._activeChannel = channel;
        if (!internalTexture || !internalTexture._hardwareTexture) {
            return false;
        }
        this._setTextureWrapMode(internalTexture._hardwareTexture.underlyingResource, getNativeAddressMode(texture.wrapU), getNativeAddressMode(texture.wrapV), getNativeAddressMode(texture.wrapR));
        this._updateAnisotropicLevel(texture);
        this._setNativeTexture(uniform, internalTexture._hardwareTexture.underlyingResource);
        return true;
    }
    // filter is a NativeFilter.XXXX value.
    _setTextureSampling(texture, filter) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTURESAMPLING);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(texture);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(filter);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    // addressModes are NativeAddressMode.XXXX values.
    _setTextureWrapMode(texture, addressModeU, addressModeV, addressModeW) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTUREWRAPMODE);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(texture);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(addressModeU);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(addressModeV);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(addressModeW);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    _setNativeTexture(uniform, texture) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTURE);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(texture);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    _unsetNativeTexture(uniform) {
        if (!_native.Engine.COMMAND_UNSETTEXTURE) {
            return;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_UNSETTEXTURE);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    // TODO: Share more of this logic with the base implementation.
    // TODO: Rename to match naming in base implementation once refactoring allows different parameters.
    _updateAnisotropicLevel(texture) {
        const internalTexture = texture.getInternalTexture();
        const value = texture.anisotropicFilteringLevel;
        if (!internalTexture || !internalTexture._hardwareTexture) {
            return;
        }
        if (internalTexture._cachedAnisotropicFilteringLevel !== value) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTUREANISOTROPICLEVEL);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(internalTexture._hardwareTexture.underlyingResource);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(value);
            this._commandBufferEncoder.finishEncodingCommand();
            internalTexture._cachedAnisotropicFilteringLevel = value;
        }
    }
    /**
     * @internal
     */
    _bindTexture(channel, texture) {
        const uniform = this._boundUniforms[channel];
        if (!uniform) {
            return;
        }
        if (texture && texture._hardwareTexture) {
            const underlyingResource = texture._hardwareTexture.underlyingResource;
            this._setNativeTexture(uniform, underlyingResource);
        }
        else {
            this._unsetNativeTexture(uniform);
        }
    }
    /**
     * Unbind all textures
     */
    unbindAllTextures() {
        if (!_native.Engine.COMMAND_DISCARDALLTEXTURES) {
            return;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DISCARDALLTEXTURES);
        this._commandBufferEncoder.finishEncodingCommand();
    }
    _deleteBuffer(buffer) {
        if (buffer.nativeIndexBuffer) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEINDEXBUFFER);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(buffer.nativeIndexBuffer);
            this._commandBufferEncoder.finishEncodingCommand();
            delete buffer.nativeIndexBuffer;
        }
        if (buffer.nativeVertexBuffer) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEVERTEXBUFFER);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(buffer.nativeVertexBuffer);
            this._commandBufferEncoder.finishEncodingCommand();
            delete buffer.nativeVertexBuffer;
        }
    }
    /**
     * Create a canvas
     * @param width width
     * @param height height
     * @returns ICanvas interface
     */
    createCanvas(width, height) {
        if (!_native.Canvas) {
            throw new Error("Native Canvas plugin not available.");
        }
        const canvas = new _native.Canvas();
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    /**
     * Create an image to use with canvas
     * @returns IImage interface
     */
    createCanvasImage() {
        if (!_native.Canvas) {
            throw new Error("Native Canvas plugin not available.");
        }
        const image = new _native.Image();
        return image;
    }
    /**
     * Update a portion of an internal texture
     * @param texture defines the texture to update
     * @param imageData defines the data to store into the texture
     * @param xOffset defines the x coordinates of the update rectangle
     * @param yOffset defines the y coordinates of the update rectangle
     * @param width defines the width of the update rectangle
     * @param height defines the height of the update rectangle
     * @param faceIndex defines the face index if texture is a cube (0 by default)
     * @param lod defines the lod level to update (0 by default)
     * @param generateMipMaps defines whether to generate mipmaps or not
     */
    updateTextureData(texture, imageData, xOffset, yOffset, width, height, faceIndex = 0, lod = 0, generateMipMaps = false) {
        throw new Error("updateTextureData not implemented.");
    }
    /**
     * @internal
     */
    _uploadCompressedDataToTextureDirectly(texture, internalFormat, width, height, data, faceIndex = 0, lod = 0) {
        throw new Error("_uploadCompressedDataToTextureDirectly not implemented.");
    }
    /**
     * @internal
     */
    _uploadDataToTextureDirectly(texture, imageData, faceIndex = 0, lod = 0) {
        throw new Error("_uploadDataToTextureDirectly not implemented.");
    }
    /**
     * @internal
     */
    _uploadArrayBufferViewToTexture(texture, imageData, faceIndex = 0, lod = 0) {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }
    /**
     * @internal
     */
    _uploadImageToTexture(texture, image, faceIndex = 0, lod = 0) {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }
    getFontOffset(font) {
        // TODO
        const result = { ascent: 0, height: 0, descent: 0 };
        return result;
    }
    /**
     * No equivalent for native. Do nothing.
     */
    flushFramebuffer() { }
    _readTexturePixels(texture, width, height, faceIndex, level, buffer, _flushRenderer, _noDataConversion, x, y) {
        if (faceIndex !== undefined && faceIndex !== -1) {
            throw new Error(`Reading cubemap faces is not supported, but faceIndex is ${faceIndex}.`);
        }
        return this._engine
            .readTexture(texture._hardwareTexture?.underlyingResource, level ?? 0, x ?? 0, y ?? 0, width, height, buffer?.buffer ?? null, buffer?.byteOffset ?? 0, buffer?.byteLength ?? 0)
            .then((rawBuffer) => {
            if (!buffer) {
                buffer = new Uint8Array(rawBuffer);
            }
            return buffer;
        });
    }
}
// This must match the protocol version in NativeEngine.cpp
NativeEngine.PROTOCOL_VERSION = 8;
//# sourceMappingURL=nativeEngine.js.map