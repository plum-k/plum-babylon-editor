import { WebGPUEngine } from "../../webgpuEngine.js";
function IsExternalTexture(texture) {
    return texture && texture.underlyingResource !== undefined ? true : false;
}
WebGPUEngine.prototype.updateVideoTexture = function (texture, video, invertY) {
    if (!texture || texture._isDisabled) {
        return;
    }
    if (this._videoTextureSupported === undefined) {
        this._videoTextureSupported = true;
    }
    let gpuTextureWrapper = texture._hardwareTexture;
    if (!texture._hardwareTexture?.underlyingResource) {
        gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
    }
    if (IsExternalTexture(video)) {
        if (video.isReady()) {
            try {
                this._textureHelper.copyVideoToTexture(video, texture, gpuTextureWrapper.format, !invertY);
                if (texture.generateMipMaps) {
                    this._generateMipmaps(texture);
                }
            }
            catch (e) {
                // WebGPU doesn't support video element who are not playing so far
                // Ignore this error ensures we can start a video texture in a paused state
            }
            texture.isReady = true;
        }
    }
    else if (video) {
        this.createImageBitmap(video)
            .then((bitmap) => {
            this._textureHelper.updateTexture(bitmap, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, !invertY, false, 0, 0);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture);
            }
            texture.isReady = true;
        })
            .catch(() => {
            // Sometimes createImageBitmap(video) fails with "Failed to execute 'createImageBitmap' on 'Window': The provided element's player has no current data."
            // Just keep going on
            texture.isReady = true;
        });
    }
};
//# sourceMappingURL=engine.videoTexture.js.map