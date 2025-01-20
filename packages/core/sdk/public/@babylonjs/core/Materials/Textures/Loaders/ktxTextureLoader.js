import { KhronosTextureContainer } from "../../../Misc/khronosTextureContainer.js";
import { KhronosTextureContainer2 } from "../../../Misc/khronosTextureContainer2.js";
import { Logger } from "../../../Misc/logger.js";

function mapSRGBToLinear(format) {
    switch (format) {
        case 35916:
            return 33776;
        case 35918:
            return 33778;
        case 35919:
            return 33779;
        case 37493:
            return 37492;
        case 37497:
            return 37496;
        case 37495:
            return 37494;
        case 37840:
            return 37808;
        case 36493:
            return 36492;
    }
    return null;
}
/**
 * Implementation of the KTX Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _KTXTextureLoader {
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
     */
    loadCubeData(data, texture, createPolynomials, onLoad) {
        if (Array.isArray(data)) {
            return;
        }
        // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
        texture._invertVScale = !texture.invertY;
        const engine = texture.getEngine();
        const ktx = new KhronosTextureContainer(data, 6);
        const loadMipmap = ktx.numberOfMipmapLevels > 1 && texture.generateMipMaps;
        engine._unpackFlipY(true);
        ktx.uploadLevels(texture, texture.generateMipMaps);
        texture.width = ktx.pixelWidth;
        texture.height = ktx.pixelHeight;
        engine._setCubeMapTextureParams(texture, loadMipmap, ktx.numberOfMipmapLevels - 1);
        texture.isReady = true;
        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();
        if (onLoad) {
            onLoad();
        }
    }
    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     * @param options
     */
    loadData(data, texture, callback, options) {
        if (KhronosTextureContainer.IsValid(data)) {
            // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
            texture._invertVScale = !texture.invertY;
            const ktx = new KhronosTextureContainer(data, 1);
            const mappedFormat = mapSRGBToLinear(ktx.glInternalFormat);
            if (mappedFormat) {
                texture.format = mappedFormat;
                texture._useSRGBBuffer = texture.getEngine()._getUseSRGBBuffer(true, texture.generateMipMaps);
                texture._gammaSpace = true;
            }
            else {
                texture.format = ktx.glInternalFormat;
            }
            callback(ktx.pixelWidth, ktx.pixelHeight, texture.generateMipMaps, true, () => {
                ktx.uploadLevels(texture, texture.generateMipMaps);
            }, ktx.isInvalid);
        }
        else if (KhronosTextureContainer2.IsValid(data)) {
            const ktx2 = new KhronosTextureContainer2(texture.getEngine());
            ktx2._uploadAsync(data, texture, options).then(() => {
                callback(texture.width, texture.height, texture.generateMipMaps, true, () => { }, false);
            }, (error) => {
                Logger.Warn(`Failed to load KTX2 texture data: ${error.message}`);
                callback(0, 0, false, false, () => { }, true);
            });
        }
        else {
            Logger.Error("texture missing KTX identifier");
            callback(0, 0, false, false, () => { }, true);
        }
    }
}
//# sourceMappingURL=ktxTextureLoader.js.map