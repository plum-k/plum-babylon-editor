import { HasStencilAspect } from "../Materials/Textures/internalTexture.js";

/**
 * Wrapper around a render target (either single or multi textures)
 */
export class RenderTargetWrapper {
    /**
     * Gets the depth/stencil texture
     */
    get depthStencilTexture() {
        return this._depthStencilTexture;
    }
    /**
     * Sets the depth/stencil texture
     * @param texture The depth/stencil texture to set
     * @param disposeExisting True to dispose the existing depth/stencil texture (if any) before replacing it (default: true)
     */
    setDepthStencilTexture(texture, disposeExisting = true) {
        if (disposeExisting && this._depthStencilTexture) {
            this._depthStencilTexture.dispose();
        }
        this._depthStencilTexture = texture;
        this._generateDepthBuffer = this._generateStencilBuffer = false;
        if (texture) {
            this._generateDepthBuffer = true;
            this._generateStencilBuffer = HasStencilAspect(texture.format);
        }
    }
    /**
     * Indicates if the depth/stencil texture has a stencil aspect
     */
    get depthStencilTextureWithStencil() {
        return this._depthStencilTextureWithStencil;
    }
    /**
     * Defines if the render target wrapper is for a cube texture or if false a 2d texture
     */
    get isCube() {
        return this._isCube;
    }
    /**
     * Defines if the render target wrapper is for a single or multi target render wrapper
     */
    get isMulti() {
        return this._isMulti;
    }
    /**
     * Defines if the render target wrapper is for a single or an array of textures
     */
    get is2DArray() {
        return this.layers > 0;
    }
    /**
     * Defines if the render target wrapper is for a 3D texture
     */
    get is3D() {
        return this.depth > 0;
    }
    /**
     * Gets the size of the render target wrapper (used for cubes, as width=height in this case)
     */
    get size() {
        return this.width;
    }
    /**
     * Gets the width of the render target wrapper
     */
    get width() {
        return this._size.width ?? this._size;
    }
    /**
     * Gets the height of the render target wrapper
     */
    get height() {
        return this._size.height ?? this._size;
    }
    /**
     * Gets the number of layers of the render target wrapper (only used if is2DArray is true and wrapper is not a multi render target)
     */
    get layers() {
        return this._size.layers || 0;
    }
    /**
     * Gets the depth of the render target wrapper (only used if is3D is true and wrapper is not a multi render target)
     */
    get depth() {
        return this._size.depth || 0;
    }
    /**
     * Gets the render texture. If this is a multi render target, gets the first texture
     */
    get texture() {
        return this._textures?.[0] ?? null;
    }
    /**
     * Gets the list of render textures. If we are not in a multi render target, the list will be null (use the texture getter instead)
     */
    get textures() {
        return this._textures;
    }
    /**
     * Gets the face indices that correspond to the list of render textures. If we are not in a multi render target, the list will be null
     */
    get faceIndices() {
        return this._faceIndices;
    }
    /**
     * Gets the layer indices that correspond to the list of render textures. If we are not in a multi render target, the list will be null
     */
    get layerIndices() {
        return this._layerIndices;
    }
    /**
     * Gets the base array layer of a texture in the textures array
     * This is an number that is calculated based on the layer and face indices set for this texture at that index
     * @param index The index of the texture in the textures array to get the base array layer for
     * @returns the base array layer of the texture at the given index
     */
    getBaseArrayLayer(index) {
        if (!this._textures) {
            return -1;
        }
        const texture = this._textures[index];
        const layerIndex = this._layerIndices?.[index] ?? 0;
        const faceIndex = this._faceIndices?.[index] ?? 0;
        return texture.isCube ? layerIndex * 6 + faceIndex : texture.is3D ? 0 : layerIndex;
    }
    /**
     * Gets the sample count of the render target
     */
    get samples() {
        return this._samples;
    }
    /**
     * Sets the sample count of the render target
     * @param value sample count
     * @param initializeBuffers If set to true, the engine will make an initializing call to drawBuffers (only used when isMulti=true).
     * @param force true to force calling the update sample count engine function even if the current sample count is equal to value
     * @returns the sample count that has been set
     */
    setSamples(value, initializeBuffers = true, force = false) {
        if (this.samples === value && !force) {
            return value;
        }
        const result = this._isMulti
            ? this._engine.updateMultipleRenderTargetTextureSampleCount(this, value, initializeBuffers)
            : this._engine.updateRenderTargetTextureSampleCount(this, value);
        this._samples = value;
        return result;
    }
    /**
     * Resolves the MSAA textures into their non-MSAA version.
     * Note that if samples equals 1 (no MSAA), no resolve is performed.
     */
    resolveMSAATextures() {
        if (this.isMulti) {
            this._engine.resolveMultiFramebuffer(this);
        }
        else {
            this._engine.resolveFramebuffer(this);
        }
    }
    /**
     * Generates mipmaps for each texture of the render target
     */
    generateMipMaps() {
        if (this._engine._currentRenderTarget === this) {
            this._engine.unBindFramebuffer(this, true);
        }
        if (this.isMulti) {
            this._engine.generateMipMapsMultiFramebuffer(this);
        }
        else {
            this._engine.generateMipMapsFramebuffer(this);
        }
    }
    /**
     * Initializes the render target wrapper
     * @param isMulti true if the wrapper is a multi render target
     * @param isCube true if the wrapper should render to a cube texture
     * @param size size of the render target (width/height/layers)
     * @param engine engine used to create the render target
     * @param label defines the label to use for the wrapper (for debugging purpose only)
     */
    constructor(isMulti, isCube, size, engine, label) {
        this._textures = null;
        this._faceIndices = null;
        this._layerIndices = null;
        /** @internal */
        this._samples = 1;
        /** @internal */
        this._attachments = null;
        /** @internal */
        this._generateStencilBuffer = false;
        /** @internal */
        this._generateDepthBuffer = false;
        /** @internal */
        this._depthStencilTextureWithStencil = false;
        /**
         * Sets this property to true to disable the automatic MSAA resolve that happens when the render target wrapper is unbound (default is false)
         */
        this.disableAutomaticMSAAResolve = false;
        /**
         * Indicates if MSAA color texture(s) should be resolved when a resolve occur (either automatically by the engine or manually by the user) (default is true)
         * Note that you can trigger a MSAA resolve at any time by calling resolveMSAATextures()
         */
        this.resolveMSAAColors = true;
        /**
         * Indicates if MSAA depth texture should be resolved when a resolve occur (either automatically by the engine or manually by the user) (default is false)
         */
        this.resolveMSAADepth = false;
        /**
         * Indicates if MSAA stencil texture should be resolved when a resolve occur (either automatically by the engine or manually by the user) (default is false)
         */
        this.resolveMSAAStencil = false;
        this._isMulti = isMulti;
        this._isCube = isCube;
        this._size = size;
        this._engine = engine;
        this._depthStencilTexture = null;
        this.label = label;
    }
    /**
     * Sets the render target texture(s)
     * @param textures texture(s) to set
     */
    setTextures(textures) {
        if (Array.isArray(textures)) {
            this._textures = textures;
        }
        else if (textures) {
            this._textures = [textures];
        }
        else {
            this._textures = null;
        }
    }
    /**
     * Set a texture in the textures array
     * @param texture The texture to set
     * @param index The index in the textures array to set
     * @param disposePrevious If this function should dispose the previous texture
     */
    setTexture(texture, index = 0, disposePrevious = true) {
        if (!this._textures) {
            this._textures = [];
        }
        if (this._textures[index] === texture) {
            return;
        }
        if (this._textures[index] && disposePrevious) {
            this._textures[index].dispose();
        }
        this._textures[index] = texture;
    }
    /**
     * Sets the layer and face indices of every render target texture bound to each color attachment
     * @param layers The layers of each texture to be set
     * @param faces The faces of each texture to be set
     */
    setLayerAndFaceIndices(layers, faces) {
        this._layerIndices = layers;
        this._faceIndices = faces;
    }
    /**
     * Sets the layer and face indices of a texture in the textures array that should be bound to each color attachment
     * @param index The index of the texture in the textures array to modify
     * @param layer The layer of the texture to be set
     * @param face The face of the texture to be set
     */
    setLayerAndFaceIndex(index = 0, layer, face) {
        if (!this._layerIndices) {
            this._layerIndices = [];
        }
        if (!this._faceIndices) {
            this._faceIndices = [];
        }
        if (layer !== undefined && layer >= 0) {
            this._layerIndices[index] = layer;
        }
        if (face !== undefined && face >= 0) {
            this._faceIndices[index] = face;
        }
    }
    /**
     * Creates the depth/stencil texture
     * @param comparisonFunction Comparison function to use for the texture
     * @param bilinearFiltering true if bilinear filtering should be used when sampling the texture
     * @param generateStencil Not used anymore. "format" will be used to determine if stencil should be created
     * @param samples sample count to use when creating the texture (default: 1)
     * @param format format of the depth texture (default: 14)
     * @param label defines the label to use for the texture (for debugging purpose only)
     * @returns the depth/stencil created texture
     */
    createDepthStencilTexture(comparisonFunction = 0, bilinearFiltering = true, generateStencil = false, samples = 1, format = 14, label) {
        this._depthStencilTexture?.dispose();
        this._depthStencilTextureWithStencil = generateStencil;
        this._depthStencilTextureLabel = label;
        this._depthStencilTexture = this._engine.createDepthStencilTexture(this._size, {
            bilinearFiltering,
            comparisonFunction,
            generateStencil,
            isCube: this._isCube,
            samples,
            depthTextureFormat: format,
            label,
        }, this);
        return this._depthStencilTexture;
    }
    /**
     * @deprecated Use shareDepth instead
     * @param renderTarget Destination renderTarget
     */
    _shareDepth(renderTarget) {
        this.shareDepth(renderTarget);
    }
    /**
     * Shares the depth buffer of this render target with another render target.
     * @param renderTarget Destination renderTarget
     */
    shareDepth(renderTarget) {
        if (this._depthStencilTexture) {
            if (renderTarget._depthStencilTexture) {
                renderTarget._depthStencilTexture.dispose();
            }
            renderTarget._depthStencilTexture = this._depthStencilTexture;
            renderTarget._depthStencilTextureWithStencil = this._depthStencilTextureWithStencil;
            this._depthStencilTexture.incrementReferences();
        }
    }
    /**
     * @internal
     */
    _swapAndDie(target) {
        if (this.texture) {
            this.texture._swapAndDie(target);
        }
        this._textures = null;
        this.dispose(true);
    }
    _cloneRenderTargetWrapper() {
        let rtw = null;
        if (this._isMulti) {
            const textureArray = this.textures;
            if (textureArray && textureArray.length > 0) {
                let generateDepthTexture = false;
                let textureCount = textureArray.length;
                let depthTextureFormat = -1;
                const lastTextureSource = textureArray[textureArray.length - 1]._source;
                if (lastTextureSource === 14 /* InternalTextureSource.Depth */ || lastTextureSource === 12 /* InternalTextureSource.DepthStencil */) {
                    generateDepthTexture = true;
                    depthTextureFormat = textureArray[textureArray.length - 1].format;
                    textureCount--;
                }
                const samplingModes = [];
                const types = [];
                const formats = [];
                const targetTypes = [];
                const faceIndex = [];
                const layerIndex = [];
                const layerCounts = [];
                const internalTexture2Index = {};
                for (let i = 0; i < textureCount; ++i) {
                    const texture = textureArray[i];
                    samplingModes.push(texture.samplingMode);
                    types.push(texture.type);
                    formats.push(texture.format);
                    const index = internalTexture2Index[texture.uniqueId];
                    if (index !== undefined) {
                        targetTypes.push(-1);
                        layerCounts.push(0);
                    }
                    else {
                        internalTexture2Index[texture.uniqueId] = i;
                        if (texture.is2DArray) {
                            targetTypes.push(35866);
                            layerCounts.push(texture.depth);
                        }
                        else if (texture.isCube) {
                            targetTypes.push(34067);
                            layerCounts.push(0);
                        } /*else if (texture.isCubeArray) {
                            targetTypes.push(3735928559);
                            layerCounts.push(texture.depth);
                        }*/
                        else if (texture.is3D) {
                            targetTypes.push(32879);
                            layerCounts.push(texture.depth);
                        }
                        else {
                            targetTypes.push(3553);
                            layerCounts.push(0);
                        }
                    }
                    if (this._faceIndices) {
                        faceIndex.push(this._faceIndices[i] ?? 0);
                    }
                    if (this._layerIndices) {
                        layerIndex.push(this._layerIndices[i] ?? 0);
                    }
                }
                const optionsMRT = {
                    samplingModes,
                    generateMipMaps: textureArray[0].generateMipMaps,
                    generateDepthBuffer: this._generateDepthBuffer,
                    generateStencilBuffer: this._generateStencilBuffer,
                    generateDepthTexture,
                    depthTextureFormat,
                    types,
                    formats,
                    textureCount,
                    targetTypes,
                    faceIndex,
                    layerIndex,
                    layerCounts,
                    label: this.label,
                };
                const size = {
                    width: this.width,
                    height: this.height,
                    depth: this.depth,
                };
                rtw = this._engine.createMultipleRenderTarget(size, optionsMRT);
                for (let i = 0; i < textureCount; ++i) {
                    if (targetTypes[i] !== -1) {
                        continue;
                    }
                    const index = internalTexture2Index[textureArray[i].uniqueId];
                    rtw.setTexture(rtw.textures[index], i);
                }
            }
        }
        else {
            const options = {};
            options.generateDepthBuffer = this._generateDepthBuffer;
            options.generateMipMaps = this.texture?.generateMipMaps ?? false;
            options.generateStencilBuffer = this._generateStencilBuffer;
            options.samplingMode = this.texture?.samplingMode;
            options.type = this.texture?.type;
            options.format = this.texture?.format;
            options.noColorAttachment = !this._textures;
            options.label = this.label;
            if (this.isCube) {
                rtw = this._engine.createRenderTargetCubeTexture(this.width, options);
            }
            else {
                const size = {
                    width: this.width,
                    height: this.height,
                    layers: this.is2DArray || this.is3D ? this.texture?.depth : undefined,
                };
                rtw = this._engine.createRenderTargetTexture(size, options);
            }
            if (rtw.texture) {
                rtw.texture.isReady = true;
            }
        }
        return rtw;
    }
    _swapRenderTargetWrapper(target) {
        if (this._textures && target._textures) {
            for (let i = 0; i < this._textures.length; ++i) {
                this._textures[i]._swapAndDie(target._textures[i], false);
                target._textures[i].isReady = true;
            }
        }
        if (this._depthStencilTexture && target._depthStencilTexture) {
            this._depthStencilTexture._swapAndDie(target._depthStencilTexture);
            target._depthStencilTexture.isReady = true;
        }
        this._textures = null;
        this._depthStencilTexture = null;
    }
    /** @internal */
    _rebuild() {
        const rtw = this._cloneRenderTargetWrapper();
        if (!rtw) {
            return;
        }
        if (this._depthStencilTexture) {
            const samplingMode = this._depthStencilTexture.samplingMode;
            const format = this._depthStencilTexture.format;
            const bilinear = samplingMode === 2 ||
                samplingMode === 3 ||
                samplingMode === 11;
            rtw.createDepthStencilTexture(this._depthStencilTexture._comparisonFunction, bilinear, this._depthStencilTextureWithStencil, this._depthStencilTexture.samples, format, this._depthStencilTextureLabel);
        }
        if (this.samples > 1) {
            rtw.setSamples(this.samples);
        }
        rtw._swapRenderTargetWrapper(this);
        rtw.dispose();
    }
    /**
     * Releases the internal render textures
     */
    releaseTextures() {
        if (this._textures) {
            for (let i = 0; i < this._textures.length; ++i) {
                this._textures[i].dispose();
            }
        }
        this._textures = null;
    }
    /**
     * Disposes the whole render target wrapper
     * @param disposeOnlyFramebuffers true if only the frame buffers should be released (used for the WebGL engine). If false, all the textures will also be released
     */
    dispose(disposeOnlyFramebuffers = false) {
        if (!disposeOnlyFramebuffers) {
            this._depthStencilTexture?.dispose();
            this._depthStencilTexture = null;
            this.releaseTextures();
        }
        this._engine._releaseRenderTargetWrapper(this);
    }
}
//# sourceMappingURL=renderTargetWrapper.js.map