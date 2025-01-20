import { InternalTexture } from "../../Materials/Textures/internalTexture.js";
import { Logger } from "../../Misc/logger.js";
import { LoadImage } from "../../Misc/fileTools.js";
import { RandomGUID } from "../../Misc/guid.js";
import { AbstractEngine } from "../abstractEngine.js";
import { _GetCompatibleTextureLoader } from "../../Materials/Textures/Loaders/textureLoaderManager.js";
AbstractEngine.prototype._partialLoadFile = function (url, index, loadedFiles, onfinish, onErrorCallBack = null) {
    const onload = (data) => {
        loadedFiles[index] = data;
        loadedFiles._internalCount++;
        if (loadedFiles._internalCount === 6) {
            onfinish(loadedFiles);
        }
    };
    const onerror = (request, exception) => {
        if (onErrorCallBack && request) {
            onErrorCallBack(request.status + " " + request.statusText, exception);
        }
    };
    this._loadFile(url, onload, undefined, undefined, true, onerror);
};
AbstractEngine.prototype._cascadeLoadFiles = function (scene, onfinish, files, onError = null) {
    const loadedFiles = [];
    loadedFiles._internalCount = 0;
    for (let index = 0; index < 6; index++) {
        this._partialLoadFile(files[index], index, loadedFiles, onfinish, onError);
    }
};
AbstractEngine.prototype._cascadeLoadImgs = function (scene, texture, onfinish, files, onError = null, mimeType) {
    const loadedImages = [];
    loadedImages._internalCount = 0;
    for (let index = 0; index < 6; index++) {
        this._partialLoadImg(files[index], index, loadedImages, scene, texture, onfinish, onError, mimeType);
    }
};
AbstractEngine.prototype._partialLoadImg = function (url, index, loadedImages, scene, texture, onfinish, onErrorCallBack = null, mimeType) {
    const tokenPendingData = RandomGUID();
    const onload = (img) => {
        loadedImages[index] = img;
        loadedImages._internalCount++;
        if (scene) {
            scene.removePendingData(tokenPendingData);
        }
        if (loadedImages._internalCount === 6 && onfinish) {
            onfinish(texture, loadedImages);
        }
    };
    const onerror = (message, exception) => {
        if (scene) {
            scene.removePendingData(tokenPendingData);
        }
        if (onErrorCallBack) {
            onErrorCallBack(message, exception);
        }
    };
    LoadImage(url, onload, onerror, scene ? scene.offlineProvider : null, mimeType);
    if (scene) {
        scene.addPendingData(tokenPendingData);
    }
};
AbstractEngine.prototype.createCubeTextureBase = function (rootUrl, scene, files, noMipmap, onLoad = null, onError = null, format, forcedExtension = null, createPolynomials = false, lodScale = 0, lodOffset = 0, fallback = null, beforeLoadCubeDataCallback = null, imageHandler = null, useSRGBBuffer = false, buffer = null) {
    const texture = fallback ? fallback : new InternalTexture(this, 7 /* InternalTextureSource.Cube */);
    texture.isCube = true;
    texture.url = rootUrl;
    texture.generateMipMaps = !noMipmap;
    texture._lodGenerationScale = lodScale;
    texture._lodGenerationOffset = lodOffset;
    texture._useSRGBBuffer = !!useSRGBBuffer && this._caps.supportSRGBBuffers && (this.version > 1 || this.isWebGPU || !!noMipmap);
    if (texture !== fallback) {
        texture.label = rootUrl.substring(0, 60); // default label, can be overriden by the caller
    }
    if (!this._doNotHandleContextLost) {
        texture._extension = forcedExtension;
        texture._files = files;
        texture._buffer = buffer;
    }
    const originalRootUrl = rootUrl;
    if (this._transformTextureUrl && !fallback) {
        rootUrl = this._transformTextureUrl(rootUrl);
    }
    const rootUrlWithoutUriParams = rootUrl.split("?")[0];
    const lastDot = rootUrlWithoutUriParams.lastIndexOf(".");
    const extension = forcedExtension ? forcedExtension : lastDot > -1 ? rootUrlWithoutUriParams.substring(lastDot).toLowerCase() : "";
    const loaderPromise = _GetCompatibleTextureLoader(extension);
    const onInternalError = (request, exception) => {
        if (rootUrl === originalRootUrl) {
            if (onError && request) {
                onError(request.status + " " + request.statusText, exception);
            }
        }
        else {
            // fall back to the original url if the transformed url fails to load
            Logger.Warn(`Failed to load ${rootUrl}, falling back to the ${originalRootUrl}`);
            this.createCubeTextureBase(originalRootUrl, scene, files, !!noMipmap, onLoad, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset, texture, beforeLoadCubeDataCallback, imageHandler, useSRGBBuffer, buffer);
        }
    };
    if (loaderPromise) {
        loaderPromise.then((loader) => {
            const onloaddata = (data) => {
                if (beforeLoadCubeDataCallback) {
                    beforeLoadCubeDataCallback(texture, data);
                }
                loader.loadCubeData(data, texture, createPolynomials, onLoad, onError);
            };
            if (buffer) {
                onloaddata(buffer);
            }
            else if (files && files.length === 6) {
                if (loader.supportCascades) {
                    this._cascadeLoadFiles(scene, (images) => onloaddata(images.map((image) => new Uint8Array(image))), files, onError);
                }
                else {
                    if (onError) {
                        onError("Textures type does not support cascades.");
                    }
                    else {
                        Logger.Warn("Texture loader does not support cascades.");
                    }
                }
            }
            else {
                this._loadFile(rootUrl, (data) => onloaddata(new Uint8Array(data)), undefined, undefined, true, onInternalError);
            }
        });
    }
    else {
        if (!files || files.length === 0) {
            throw new Error("Cannot load cubemap because files were not defined, or the correct loader was not found.");
        }
        this._cascadeLoadImgs(scene, texture, (texture, imgs) => {
            if (imageHandler) {
                imageHandler(texture, imgs);
            }
        }, files, onError);
    }
    this._internalTexturesCache.push(texture);
    return texture;
};
//# sourceMappingURL=abstractEngine.cubeTexture.js.map