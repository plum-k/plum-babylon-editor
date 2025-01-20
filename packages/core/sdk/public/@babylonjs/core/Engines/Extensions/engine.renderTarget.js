import { InternalTexture } from "../../Materials/Textures/internalTexture.js";
import { Logger } from "../../Misc/logger.js";
import { ThinEngine } from "../thinEngine.js";
import { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper.js";

import "../AbstractEngine/abstractEngine.texture.js";
ThinEngine.prototype._createHardwareRenderTargetWrapper = function (isMulti, isCube, size) {
    const rtWrapper = new WebGLRenderTargetWrapper(isMulti, isCube, size, this, this._gl);
    this._renderTargetWrapperCache.push(rtWrapper);
    return rtWrapper;
};
ThinEngine.prototype.createRenderTargetTexture = function (size, options) {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size);
    let generateDepthBuffer = true;
    let generateStencilBuffer = false;
    let noColorAttachment = false;
    let colorAttachment = undefined;
    let samples = 1;
    let label = undefined;
    if (options !== undefined && typeof options === "object") {
        generateDepthBuffer = options.generateDepthBuffer ?? true;
        generateStencilBuffer = !!options.generateStencilBuffer;
        noColorAttachment = !!options.noColorAttachment;
        colorAttachment = options.colorAttachment;
        samples = options.samples ?? 1;
        label = options.label;
    }
    const texture = colorAttachment || (noColorAttachment ? null : this._createInternalTexture(size, options, true, 5 /* InternalTextureSource.RenderTarget */));
    const width = size.width || size;
    const height = size.height || size;
    const currentFrameBuffer = this._currentFramebuffer;
    const gl = this._gl;
    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height);
    // No need to rebind on every frame
    if (texture && !texture.is2DArray && !texture.is3D) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture.underlyingResource, 0);
    }
    this._bindUnboundFramebuffer(currentFrameBuffer);
    rtWrapper.label = label ?? "RenderTargetWrapper";
    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = generateDepthBuffer;
    rtWrapper._generateStencilBuffer = generateStencilBuffer;
    rtWrapper.setTextures(texture);
    if (!colorAttachment) {
        this.updateRenderTargetTextureSampleCount(rtWrapper, samples);
    }
    else {
        rtWrapper._samples = colorAttachment.samples;
        if (colorAttachment.samples > 1) {
            const msaaRenderBuffer = colorAttachment._hardwareTexture.getMSAARenderBuffer(0);
            rtWrapper._MSAAFramebuffer = gl.createFramebuffer();
            this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msaaRenderBuffer);
            this._bindUnboundFramebuffer(null);
        }
    }
    return rtWrapper;
};
ThinEngine.prototype._createDepthStencilTexture = function (size, options, rtWrapper) {
    const gl = this._gl;
    const layers = size.layers || 0;
    const depth = size.depth || 0;
    let target = gl.TEXTURE_2D;
    if (layers !== 0) {
        target = gl.TEXTURE_2D_ARRAY;
    }
    else if (depth !== 0) {
        target = gl.TEXTURE_3D;
    }
    const internalTexture = new InternalTexture(this, 12 /* InternalTextureSource.DepthStencil */);
    internalTexture.label = options.label;
    if (!this._caps.depthTextureExtension) {
        Logger.Error("Depth texture is not supported by your browser or hardware.");
        return internalTexture;
    }
    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options,
    };
    this._bindTextureDirectly(target, internalTexture, true);
    this._setupDepthStencilTexture(internalTexture, size, internalOptions.comparisonFunction === 0 ? false : internalOptions.bilinearFiltering, internalOptions.comparisonFunction, internalOptions.samples);
    if (internalOptions.depthTextureFormat !== undefined) {
        if (internalOptions.depthTextureFormat !== 15 &&
            internalOptions.depthTextureFormat !== 16 &&
            internalOptions.depthTextureFormat !== 17 &&
            internalOptions.depthTextureFormat !== 13 &&
            internalOptions.depthTextureFormat !== 14 &&
            internalOptions.depthTextureFormat !== 18) {
            Logger.Error(`Depth texture ${internalOptions.depthTextureFormat} format is not supported.`);
            return internalTexture;
        }
        internalTexture.format = internalOptions.depthTextureFormat;
    }
    else {
        internalTexture.format = internalOptions.generateStencil ? 13 : 16;
    }
    const hasStencil = internalTexture.format === 17 ||
        internalTexture.format === 13 ||
        internalTexture.format === 18;
    const type = this._getWebGLTextureTypeFromDepthTextureFormat(internalTexture.format);
    const format = hasStencil ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT;
    const internalFormat = this._getInternalFormatFromDepthTextureFormat(internalTexture.format, true, hasStencil);
    if (internalTexture.is2DArray) {
        gl.texImage3D(target, 0, internalFormat, internalTexture.width, internalTexture.height, layers, 0, format, type, null);
    }
    else if (internalTexture.is3D) {
        gl.texImage3D(target, 0, internalFormat, internalTexture.width, internalTexture.height, depth, 0, format, type, null);
    }
    else {
        gl.texImage2D(target, 0, internalFormat, internalTexture.width, internalTexture.height, 0, format, type, null);
    }
    this._bindTextureDirectly(target, null);
    this._internalTexturesCache.push(internalTexture);
    if (rtWrapper._depthStencilBuffer) {
        gl.deleteRenderbuffer(rtWrapper._depthStencilBuffer);
        rtWrapper._depthStencilBuffer = null;
    }
    this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer ?? rtWrapper._framebuffer);
    rtWrapper._generateStencilBuffer = hasStencil;
    rtWrapper._depthStencilTextureWithStencil = hasStencil;
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(rtWrapper._generateStencilBuffer, rtWrapper._generateDepthBuffer, rtWrapper.width, rtWrapper.height, rtWrapper.samples, internalTexture.format);
    this._bindUnboundFramebuffer(null);
    return internalTexture;
};
ThinEngine.prototype.updateRenderTargetTextureSampleCount = function (rtWrapper, samples) {
    if (this.webGLVersion < 2 || !rtWrapper) {
        return 1;
    }
    if (rtWrapper.samples === samples) {
        return samples;
    }
    const gl = this._gl;
    samples = Math.min(samples, this.getCaps().maxMSAASamples);
    // Dispose previous render buffers
    if (rtWrapper._depthStencilBuffer) {
        gl.deleteRenderbuffer(rtWrapper._depthStencilBuffer);
        rtWrapper._depthStencilBuffer = null;
    }
    if (rtWrapper._MSAAFramebuffer) {
        gl.deleteFramebuffer(rtWrapper._MSAAFramebuffer);
        rtWrapper._MSAAFramebuffer = null;
    }
    const hardwareTexture = rtWrapper.texture?._hardwareTexture;
    hardwareTexture?.releaseMSAARenderBuffers();
    if (rtWrapper.texture && samples > 1 && typeof gl.renderbufferStorageMultisample === "function") {
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }
        rtWrapper._MSAAFramebuffer = framebuffer;
        this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer);
        const colorRenderbuffer = this._createRenderBuffer(rtWrapper.texture.width, rtWrapper.texture.height, samples, -1 /* not used */, this._getRGBABufferInternalSizedFormat(rtWrapper.texture.type, rtWrapper.texture.format, rtWrapper.texture._useSRGBBuffer), gl.COLOR_ATTACHMENT0, false);
        if (!colorRenderbuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }
        hardwareTexture?.addMSAARenderBuffer(colorRenderbuffer);
    }
    this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer ?? rtWrapper._framebuffer);
    if (rtWrapper.texture) {
        rtWrapper.texture.samples = samples;
    }
    rtWrapper._samples = samples;
    const depthFormat = rtWrapper._depthStencilTexture ? rtWrapper._depthStencilTexture.format : undefined;
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(rtWrapper._generateStencilBuffer, rtWrapper._generateDepthBuffer, rtWrapper.width, rtWrapper.height, samples, depthFormat);
    this._bindUnboundFramebuffer(null);
    return samples;
};
ThinEngine.prototype._setupDepthStencilTexture = function (internalTexture, size, bilinearFiltering, comparisonFunction, samples = 1) {
    const width = size.width ?? size;
    const height = size.height ?? size;
    const layers = size.layers || 0;
    const depth = size.depth || 0;
    internalTexture.baseWidth = width;
    internalTexture.baseHeight = height;
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.is2DArray = layers > 0;
    internalTexture.depth = layers || depth;
    internalTexture.isReady = true;
    internalTexture.samples = samples;
    internalTexture.generateMipMaps = false;
    internalTexture.samplingMode = bilinearFiltering ? 2 : 1;
    internalTexture.type = 0;
    internalTexture._comparisonFunction = comparisonFunction;
    const gl = this._gl;
    const target = this._getTextureTarget(internalTexture);
    const samplingParameters = this._getSamplingParameters(internalTexture.samplingMode, false);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // TEXTURE_COMPARE_FUNC/MODE are only availble in WebGL2.
    if (this.webGLVersion > 1) {
        if (comparisonFunction === 0) {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, 515);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        }
        else {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        }
    }
};
//# sourceMappingURL=engine.renderTarget.js.map