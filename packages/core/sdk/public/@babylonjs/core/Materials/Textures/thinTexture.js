
import { Size } from "../../Maths/math.size.js";
/**
 * Base class of all the textures in babylon.
 * It groups all the common properties required to work with Thin Engine.
 */
export class ThinTexture {
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
     * How a texture is mapped.
     * Unused in thin texture mode.
     */
    get coordinatesMode() {
        return 0;
    }
    /**
     * Define if the texture is a cube texture or if false a 2d texture.
     */
    get isCube() {
        if (!this._texture) {
            return false;
        }
        return this._texture.isCube;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    set isCube(value) {
        if (!this._texture) {
            return;
        }
        this._texture.isCube = value;
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
     * Get the class name of the texture.
     * @returns "ThinTexture"
     */
    getClassName() {
        return "ThinTexture";
    }
    static _IsRenderTargetWrapper(texture) {
        return texture?.shareDepth !== undefined;
    }
    /**
     * Instantiates a new ThinTexture.
     * Base class of all the textures in babylon.
     * This can be used as an internal texture wrapper in AbstractEngine to benefit from the cache
     * @param internalTexture Define the internalTexture to wrap. You can also pass a RenderTargetWrapper, in which case the texture will be the render target's texture
     */
    constructor(internalTexture) {
        this._wrapU = 1;
        this._wrapV = 1;
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
        this.anisotropicFilteringLevel = 4;
        /**
         * Define the current state of the loading sequence when in delayed load mode.
         */
        this.delayLoadState = 0;
        /** @internal */
        this._texture = null;
        this._engine = null;
        this._cachedSize = Size.Zero();
        this._cachedBaseSize = Size.Zero();
        /** @internal */
        this._initialSamplingMode = 2;
        this._texture = ThinTexture._IsRenderTargetWrapper(internalTexture) ? internalTexture.texture : internalTexture;
        if (this._texture) {
            this._engine = this._texture.getEngine();
        }
    }
    /**
     * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
     * @returns true if fully ready
     */
    isReady() {
        if (this.delayLoadState === 4) {
            this.delayLoad();
            return false;
        }
        if (this._texture) {
            return this._texture.isReady;
        }
        return false;
    }
    /**
     * Triggers the load sequence in delayed load mode.
     */
    delayLoad() { }
    /**
     * Get the underlying lower level texture from Babylon.
     * @returns the internal texture
     */
    getInternalTexture() {
        return this._texture;
    }
    /**
     * Get the size of the texture.
     * @returns the texture size.
     */
    getSize() {
        if (this._texture) {
            if (this._texture.width) {
                this._cachedSize.width = this._texture.width;
                this._cachedSize.height = this._texture.height;
                return this._cachedSize;
            }
            if (this._texture._size) {
                this._cachedSize.width = this._texture._size;
                this._cachedSize.height = this._texture._size;
                return this._cachedSize;
            }
        }
        return this._cachedSize;
    }
    /**
     * Get the base size of the texture.
     * It can be different from the size if the texture has been resized for POT for instance
     * @returns the base size
     */
    getBaseSize() {
        if (!this.isReady() || !this._texture) {
            this._cachedBaseSize.width = 0;
            this._cachedBaseSize.height = 0;
            return this._cachedBaseSize;
        }
        if (this._texture._size) {
            this._cachedBaseSize.width = this._texture._size;
            this._cachedBaseSize.height = this._texture._size;
            return this._cachedBaseSize;
        }
        this._cachedBaseSize.width = this._texture.baseWidth;
        this._cachedBaseSize.height = this._texture.baseHeight;
        return this._cachedBaseSize;
    }
    /**
     * Get the current sampling mode associated with the texture.
     */
    get samplingMode() {
        if (!this._texture) {
            return this._initialSamplingMode;
        }
        return this._texture.samplingMode;
    }
    /**
     * Update the sampling mode of the texture.
     * Default is Trilinear mode.
     *
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 1     | NEAREST_SAMPLINGMODE or NEAREST_NEAREST_MIPLINEAR  | Nearest is: mag = nearest, min = nearest, mip = linear |
     * | 2     | BILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPNEAREST | Bilinear is: mag = linear, min = linear, mip = nearest |
     * | 3     | TRILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPLINEAR | Trilinear is: mag = linear, min = linear, mip = linear |
     * | 4     | NEAREST_NEAREST_MIPNEAREST |             |
     * | 5    | NEAREST_LINEAR_MIPNEAREST |             |
     * | 6    | NEAREST_LINEAR_MIPLINEAR |             |
     * | 7    | NEAREST_LINEAR |             |
     * | 8    | NEAREST_NEAREST |             |
     * | 9   | LINEAR_NEAREST_MIPNEAREST |             |
     * | 10   | LINEAR_NEAREST_MIPLINEAR |             |
     * | 11   | LINEAR_LINEAR |             |
     * | 12   | LINEAR_NEAREST |             |
     *
     *    > _mag_: magnification filter (close to the viewer)
     *    > _min_: minification filter (far from the viewer)
     *    > _mip_: filter used between mip map levels
     *@param samplingMode Define the new sampling mode of the texture
     */
    updateSamplingMode(samplingMode) {
        if (this._texture && this._engine) {
            this._engine.updateTextureSamplingMode(samplingMode, this._texture);
        }
    }
    /**
     * Release and destroy the underlying lower level texture aka internalTexture.
     */
    releaseInternalTexture() {
        if (this._texture) {
            this._texture.dispose();
            this._texture = null;
        }
    }
    /**
     * Dispose the texture and release its associated resources.
     */
    dispose() {
        if (this._texture) {
            this.releaseInternalTexture();
            this._engine = null;
        }
    }
}
//# sourceMappingURL=thinTexture.js.map