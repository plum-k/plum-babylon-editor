
import { AutoReleaseWorkerPool } from "./workerPool.js";
import { Tools } from "./tools.js";
import { TranscodeTarget } from "../Materials/Textures/ktx2decoderTypes.js";
import { applyConfig, initializeWebWorker, workerFunction } from "./khronosTextureContainer2Worker.js";
/**
 * Class that defines the default KTX2 decoder options.
 *
 * This class is useful for providing options to the KTX2 decoder to control how the source data is transcoded.
 */
export class DefaultKTX2DecoderOptions {
    constructor() {
        this._isDirty = true;
        this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC = true;
        this._ktx2DecoderOptions = {};
    }
    /**
     * Gets the dirty flag
     */
    get isDirty() {
        return this._isDirty;
    }
    /**
     * force a (uncompressed) RGBA transcoded format if transcoding a UASTC source format and ASTC + BC7 are not available as a compressed transcoded format
     */
    get useRGBAIfASTCBC7NotAvailableWhenUASTC() {
        return this._useRGBAIfASTCBC7NotAvailableWhenUASTC;
    }
    set useRGBAIfASTCBC7NotAvailableWhenUASTC(value) {
        if (this._useRGBAIfASTCBC7NotAvailableWhenUASTC === value) {
            return;
        }
        this._useRGBAIfASTCBC7NotAvailableWhenUASTC = value;
        this._isDirty = true;
    }
    /**
     * force a (uncompressed) RGBA transcoded format if transcoding a UASTC source format and only BC1 or BC3 are available as a compressed transcoded format.
     * This property is true by default to favor speed over memory, because currently transcoding from UASTC to BC1/3 is slow because the transcoder transcodes
     * to uncompressed and then recompresses the texture
     */
    get useRGBAIfOnlyBC1BC3AvailableWhenUASTC() {
        return this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC;
    }
    set useRGBAIfOnlyBC1BC3AvailableWhenUASTC(value) {
        if (this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC === value) {
            return;
        }
        this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC = value;
        this._isDirty = true;
    }
    /**
     * force to always use (uncompressed) RGBA for transcoded format
     */
    get forceRGBA() {
        return this._forceRGBA;
    }
    set forceRGBA(value) {
        if (this._forceRGBA === value) {
            return;
        }
        this._forceRGBA = value;
        this._isDirty = true;
    }
    /**
     * force to always use (uncompressed) R8 for transcoded format
     */
    get forceR8() {
        return this._forceR8;
    }
    set forceR8(value) {
        if (this._forceR8 === value) {
            return;
        }
        this._forceR8 = value;
        this._isDirty = true;
    }
    /**
     * force to always use (uncompressed) RG8 for transcoded format
     */
    get forceRG8() {
        return this._forceRG8;
    }
    set forceRG8(value) {
        if (this._forceRG8 === value) {
            return;
        }
        this._forceRG8 = value;
        this._isDirty = true;
    }
    /**
     * list of transcoders to bypass when looking for a suitable transcoder. The available transcoders are:
     *      UniversalTranscoder_UASTC_ASTC
     *      UniversalTranscoder_UASTC_BC7
     *      UniversalTranscoder_UASTC_RGBA_UNORM
     *      UniversalTranscoder_UASTC_RGBA_SRGB
     *      UniversalTranscoder_UASTC_R8_UNORM
     *      UniversalTranscoder_UASTC_RG8_UNORM
     *      MSCTranscoder
     */
    get bypassTranscoders() {
        return this._bypassTranscoders;
    }
    set bypassTranscoders(value) {
        if (this._bypassTranscoders === value) {
            return;
        }
        this._bypassTranscoders = value;
        this._isDirty = true;
    }
    /** @internal */
    _getKTX2DecoderOptions() {
        if (!this._isDirty) {
            return this._ktx2DecoderOptions;
        }
        this._isDirty = false;
        const options = {
            useRGBAIfASTCBC7NotAvailableWhenUASTC: this._useRGBAIfASTCBC7NotAvailableWhenUASTC,
            forceRGBA: this._forceRGBA,
            forceR8: this._forceR8,
            forceRG8: this._forceRG8,
            bypassTranscoders: this._bypassTranscoders,
        };
        if (this.useRGBAIfOnlyBC1BC3AvailableWhenUASTC) {
            options.transcodeFormatDecisionTree = {
                UASTC: {
                    transcodeFormat: [TranscodeTarget.BC1_RGB, TranscodeTarget.BC3_RGBA],
                    yes: {
                        transcodeFormat: TranscodeTarget.RGBA32,
                        engineFormat: 32856 /* EngineFormat.RGBA8Format */,
                        roundToMultiple4: false,
                    },
                },
            };
        }
        this._ktx2DecoderOptions = options;
        return options;
    }
}
/**
 * Class for loading KTX2 files
 */
export class KhronosTextureContainer2 {
    static GetDefaultNumWorkers() {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }
        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }
    static _Initialize(numWorkers) {
        if (KhronosTextureContainer2._WorkerPoolPromise || KhronosTextureContainer2._DecoderModulePromise) {
            return;
        }
        const urls = {
            jsDecoderModule: Tools.GetBabylonScriptURL(this.URLConfig.jsDecoderModule, true),
            wasmUASTCToASTC: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToASTC, true),
            wasmUASTCToBC7: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToBC7, true),
            wasmUASTCToRGBA_UNORM: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_UNORM, true),
            wasmUASTCToRGBA_SRGB: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_SRGB, true),
            wasmUASTCToR8_UNORM: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToR8_UNORM, true),
            wasmUASTCToRG8_UNORM: Tools.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRG8_UNORM, true),
            jsMSCTranscoder: Tools.GetBabylonScriptURL(this.URLConfig.jsMSCTranscoder, true),
            wasmMSCTranscoder: Tools.GetBabylonScriptURL(this.URLConfig.wasmMSCTranscoder, true),
            wasmZSTDDecoder: Tools.GetBabylonScriptURL(this.URLConfig.wasmZSTDDecoder, true),
        };
        if (numWorkers && typeof Worker === "function" && typeof URL !== "undefined") {
            KhronosTextureContainer2._WorkerPoolPromise = new Promise((resolve) => {
                const workerContent = `${applyConfig}(${workerFunction})()`;
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                resolve(new AutoReleaseWorkerPool(numWorkers, () => initializeWebWorker(new Worker(workerBlobUrl), undefined, urls)));
            });
        }
        else {
            if (typeof KhronosTextureContainer2._KTX2DecoderModule === "undefined") {
                KhronosTextureContainer2._DecoderModulePromise = Tools.LoadBabylonScriptAsync(urls.jsDecoderModule).then(() => {
                    KhronosTextureContainer2._KTX2DecoderModule = KTX2DECODER;
                    KhronosTextureContainer2._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread = false;
                    KhronosTextureContainer2._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread = true;
                    applyConfig(urls, KhronosTextureContainer2._KTX2DecoderModule);
                    return new KhronosTextureContainer2._KTX2DecoderModule.KTX2Decoder();
                });
            }
            else {
                KhronosTextureContainer2._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread = false;
                KhronosTextureContainer2._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread = true;
                KhronosTextureContainer2._DecoderModulePromise = Promise.resolve(new KhronosTextureContainer2._KTX2DecoderModule.KTX2Decoder());
            }
        }
    }
    /**
     * Constructor
     * @param engine The engine to use
     * @param numWorkersOrOptions The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    constructor(engine, numWorkersOrOptions = KhronosTextureContainer2.DefaultNumWorkers) {
        this._engine = engine;
        const workerPoolOption = (typeof numWorkersOrOptions === "object" && numWorkersOrOptions.workerPool) || KhronosTextureContainer2.WorkerPool;
        if (workerPoolOption) {
            KhronosTextureContainer2._WorkerPoolPromise = Promise.resolve(workerPoolOption);
        }
        else {
            // set the KTX2 decoder module
            if (typeof numWorkersOrOptions === "object") {
                KhronosTextureContainer2._KTX2DecoderModule = numWorkersOrOptions?.binariesAndModulesContainer?.jsDecoderModule;
            }
            else if (typeof KTX2DECODER !== "undefined") {
                KhronosTextureContainer2._KTX2DecoderModule = KTX2DECODER;
            }
            const numberOfWorkers = typeof numWorkersOrOptions === "number" ? numWorkersOrOptions : (numWorkersOrOptions.numWorkers ?? KhronosTextureContainer2.DefaultNumWorkers);
            KhronosTextureContainer2._Initialize(numberOfWorkers);
        }
    }
    /**
     * @internal
     */
    _uploadAsync(data, internalTexture, options) {
        const caps = this._engine.getCaps();
        const compressedTexturesCaps = {
            astc: !!caps.astc,
            bptc: !!caps.bptc,
            s3tc: !!caps.s3tc,
            pvrtc: !!caps.pvrtc,
            etc2: !!caps.etc2,
            etc1: !!caps.etc1,
        };
        if (KhronosTextureContainer2._WorkerPoolPromise) {
            return KhronosTextureContainer2._WorkerPoolPromise.then((workerPool) => {
                return new Promise((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        const onError = (error) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                            onComplete();
                        };
                        const onMessage = (message) => {
                            if (message.data.action === "decoded") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                if (!message.data.success) {
                                    reject({ message: message.data.msg });
                                }
                                else {
                                    try {
                                        this._createTexture(message.data.decodedData, internalTexture, options);
                                        resolve();
                                    }
                                    catch (err) {
                                        reject({ message: err });
                                    }
                                }
                                onComplete();
                            }
                        };
                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);
                        worker.postMessage({ action: "setDefaultDecoderOptions", options: KhronosTextureContainer2.DefaultDecoderOptions._getKTX2DecoderOptions() });
                        const dataCopy = new Uint8Array(data.byteLength);
                        dataCopy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
                        worker.postMessage({ action: "decode", data: dataCopy, caps: compressedTexturesCaps, options }, [dataCopy.buffer]);
                    });
                });
            });
        }
        else if (KhronosTextureContainer2._DecoderModulePromise) {
            return KhronosTextureContainer2._DecoderModulePromise.then((decoder) => {
                if (KhronosTextureContainer2.DefaultDecoderOptions.isDirty) {
                    KhronosTextureContainer2._KTX2DecoderModule.KTX2Decoder.DefaultDecoderOptions = KhronosTextureContainer2.DefaultDecoderOptions._getKTX2DecoderOptions();
                }
                return new Promise((resolve, reject) => {
                    decoder
                        .decode(data, caps)
                        .then((data) => {
                        this._createTexture(data, internalTexture);
                        resolve();
                    })
                        .catch((reason) => {
                        reject({ message: reason });
                    });
                });
            });
        }
        throw new Error("KTX2 decoder module is not available");
    }
    _createTexture(data, internalTexture, options) {
        const oglTexture2D = 3553; // gl.TEXTURE_2D
        this._engine._bindTextureDirectly(oglTexture2D, internalTexture);
        if (options) {
            // return back some information about the decoded data
            options.transcodedFormat = data.transcodedFormat;
            options.isInGammaSpace = data.isInGammaSpace;
            options.hasAlpha = data.hasAlpha;
            options.transcoderName = data.transcoderName;
        }
        let isUncompressedFormat = true;
        switch (data.transcodedFormat) {
            case 0x8058 /* RGBA8 */:
                internalTexture.type = 0;
                internalTexture.format = 5;
                break;
            case 0x8229 /* R8 */:
                internalTexture.type = 0;
                internalTexture.format = 6;
                break;
            case 0x822b /* RG8 */:
                internalTexture.type = 0;
                internalTexture.format = 7;
                break;
            default:
                internalTexture.format = data.transcodedFormat;
                isUncompressedFormat = false;
                break;
        }
        internalTexture._gammaSpace = data.isInGammaSpace;
        internalTexture.generateMipMaps = data.mipmaps.length > 1;
        if (data.errors) {
            throw new Error("KTX2 container - could not transcode the data. " + data.errors);
        }
        for (let t = 0; t < data.mipmaps.length; ++t) {
            const mipmap = data.mipmaps[t];
            if (!mipmap || !mipmap.data) {
                throw new Error("KTX2 container - could not transcode one of the image");
            }
            if (isUncompressedFormat) {
                // uncompressed RGBA / R8 / RG8
                internalTexture.width = mipmap.width; // need to set width/height so that the call to _uploadDataToTextureDirectly uses the right dimensions
                internalTexture.height = mipmap.height;
                this._engine._uploadDataToTextureDirectly(internalTexture, mipmap.data, 0, t, undefined, true);
            }
            else {
                this._engine._uploadCompressedDataToTextureDirectly(internalTexture, data.transcodedFormat, mipmap.width, mipmap.height, mipmap.data, 0, t);
            }
        }
        internalTexture._extension = ".ktx2";
        internalTexture.width = data.mipmaps[0].width;
        internalTexture.height = data.mipmaps[0].height;
        internalTexture.isReady = true;
        this._engine._bindTextureDirectly(oglTexture2D, null);
    }
    /**
     * Checks if the given data starts with a KTX2 file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX2 file or false otherwise
     */
    static IsValid(data) {
        if (data.byteLength >= 12) {
            // '«', 'K', 'T', 'X', ' ', '2', '0', '»', '\r', '\n', '\x1A', '\n'
            const identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
            if (identifier[0] === 0xab &&
                identifier[1] === 0x4b &&
                identifier[2] === 0x54 &&
                identifier[3] === 0x58 &&
                identifier[4] === 0x20 &&
                identifier[5] === 0x32 &&
                identifier[6] === 0x30 &&
                identifier[7] === 0xbb &&
                identifier[8] === 0x0d &&
                identifier[9] === 0x0a &&
                identifier[10] === 0x1a &&
                identifier[11] === 0x0a) {
                return true;
            }
        }
        return false;
    }
}
/**
 * URLs to use when loading the KTX2 decoder module as well as its dependencies
 * If a url is null, the default url is used (pointing to https://preview.babylonjs.com)
 * Note that jsDecoderModule can't be null and that the other dependencies will only be loaded if necessary
 * Urls you can change:
 *     URLConfig.jsDecoderModule
 *     URLConfig.wasmUASTCToASTC
 *     URLConfig.wasmUASTCToBC7
 *     URLConfig.wasmUASTCToRGBA_UNORM
 *     URLConfig.wasmUASTCToRGBA_SRGB
 *     URLConfig.wasmUASTCToR8_UNORM
 *     URLConfig.wasmUASTCToRG8_UNORM
 *     URLConfig.jsMSCTranscoder
 *     URLConfig.wasmMSCTranscoder
 *     URLConfig.wasmZSTDDecoder
 * You can see their default values in this PG: https://playground.babylonjs.com/#EIJH8L#29
 */
KhronosTextureContainer2.URLConfig = {
    jsDecoderModule: "https://cdn.babylonjs.com/babylon.ktx2Decoder.js",
    wasmUASTCToASTC: null,
    wasmUASTCToBC7: null,
    wasmUASTCToRGBA_UNORM: null,
    wasmUASTCToRGBA_SRGB: null,
    wasmUASTCToR8_UNORM: null,
    wasmUASTCToRG8_UNORM: null,
    jsMSCTranscoder: null,
    wasmMSCTranscoder: null,
    wasmZSTDDecoder: null,
};
/**
 * Default number of workers used to handle data decoding
 */
KhronosTextureContainer2.DefaultNumWorkers = KhronosTextureContainer2.GetDefaultNumWorkers();
/**
 * Default configuration for the KTX2 decoder.
 * The options defined in this way have priority over those passed when creating a KTX2 texture with new Texture(...).
 */
KhronosTextureContainer2.DefaultDecoderOptions = new DefaultKTX2DecoderOptions();
//# sourceMappingURL=khronosTextureContainer2.js.map