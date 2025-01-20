import { SerializationHelper } from "../../Misc/decorators.serialization.js";
import { _UpdateRGBDAsync as UpdateRGBDAsyncEnvTools } from "../../Misc/environmentTextureTools.js";
import { CubeTexture } from "./cubeTexture.js";

/**
 * Raw cube texture where the raw buffers are passed in
 */
export class RawCubeTexture extends CubeTexture {
    /**
     * Creates a cube texture where the raw buffers are passed in.
     * @param scene defines the scene the texture is attached to
     * @param data defines the array of data to use to create each face
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
     * @param generateMipMaps  defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compression used (null by default)
     */
    constructor(scene, data, size, format = 5, type = 0, generateMipMaps = false, invertY = false, samplingMode = 3, compression = null) {
        super("", scene);
        this._texture = scene.getEngine().createRawCubeTexture(data, size, format, type, generateMipMaps, invertY, samplingMode, compression);
    }
    /**
     * Updates the raw cube texture.
     * @param data defines the data to store
     * @param format defines the data format
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     */
    update(data, format, type, invertY, compression = null) {
        this._texture.getEngine().updateRawCubeTexture(this._texture, data, format, type, invertY, compression);
    }
    /**
     * Updates a raw cube texture with RGBD encoded data.
     * @param data defines the array of data [mipmap][face] to use to create each face
     * @param sphericalPolynomial defines the spherical polynomial for irradiance
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @returns a promise that resolves when the operation is complete
     */
    updateRGBDAsync(data, sphericalPolynomial = null, lodScale = 0.8, lodOffset = 0) {
        return UpdateRGBDAsyncEnvTools(this._texture, data, sphericalPolynomial, lodScale, lodOffset).then(() => { });
    }
    /**
     * Clones the raw cube texture.
     * @returns a new cube texture
     */
    clone() {
        return SerializationHelper.Clone(() => {
            const scene = this.getScene();
            const internalTexture = this._texture;
            const texture = new RawCubeTexture(scene, internalTexture._bufferViewArray, internalTexture.width, internalTexture.format, internalTexture.type, internalTexture.generateMipMaps, internalTexture.invertY, internalTexture.samplingMode, internalTexture._compression);
            if (internalTexture.source === 13 /* InternalTextureSource.CubeRawRGBD */) {
                texture.updateRGBDAsync(internalTexture._bufferViewArrayArray, internalTexture._sphericalPolynomial, internalTexture._lodGenerationScale, internalTexture._lodGenerationOffset);
            }
            return texture;
        }, this);
    }
}
//# sourceMappingURL=rawCubeTexture.js.map