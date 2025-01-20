import { EngineStore } from "../../../Engines/engineStore.js";
import { ProceduralTexture } from "./proceduralTexture.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import "../../../Shaders/noise.fragment.js";
/**
 * Class used to generate noise procedural textures
 */
export class NoiseProceduralTexture extends ProceduralTexture {
    /**
     * Creates a new NoiseProceduralTexture
     * @param name defines the name fo the texture
     * @param size defines the size of the texture (default is 256)
     * @param scene defines the hosting scene
     * @param fallbackTexture defines the texture to use if the NoiseProceduralTexture can't be created
     * @param generateMipMaps defines if mipmaps must be generated (true by default)
     */
    constructor(name, size = 256, scene = EngineStore.LastCreatedScene, fallbackTexture, generateMipMaps) {
        super(name, size, "noise", scene, fallbackTexture, generateMipMaps);
        /** Gets or sets the start time (default is 0) */
        this.time = 0.0;
        /** Gets or sets a value between 0 and 1 indicating the overall brightness of the texture (default is 0.2) */
        this.brightness = 0.2;
        /** Defines the number of octaves to process */
        this.octaves = 3;
        /** Defines the level of persistence (0.8 by default) */
        this.persistence = 0.8;
        /** Gets or sets animation speed factor (default is 1) */
        this.animationSpeedFactor = 1;
        this.autoClear = false;
        this._updateShaderUniforms();
    }
    _updateShaderUniforms() {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        this.time += scene.getAnimationRatio() * this.animationSpeedFactor * 0.01;
        this.setFloat("brightness", this.brightness);
        this.setFloat("persistence", this.persistence);
        this.setFloat("timeScale", this.time);
    }
    _getDefines() {
        return "#define OCTAVES " + (this.octaves | 0);
    }
    /**
     * Generate the current state of the procedural texture
     * @param useCameraPostProcess Define if camera post process should be applied to the texture
     */
    render(useCameraPostProcess) {
        this._updateShaderUniforms();
        super.render(useCameraPostProcess);
    }
    /**
     * Serializes this noise procedural texture
     * @returns a serialized noise procedural texture object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.customType = "BABYLON.NoiseProceduralTexture";
        serializationObject.brightness = this.brightness;
        serializationObject.octaves = this.octaves;
        serializationObject.persistence = this.persistence;
        serializationObject.animationSpeedFactor = this.animationSpeedFactor;
        serializationObject.size = this.getSize().width;
        serializationObject.generateMipMaps = this._generateMipMaps;
        serializationObject.time = this.time;
        return serializationObject;
    }
    /**
     * Clone the texture.
     * @returns the cloned texture
     */
    clone() {
        const textureSize = this.getSize();
        const newTexture = new NoiseProceduralTexture(this.name, textureSize.width, this.getScene(), this._fallbackTexture ? this._fallbackTexture : undefined, this._generateMipMaps);
        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;
        // RenderTarget Texture
        newTexture.coordinatesMode = this.coordinatesMode;
        // Noise Specifics
        newTexture.brightness = this.brightness;
        newTexture.octaves = this.octaves;
        newTexture.persistence = this.persistence;
        newTexture.animationSpeedFactor = this.animationSpeedFactor;
        newTexture.time = this.time;
        return newTexture;
    }
    /**
     * Creates a NoiseProceduralTexture from parsed noise procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @returns a parsed NoiseProceduralTexture
     */
    static Parse(parsedTexture, scene) {
        const texture = new NoiseProceduralTexture(parsedTexture.name, parsedTexture.size, scene, undefined, parsedTexture.generateMipMaps);
        texture.brightness = parsedTexture.brightness;
        texture.octaves = parsedTexture.octaves;
        texture.persistence = parsedTexture.persistence;
        texture.animationSpeedFactor = parsedTexture.animationSpeedFactor;
        texture.time = parsedTexture.time ?? 0;
        return texture;
    }
}
RegisterClass("BABYLON.NoiseProceduralTexture", NoiseProceduralTexture);
//# sourceMappingURL=noiseProceduralTexture.js.map