import { InternalTexture } from "../../../Materials/Textures/internalTexture.js";

import { Logger } from "../../../Misc/logger.js";
import { ThinWebGPUEngine } from "../../thinWebGPUEngine.js";
ThinWebGPUEngine.prototype.createRawTexture = function (data, width, height, format, generateMipMaps, invertY, samplingMode, compression = null, type = 0, creationFlags = 0, useSRGBBuffer = false) {
    const texture = new InternalTexture(this, 3 /* InternalTextureSource.Raw */);
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.format = format;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    texture.invertY = invertY;
    texture._compression = compression;
    texture.type = type;
    texture._creationFlags = creationFlags;
    texture._useSRGBBuffer = useSRGBBuffer;
    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }
    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);
    this.updateRawTexture(texture, data, format, invertY, compression, type, useSRGBBuffer);
    this._internalTexturesCache.push(texture);
    return texture;
};
ThinWebGPUEngine.prototype.updateRawTexture = function (texture, bufferView, format, invertY, compression = null, type = 0, useSRGBBuffer = false) {
    if (!texture) {
        return;
    }
    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.invertY = invertY;
        texture._compression = compression;
        texture._useSRGBBuffer = useSRGBBuffer;
    }
    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture;
        const needConversion = format === 4;
        if (needConversion) {
            bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, type);
        }
        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }
    texture.isReady = true;
};
ThinWebGPUEngine.prototype.createRawCubeTexture = function (data, size, format, type, generateMipMaps, invertY, samplingMode, compression = null) {
    const texture = new InternalTexture(this, 8 /* InternalTextureSource.CubeRaw */);
    if (type === 1 && !this._caps.textureFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = 1;
        Logger.Warn("Float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    }
    else if (type === 2 && !this._caps.textureHalfFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = 1;
        Logger.Warn("Half float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    }
    else if (type === 1 && !this._caps.textureFloatRender) {
        generateMipMaps = false;
        Logger.Warn("Render to float textures is not supported. Mipmap generation forced to false.");
    }
    else if (type === 2 && !this._caps.colorBufferFloat) {
        generateMipMaps = false;
        Logger.Warn("Render to half float textures is not supported. Mipmap generation forced to false.");
    }
    texture.isCube = true;
    texture._originalFormat = format;
    texture.format = format === 4 ? 5 : format;
    texture.type = type;
    texture.generateMipMaps = generateMipMaps;
    texture.width = size;
    texture.height = size;
    texture.samplingMode = samplingMode;
    if (!this._doNotHandleContextLost) {
        texture._bufferViewArray = data;
    }
    texture.invertY = invertY;
    texture._compression = compression;
    texture._cachedWrapU = 0;
    texture._cachedWrapV = 0;
    this._textureHelper.createGPUTextureForInternalTexture(texture);
    if (format === 4) {
        const gpuTextureWrapper = texture._hardwareTexture;
        gpuTextureWrapper._originalFormatIsRGB = true;
    }
    if (data) {
        this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
    }
    texture.isReady = true;
    return texture;
};
ThinWebGPUEngine.prototype.updateRawCubeTexture = function (texture, bufferView, _format, type, invertY, compression = null) {
    texture._bufferViewArray = bufferView;
    texture.invertY = invertY;
    texture._compression = compression;
    const gpuTextureWrapper = texture._hardwareTexture;
    const needConversion = gpuTextureWrapper._originalFormatIsRGB;
    const faces = [0, 2, 4, 1, 3, 5];
    const data = [];
    for (let i = 0; i < bufferView.length; ++i) {
        let faceData = bufferView[faces[i]];
        if (needConversion) {
            faceData = _convertRGBtoRGBATextureData(faceData, texture.width, texture.height, type);
        }
        data.push(new Uint8Array(faceData.buffer, faceData.byteOffset, faceData.byteLength));
    }
    this._textureHelper.updateCubeTextures(data, gpuTextureWrapper.underlyingResource, texture.width, texture.height, gpuTextureWrapper.format, invertY, false, 0, 0);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture, this._uploadEncoder);
    }
    texture.isReady = true;
};
ThinWebGPUEngine.prototype.createRawCubeTextureFromUrl = function (url, scene, size, format, type, noMipmap, callback, mipmapGenerator, onLoad = null, onError = null, samplingMode = 3, invertY = false) {
    const texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode, null);
    scene?.addPendingData(texture);
    texture.url = url;
    texture.isReady = false;
    this._internalTexturesCache.push(texture);
    const onerror = (request, exception) => {
        scene?.removePendingData(texture);
        if (onError && request) {
            onError(request.status + " " + request.statusText, exception);
        }
    };
    const internalCallback = (data) => {
        const width = texture.width;
        const faceDataArrays = callback(data);
        if (!faceDataArrays) {
            return;
        }
        if (mipmapGenerator) {
            const needConversion = format === 4;
            const mipData = mipmapGenerator(faceDataArrays);
            const gpuTextureWrapper = texture._hardwareTexture;
            const faces = [0, 1, 2, 3, 4, 5];
            for (let level = 0; level < mipData.length; level++) {
                const mipSize = width >> level;
                const allFaces = [];
                for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                    let mipFaceData = mipData[level][faces[faceIndex]];
                    if (needConversion) {
                        mipFaceData = _convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                    }
                    allFaces.push(new Uint8Array(mipFaceData.buffer, mipFaceData.byteOffset, mipFaceData.byteLength));
                }
                this._textureHelper.updateCubeTextures(allFaces, gpuTextureWrapper.underlyingResource, mipSize, mipSize, gpuTextureWrapper.format, invertY, false, 0, 0);
            }
        }
        else {
            this.updateRawCubeTexture(texture, faceDataArrays, format, type, invertY);
        }
        texture.isReady = true;
        scene?.removePendingData(texture);
        if (onLoad) {
            onLoad();
        }
    };
    this._loadFile(url, (data) => {
        internalCallback(data);
    }, undefined, scene?.offlineProvider, true, onerror);
    return texture;
};
ThinWebGPUEngine.prototype.createRawTexture3D = function (data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression = null, textureType = 0, creationFlags = 0) {
    const source = 10 /* InternalTextureSource.Raw3D */;
    const texture = new InternalTexture(this, source);
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
    texture.is3D = true;
    texture._creationFlags = creationFlags;
    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }
    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);
    this.updateRawTexture3D(texture, data, format, invertY, compression, textureType);
    this._internalTexturesCache.push(texture);
    return texture;
};
ThinWebGPUEngine.prototype.updateRawTexture3D = function (texture, bufferView, format, invertY, compression = null, textureType = 0) {
    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
    }
    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture;
        const needConversion = format === 4;
        if (needConversion) {
            bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
        }
        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }
    texture.isReady = true;
};
ThinWebGPUEngine.prototype.createRawTexture2DArray = function (data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression = null, textureType = 0, creationFlags = 0) {
    const source = 11 /* InternalTextureSource.Raw2DArray */;
    const texture = new InternalTexture(this, source);
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
    texture._creationFlags = creationFlags;
    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }
    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, depth, creationFlags);
    this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);
    this._internalTexturesCache.push(texture);
    return texture;
};
ThinWebGPUEngine.prototype.updateRawTexture2DArray = function (texture, bufferView, format, invertY, compression = null, textureType = 0) {
    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
    }
    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture;
        const needConversion = format === 4;
        if (needConversion) {
            bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
        }
        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }
    texture.isReady = true;
};
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _convertRGBtoRGBATextureData(rgbData, width, height, textureType) {
    // Create new RGBA data container.
    let rgbaData;
    let val1 = 1;
    if (textureType === 1) {
        rgbaData = new Float32Array(width * height * 4);
    }
    else if (textureType === 2) {
        rgbaData = new Uint16Array(width * height * 4);
        val1 = 15360; // 15360 is the encoding of 1 in half float
    }
    else if (textureType === 7) {
        rgbaData = new Uint32Array(width * height * 4);
    }
    else {
        rgbaData = new Uint8Array(width * height * 4);
    }
    // Convert each pixel.
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const index = (y * width + x) * 3;
            const newIndex = (y * width + x) * 4;
            // Map Old Value to new value.
            rgbaData[newIndex + 0] = rgbData[index + 0];
            rgbaData[newIndex + 1] = rgbData[index + 1];
            rgbaData[newIndex + 2] = rgbData[index + 2];
            // Add fully opaque alpha channel.
            rgbaData[newIndex + 3] = val1;
        }
    }
    return rgbaData;
}
//# sourceMappingURL=engine.rawTexture.js.map