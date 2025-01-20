import { InternalTexture } from "../../../Materials/Textures/internalTexture.js";
import { WebGPUEngine } from "../../webgpuEngine.js";
import { GetExponentOfTwo } from "../../../Misc/tools.functions.js";
WebGPUEngine.prototype.createDynamicTexture = function (width, height, generateMipMaps, samplingMode) {
    const texture = new InternalTexture(this, 4 /* InternalTextureSource.Dynamic */);
    texture.baseWidth = width;
    texture.baseHeight = height;
    if (generateMipMaps) {
        width = this.needPOTTextures ? GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
        height = this.needPOTTextures ? GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
    }
    texture.width = width;
    texture.height = height;
    texture.isReady = false;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    this.updateTextureSamplingMode(samplingMode, texture);
    this._internalTexturesCache.push(texture);
    if (width && height) {
        this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
    }
    return texture;
};
WebGPUEngine.prototype.updateDynamicTexture = function (texture, source, invertY, premulAlpha = false, format, forceBindTexture, allowGPUOptimization) {
    if (!texture) {
        return;
    }
    const width = source.width, height = source.height;
    let gpuTextureWrapper = texture._hardwareTexture;
    if (!texture._hardwareTexture?.underlyingResource) {
        gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
    }
    this._textureHelper.updateTexture(source, texture, width, height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, premulAlpha, 0, 0, allowGPUOptimization);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture);
    }
    texture._dynamicTextureSource = source;
    texture._premulAlpha = premulAlpha;
    texture.invertY = invertY || false;
    texture.isReady = true;
};
//# sourceMappingURL=engine.dynamicTexture.js.map