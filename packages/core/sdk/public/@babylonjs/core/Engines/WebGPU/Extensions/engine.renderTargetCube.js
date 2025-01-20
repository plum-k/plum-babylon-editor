import { ThinWebGPUEngine } from "../../thinWebGPUEngine.js";
import { InternalTexture } from "../../../Materials/Textures/internalTexture.js";

ThinWebGPUEngine.prototype.createRenderTargetCubeTexture = function (size, options) {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, true, size);
    const fullOptions = {
        generateMipMaps: true,
        generateDepthBuffer: true,
        generateStencilBuffer: false,
        type: 0,
        samplingMode: 3,
        format: 5,
        samples: 1,
        ...options,
    };
    fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;
    rtWrapper.label = fullOptions.label ?? "RenderTargetWrapper";
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer;
    const texture = new InternalTexture(this, 5 /* InternalTextureSource.RenderTarget */);
    texture.width = size;
    texture.height = size;
    texture.depth = 0;
    texture.isReady = true;
    texture.isCube = true;
    texture.samples = fullOptions.samples;
    texture.generateMipMaps = fullOptions.generateMipMaps;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;
    this._internalTexturesCache.push(texture);
    rtWrapper.setTextures(texture);
    if (rtWrapper._generateDepthBuffer || rtWrapper._generateStencilBuffer) {
        rtWrapper.createDepthStencilTexture(0, fullOptions.samplingMode === undefined ||
            fullOptions.samplingMode === 2 ||
            fullOptions.samplingMode === 2 ||
            fullOptions.samplingMode === 3 ||
            fullOptions.samplingMode === 3 ||
            fullOptions.samplingMode === 5 ||
            fullOptions.samplingMode === 6 ||
            fullOptions.samplingMode === 7 ||
            fullOptions.samplingMode === 11, rtWrapper._generateStencilBuffer, rtWrapper.samples);
    }
    if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = true;
    }
    this._textureHelper.createGPUTextureForInternalTexture(texture);
    if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = false;
    }
    return rtWrapper;
};
//# sourceMappingURL=engine.renderTargetCube.js.map