import { Tools } from "./tools.js";
import { Texture } from "../Materials/Textures/texture.js";
import { InternalTexture } from "../Materials/Textures/internalTexture.js";

import { initializeWebWorker, workerFunction } from "./basisWorker.js";
/**
 * Info about the .basis files
 */
export class BasisFileInfo {
}
/**
 * Result of transcoding a basis file
 */
class TranscodeResult {
}
/**
 * Configuration options for the Basis transcoder
 */
export class BasisTranscodeConfiguration {
}
/**
 * @internal
 * Enum of basis transcoder formats
 */
var BASIS_FORMATS;
(function (BASIS_FORMATS) {
    BASIS_FORMATS[BASIS_FORMATS["cTFETC1"] = 0] = "cTFETC1";
    BASIS_FORMATS[BASIS_FORMATS["cTFETC2"] = 1] = "cTFETC2";
    BASIS_FORMATS[BASIS_FORMATS["cTFBC1"] = 2] = "cTFBC1";
    BASIS_FORMATS[BASIS_FORMATS["cTFBC3"] = 3] = "cTFBC3";
    BASIS_FORMATS[BASIS_FORMATS["cTFBC4"] = 4] = "cTFBC4";
    BASIS_FORMATS[BASIS_FORMATS["cTFBC5"] = 5] = "cTFBC5";
    BASIS_FORMATS[BASIS_FORMATS["cTFBC7"] = 6] = "cTFBC7";
    BASIS_FORMATS[BASIS_FORMATS["cTFPVRTC1_4_RGB"] = 8] = "cTFPVRTC1_4_RGB";
    BASIS_FORMATS[BASIS_FORMATS["cTFPVRTC1_4_RGBA"] = 9] = "cTFPVRTC1_4_RGBA";
    BASIS_FORMATS[BASIS_FORMATS["cTFASTC_4x4"] = 10] = "cTFASTC_4x4";
    BASIS_FORMATS[BASIS_FORMATS["cTFATC_RGB"] = 11] = "cTFATC_RGB";
    BASIS_FORMATS[BASIS_FORMATS["cTFATC_RGBA_INTERPOLATED_ALPHA"] = 12] = "cTFATC_RGBA_INTERPOLATED_ALPHA";
    BASIS_FORMATS[BASIS_FORMATS["cTFRGBA32"] = 13] = "cTFRGBA32";
    BASIS_FORMATS[BASIS_FORMATS["cTFRGB565"] = 14] = "cTFRGB565";
    BASIS_FORMATS[BASIS_FORMATS["cTFBGR565"] = 15] = "cTFBGR565";
    BASIS_FORMATS[BASIS_FORMATS["cTFRGBA4444"] = 16] = "cTFRGBA4444";
    BASIS_FORMATS[BASIS_FORMATS["cTFFXT1_RGB"] = 17] = "cTFFXT1_RGB";
    BASIS_FORMATS[BASIS_FORMATS["cTFPVRTC2_4_RGB"] = 18] = "cTFPVRTC2_4_RGB";
    BASIS_FORMATS[BASIS_FORMATS["cTFPVRTC2_4_RGBA"] = 19] = "cTFPVRTC2_4_RGBA";
    BASIS_FORMATS[BASIS_FORMATS["cTFETC2_EAC_R11"] = 20] = "cTFETC2_EAC_R11";
    BASIS_FORMATS[BASIS_FORMATS["cTFETC2_EAC_RG11"] = 21] = "cTFETC2_EAC_RG11";
})(BASIS_FORMATS || (BASIS_FORMATS = {}));
/**
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export const BasisToolsOptions = {
    /**
     * URL to use when loading the basis transcoder
     */
    JSModuleURL: `${Tools._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.js`,
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    WasmModuleURL: `${Tools._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.wasm`,
};
/**
 * Get the internal format to be passed to texImage2D corresponding to the .basis format value
 * @param basisFormat format chosen from GetSupportedTranscodeFormat
 * @param engine
 * @returns internal format corresponding to the Basis format
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GetInternalFormatFromBasisFormat = (basisFormat, engine) => {
    let format;
    switch (basisFormat) {
        case BASIS_FORMATS.cTFETC1:
            format = 36196;
            break;
        case BASIS_FORMATS.cTFBC1:
            format = 33776;
            break;
        case BASIS_FORMATS.cTFBC4:
            format = 33779;
            break;
        case BASIS_FORMATS.cTFASTC_4x4:
            format = 37808;
            break;
        case BASIS_FORMATS.cTFETC2:
            format = 37496;
            break;
        case BASIS_FORMATS.cTFBC7:
            format = 36492;
            break;
    }
    if (format === undefined) {
        // eslint-disable-next-line no-throw-literal
        throw "The chosen Basis transcoder format is not currently supported";
    }
    return format;
};
let _WorkerPromise = null;
let _Worker = null;
let _actionId = 0;
const _IgnoreSupportedFormats = false;
const _CreateWorkerAsync = () => {
    if (!_WorkerPromise) {
        _WorkerPromise = new Promise((res, reject) => {
            if (_Worker) {
                res(_Worker);
            }
            else {
                Tools.LoadFileAsync(Tools.GetBabylonScriptURL(BasisToolsOptions.WasmModuleURL))
                    .then((wasmBinary) => {
                    if (typeof URL !== "function") {
                        return reject("Basis transcoder requires an environment with a URL constructor");
                    }
                    const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunction})()`], { type: "application/javascript" }));
                    _Worker = new Worker(workerBlobUrl);
                    initializeWebWorker(_Worker, wasmBinary, BasisToolsOptions.JSModuleURL).then(res, reject);
                })
                    .catch(reject);
            }
        });
    }
    return _WorkerPromise;
};
/**
 * Set the worker to use for transcoding
 * @param worker The worker that will be used for transcoding
 */
export const SetBasisTranscoderWorker = (worker) => {
    _Worker = worker;
};
/**
 * Transcodes a loaded image file to compressed pixel data
 * @param data image data to transcode
 * @param config configuration options for the transcoding
 * @returns a promise resulting in the transcoded image
 */
export const TranscodeAsync = (data, config) => {
    const dataView = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    return new Promise((res, rej) => {
        _CreateWorkerAsync().then(() => {
            const actionId = _actionId++;
            const messageHandler = (msg) => {
                if (msg.data.action === "transcode" && msg.data.id === actionId) {
                    _Worker.removeEventListener("message", messageHandler);
                    if (!msg.data.success) {
                        rej("Transcode is not supported on this device");
                    }
                    else {
                        res(msg.data);
                    }
                }
            };
            _Worker.addEventListener("message", messageHandler);
            const dataViewCopy = new Uint8Array(dataView.byteLength);
            dataViewCopy.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength));
            _Worker.postMessage({ action: "transcode", id: actionId, imageData: dataViewCopy, config: config, ignoreSupportedFormats: _IgnoreSupportedFormats }, [
                dataViewCopy.buffer,
            ]);
        }, (error) => {
            rej(error);
        });
    });
};
/**
 * Binds a texture according to its underlying target.
 * @param texture texture to bind
 * @param engine the engine to bind the texture in
 */
const BindTexture = (texture, engine) => {
    let target = engine._gl?.TEXTURE_2D;
    if (texture.isCube) {
        target = engine._gl?.TEXTURE_CUBE_MAP;
    }
    engine._bindTextureDirectly(target, texture, true);
};
/**
 * Loads a texture from the transcode result
 * @param texture texture load to
 * @param transcodeResult the result of transcoding the basis file to load from
 */
export const LoadTextureFromTranscodeResult = (texture, transcodeResult) => {
    const engine = texture.getEngine();
    for (let i = 0; i < transcodeResult.fileInfo.images.length; i++) {
        const rootImage = transcodeResult.fileInfo.images[i].levels[0];
        texture._invertVScale = texture.invertY;
        if (transcodeResult.format === -1 || transcodeResult.format === BASIS_FORMATS.cTFRGB565) {
            // No compatable compressed format found, fallback to RGB
            texture.type = 10;
            texture.format = 4;
            if (engine._features.basisNeedsPOT && (Math.log2(rootImage.width) % 1 !== 0 || Math.log2(rootImage.height) % 1 !== 0)) {
                // Create non power of two texture
                const source = new InternalTexture(engine, 2 /* InternalTextureSource.Temp */);
                texture._invertVScale = texture.invertY;
                source.type = 10;
                source.format = 4;
                // Fallback requires aligned width/height
                source.width = (rootImage.width + 3) & ~3;
                source.height = (rootImage.height + 3) & ~3;
                BindTexture(source, engine);
                engine._uploadDataToTextureDirectly(source, new Uint16Array(rootImage.transcodedPixels.buffer), i, 0, 4, true);
                // Resize to power of two
                engine._rescaleTexture(source, texture, engine.scenes[0], engine._getInternalFormat(4), () => {
                    engine._releaseTexture(source);
                    BindTexture(texture, engine);
                });
            }
            else {
                // Fallback is already inverted
                texture._invertVScale = !texture.invertY;
                // Upload directly
                texture.width = (rootImage.width + 3) & ~3;
                texture.height = (rootImage.height + 3) & ~3;
                texture.samplingMode = 2;
                BindTexture(texture, engine);
                engine._uploadDataToTextureDirectly(texture, new Uint16Array(rootImage.transcodedPixels.buffer), i, 0, 4, true);
            }
        }
        else {
            texture.width = rootImage.width;
            texture.height = rootImage.height;
            texture.generateMipMaps = transcodeResult.fileInfo.images[i].levels.length > 1;
            const format = BasisTools.GetInternalFormatFromBasisFormat(transcodeResult.format, engine);
            texture.format = format;
            BindTexture(texture, engine);
            // Upload all mip levels in the file
            transcodeResult.fileInfo.images[i].levels.forEach((level, index) => {
                engine._uploadCompressedDataToTextureDirectly(texture, format, level.width, level.height, level.transcodedPixels, i, index);
            });
            if (engine._features.basisNeedsPOT && (Math.log2(texture.width) % 1 !== 0 || Math.log2(texture.height) % 1 !== 0)) {
                Tools.Warn("Loaded .basis texture width and height are not a power of two. Texture wrapping will be set to Texture.CLAMP_ADDRESSMODE as other modes are not supported with non power of two dimensions in webGL 1.");
                texture._cachedWrapU = Texture.CLAMP_ADDRESSMODE;
                texture._cachedWrapV = Texture.CLAMP_ADDRESSMODE;
            }
        }
    }
};
/**
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export const BasisTools = {
    /**
     * URL to use when loading the basis transcoder
     */
    JSModuleURL: BasisToolsOptions.JSModuleURL,
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    WasmModuleURL: BasisToolsOptions.WasmModuleURL,
    /**
     * Get the internal format to be passed to texImage2D corresponding to the .basis format value
     * @param basisFormat format chosen from GetSupportedTranscodeFormat
     * @returns internal format corresponding to the Basis format
     */
    GetInternalFormatFromBasisFormat,
    /**
     * Transcodes a loaded image file to compressed pixel data
     * @param data image data to transcode
     * @param config configuration options for the transcoding
     * @returns a promise resulting in the transcoded image
     */
    TranscodeAsync,
    /**
     * Loads a texture from the transcode result
     * @param texture texture load to
     * @param transcodeResult the result of transcoding the basis file to load from
     */
    LoadTextureFromTranscodeResult,
};
Object.defineProperty(BasisTools, "JSModuleURL", {
    get: function () {
        return BasisToolsOptions.JSModuleURL;
    },
    set: function (value) {
        BasisToolsOptions.JSModuleURL = value;
    },
});
Object.defineProperty(BasisTools, "WasmModuleURL", {
    get: function () {
        return BasisToolsOptions.WasmModuleURL;
    },
    set: function (value) {
        BasisToolsOptions.WasmModuleURL = value;
    },
});
//# sourceMappingURL=basis.js.map