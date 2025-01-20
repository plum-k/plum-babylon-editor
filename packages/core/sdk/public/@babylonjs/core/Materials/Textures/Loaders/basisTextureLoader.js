import { LoadTextureFromTranscodeResult, TranscodeAsync } from "../../../Misc/basis.js";
import { Tools } from "../../../Misc/tools.js";
/**
 * Loader for .basis file format
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _BasisTextureLoader {
    constructor() {
        /**
         * Defines whether the loader supports cascade loading the different faces.
         */
        this.supportCascades = false;
    }
    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    loadCubeData(data, texture, createPolynomials, onLoad, onError) {
        if (Array.isArray(data)) {
            return;
        }
        const caps = texture.getEngine().getCaps();
        const transcodeConfig = {
            supportedCompressionFormats: {
                etc1: caps.etc1 ? true : false,
                s3tc: caps.s3tc ? true : false,
                pvrtc: caps.pvrtc ? true : false,
                etc2: caps.etc2 ? true : false,
                astc: caps.astc ? true : false,
                bc7: caps.bptc ? true : false,
            },
        };
        TranscodeAsync(data, transcodeConfig)
            .then((result) => {
            const hasMipmap = result.fileInfo.images[0].levels.length > 1 && texture.generateMipMaps;
            LoadTextureFromTranscodeResult(texture, result);
            texture.getEngine()._setCubeMapTextureParams(texture, hasMipmap);
            texture.isReady = true;
            texture.onLoadedObservable.notifyObservers(texture);
            texture.onLoadedObservable.clear();
            if (onLoad) {
                onLoad();
            }
        })
            .catch((err) => {
            const errorMessage = "Failed to transcode Basis file, transcoding may not be supported on this device";
            Tools.Warn(errorMessage);
            texture.isReady = true;
            if (onError) {
                onError(err);
            }
        });
    }
    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    loadData(data, texture, callback) {
        const caps = texture.getEngine().getCaps();
        const transcodeConfig = {
            supportedCompressionFormats: {
                etc1: caps.etc1 ? true : false,
                s3tc: caps.s3tc ? true : false,
                pvrtc: caps.pvrtc ? true : false,
                etc2: caps.etc2 ? true : false,
                astc: caps.astc ? true : false,
                bc7: caps.bptc ? true : false,
            },
        };
        TranscodeAsync(data, transcodeConfig)
            .then((result) => {
            const rootImage = result.fileInfo.images[0].levels[0];
            const hasMipmap = result.fileInfo.images[0].levels.length > 1 && texture.generateMipMaps;
            callback(rootImage.width, rootImage.height, hasMipmap, result.format !== -1, () => {
                LoadTextureFromTranscodeResult(texture, result);
            });
        })
            .catch((err) => {
            Tools.Warn("Failed to transcode Basis file, transcoding may not be supported on this device");
            Tools.Warn(`Failed to transcode Basis file: ${err}`);
            callback(0, 0, false, false, () => { }, true);
        });
    }
}
//# sourceMappingURL=basisTextureLoader.js.map