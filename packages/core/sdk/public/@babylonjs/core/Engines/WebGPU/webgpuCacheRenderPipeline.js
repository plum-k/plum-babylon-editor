/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { VertexBuffer } from "../../Buffers/buffer.js";
import { WebGPUTextureHelper } from "./webgpuTextureHelper.js";
import { renderableTextureFormatToIndex } from "./webgpuTextureManager.js";
import { checkNonFloatVertexBuffers } from "../../Buffers/buffer.nonFloatVertexBuffers.js";
import { Logger } from "../../Misc/logger.js";
var StatePosition;
(function (StatePosition) {
    StatePosition[StatePosition["StencilReadMask"] = 0] = "StencilReadMask";
    StatePosition[StatePosition["StencilWriteMask"] = 1] = "StencilWriteMask";
    //DepthBiasClamp = 1, // not used, so remove it to improve perf
    StatePosition[StatePosition["DepthBias"] = 2] = "DepthBias";
    StatePosition[StatePosition["DepthBiasSlopeScale"] = 3] = "DepthBiasSlopeScale";
    StatePosition[StatePosition["DepthStencilState"] = 4] = "DepthStencilState";
    StatePosition[StatePosition["MRTAttachments1"] = 5] = "MRTAttachments1";
    StatePosition[StatePosition["MRTAttachments2"] = 6] = "MRTAttachments2";
    StatePosition[StatePosition["RasterizationState"] = 7] = "RasterizationState";
    StatePosition[StatePosition["ColorStates"] = 8] = "ColorStates";
    StatePosition[StatePosition["ShaderStage"] = 9] = "ShaderStage";
    StatePosition[StatePosition["TextureStage"] = 10] = "TextureStage";
    StatePosition[StatePosition["VertexState"] = 11] = "VertexState";
    StatePosition[StatePosition["NumStates"] = 12] = "NumStates";
})(StatePosition || (StatePosition = {}));
const alphaBlendFactorToIndex = {
    0: 1, // Zero
    1: 2, // One
    0x0300: 3, // SrcColor
    0x0301: 4, // OneMinusSrcColor
    0x0302: 5, // SrcAlpha
    0x0303: 6, // OneMinusSrcAlpha
    0x0304: 7, // DstAlpha
    0x0305: 8, // OneMinusDstAlpha
    0x0306: 9, // DstColor
    0x0307: 10, // OneMinusDstColor
    0x0308: 11, // SrcAlphaSaturated
    0x8001: 12, // BlendColor
    0x8002: 13, // OneMinusBlendColor
    0x8003: 12, // BlendColor (alpha)
    0x8004: 13, // OneMinusBlendColor (alpha)
};
const stencilOpToIndex = {
    0x0000: 0, // ZERO
    0x1e00: 1, // KEEP
    0x1e01: 2, // REPLACE
    0x1e02: 3, // INCR
    0x1e03: 4, // DECR
    0x150a: 5, // INVERT
    0x8507: 6, // INCR_WRAP
    0x8508: 7, // DECR_WRAP
};
/** @internal */
export class WebGPUCacheRenderPipeline {
    constructor(device, emptyVertexBuffer) {
        this.mrtTextureCount = 0;
        this._device = device;
        this._useTextureStage = true; // we force usage because we must handle depth textures with "float" filtering, which can't be fixed by a caps (like "textureFloatLinearFiltering" can for float textures)
        this._states = new Array(30); // pre-allocate enough room so that no new allocation will take place afterwards
        this._statesLength = 0;
        this._stateDirtyLowestIndex = 0;
        this._emptyVertexBuffer = emptyVertexBuffer;
        this._mrtFormats = [];
        this._parameter = { token: undefined, pipeline: null };
        this.disabled = false;
        this.vertexBuffers = [];
        this._kMaxVertexBufferStride = device.limits.maxVertexBufferArrayStride || 2048;
        this.reset();
    }
    reset() {
        this._isDirty = true;
        this.vertexBuffers.length = 0;
        this.setAlphaToCoverage(false);
        this.resetDepthCullingState();
        this.setClampDepth(false);
        this.setDepthBias(0);
        //this.setDepthBiasClamp(0);
        this._webgpuColorFormat = ["bgra8unorm" /* WebGPUConstants.TextureFormat.BGRA8Unorm */];
        this.setColorFormat("bgra8unorm" /* WebGPUConstants.TextureFormat.BGRA8Unorm */);
        this.setMRT([]);
        this.setAlphaBlendEnabled(false);
        this.setAlphaBlendFactors([null, null, null, null], [null, null]);
        this.setWriteMask(0xf);
        this.setDepthStencilFormat("depth24plus-stencil8" /* WebGPUConstants.TextureFormat.Depth24PlusStencil8 */);
        this.setStencilEnabled(false);
        this.resetStencilState();
        this.setBuffers(null, null, null);
        this._setTextureState(0);
    }
    get colorFormats() {
        return this._mrtAttachments1 > 0 ? this._mrtFormats : this._webgpuColorFormat;
    }
    getRenderPipeline(fillMode, effect, sampleCount, textureState = 0) {
        sampleCount = WebGPUTextureHelper.GetSample(sampleCount);
        if (this.disabled) {
            const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);
            this._setVertexState(effect); // to fill this.vertexBuffers with correct data
            this._setTextureState(textureState);
            this._parameter.pipeline = this._createRenderPipeline(effect, topology, sampleCount);
            WebGPUCacheRenderPipeline.NumCacheMiss++;
            WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;
            return this._parameter.pipeline;
        }
        this._setShaderStage(effect.uniqueId);
        this._setRasterizationState(fillMode, sampleCount);
        this._setColorStates();
        this._setDepthStencilState();
        this._setVertexState(effect);
        this._setTextureState(textureState);
        this.lastStateDirtyLowestIndex = this._stateDirtyLowestIndex;
        if (!this._isDirty && this._parameter.pipeline) {
            this._stateDirtyLowestIndex = this._statesLength;
            WebGPUCacheRenderPipeline.NumCacheHitWithoutHash++;
            return this._parameter.pipeline;
        }
        this._getRenderPipeline(this._parameter);
        this._isDirty = false;
        this._stateDirtyLowestIndex = this._statesLength;
        if (this._parameter.pipeline) {
            WebGPUCacheRenderPipeline.NumCacheHitWithHash++;
            return this._parameter.pipeline;
        }
        const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);
        this._parameter.pipeline = this._createRenderPipeline(effect, topology, sampleCount);
        this._setRenderPipeline(this._parameter);
        WebGPUCacheRenderPipeline.NumCacheMiss++;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;
        return this._parameter.pipeline;
    }
    endFrame() {
        WebGPUCacheRenderPipeline.NumPipelineCreationLastFrame = WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame = 0;
    }
    setAlphaToCoverage(enabled) {
        this._alphaToCoverageEnabled = enabled;
    }
    setFrontFace(frontFace) {
        this._frontFace = frontFace;
    }
    setCullEnabled(enabled) {
        this._cullEnabled = enabled;
    }
    setCullFace(cullFace) {
        this._cullFace = cullFace;
    }
    setClampDepth(clampDepth) {
        this._clampDepth = clampDepth;
    }
    resetDepthCullingState() {
        this.setDepthCullingState(false, 2, 1, 0, 0, true, true, 519);
    }
    setDepthCullingState(cullEnabled, frontFace, cullFace, zOffset, zOffsetUnits, depthTestEnabled, depthWriteEnabled, depthCompare) {
        this._depthWriteEnabled = depthWriteEnabled;
        this._depthTestEnabled = depthTestEnabled;
        this._depthCompare = (depthCompare ?? 519) - 0x0200;
        this._cullFace = cullFace;
        this._cullEnabled = cullEnabled;
        this._frontFace = frontFace;
        this.setDepthBiasSlopeScale(zOffset);
        this.setDepthBias(zOffsetUnits);
    }
    setDepthBias(depthBias) {
        if (this._depthBias !== depthBias) {
            this._depthBias = depthBias;
            this._states[StatePosition.DepthBias] = depthBias;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.DepthBias);
        }
    }
    /*public setDepthBiasClamp(depthBiasClamp: number): void {
        if (this._depthBiasClamp !== depthBiasClamp) {
            this._depthBiasClamp = depthBiasClamp;
            this._states[StatePosition.DepthBiasClamp] = depthBiasClamp.toString();
            this._isDirty = true;
        }
    }*/
    setDepthBiasSlopeScale(depthBiasSlopeScale) {
        if (this._depthBiasSlopeScale !== depthBiasSlopeScale) {
            this._depthBiasSlopeScale = depthBiasSlopeScale;
            this._states[StatePosition.DepthBiasSlopeScale] = depthBiasSlopeScale;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.DepthBiasSlopeScale);
        }
    }
    setColorFormat(format) {
        this._webgpuColorFormat[0] = format;
        this._colorFormat = renderableTextureFormatToIndex[format ?? ""];
    }
    setMRTAttachments(attachments) {
        this.mrtAttachments = attachments;
        let mask = 0;
        for (let i = 0; i < attachments.length; ++i) {
            if (attachments[i] !== 0) {
                mask += 1 << i;
            }
        }
        if (this._mrtEnabledMask !== mask) {
            this._mrtEnabledMask = mask;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.MRTAttachments1);
        }
    }
    setMRT(textureArray, textureCount) {
        textureCount = textureCount ?? textureArray.length;
        if (textureCount > 10) {
            // If we want more than 10 attachments we need to change this method (and the StatePosition enum) but 10 seems plenty: note that WebGPU only supports 8 at the time (2021/12/13)!
            // As we need ~39 different values we are using 6 bits to encode a texture format, meaning we can encode 5 texture formats in 32 bits
            // We are using 2x32 bit values to handle 10 textures
            // eslint-disable-next-line no-throw-literal
            throw "Can't handle more than 10 attachments for a MRT in cache render pipeline!";
        }
        this.mrtTextureArray = textureArray;
        this.mrtTextureCount = textureCount;
        this._mrtEnabledMask = 0xffff; // all textures are enabled at start (meaning we can write to them). Calls to setMRTAttachments may disable some
        const bits = [0, 0];
        let indexBits = 0, mask = 0, numRT = 0;
        for (let i = 0; i < textureCount; ++i) {
            const texture = textureArray[i];
            const gpuWrapper = texture?._hardwareTexture;
            this._mrtFormats[numRT] = gpuWrapper?.format ?? this._webgpuColorFormat[0];
            bits[indexBits] += renderableTextureFormatToIndex[this._mrtFormats[numRT] ?? ""] << mask;
            mask += 6;
            numRT++;
            if (mask >= 32) {
                mask = 0;
                indexBits++;
            }
        }
        this._mrtFormats.length = numRT;
        if (this._mrtAttachments1 !== bits[0] || this._mrtAttachments2 !== bits[1]) {
            this._mrtAttachments1 = bits[0];
            this._mrtAttachments2 = bits[1];
            this._states[StatePosition.MRTAttachments1] = bits[0];
            this._states[StatePosition.MRTAttachments2] = bits[1];
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.MRTAttachments1);
        }
    }
    setAlphaBlendEnabled(enabled) {
        this._alphaBlendEnabled = enabled;
    }
    setAlphaBlendFactors(factors, operations) {
        this._alphaBlendFuncParams = factors;
        this._alphaBlendEqParams = operations;
    }
    setWriteMask(mask) {
        this._writeMask = mask;
    }
    setDepthStencilFormat(format) {
        this._webgpuDepthStencilFormat = format;
        this._depthStencilFormat = format === undefined ? 0 : renderableTextureFormatToIndex[format];
    }
    setDepthTestEnabled(enabled) {
        this._depthTestEnabled = enabled;
    }
    setDepthWriteEnabled(enabled) {
        this._depthWriteEnabled = enabled;
    }
    setDepthCompare(func) {
        this._depthCompare = (func ?? 519) - 0x0200;
    }
    setStencilEnabled(enabled) {
        this._stencilEnabled = enabled;
    }
    setStencilCompare(func) {
        this._stencilFrontCompare = (func ?? 519) - 0x0200;
    }
    setStencilDepthFailOp(op) {
        this._stencilFrontDepthFailOp = op === null ? 1 /* KEEP */ : stencilOpToIndex[op];
    }
    setStencilPassOp(op) {
        this._stencilFrontPassOp = op === null ? 2 /* REPLACE */ : stencilOpToIndex[op];
    }
    setStencilFailOp(op) {
        this._stencilFrontFailOp = op === null ? 1 /* KEEP */ : stencilOpToIndex[op];
    }
    setStencilReadMask(mask) {
        if (this._stencilReadMask !== mask) {
            this._stencilReadMask = mask;
            this._states[StatePosition.StencilReadMask] = mask;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.StencilReadMask);
        }
    }
    setStencilWriteMask(mask) {
        if (this._stencilWriteMask !== mask) {
            this._stencilWriteMask = mask;
            this._states[StatePosition.StencilWriteMask] = mask;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.StencilWriteMask);
        }
    }
    resetStencilState() {
        this.setStencilState(false, 519, 7680, 7681, 7680, 0xff, 0xff);
    }
    setStencilState(stencilEnabled, compare, depthFailOp, passOp, failOp, readMask, writeMask) {
        this._stencilEnabled = stencilEnabled;
        this._stencilFrontCompare = (compare ?? 519) - 0x0200;
        this._stencilFrontDepthFailOp = depthFailOp === null ? 1 /* KEEP */ : stencilOpToIndex[depthFailOp];
        this._stencilFrontPassOp = passOp === null ? 2 /* REPLACE */ : stencilOpToIndex[passOp];
        this._stencilFrontFailOp = failOp === null ? 1 /* KEEP */ : stencilOpToIndex[failOp];
        this.setStencilReadMask(readMask);
        this.setStencilWriteMask(writeMask);
    }
    setBuffers(vertexBuffers, indexBuffer, overrideVertexBuffers) {
        this._vertexBuffers = vertexBuffers;
        this._overrideVertexBuffers = overrideVertexBuffers;
        this._indexBuffer = indexBuffer;
    }
    static _GetTopology(fillMode) {
        switch (fillMode) {
            // Triangle views
            case 0:
                return "triangle-list" /* WebGPUConstants.PrimitiveTopology.TriangleList */;
            case 2:
                return "point-list" /* WebGPUConstants.PrimitiveTopology.PointList */;
            case 1:
                return "line-list" /* WebGPUConstants.PrimitiveTopology.LineList */;
            // Draw modes
            case 3:
                return "point-list" /* WebGPUConstants.PrimitiveTopology.PointList */;
            case 4:
                return "line-list" /* WebGPUConstants.PrimitiveTopology.LineList */;
            case 5:
                // return this._gl.LINE_LOOP;
                // TODO WEBGPU. Line Loop Mode Fallback at buffer load time.
                // eslint-disable-next-line no-throw-literal
                throw "LineLoop is an unsupported fillmode in WebGPU";
            case 6:
                return "line-strip" /* WebGPUConstants.PrimitiveTopology.LineStrip */;
            case 7:
                return "triangle-strip" /* WebGPUConstants.PrimitiveTopology.TriangleStrip */;
            case 8:
                // return this._gl.TRIANGLE_FAN;
                // TODO WEBGPU. Triangle Fan Mode Fallback at buffer load time.
                // eslint-disable-next-line no-throw-literal
                throw "TriangleFan is an unsupported fillmode in WebGPU";
            default:
                return "triangle-list" /* WebGPUConstants.PrimitiveTopology.TriangleList */;
        }
    }
    static _GetAphaBlendOperation(operation) {
        switch (operation) {
            case 32774:
                return "add" /* WebGPUConstants.BlendOperation.Add */;
            case 32778:
                return "subtract" /* WebGPUConstants.BlendOperation.Subtract */;
            case 32779:
                return "reverse-subtract" /* WebGPUConstants.BlendOperation.ReverseSubtract */;
            case 32775:
                return "min" /* WebGPUConstants.BlendOperation.Min */;
            case 32776:
                return "max" /* WebGPUConstants.BlendOperation.Max */;
            default:
                return "add" /* WebGPUConstants.BlendOperation.Add */;
        }
    }
    static _GetAphaBlendFactor(factor) {
        switch (factor) {
            case 0:
                return "zero" /* WebGPUConstants.BlendFactor.Zero */;
            case 1:
                return "one" /* WebGPUConstants.BlendFactor.One */;
            case 768:
                return "src" /* WebGPUConstants.BlendFactor.Src */;
            case 769:
                return "one-minus-src" /* WebGPUConstants.BlendFactor.OneMinusSrc */;
            case 770:
                return "src-alpha" /* WebGPUConstants.BlendFactor.SrcAlpha */;
            case 771:
                return "one-minus-src-alpha" /* WebGPUConstants.BlendFactor.OneMinusSrcAlpha */;
            case 772:
                return "dst-alpha" /* WebGPUConstants.BlendFactor.DstAlpha */;
            case 773:
                return "one-minus-dst-alpha" /* WebGPUConstants.BlendFactor.OneMinusDstAlpha */;
            case 774:
                return "dst" /* WebGPUConstants.BlendFactor.Dst */;
            case 775:
                return "one-minus-dst" /* WebGPUConstants.BlendFactor.OneMinusDst */;
            case 776:
                return "src-alpha-saturated" /* WebGPUConstants.BlendFactor.SrcAlphaSaturated */;
            case 32769:
                return "constant" /* WebGPUConstants.BlendFactor.Constant */;
            case 32770:
                return "one-minus-constant" /* WebGPUConstants.BlendFactor.OneMinusConstant */;
            case 32771:
                return "constant" /* WebGPUConstants.BlendFactor.Constant */;
            case 32772:
                return "one-minus-constant" /* WebGPUConstants.BlendFactor.OneMinusConstant */;
            case 35065:
                return "src1" /* WebGPUConstants.BlendFactor.Src1 */;
            case 35066:
                return "one-minus-src1" /* WebGPUConstants.BlendFactor.OneMinusSrc1 */;
            case 34185:
                return "src1-alpha" /* WebGPUConstants.BlendFactor.Src1Alpha */;
            case 35067:
                return "one-minus-src1-alpha" /* WebGPUConstants.BlendFactor.OneMinusSrc1Alpha */;
            default:
                return "one" /* WebGPUConstants.BlendFactor.One */;
        }
    }
    static _GetCompareFunction(compareFunction) {
        switch (compareFunction) {
            case 0: // NEVER
                return "never" /* WebGPUConstants.CompareFunction.Never */;
            case 1: // LESS
                return "less" /* WebGPUConstants.CompareFunction.Less */;
            case 2: // EQUAL
                return "equal" /* WebGPUConstants.CompareFunction.Equal */;
            case 3: // LEQUAL
                return "less-equal" /* WebGPUConstants.CompareFunction.LessEqual */;
            case 4: // GREATER
                return "greater" /* WebGPUConstants.CompareFunction.Greater */;
            case 5: // NOTEQUAL
                return "not-equal" /* WebGPUConstants.CompareFunction.NotEqual */;
            case 6: // GEQUAL
                return "greater-equal" /* WebGPUConstants.CompareFunction.GreaterEqual */;
            case 7: // ALWAYS
                return "always" /* WebGPUConstants.CompareFunction.Always */;
        }
        return "never" /* WebGPUConstants.CompareFunction.Never */;
    }
    static _GetStencilOpFunction(operation) {
        switch (operation) {
            case 0:
                return "zero" /* WebGPUConstants.StencilOperation.Zero */;
            case 1:
                return "keep" /* WebGPUConstants.StencilOperation.Keep */;
            case 2:
                return "replace" /* WebGPUConstants.StencilOperation.Replace */;
            case 3:
                return "increment-clamp" /* WebGPUConstants.StencilOperation.IncrementClamp */;
            case 4:
                return "decrement-clamp" /* WebGPUConstants.StencilOperation.DecrementClamp */;
            case 5:
                return "invert" /* WebGPUConstants.StencilOperation.Invert */;
            case 6:
                return "increment-wrap" /* WebGPUConstants.StencilOperation.IncrementWrap */;
            case 7:
                return "decrement-wrap" /* WebGPUConstants.StencilOperation.DecrementWrap */;
        }
        return "keep" /* WebGPUConstants.StencilOperation.Keep */;
    }
    static _GetVertexInputDescriptorFormat(vertexBuffer) {
        const type = vertexBuffer.type;
        const normalized = vertexBuffer.normalized;
        const size = vertexBuffer.getSize();
        switch (type) {
            case VertexBuffer.BYTE:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? "snorm8x2" /* WebGPUConstants.VertexFormat.Snorm8x2 */ : "sint8x2" /* WebGPUConstants.VertexFormat.Sint8x2 */;
                    case 3:
                    case 4:
                        return normalized ? "snorm8x4" /* WebGPUConstants.VertexFormat.Snorm8x4 */ : "sint8x4" /* WebGPUConstants.VertexFormat.Sint8x4 */;
                }
                break;
            case VertexBuffer.UNSIGNED_BYTE:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? "unorm8x2" /* WebGPUConstants.VertexFormat.Unorm8x2 */ : "uint8x2" /* WebGPUConstants.VertexFormat.Uint8x2 */;
                    case 3:
                    case 4:
                        return normalized ? "unorm8x4" /* WebGPUConstants.VertexFormat.Unorm8x4 */ : "uint8x4" /* WebGPUConstants.VertexFormat.Uint8x4 */;
                }
                break;
            case VertexBuffer.SHORT:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? "snorm16x2" /* WebGPUConstants.VertexFormat.Snorm16x2 */ : "sint16x2" /* WebGPUConstants.VertexFormat.Sint16x2 */;
                    case 3:
                    case 4:
                        return normalized ? "snorm16x4" /* WebGPUConstants.VertexFormat.Snorm16x4 */ : "sint16x4" /* WebGPUConstants.VertexFormat.Sint16x4 */;
                }
                break;
            case VertexBuffer.UNSIGNED_SHORT:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? "unorm16x2" /* WebGPUConstants.VertexFormat.Unorm16x2 */ : "uint16x2" /* WebGPUConstants.VertexFormat.Uint16x2 */;
                    case 3:
                    case 4:
                        return normalized ? "unorm16x4" /* WebGPUConstants.VertexFormat.Unorm16x4 */ : "uint16x4" /* WebGPUConstants.VertexFormat.Uint16x4 */;
                }
                break;
            case VertexBuffer.INT:
                switch (size) {
                    case 1:
                        return "sint32" /* WebGPUConstants.VertexFormat.Sint32 */;
                    case 2:
                        return "sint32x2" /* WebGPUConstants.VertexFormat.Sint32x2 */;
                    case 3:
                        return "sint32x3" /* WebGPUConstants.VertexFormat.Sint32x3 */;
                    case 4:
                        return "sint32x4" /* WebGPUConstants.VertexFormat.Sint32x4 */;
                }
                break;
            case VertexBuffer.UNSIGNED_INT:
                switch (size) {
                    case 1:
                        return "uint32" /* WebGPUConstants.VertexFormat.Uint32 */;
                    case 2:
                        return "uint32x2" /* WebGPUConstants.VertexFormat.Uint32x2 */;
                    case 3:
                        return "uint32x3" /* WebGPUConstants.VertexFormat.Uint32x3 */;
                    case 4:
                        return "uint32x4" /* WebGPUConstants.VertexFormat.Uint32x4 */;
                }
                break;
            case VertexBuffer.FLOAT:
                switch (size) {
                    case 1:
                        return "float32" /* WebGPUConstants.VertexFormat.Float32 */;
                    case 2:
                        return "float32x2" /* WebGPUConstants.VertexFormat.Float32x2 */;
                    case 3:
                        return "float32x3" /* WebGPUConstants.VertexFormat.Float32x3 */;
                    case 4:
                        return "float32x4" /* WebGPUConstants.VertexFormat.Float32x4 */;
                }
                break;
        }
        throw new Error(`Invalid Format '${vertexBuffer.getKind()}' - type=${type}, normalized=${normalized}, size=${size}`);
    }
    _getAphaBlendState() {
        if (!this._alphaBlendEnabled) {
            return null;
        }
        return {
            srcFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[2]),
            dstFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[3]),
            operation: WebGPUCacheRenderPipeline._GetAphaBlendOperation(this._alphaBlendEqParams[1]),
        };
    }
    _getColorBlendState() {
        if (!this._alphaBlendEnabled) {
            return null;
        }
        return {
            srcFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[0]),
            dstFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[1]),
            operation: WebGPUCacheRenderPipeline._GetAphaBlendOperation(this._alphaBlendEqParams[0]),
        };
    }
    _setShaderStage(id) {
        if (this._shaderId !== id) {
            this._shaderId = id;
            this._states[StatePosition.ShaderStage] = id;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.ShaderStage);
        }
    }
    _setRasterizationState(topology, sampleCount) {
        const frontFace = this._frontFace;
        const cullMode = this._cullEnabled ? this._cullFace : 0;
        const clampDepth = this._clampDepth ? 1 : 0;
        const alphaToCoverage = this._alphaToCoverageEnabled ? 1 : 0;
        const rasterizationState = frontFace - 1 + (cullMode << 1) + (clampDepth << 3) + (alphaToCoverage << 4) + (topology << 5) + (sampleCount << 8);
        if (this._rasterizationState !== rasterizationState) {
            this._rasterizationState = rasterizationState;
            this._states[StatePosition.RasterizationState] = this._rasterizationState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.RasterizationState);
        }
    }
    _setColorStates() {
        let colorStates = ((this._writeMask ? 1 : 0) << 22) + (this._colorFormat << 23) + ((this._depthWriteEnabled ? 1 : 0) << 29); // this state has been moved from depthStencilState here because alpha and depth are related (generally when alpha is on, depth write is off and the other way around)
        if (this._alphaBlendEnabled) {
            colorStates +=
                ((this._alphaBlendFuncParams[0] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[0]]) << 0) +
                    ((this._alphaBlendFuncParams[1] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[1]]) << 4) +
                    ((this._alphaBlendFuncParams[2] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[2]]) << 8) +
                    ((this._alphaBlendFuncParams[3] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[3]]) << 12) +
                    ((this._alphaBlendEqParams[0] === null ? 1 : this._alphaBlendEqParams[0] - 0x8005) << 16) +
                    ((this._alphaBlendEqParams[1] === null ? 1 : this._alphaBlendEqParams[1] - 0x8005) << 19);
        }
        if (colorStates !== this._colorStates) {
            this._colorStates = colorStates;
            this._states[StatePosition.ColorStates] = this._colorStates;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.ColorStates);
        }
    }
    _setDepthStencilState() {
        const stencilState = !this._stencilEnabled
            ? 7 /* ALWAYS */ + (1 /* KEEP */ << 3) + (1 /* KEEP */ << 6) + (1 /* KEEP */ << 9)
            : this._stencilFrontCompare + (this._stencilFrontDepthFailOp << 3) + (this._stencilFrontPassOp << 6) + (this._stencilFrontFailOp << 9);
        const depthStencilState = this._depthStencilFormat + ((this._depthTestEnabled ? this._depthCompare : 7) /* ALWAYS */ << 6) + (stencilState << 10); // stencil front - stencil back is the same
        if (this._depthStencilState !== depthStencilState) {
            this._depthStencilState = depthStencilState;
            this._states[StatePosition.DepthStencilState] = this._depthStencilState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.DepthStencilState);
        }
    }
    _setVertexState(effect) {
        const currStateLen = this._statesLength;
        let newNumStates = StatePosition.VertexState;
        const webgpuPipelineContext = effect._pipelineContext;
        const attributes = webgpuPipelineContext.shaderProcessingContext.attributeNamesFromEffect;
        const locations = webgpuPipelineContext.shaderProcessingContext.attributeLocationsFromEffect;
        let currentGPUBuffer;
        let numVertexBuffers = 0;
        for (let index = 0; index < attributes.length; index++) {
            const location = locations[index];
            let vertexBuffer = (this._overrideVertexBuffers && this._overrideVertexBuffers[attributes[index]]) ?? this._vertexBuffers[attributes[index]];
            if (!vertexBuffer) {
                // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                // So we must bind a dummy buffer when we are not given one for a specific attribute
                vertexBuffer = this._emptyVertexBuffer;
                if (WebGPUCacheRenderPipeline.LogErrorIfNoVertexBuffer) {
                    Logger.Error(`No vertex buffer is provided for the "${attributes[index]}" attribute. A default empty vertex buffer will be used, but this may generate errors in some browsers.`);
                }
            }
            const buffer = vertexBuffer.effectiveBuffer?.underlyingResource;
            // We optimize usage of GPUVertexBufferLayout: we will create a single GPUVertexBufferLayout for all the attributes which follow each other and which use the same GPU buffer
            // However, there are some constraints in the attribute.offset value range, so we must check for them before being able to reuse the same GPUVertexBufferLayout
            // See _getVertexInputDescriptor() below
            if (vertexBuffer._validOffsetRange === undefined) {
                const offset = vertexBuffer.effectiveByteOffset;
                const formatSize = vertexBuffer.getSize(true);
                const byteStride = vertexBuffer.effectiveByteStride;
                vertexBuffer._validOffsetRange =
                    (offset + formatSize <= this._kMaxVertexBufferStride && byteStride === 0) || (byteStride !== 0 && offset + formatSize <= byteStride);
            }
            if (!(currentGPUBuffer && currentGPUBuffer === buffer && vertexBuffer._validOffsetRange)) {
                // we can't combine the previous vertexBuffer with the current one
                this.vertexBuffers[numVertexBuffers++] = vertexBuffer;
                currentGPUBuffer = vertexBuffer._validOffsetRange ? buffer : null;
            }
            const vid = vertexBuffer.hashCode + (location << 7);
            this._isDirty = this._isDirty || this._states[newNumStates] !== vid;
            this._states[newNumStates++] = vid;
        }
        this.vertexBuffers.length = numVertexBuffers;
        this._statesLength = newNumStates;
        this._isDirty = this._isDirty || newNumStates !== currStateLen;
        if (this._isDirty) {
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.VertexState);
        }
    }
    _setTextureState(textureState) {
        if (this._textureState !== textureState) {
            this._textureState = textureState;
            this._states[StatePosition.TextureStage] = this._textureState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.TextureStage);
        }
    }
    _createPipelineLayout(webgpuPipelineContext) {
        if (this._useTextureStage) {
            return this._createPipelineLayoutWithTextureStage(webgpuPipelineContext);
        }
        const bindGroupLayouts = [];
        const bindGroupLayoutEntries = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries;
        for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
            const setDefinition = bindGroupLayoutEntries[i];
            bindGroupLayouts[i] = this._device.createBindGroupLayout({
                entries: setDefinition,
            });
        }
        webgpuPipelineContext.bindGroupLayouts[0] = bindGroupLayouts;
        return this._device.createPipelineLayout({ bindGroupLayouts });
    }
    _createPipelineLayoutWithTextureStage(webgpuPipelineContext) {
        const shaderProcessingContext = webgpuPipelineContext.shaderProcessingContext;
        const bindGroupLayoutEntries = shaderProcessingContext.bindGroupLayoutEntries;
        let bitVal = 1;
        for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
            const setDefinition = bindGroupLayoutEntries[i];
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = bindGroupLayoutEntries[i][j];
                if (entry.texture) {
                    const name = shaderProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding].name;
                    const textureInfo = shaderProcessingContext.availableTextures[name];
                    const samplerInfo = textureInfo.autoBindSampler ? shaderProcessingContext.availableSamplers[name + `Sampler`] : null;
                    let sampleType = textureInfo.sampleType;
                    let samplerType = samplerInfo?.type ?? "filtering" /* WebGPUConstants.SamplerBindingType.Filtering */;
                    if (this._textureState & bitVal && sampleType !== "depth" /* WebGPUConstants.TextureSampleType.Depth */) {
                        // The texture is a 32 bits float texture but the system does not support linear filtering for them OR the texture is a depth texture with "float" filtering:
                        // we set the sampler to "non-filtering" and the texture sample type to "unfilterable-float"
                        if (textureInfo.autoBindSampler) {
                            samplerType = "non-filtering" /* WebGPUConstants.SamplerBindingType.NonFiltering */;
                        }
                        sampleType = "unfilterable-float" /* WebGPUConstants.TextureSampleType.UnfilterableFloat */;
                    }
                    entry.texture.sampleType = sampleType;
                    if (samplerInfo) {
                        const binding = shaderProcessingContext.bindGroupLayoutEntryInfo[samplerInfo.binding.groupIndex][samplerInfo.binding.bindingIndex].index;
                        bindGroupLayoutEntries[samplerInfo.binding.groupIndex][binding].sampler.type = samplerType;
                    }
                    bitVal = bitVal << 1;
                }
            }
        }
        const bindGroupLayouts = [];
        for (let i = 0; i < bindGroupLayoutEntries.length; ++i) {
            bindGroupLayouts[i] = this._device.createBindGroupLayout({
                entries: bindGroupLayoutEntries[i],
            });
        }
        webgpuPipelineContext.bindGroupLayouts[this._textureState] = bindGroupLayouts;
        return this._device.createPipelineLayout({ bindGroupLayouts });
    }
    _getVertexInputDescriptor(effect) {
        const descriptors = [];
        const webgpuPipelineContext = effect._pipelineContext;
        const attributes = webgpuPipelineContext.shaderProcessingContext.attributeNamesFromEffect;
        const locations = webgpuPipelineContext.shaderProcessingContext.attributeLocationsFromEffect;
        let currentGPUBuffer;
        let currentGPUAttributes;
        for (let index = 0; index < attributes.length; index++) {
            const location = locations[index];
            let vertexBuffer = (this._overrideVertexBuffers && this._overrideVertexBuffers[attributes[index]]) ?? this._vertexBuffers[attributes[index]];
            if (!vertexBuffer) {
                // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                // So we must bind a dummy buffer when we are not given one for a specific attribute
                vertexBuffer = this._emptyVertexBuffer;
            }
            let buffer = vertexBuffer.effectiveBuffer?.underlyingResource;
            // We reuse the same GPUVertexBufferLayout for all attributes that use the same underlying GPU buffer (and for attributes that follow each other in the attributes array)
            let offset = vertexBuffer.effectiveByteOffset;
            const invalidOffsetRange = !vertexBuffer._validOffsetRange;
            if (!(currentGPUBuffer && currentGPUAttributes && currentGPUBuffer === buffer) || invalidOffsetRange) {
                const vertexBufferDescriptor = {
                    arrayStride: vertexBuffer.effectiveByteStride,
                    stepMode: vertexBuffer.getIsInstanced() ? "instance" /* WebGPUConstants.VertexStepMode.Instance */ : "vertex" /* WebGPUConstants.VertexStepMode.Vertex */,
                    attributes: [],
                };
                descriptors.push(vertexBufferDescriptor);
                currentGPUAttributes = vertexBufferDescriptor.attributes;
                if (invalidOffsetRange) {
                    offset = 0; // the offset will be set directly in the setVertexBuffer call
                    buffer = null; // buffer can't be reused
                }
            }
            currentGPUAttributes.push({
                shaderLocation: location,
                offset,
                format: WebGPUCacheRenderPipeline._GetVertexInputDescriptorFormat(vertexBuffer),
            });
            currentGPUBuffer = buffer;
        }
        return descriptors;
    }
    _createRenderPipeline(effect, topology, sampleCount) {
        const webgpuPipelineContext = effect._pipelineContext;
        const inputStateDescriptor = this._getVertexInputDescriptor(effect);
        const pipelineLayout = this._createPipelineLayout(webgpuPipelineContext);
        const colorStates = [];
        const alphaBlend = this._getAphaBlendState();
        const colorBlend = this._getColorBlendState();
        if (this._vertexBuffers) {
            checkNonFloatVertexBuffers(this._vertexBuffers, effect);
        }
        if (this._mrtAttachments1 > 0) {
            for (let i = 0; i < this._mrtFormats.length; ++i) {
                const format = this._mrtFormats[i];
                if (format) {
                    const descr = {
                        format,
                        writeMask: (this._mrtEnabledMask & (1 << i)) !== 0 ? this._writeMask : 0,
                    };
                    if (alphaBlend && colorBlend) {
                        descr.blend = {
                            alpha: alphaBlend,
                            color: colorBlend,
                        };
                    }
                    colorStates.push(descr);
                }
                else {
                    colorStates.push(null);
                }
            }
        }
        else {
            if (this._webgpuColorFormat[0]) {
                const descr = {
                    format: this._webgpuColorFormat[0],
                    writeMask: this._writeMask,
                };
                if (alphaBlend && colorBlend) {
                    descr.blend = {
                        alpha: alphaBlend,
                        color: colorBlend,
                    };
                }
                colorStates.push(descr);
            }
            else {
                colorStates.push(null);
            }
        }
        const stencilFrontBack = {
            compare: WebGPUCacheRenderPipeline._GetCompareFunction(this._stencilEnabled ? this._stencilFrontCompare : 7 /* ALWAYS */),
            depthFailOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontDepthFailOp : 1 /* KEEP */),
            failOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontFailOp : 1 /* KEEP */),
            passOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontPassOp : 1 /* KEEP */),
        };
        const topologyIsTriangle = topology === "triangle-list" /* WebGPUConstants.PrimitiveTopology.TriangleList */ || topology === "triangle-strip" /* WebGPUConstants.PrimitiveTopology.TriangleStrip */;
        let stripIndexFormat = undefined;
        if (topology === "line-strip" /* WebGPUConstants.PrimitiveTopology.LineStrip */ || topology === "triangle-strip" /* WebGPUConstants.PrimitiveTopology.TriangleStrip */) {
            stripIndexFormat = !this._indexBuffer || this._indexBuffer.is32Bits ? "uint32" /* WebGPUConstants.IndexFormat.Uint32 */ : "uint16" /* WebGPUConstants.IndexFormat.Uint16 */;
        }
        const depthStencilFormatHasStencil = this._webgpuDepthStencilFormat ? WebGPUTextureHelper.HasStencilAspect(this._webgpuDepthStencilFormat) : false;
        return this._device.createRenderPipeline({
            label: `RenderPipeline_${colorStates[0]?.format ?? "nooutput"}_${this._webgpuDepthStencilFormat ?? "nodepth"}_samples${sampleCount}_textureState${this._textureState}`,
            layout: pipelineLayout,
            vertex: {
                module: webgpuPipelineContext.stages.vertexStage.module,
                entryPoint: webgpuPipelineContext.stages.vertexStage.entryPoint,
                buffers: inputStateDescriptor,
            },
            primitive: {
                topology,
                stripIndexFormat,
                frontFace: this._frontFace === 1 ? "ccw" /* WebGPUConstants.FrontFace.CCW */ : "cw" /* WebGPUConstants.FrontFace.CW */,
                cullMode: !this._cullEnabled ? "none" /* WebGPUConstants.CullMode.None */ : this._cullFace === 2 ? "front" /* WebGPUConstants.CullMode.Front */ : "back" /* WebGPUConstants.CullMode.Back */,
            },
            fragment: !webgpuPipelineContext.stages.fragmentStage
                ? undefined
                : {
                    module: webgpuPipelineContext.stages.fragmentStage.module,
                    entryPoint: webgpuPipelineContext.stages.fragmentStage.entryPoint,
                    targets: colorStates,
                },
            multisample: {
                count: sampleCount,
                /*mask,
                alphaToCoverageEnabled,*/
            },
            depthStencil: this._webgpuDepthStencilFormat === undefined
                ? undefined
                : {
                    depthWriteEnabled: this._depthWriteEnabled,
                    depthCompare: this._depthTestEnabled ? WebGPUCacheRenderPipeline._GetCompareFunction(this._depthCompare) : "always" /* WebGPUConstants.CompareFunction.Always */,
                    format: this._webgpuDepthStencilFormat,
                    stencilFront: this._stencilEnabled && depthStencilFormatHasStencil ? stencilFrontBack : undefined,
                    stencilBack: this._stencilEnabled && depthStencilFormatHasStencil ? stencilFrontBack : undefined,
                    stencilReadMask: this._stencilEnabled && depthStencilFormatHasStencil ? this._stencilReadMask : undefined,
                    stencilWriteMask: this._stencilEnabled && depthStencilFormatHasStencil ? this._stencilWriteMask : undefined,
                    depthBias: this._depthBias,
                    depthBiasClamp: topologyIsTriangle ? this._depthBiasClamp : 0,
                    depthBiasSlopeScale: topologyIsTriangle ? this._depthBiasSlopeScale : 0,
                },
        });
    }
}
WebGPUCacheRenderPipeline.LogErrorIfNoVertexBuffer = false;
WebGPUCacheRenderPipeline.NumCacheHitWithoutHash = 0;
WebGPUCacheRenderPipeline.NumCacheHitWithHash = 0;
WebGPUCacheRenderPipeline.NumCacheMiss = 0;
WebGPUCacheRenderPipeline.NumPipelineCreationLastFrame = 0;
WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame = 0;
//# sourceMappingURL=webgpuCacheRenderPipeline.js.map