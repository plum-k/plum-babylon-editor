import { ThinWebGPUEngine } from "../../thinWebGPUEngine.js";
ThinWebGPUEngine.prototype._readTexturePixels = function (texture, width, height, faceIndex = -1, level = 0, buffer = null, flushRenderer = true, noDataConversion = false, x = 0, y = 0) {
    const gpuTextureWrapper = texture._hardwareTexture;
    if (flushRenderer) {
        this.flushFramebuffer();
    }
    return this._textureHelper.readPixels(gpuTextureWrapper.underlyingResource, x, y, width, height, gpuTextureWrapper.format, faceIndex, level, buffer, noDataConversion);
};
ThinWebGPUEngine.prototype._readTexturePixelsSync = function () {
    // eslint-disable-next-line no-throw-literal
    throw "_readTexturePixelsSync is unsupported in WebGPU!";
};
//# sourceMappingURL=engine.readTexture.js.map