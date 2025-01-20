import { RGBE_ReadHeader, RGBE_ReadPixels } from "../../../Misc/HighDynamicRange/hdr.js";

/**
 * Implementation of the HDR Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _HDRTextureLoader {
    constructor() {
        /**
         * Defines whether the loader supports cascade loading the different faces.
         */
        this.supportCascades = false;
    }
    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * Cube texture are not supported by .hdr files
     */
    loadCubeData() {
        // eslint-disable-next-line no-throw-literal
        throw ".hdr not supported in Cube.";
    }
    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    loadData(data, texture, callback) {
        const uint8array = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const hdrInfo = RGBE_ReadHeader(uint8array);
        const pixelsDataRGB32 = RGBE_ReadPixels(uint8array, hdrInfo);
        const pixels = hdrInfo.width * hdrInfo.height;
        const pixelsDataRGBA32 = new Float32Array(pixels * 4);
        for (let i = 0; i < pixels; i += 1) {
            pixelsDataRGBA32[i * 4] = pixelsDataRGB32[i * 3];
            pixelsDataRGBA32[i * 4 + 1] = pixelsDataRGB32[i * 3 + 1];
            pixelsDataRGBA32[i * 4 + 2] = pixelsDataRGB32[i * 3 + 2];
            pixelsDataRGBA32[i * 4 + 3] = 1;
        }
        callback(hdrInfo.width, hdrInfo.height, texture.generateMipMaps, false, () => {
            const engine = texture.getEngine();
            texture.type = 1;
            texture.format = 5;
            texture._gammaSpace = false;
            engine._uploadDataToTextureDirectly(texture, pixelsDataRGBA32);
        });
    }
}
//# sourceMappingURL=hdrTextureLoader.js.map