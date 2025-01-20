import { Texture } from "./texture.js";

/**
 * Raw texture can help creating a texture directly from an array of data.
 * This can be super useful if you either get the data from an uncompressed source or
 * if you wish to create your texture pixel by pixel.
 */
export class RawTexture extends Texture {
    /**
     * Instantiates a new RawTexture.
     * Raw texture can help creating a texture directly from an array of data.
     * This can be super useful if you either get the data from an uncompressed source or
     * if you wish to create your texture pixel by pixel.
     * @param data define the array of data to use to create the texture (null to create an empty texture)
     * @param width define the width of the texture
     * @param height define the height of the texture
     * @param format define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps define whether mip maps should be generated or not
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     */
    constructor(data, width, height, 
    /**
     * Define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
     */
    format, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3, type = 0, creationFlags, useSRGBBuffer) {
        super(null, sceneOrEngine, !generateMipMaps, invertY, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, creationFlags);
        this.format = format;
        if (!this._engine) {
            return;
        }
        if (!this._engine._caps.textureFloatLinearFiltering && type === 1) {
            samplingMode = 1;
        }
        if (!this._engine._caps.textureHalfFloatLinearFiltering && type === 2) {
            samplingMode = 1;
        }
        this._texture = this._engine.createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode, null, type, creationFlags ?? 0, useSRGBBuffer ?? false);
        this.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.wrapV = Texture.CLAMP_ADDRESSMODE;
    }
    /**
     * Updates the texture underlying data.
     * @param data Define the new data of the texture
     */
    update(data) {
        this._getEngine().updateRawTexture(this._texture, data, this._texture.format, this._texture.invertY, null, this._texture.type, this._texture._useSRGBBuffer);
    }
    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    clone() {
        if (!this._texture) {
            return super.clone();
        }
        const rawTexture = new RawTexture(null, this.getSize().width, this.getSize().height, this.format, this.getScene(), this._texture.generateMipMaps, this._invertY, this.samplingMode, this._texture.type, this._texture._creationFlags, this._useSRGBBuffer);
        rawTexture._texture = this._texture;
        this._texture.incrementReferences();
        return rawTexture;
    }
    /**
     * Creates a luminance texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the luminance texture
     */
    static CreateLuminanceTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3) {
        return new RawTexture(data, width, height, 1, sceneOrEngine, generateMipMaps, invertY, samplingMode);
    }
    /**
     * Creates a luminance alpha texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the luminance alpha texture
     */
    static CreateLuminanceAlphaTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3) {
        return new RawTexture(data, width, height, 2, sceneOrEngine, generateMipMaps, invertY, samplingMode);
    }
    /**
     * Creates an alpha texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the alpha texture
     */
    static CreateAlphaTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3) {
        return new RawTexture(data, width, height, 0, sceneOrEngine, generateMipMaps, invertY, samplingMode);
    }
    /**
     * Creates a RGB texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the RGB alpha texture
     */
    static CreateRGBTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3, type = 0, creationFlags = 0, useSRGBBuffer = false) {
        return new RawTexture(data, width, height, 4, sceneOrEngine, generateMipMaps, invertY, samplingMode, type, creationFlags, useSRGBBuffer);
    }
    /**
     * Creates a RGBA texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the RGBA texture
     */
    static CreateRGBATexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3, type = 0, creationFlags = 0, useSRGBBuffer = false) {
        return new RawTexture(data, width, height, 5, sceneOrEngine, generateMipMaps, invertY, samplingMode, type, creationFlags, useSRGBBuffer);
    }
    /**
     * Creates a RGBA storage texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the RGBA texture
     */
    static CreateRGBAStorageTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = 3, type = 0, useSRGBBuffer = false) {
        return new RawTexture(data, width, height, 5, sceneOrEngine, generateMipMaps, invertY, samplingMode, type, 1, useSRGBBuffer);
    }
    /**
     * Creates a R texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the R texture
     */
    static CreateRTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, type = 1) {
        return new RawTexture(data, width, height, 6, sceneOrEngine, generateMipMaps, invertY, samplingMode, type);
    }
    /**
     * Creates a R storage texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the R texture
     */
    static CreateRStorageTexture(data, width, height, sceneOrEngine, generateMipMaps = true, invertY = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, type = 1) {
        return new RawTexture(data, width, height, 6, sceneOrEngine, generateMipMaps, invertY, samplingMode, type, 1);
    }
}
//# sourceMappingURL=rawTexture.js.map