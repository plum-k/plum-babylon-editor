import { InternalTexture } from "../../Materials/Textures/internalTexture.js";
import { Logger } from "../../Misc/logger.js";

import { ThinEngine } from "../thinEngine.js";
ThinEngine.prototype.createRenderTargetCubeTexture = function (size, options) {
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
    const gl = this._gl;
    const texture = new InternalTexture(this, 5 /* InternalTextureSource.RenderTarget */);
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
    const filters = this._getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps);
    if (fullOptions.type === 1 && !this._caps.textureFloat) {
        fullOptions.type = 0;
        Logger.Warn("Float textures are not supported. Cube render target forced to TEXTURETYPE_UNESIGNED_BYTE type");
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    for (let face = 0; face < 6; face++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, this._getRGBABufferInternalSizedFormat(fullOptions.type, fullOptions.format), size, size, 0, this._getInternalFormat(fullOptions.format), this._getWebGLTextureType(fullOptions.type), null);
    }
    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer, fullOptions.generateDepthBuffer, size, size);
    // MipMaps
    if (fullOptions.generateMipMaps) {
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    }
    // Unbind
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
    this._bindUnboundFramebuffer(null);
    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer;
    texture.width = size;
    texture.height = size;
    texture.isReady = true;
    texture.isCube = true;
    texture.samples = 1;
    texture.generateMipMaps = fullOptions.generateMipMaps;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;
    this._internalTexturesCache.push(texture);
    rtWrapper.setTextures(texture);
    return rtWrapper;
};
//# sourceMappingURL=engine.renderTargetCube.js.map