import { SphericalPolynomial } from "../../../Maths/sphericalPolynomial.js";
import { DDSTools } from "../../../Misc/dds.js";
/**
 * Implementation of the DDS Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _DDSTextureLoader {
    constructor() {
        /**
         * Defines whether the loader supports cascade loading the different faces.
         */
        this.supportCascades = true;
    }
    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param imgs contains the cube maps
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     */
    loadCubeData(imgs, texture, createPolynomials, onLoad) {
        const engine = texture.getEngine();
        let info;
        let loadMipmap = false;
        let maxLevel = 1000;
        if (Array.isArray(imgs)) {
            for (let index = 0; index < imgs.length; index++) {
                const data = imgs[index];
                info = DDSTools.GetDDSInfo(data);
                texture.width = info.width;
                texture.height = info.height;
                loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps;
                engine._unpackFlipY(info.isCompressed);
                DDSTools.UploadDDSLevels(engine, texture, data, info, loadMipmap, 6, -1, index);
                if (!info.isFourCC && info.mipmapCount === 1) {
                    engine.generateMipMapsForCubemap(texture);
                }
                else {
                    maxLevel = info.mipmapCount - 1;
                }
            }
        }
        else {
            const data = imgs;
            info = DDSTools.GetDDSInfo(data);
            texture.width = info.width;
            texture.height = info.height;
            if (createPolynomials) {
                info.sphericalPolynomial = new SphericalPolynomial();
            }
            loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps;
            engine._unpackFlipY(info.isCompressed);
            DDSTools.UploadDDSLevels(engine, texture, data, info, loadMipmap, 6);
            if (!info.isFourCC && info.mipmapCount === 1) {
                // Do not unbind as we still need to set the parameters.
                engine.generateMipMapsForCubemap(texture, false);
            }
            else {
                maxLevel = info.mipmapCount - 1;
            }
        }
        engine._setCubeMapTextureParams(texture, loadMipmap, maxLevel);
        texture.isReady = true;
        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();
        if (onLoad) {
            onLoad({ isDDS: true, width: texture.width, info, data: imgs, texture });
        }
    }
    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    loadData(data, texture, callback) {
        const info = DDSTools.GetDDSInfo(data);
        const loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps && Math.max(info.width, info.height) >> (info.mipmapCount - 1) === 1;
        callback(info.width, info.height, loadMipmap, info.isFourCC, () => {
            DDSTools.UploadDDSLevels(texture.getEngine(), texture, data, info, loadMipmap, 1);
        });
    }
}
//# sourceMappingURL=ddsTextureLoader.js.map