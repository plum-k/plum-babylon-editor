
import { LoadIESData } from "../../../Lights/IES/iesLoader.js";
/**
 * Implementation of the IES Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _IESTextureLoader {
    constructor() {
        /**
         * Defines whether the loader supports cascade loading the different faces.
         */
        this.supportCascades = false;
    }
    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     */
    loadCubeData() {
        // eslint-disable-next-line no-throw-literal
        throw ".ies not supported in Cube.";
    }
    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    loadData(data, texture, callback) {
        const uint8array = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const textureData = LoadIESData(uint8array);
        callback(textureData.width, textureData.height, false, false, () => {
            const engine = texture.getEngine();
            texture.type = 1;
            texture.format = 6;
            texture._gammaSpace = false;
            engine._uploadDataToTextureDirectly(texture, textureData.data);
        });
    }
}
//# sourceMappingURL=iesTextureLoader.js.map