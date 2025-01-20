import { Texture } from "./texture.js";

/**
 * Class used to store 2D array textures containing user data
 */
export class RawTexture2DArray extends Texture {
    /**
     * Gets the number of layers of the texture
     */
    get depth() {
        return this._depth;
    }
    /**
     * Create a new RawTexture2DArray
     * @param data defines the data of the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the number of layers of the texture
     * @param format defines the texture format to use
     * @param scene defines the hosting scene
     * @param generateMipMaps defines a boolean indicating if mip levels should be generated (true by default)
     * @param invertY defines if texture must be stored with Y axis inverted
     * @param samplingMode defines the sampling mode to use (Texture.TRILINEAR_SAMPLINGMODE by default)
     * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_BYTE, Engine.TEXTURETYPE_FLOAT...)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     */
    constructor(data, width, height, depth, 
    /** Gets or sets the texture format to use */
    format, scene, generateMipMaps = true, invertY = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, textureType = 0, creationFlags) {
        super(null, scene, !generateMipMaps, invertY);
        this.format = format;
        this._texture = scene.getEngine().createRawTexture2DArray(data, width, height, depth, format, generateMipMaps, invertY, samplingMode, null, textureType, creationFlags);
        this._depth = depth;
        this.is2DArray = true;
    }
    /**
     * Update the texture with new data
     * @param data defines the data to store in the texture
     */
    update(data) {
        if (!this._texture) {
            return;
        }
        this._getEngine().updateRawTexture2DArray(this._texture, data, this._texture.format, this._texture.invertY, null, this._texture.type);
    }
    /**
     * Creates a RGBA texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param depth defines the number of layers of the texture
     * @param scene defines the scene the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the RGBA texture
     */
    static CreateRGBATexture(data, width, height, depth, scene, generateMipMaps = true, invertY = false, samplingMode = 3, type = 0) {
        return new RawTexture2DArray(data, width, height, depth, 5, scene, generateMipMaps, invertY, samplingMode, type);
    }
}
//# sourceMappingURL=rawTexture2DArray.js.map