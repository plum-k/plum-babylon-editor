import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsTexture } from "../../Misc/decorators.js";
import { Observable } from "../../Misc/observable.js";
import { Matrix } from "../../Maths/math.vector.js";
import { EngineStore } from "../../Engines/engineStore.js";

import { RandomGUID } from "../../Misc/guid.js";
import "../../Misc/fileTools.js";
import { ThinTexture } from "./thinTexture.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";
/**
 * Base class of all the textures in babylon.
 * It groups all the common properties the materials, post process, lights... might need
 * in order to make a correct use of the texture.
 */
export class BaseTexture extends ThinTexture {
    /**
     * Define if the texture is having a usable alpha value (can be use for transparency or glossiness for instance).
     */
    set hasAlpha(value) {
        if (this._hasAlpha === value) {
            return;
        }
        this._hasAlpha = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(1, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    get hasAlpha() {
        return this._hasAlpha;
    }
    /**
     * Defines if the alpha value should be determined via the rgb values.
     * If true the luminance of the pixel might be used to find the corresponding alpha value.
     */
    set getAlphaFromRGB(value) {
        if (this._getAlphaFromRGB === value) {
            return;
        }
        this._getAlphaFromRGB = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(1, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    get getAlphaFromRGB() {
        return this._getAlphaFromRGB;
    }
    /**
     * Define the UV channel to use starting from 0 and defaulting to 0.
     * This is part of the texture as textures usually maps to one uv set.
     */
    set coordinatesIndex(value) {
        if (this._coordinatesIndex === value) {
            return;
        }
        this._coordinatesIndex = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(1, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    get coordinatesIndex() {
        return this._coordinatesIndex;
    }
    /**
     * How a texture is mapped.
     *
     * | Value | Type                                | Description |
     * | ----- | ----------------------------------- | ----------- |
     * | 0     | EXPLICIT_MODE                       |             |
     * | 1     | SPHERICAL_MODE                      |             |
     * | 2     | PLANAR_MODE                         |             |
     * | 3     | CUBIC_MODE                          |             |
     * | 4     | PROJECTION_MODE                     |             |
     * | 5     | SKYBOX_MODE                         |             |
     * | 6     | INVCUBIC_MODE                       |             |
     * | 7     | EQUIRECTANGULAR_MODE                |             |
     * | 8     | FIXED_EQUIRECTANGULAR_MODE          |             |
     * | 9     | FIXED_EQUIRECTANGULAR_MIRRORED_MODE |             |
     */
    set coordinatesMode(value) {
        if (this._coordinatesMode === value) {
            return;
        }
        this._coordinatesMode = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(1, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    get coordinatesMode() {
        return this._coordinatesMode;
    }
    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    get wrapU() {
        return this._wrapU;
    }
    set wrapU(value) {
        this._wrapU = value;
    }
    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    get wrapV() {
        return this._wrapV;
    }
    set wrapV(value) {
        this._wrapV = value;
    }
    /**
     * Define if the texture is a cube texture or if false a 2d texture.
     */
    get isCube() {
        if (!this._texture) {
            return this._isCube;
        }
        return this._texture.isCube;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    set isCube(value) {
        if (!this._texture) {
            this._isCube = value;
        }
        else {
            this._texture.isCube = value;
        }
    }
    /**
     * Define if the texture is a 3d texture (webgl 2) or if false a 2d texture.
     */
    get is3D() {
        if (!this._texture) {
            return false;
        }
        return this._texture.is3D;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    set is3D(value) {
        if (!this._texture) {
            return;
        }
        this._texture.is3D = value;
    }
    /**
     * Define if the texture is a 2d array texture (webgl 2) or if false a 2d texture.
     */
    get is2DArray() {
        if (!this._texture) {
            return false;
        }
        return this._texture.is2DArray;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    set is2DArray(value) {
        if (!this._texture) {
            return;
        }
        this._texture.is2DArray = value;
    }
    /**
     * Define if the texture contains data in gamma space (most of the png/jpg aside bump).
     * HDR texture are usually stored in linear space.
     * This only impacts the PBR and Background materials
     */
    get gammaSpace() {
        if (!this._texture) {
            return this._gammaSpace;
        }
        else {
            if (this._texture._gammaSpace === null) {
                this._texture._gammaSpace = this._gammaSpace;
            }
        }
        return this._texture._gammaSpace && !this._texture._useSRGBBuffer;
    }
    set gammaSpace(gamma) {
        if (!this._texture) {
            if (this._gammaSpace === gamma) {
                return;
            }
            this._gammaSpace = gamma;
        }
        else {
            if (this._texture._gammaSpace === gamma) {
                return;
            }
            this._texture._gammaSpace = gamma;
        }
        this.getScene()?.markAllMaterialsAsDirty(1, (mat) => {
            return mat.hasTexture(this);
        });
    }
    /**
     * Gets or sets whether or not the texture contains RGBD data.
     */
    get isRGBD() {
        return this._texture != null && this._texture._isRGBD;
    }
    set isRGBD(value) {
        if (value === this.isRGBD) {
            return;
        }
        if (this._texture) {
            this._texture._isRGBD = value;
        }
        this.getScene()?.markAllMaterialsAsDirty(1, (mat) => {
            return mat.hasTexture(this);
        });
    }
    /**
     * Are mip maps generated for this texture or not.
     */
    get noMipmap() {
        return false;
    }
    /**
     * With prefiltered texture, defined the offset used during the prefiltering steps.
     */
    get lodGenerationOffset() {
        if (this._texture) {
            return this._texture._lodGenerationOffset;
        }
        return 0.0;
    }
    set lodGenerationOffset(value) {
        if (this._texture) {
            this._texture._lodGenerationOffset = value;
        }
    }
    /**
     * With prefiltered texture, defined the scale used during the prefiltering steps.
     */
    get lodGenerationScale() {
        if (this._texture) {
            return this._texture._lodGenerationScale;
        }
        return 0.0;
    }
    set lodGenerationScale(value) {
        if (this._texture) {
            this._texture._lodGenerationScale = value;
        }
    }
    /**
     * With prefiltered texture, defined if the specular generation is based on a linear ramp.
     * By default we are using a log2 of the linear roughness helping to keep a better resolution for
     * average roughness values.
     */
    get linearSpecularLOD() {
        if (this._texture) {
            return this._texture._linearSpecularLOD;
        }
        return false;
    }
    set linearSpecularLOD(value) {
        if (this._texture) {
            this._texture._linearSpecularLOD = value;
        }
    }
    /**
     * In case a better definition than spherical harmonics is required for the diffuse part of the environment.
     * You can set the irradiance texture to rely on a texture instead of the spherical approach.
     * This texture need to have the same characteristics than its parent (Cube vs 2d, coordinates mode, Gamma/Linear, RGBD).
     */
    get irradianceTexture() {
        if (this._texture) {
            return this._texture._irradianceTexture;
        }
        return null;
    }
    set irradianceTexture(value) {
        if (this._texture) {
            this._texture._irradianceTexture = value;
        }
    }
    /**
     * Define the unique id of the texture in the scene.
     */
    get uid() {
        if (!this._uid) {
            this._uid = RandomGUID();
        }
        return this._uid;
    }
    /**
     * Return a string representation of the texture.
     * @returns the texture as a string
     */
    toString() {
        return this.name;
    }
    /**
     * Get the class name of the texture.
     * @returns "BaseTexture"
     */
    getClassName() {
        return "BaseTexture";
    }
    /**
     * Callback triggered when the texture has been disposed.
     * Kept for back compatibility, you can use the onDisposeObservable instead.
     */
    set onDispose(callback) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }
    /**
     * Define if the texture is preventing a material to render or not.
     * If not and the texture is not ready, the engine will use a default black texture instead.
     */
    get isBlocking() {
        return true;
    }
    /**
     * Was there any loading error?
     */
    get loadingError() {
        return this._loadingError;
    }
    /**
     * If a loading error occurred this object will be populated with information about the error.
     */
    get errorObject() {
        return this._errorObject;
    }
    /**
     * Instantiates a new BaseTexture.
     * Base class of all the textures in babylon.
     * It groups all the common properties the materials, post process, lights... might need
     * in order to make a correct use of the texture.
     * @param sceneOrEngine Define the scene or engine the texture belongs to
     * @param internalTexture Define the internal texture associated with the texture
     */
    constructor(sceneOrEngine, internalTexture = null) {
        super(null);
        /**
         * Gets or sets an object used to store user defined information.
         */
        this.metadata = null;
        /**
         * For internal use only. Please do not use.
         */
        this.reservedDataStore = null;
        this._hasAlpha = false;
        this._getAlphaFromRGB = false;
        /**
         * Intensity or strength of the texture.
         * It is commonly used by materials to fine tune the intensity of the texture
         */
        this.level = 1;
        this._coordinatesIndex = 0;
        /**
         * Gets or sets a boolean indicating that the texture should try to reduce shader code if there is no UV manipulation.
         * (ie. when texture.getTextureMatrix().isIdentityAs3x2() returns true)
         */
        this.optimizeUVAllocation = true;
        this._coordinatesMode = 0;
        /**
         * | Value | Type               | Description |
         * | ----- | ------------------ | ----------- |
         * | 0     | CLAMP_ADDRESSMODE  |             |
         * | 1     | WRAP_ADDRESSMODE   |             |
         * | 2     | MIRROR_ADDRESSMODE |             |
         */
        this.wrapR = 1;
        /**
         * With compliant hardware and browser (supporting anisotropic filtering)
         * this defines the level of anisotropic filtering in the texture.
         * The higher the better but the slower. This defaults to 4 as it seems to be the best tradeoff.
         */
        this.anisotropicFilteringLevel = BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL;
        /** @internal */
        this._isCube = false;
        /** @internal */
        this._gammaSpace = true;
        /**
         * Is Z inverted in the texture (useful in a cube texture).
         */
        this.invertZ = false;
        /**
         * @internal
         */
        this.lodLevelInAlpha = false;
        /**
         * Define if the texture is a render target.
         */
        this.isRenderTarget = false;
        /** @internal */
        this._prefiltered = false;
        /** @internal */
        this._forceSerialize = false;
        /**
         * Define the list of animation attached to the texture.
         */
        this.animations = [];
        /**
         * An event triggered when the texture is disposed.
         */
        this.onDisposeObservable = new Observable();
        this._onDisposeObserver = null;
        this._scene = null;
        /** @internal */
        this._uid = null;
        /** @internal */
        this._parentContainer = null;
        this._loadingError = false;
        if (sceneOrEngine) {
            if (BaseTexture._IsScene(sceneOrEngine)) {
                this._scene = sceneOrEngine;
            }
            else {
                this._engine = sceneOrEngine;
            }
        }
        else {
            this._scene = EngineStore.LastCreatedScene;
        }
        if (this._scene) {
            this.uniqueId = this._scene.getUniqueId();
            this._scene.addTexture(this);
            this._engine = this._scene.getEngine();
        }
        this._texture = internalTexture;
        this._uid = null;
    }
    /**
     * Get the scene the texture belongs to.
     * @returns the scene or null if undefined
     */
    getScene() {
        return this._scene;
    }
    /** @internal */
    _getEngine() {
        return this._engine;
    }
    /**
     * Get the texture transform matrix used to offset tile the texture for instance.
     * @returns the transformation matrix
     */
    getTextureMatrix() {
        return Matrix.IdentityReadOnly;
    }
    /**
     * Get the texture reflection matrix used to rotate/transform the reflection.
     * @returns the reflection matrix
     */
    getReflectionTextureMatrix() {
        return Matrix.IdentityReadOnly;
    }
    /**
     * Gets a suitable rotate/transform matrix when the texture is used for refraction.
     * There's a separate function from getReflectionTextureMatrix because refraction requires a special configuration of the matrix in right-handed mode.
     * @returns The refraction matrix
     */
    getRefractionTextureMatrix() {
        return this.getReflectionTextureMatrix();
    }
    /**
     * Get if the texture is ready to be consumed (either it is ready or it is not blocking)
     * @returns true if ready, not blocking or if there was an error loading the texture
     */
    isReadyOrNotBlocking() {
        return !this.isBlocking || this.isReady() || this.loadingError;
    }
    /**
     * Scales the texture if is `canRescale()`
     * @param ratio the resize factor we want to use to rescale
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    scale(ratio) { }
    /**
     * Get if the texture can rescale.
     */
    get canRescale() {
        return false;
    }
    /**
     * @internal
     */
    _getFromCache(url, noMipmap, sampling, invertY, useSRGBBuffer, isCube) {
        const engine = this._getEngine();
        if (!engine) {
            return null;
        }
        const correctedUseSRGBBuffer = engine._getUseSRGBBuffer(!!useSRGBBuffer, noMipmap);
        const texturesCache = engine.getLoadedTexturesCache();
        for (let index = 0; index < texturesCache.length; index++) {
            const texturesCacheEntry = texturesCache[index];
            if (useSRGBBuffer === undefined || correctedUseSRGBBuffer === texturesCacheEntry._useSRGBBuffer) {
                if (invertY === undefined || invertY === texturesCacheEntry.invertY) {
                    if (texturesCacheEntry.url === url && texturesCacheEntry.generateMipMaps === !noMipmap) {
                        if (!sampling || sampling === texturesCacheEntry.samplingMode) {
                            if (isCube === undefined || isCube === texturesCacheEntry.isCube) {
                                texturesCacheEntry.incrementReferences();
                                return texturesCacheEntry;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    /** @internal */
    _rebuild(_fromContextLost = false) { }
    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    clone() {
        return null;
    }
    /**
     * Get the texture underlying type (INT, FLOAT...)
     */
    get textureType() {
        if (!this._texture) {
            return 0;
        }
        return this._texture.type !== undefined ? this._texture.type : 0;
    }
    /**
     * Get the texture underlying format (RGB, RGBA...)
     */
    get textureFormat() {
        if (!this._texture) {
            return 5;
        }
        return this._texture.format !== undefined ? this._texture.format : 5;
    }
    /**
     * Indicates that textures need to be re-calculated for all materials
     */
    _markAllSubMeshesAsTexturesDirty() {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        scene.markAllMaterialsAsDirty(1);
    }
    /**
     * Reads the pixels stored in the webgl texture and returns them as an ArrayBuffer.
     * This will returns an RGBA array buffer containing either in values (0-255) or
     * float values (0-1) depending of the underlying buffer type.
     * @param faceIndex defines the face of the texture to read (in case of cube texture)
     * @param level defines the LOD level of the texture to read (in case of Mip Maps)
     * @param buffer defines a user defined buffer to fill with data (can be null)
     * @param flushRenderer true to flush the renderer from the pending commands before reading the pixels
     * @param noDataConversion false to convert the data to Uint8Array (if texture type is UNSIGNED_BYTE) or to Float32Array (if texture type is anything but UNSIGNED_BYTE). If true, the type of the generated buffer (if buffer==null) will depend on the type of the texture
     * @param x defines the region x coordinates to start reading from (default to 0)
     * @param y defines the region y coordinates to start reading from (default to 0)
     * @param width defines the region width to read from (default to the texture size at level)
     * @param height defines the region width to read from (default to the texture size at level)
     * @returns The Array buffer promise containing the pixels data.
     */
    readPixels(faceIndex = 0, level = 0, buffer = null, flushRenderer = true, noDataConversion = false, x = 0, y = 0, width = Number.MAX_VALUE, height = Number.MAX_VALUE) {
        if (!this._texture) {
            return null;
        }
        const engine = this._getEngine();
        if (!engine) {
            return null;
        }
        const size = this.getSize();
        let maxWidth = size.width;
        let maxHeight = size.height;
        if (level !== 0) {
            maxWidth = maxWidth / Math.pow(2, level);
            maxHeight = maxHeight / Math.pow(2, level);
            maxWidth = Math.round(maxWidth);
            maxHeight = Math.round(maxHeight);
        }
        width = Math.min(maxWidth, width);
        height = Math.min(maxHeight, height);
        try {
            if (this._texture.isCube) {
                return engine._readTexturePixels(this._texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion, x, y);
            }
            return engine._readTexturePixels(this._texture, width, height, -1, level, buffer, flushRenderer, noDataConversion, x, y);
        }
        catch (e) {
            return null;
        }
    }
    /**
     * @internal
     */
    _readPixelsSync(faceIndex = 0, level = 0, buffer = null, flushRenderer = true, noDataConversion = false) {
        if (!this._texture) {
            return null;
        }
        const size = this.getSize();
        let width = size.width;
        let height = size.height;
        const engine = this._getEngine();
        if (!engine) {
            return null;
        }
        if (level != 0) {
            width = width / Math.pow(2, level);
            height = height / Math.pow(2, level);
            width = Math.round(width);
            height = Math.round(height);
        }
        try {
            if (this._texture.isCube) {
                return engine._readTexturePixelsSync(this._texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion);
            }
            return engine._readTexturePixelsSync(this._texture, width, height, -1, level, buffer, flushRenderer, noDataConversion);
        }
        catch (e) {
            return null;
        }
    }
    /** @internal */
    get _lodTextureHigh() {
        if (this._texture) {
            return this._texture._lodTextureHigh;
        }
        return null;
    }
    /** @internal */
    get _lodTextureMid() {
        if (this._texture) {
            return this._texture._lodTextureMid;
        }
        return null;
    }
    /** @internal */
    get _lodTextureLow() {
        if (this._texture) {
            return this._texture._lodTextureLow;
        }
        return null;
    }
    /**
     * Dispose the texture and release its associated resources.
     */
    dispose() {
        if (this._scene) {
            // Animations
            if (this._scene.stopAnimation) {
                this._scene.stopAnimation(this);
            }
            // Remove from scene
            this._scene.removePendingData(this);
            const index = this._scene.textures.indexOf(this);
            if (index >= 0) {
                this._scene.textures.splice(index, 1);
            }
            this._scene.onTextureRemovedObservable.notifyObservers(this);
            this._scene = null;
            if (this._parentContainer) {
                const index = this._parentContainer.textures.indexOf(this);
                if (index > -1) {
                    this._parentContainer.textures.splice(index, 1);
                }
                this._parentContainer = null;
            }
        }
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this.metadata = null;
        super.dispose();
    }
    /**
     * Serialize the texture into a JSON representation that can be parsed later on.
     * @param allowEmptyName True to force serialization even if name is empty. Default: false
     * @returns the JSON representation of the texture
     */
    serialize(allowEmptyName = false) {
        if (!this.name && !allowEmptyName) {
            return null;
        }
        const serializationObject = SerializationHelper.Serialize(this);
        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
        return serializationObject;
    }
    /**
     * Helper function to be called back once a list of texture contains only ready textures.
     * @param textures Define the list of textures to wait for
     * @param callback Define the callback triggered once the entire list will be ready
     */
    static WhenAllReady(textures, callback) {
        let numRemaining = textures.length;
        if (numRemaining === 0) {
            callback();
            return;
        }
        for (let i = 0; i < textures.length; i++) {
            const texture = textures[i];
            if (texture.isReady()) {
                if (--numRemaining === 0) {
                    callback();
                }
            }
            else {
                const onLoadObservable = texture.onLoadObservable;
                if (onLoadObservable) {
                    onLoadObservable.addOnce(() => {
                        if (--numRemaining === 0) {
                            callback();
                        }
                    });
                }
                else {
                    if (--numRemaining === 0) {
                        callback();
                    }
                }
            }
        }
    }
    static _IsScene(sceneOrEngine) {
        return sceneOrEngine.getClassName() === "Scene";
    }
}
/**
 * Default anisotropic filtering level for the application.
 * It is set to 4 as a good tradeoff between perf and quality.
 */
BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL = 4;
__decorate([
    serialize()
], BaseTexture.prototype, "uniqueId", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "name", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "displayName", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "metadata", void 0);
__decorate([
    serialize("hasAlpha")
], BaseTexture.prototype, "_hasAlpha", void 0);
__decorate([
    serialize("getAlphaFromRGB")
], BaseTexture.prototype, "_getAlphaFromRGB", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "level", void 0);
__decorate([
    serialize("coordinatesIndex")
], BaseTexture.prototype, "_coordinatesIndex", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "optimizeUVAllocation", void 0);
__decorate([
    serialize("coordinatesMode")
], BaseTexture.prototype, "_coordinatesMode", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "wrapU", null);
__decorate([
    serialize()
], BaseTexture.prototype, "wrapV", null);
__decorate([
    serialize()
], BaseTexture.prototype, "wrapR", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "anisotropicFilteringLevel", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "isCube", null);
__decorate([
    serialize()
], BaseTexture.prototype, "is3D", null);
__decorate([
    serialize()
], BaseTexture.prototype, "is2DArray", null);
__decorate([
    serialize()
], BaseTexture.prototype, "gammaSpace", null);
__decorate([
    serialize()
], BaseTexture.prototype, "invertZ", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "lodLevelInAlpha", void 0);
__decorate([
    serialize()
], BaseTexture.prototype, "lodGenerationOffset", null);
__decorate([
    serialize()
], BaseTexture.prototype, "lodGenerationScale", null);
__decorate([
    serialize()
], BaseTexture.prototype, "linearSpecularLOD", null);
__decorate([
    serializeAsTexture()
], BaseTexture.prototype, "irradianceTexture", null);
__decorate([
    serialize()
], BaseTexture.prototype, "isRenderTarget", void 0);
//# sourceMappingURL=baseTexture.js.map