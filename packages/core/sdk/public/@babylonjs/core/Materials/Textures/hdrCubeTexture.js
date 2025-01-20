import { Matrix, Vector3 } from "../../Maths/math.vector.js";
import { BaseTexture } from "../../Materials/Textures/baseTexture.js";
import { Texture } from "../../Materials/Textures/texture.js";

import { GetCubeMapTextureData } from "../../Misc/HighDynamicRange/hdr.js";
import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial.js";
import { RegisterClass } from "../../Misc/typeStore.js";
import { Observable } from "../../Misc/observable.js";
import { Tools } from "../../Misc/tools.js";
import { ToGammaSpace } from "../../Maths/math.constants.js";
import { HDRFiltering } from "../../Materials/Textures/Filtering/hdrFiltering.js";
import { HDRIrradianceFiltering } from "../../Materials/Textures/Filtering/hdrIrradianceFiltering.js";
import { ToHalfFloat } from "../../Misc/textureTools.js";
import "../../Materials/Textures/baseTexture.polynomial.js";
/**
 * This represents a texture coming from an HDR input.
 *
 * The only supported format is currently panorama picture stored in RGBE format.
 * Example of such files can be found on Poly Haven: https://polyhaven.com/hdris
 */
export class HDRCubeTexture extends BaseTexture {
    /**
     * Sets whether or not the texture is blocking during loading.
     */
    set isBlocking(value) {
        this._isBlocking = value;
    }
    /**
     * Gets whether or not the texture is blocking during loading.
     */
    get isBlocking() {
        return this._isBlocking;
    }
    /**
     * Sets texture matrix rotation angle around Y axis in radians.
     */
    set rotationY(value) {
        this._rotationY = value;
        this.setReflectionTextureMatrix(Matrix.RotationY(this._rotationY));
    }
    /**
     * Gets texture matrix rotation angle around Y axis radians.
     */
    get rotationY() {
        return this._rotationY;
    }
    /**
     * Gets or sets the size of the bounding box associated with the cube texture
     * When defined, the cubemap will switch to local mode
     * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
     * @example https://www.babylonjs-playground.com/#RNASML
     */
    set boundingBoxSize(value) {
        if (this._boundingBoxSize && this._boundingBoxSize.equals(value)) {
            return;
        }
        this._boundingBoxSize = value;
        const scene = this.getScene();
        if (scene) {
            scene.markAllMaterialsAsDirty(1);
        }
    }
    get boundingBoxSize() {
        return this._boundingBoxSize;
    }
    /**
     * Instantiates an HDRTexture from the following parameters.
     *
     * @param url The location of the HDR raw data (Panorama stored in RGBE format)
     * @param sceneOrEngine The scene or engine the texture will be used in
     * @param size The cubemap desired size (the more it increases the longer the generation will be)
     * @param noMipmap Forces to not generate the mipmap if true
     * @param generateHarmonics Specifies whether you want to extract the polynomial harmonics during the generation process
     * @param gammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
     * @param prefilterOnLoad Prefilters HDR texture to allow use of this texture as a PBR reflection texture.
     * @param onLoad on success callback function
     * @param onError on error callback function
     * @param supersample Defines if texture must be supersampled (default: false)
     * @param prefilterIrradianceOnLoad Prefilters HDR texture to allow use of this texture for irradiance lighting.
     * @param prefilterUsingCdf Defines if the prefiltering should be done using a CDF instead of the default approach.
     */
    constructor(url, sceneOrEngine, size, noMipmap = false, generateHarmonics = true, gammaSpace = false, prefilterOnLoad = false, onLoad = null, onError = null, supersample = false, prefilterIrradianceOnLoad = false, prefilterUsingCdf = false) {
        super(sceneOrEngine);
        this._generateHarmonics = true;
        this._onError = null;
        this._isBlocking = true;
        this._rotationY = 0;
        /**
         * Gets or sets the center of the bounding box associated with the cube texture
         * It must define where the camera used to render the texture was set
         */
        this.boundingBoxPosition = Vector3.Zero();
        /**
         * Observable triggered once the texture has been loaded.
         */
        this.onLoadObservable = new Observable();
        if (!url) {
            return;
        }
        this._coordinatesMode = Texture.CUBIC_MODE;
        this.name = url;
        this.url = url;
        this.hasAlpha = false;
        this.isCube = true;
        this._textureMatrix = Matrix.Identity();
        this._prefilterOnLoad = prefilterOnLoad;
        this._prefilterIrradianceOnLoad = prefilterIrradianceOnLoad;
        this._prefilterUsingCdf = prefilterUsingCdf;
        this._onLoad = () => {
            this.onLoadObservable.notifyObservers(this);
            if (onLoad) {
                onLoad();
            }
        };
        this._onError = onError;
        this.gammaSpace = gammaSpace;
        this._noMipmap = noMipmap;
        this._size = size;
        this._supersample = supersample;
        this._generateHarmonics = generateHarmonics;
        this._texture = this._getFromCache(url, this._noMipmap, undefined, undefined, undefined, this.isCube);
        if (!this._texture) {
            if (!this.getScene()?.useDelayedTextureLoading) {
                this._loadTexture();
            }
            else {
                this.delayLoadState = 4;
            }
        }
        else {
            if (this._texture.isReady) {
                Tools.SetImmediate(() => this._onLoad());
            }
            else {
                this._texture.onLoadedObservable.add(this._onLoad);
            }
        }
    }
    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "HDRCubeTexture"
     */
    getClassName() {
        return "HDRCubeTexture";
    }
    /**
     * Occurs when the file is raw .hdr file.
     */
    _loadTexture() {
        const engine = this._getEngine();
        const caps = engine.getCaps();
        let textureType = 0;
        if (caps.textureFloat && caps.textureFloatLinearFiltering) {
            textureType = 1;
        }
        else if (caps.textureHalfFloat && caps.textureHalfFloatLinearFiltering) {
            textureType = 2;
        }
        const callback = (buffer) => {
            this.lodGenerationOffset = 0.0;
            this.lodGenerationScale = 0.8;
            // Extract the raw linear data.
            const data = GetCubeMapTextureData(buffer, this._size, this._supersample);
            // Generate harmonics if needed.
            if (this._generateHarmonics) {
                const sphericalPolynomial = CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                this.sphericalPolynomial = sphericalPolynomial;
            }
            const results = [];
            let byteArray = null;
            let shortArray = null;
            // Push each faces.
            for (let j = 0; j < 6; j++) {
                // Create fallback array
                if (textureType === 2) {
                    shortArray = new Uint16Array(this._size * this._size * 3);
                }
                else if (textureType === 0) {
                    // 3 channels of 1 bytes per pixel in bytes.
                    byteArray = new Uint8Array(this._size * this._size * 3);
                }
                const dataFace = data[HDRCubeTexture._FacesMapping[j]];
                // If special cases.
                if (this.gammaSpace || shortArray || byteArray) {
                    for (let i = 0; i < this._size * this._size; i++) {
                        // Put in gamma space if requested.
                        if (this.gammaSpace) {
                            dataFace[i * 3 + 0] = Math.pow(dataFace[i * 3 + 0], ToGammaSpace);
                            dataFace[i * 3 + 1] = Math.pow(dataFace[i * 3 + 1], ToGammaSpace);
                            dataFace[i * 3 + 2] = Math.pow(dataFace[i * 3 + 2], ToGammaSpace);
                        }
                        // Convert to half float texture for fallback.
                        if (shortArray) {
                            shortArray[i * 3 + 0] = ToHalfFloat(dataFace[i * 3 + 0]);
                            shortArray[i * 3 + 1] = ToHalfFloat(dataFace[i * 3 + 1]);
                            shortArray[i * 3 + 2] = ToHalfFloat(dataFace[i * 3 + 2]);
                        }
                        // Convert to int texture for fallback.
                        if (byteArray) {
                            let r = Math.max(dataFace[i * 3 + 0] * 255, 0);
                            let g = Math.max(dataFace[i * 3 + 1] * 255, 0);
                            let b = Math.max(dataFace[i * 3 + 2] * 255, 0);
                            // May use luminance instead if the result is not accurate.
                            const max = Math.max(Math.max(r, g), b);
                            if (max > 255) {
                                const scale = 255 / max;
                                r *= scale;
                                g *= scale;
                                b *= scale;
                            }
                            byteArray[i * 3 + 0] = r;
                            byteArray[i * 3 + 1] = g;
                            byteArray[i * 3 + 2] = b;
                        }
                    }
                }
                if (shortArray) {
                    results.push(shortArray);
                }
                else if (byteArray) {
                    results.push(byteArray);
                }
                else {
                    results.push(dataFace);
                }
            }
            return results;
        };
        if (engine._features.allowTexturePrefiltering && (this._prefilterOnLoad || this._prefilterIrradianceOnLoad)) {
            const previousOnLoad = this._onLoad;
            const hdrFiltering = new HDRFiltering(engine);
            this._onLoad = () => {
                let irradiancePromise = Promise.resolve(null);
                let radiancePromise = Promise.resolve();
                if (this._prefilterIrradianceOnLoad) {
                    const hdrIrradianceFiltering = new HDRIrradianceFiltering(engine, { useCdf: this._prefilterUsingCdf });
                    irradiancePromise = hdrIrradianceFiltering.prefilter(this);
                }
                if (this._prefilterOnLoad) {
                    radiancePromise = hdrFiltering.prefilter(this);
                }
                Promise.all([irradiancePromise, radiancePromise]).then((results) => {
                    const irradianceTexture = results[0];
                    if (this._prefilterIrradianceOnLoad && irradianceTexture) {
                        this.irradianceTexture = irradianceTexture;
                        const scene = this.getScene();
                        if (scene) {
                            scene.markAllMaterialsAsDirty(1);
                        }
                    }
                    if (previousOnLoad) {
                        previousOnLoad();
                    }
                });
            };
        }
        this._texture = engine.createRawCubeTextureFromUrl(this.url, this.getScene(), this._size, 4, textureType, this._noMipmap, callback, null, this._onLoad, this._onError);
    }
    clone() {
        const newTexture = new HDRCubeTexture(this.url, this.getScene() || this._getEngine(), this._size, this._noMipmap, this._generateHarmonics, this.gammaSpace);
        // Base texture
        newTexture.level = this.level;
        newTexture.wrapU = this.wrapU;
        newTexture.wrapV = this.wrapV;
        newTexture.coordinatesIndex = this.coordinatesIndex;
        newTexture.coordinatesMode = this.coordinatesMode;
        return newTexture;
    }
    // Methods
    delayLoad() {
        if (this.delayLoadState !== 4) {
            return;
        }
        this.delayLoadState = 1;
        this._texture = this._getFromCache(this.url, this._noMipmap);
        if (!this._texture) {
            this._loadTexture();
        }
    }
    /**
     * Get the texture reflection matrix used to rotate/transform the reflection.
     * @returns the reflection matrix
     */
    getReflectionTextureMatrix() {
        return this._textureMatrix;
    }
    /**
     * Set the texture reflection matrix used to rotate/transform the reflection.
     * @param value Define the reflection matrix to set
     */
    setReflectionTextureMatrix(value) {
        this._textureMatrix = value;
        if (value.updateFlag === this._textureMatrix.updateFlag) {
            return;
        }
        if (value.isIdentity() !== this._textureMatrix.isIdentity()) {
            this.getScene()?.markAllMaterialsAsDirty(1, (mat) => mat.getActiveTextures().indexOf(this) !== -1);
        }
    }
    /**
     * Dispose the texture and release its associated resources.
     */
    dispose() {
        this.onLoadObservable.clear();
        super.dispose();
    }
    /**
     * Parses a JSON representation of an HDR Texture in order to create the texture
     * @param parsedTexture Define the JSON representation
     * @param scene Define the scene the texture should be created in
     * @param rootUrl Define the root url in case we need to load relative dependencies
     * @returns the newly created texture after parsing
     */
    static Parse(parsedTexture, scene, rootUrl) {
        let texture = null;
        if (parsedTexture.name && !parsedTexture.isRenderTarget) {
            texture = new HDRCubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.size, parsedTexture.noMipmap, parsedTexture.generateHarmonics, parsedTexture.useInGammaSpace);
            texture.name = parsedTexture.name;
            texture.hasAlpha = parsedTexture.hasAlpha;
            texture.level = parsedTexture.level;
            texture.coordinatesMode = parsedTexture.coordinatesMode;
            texture.isBlocking = parsedTexture.isBlocking;
        }
        if (texture) {
            if (parsedTexture.boundingBoxPosition) {
                texture.boundingBoxPosition = Vector3.FromArray(parsedTexture.boundingBoxPosition);
            }
            if (parsedTexture.boundingBoxSize) {
                texture.boundingBoxSize = Vector3.FromArray(parsedTexture.boundingBoxSize);
            }
            if (parsedTexture.rotationY) {
                texture.rotationY = parsedTexture.rotationY;
            }
        }
        return texture;
    }
    serialize() {
        if (!this.name) {
            return null;
        }
        const serializationObject = {};
        serializationObject.name = this.name;
        serializationObject.hasAlpha = this.hasAlpha;
        serializationObject.isCube = true;
        serializationObject.level = this.level;
        serializationObject.size = this._size;
        serializationObject.coordinatesMode = this.coordinatesMode;
        serializationObject.useInGammaSpace = this.gammaSpace;
        serializationObject.generateHarmonics = this._generateHarmonics;
        serializationObject.customType = "BABYLON.HDRCubeTexture";
        serializationObject.noMipmap = this._noMipmap;
        serializationObject.isBlocking = this._isBlocking;
        serializationObject.rotationY = this._rotationY;
        return serializationObject;
    }
}
HDRCubeTexture._FacesMapping = ["right", "left", "up", "down", "front", "back"];
RegisterClass("BABYLON.HDRCubeTexture", HDRCubeTexture);
//# sourceMappingURL=hdrCubeTexture.js.map