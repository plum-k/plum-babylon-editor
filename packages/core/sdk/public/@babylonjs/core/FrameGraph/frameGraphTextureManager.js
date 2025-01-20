import { getDimensionsFromTextureSize, textureSizeIsObject } from "../Materials/Textures/textureCreationOptions.js";
import { Texture } from "../Materials/Textures/texture.js";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "./frameGraphTypes.js";

import { GetTypeForDepthTexture, IsDepthTexture, HasStencilAspect } from "../Materials/Textures/internalTexture.js";
import { FrameGraphRenderTarget } from "./frameGraphRenderTarget.js";
var FrameGraphTextureNamespace;
(function (FrameGraphTextureNamespace) {
    FrameGraphTextureNamespace[FrameGraphTextureNamespace["Task"] = 0] = "Task";
    FrameGraphTextureNamespace[FrameGraphTextureNamespace["Graph"] = 1] = "Graph";
    FrameGraphTextureNamespace[FrameGraphTextureNamespace["External"] = 2] = "External";
})(FrameGraphTextureNamespace || (FrameGraphTextureNamespace = {}));
/**
 * Manages the textures used by a frame graph
 * @experimental
 */
export class FrameGraphTextureManager {
    /**
     * Constructs a new instance of the texture manager
     * @param engine The engine to use
     * @param _debugTextures If true, debug textures will be created so that they are visible in the inspector
     * @param _scene The scene the manager belongs to
     */
    constructor(engine, _debugTextures = false, _scene) {
        this.engine = engine;
        this._debugTextures = _debugTextures;
        this._scene = _scene;
        /** @internal */
        this._textures = new Map();
        /** @internal */
        this._historyTextures = new Map();
        /** @internal */
        this._isRecordingTask = false;
        this._addSystemTextures();
    }
    /**
     * Checks if a handle is a backbuffer handle (color or depth/stencil)
     * @param handle The handle to check
     * @returns True if the handle is a backbuffer handle
     */
    isBackbuffer(handle) {
        if (handle === backbufferColorTextureHandle || handle === backbufferDepthStencilTextureHandle) {
            return true;
        }
        const textureEntry = this._textures.get(handle);
        if (!textureEntry) {
            return false;
        }
        return textureEntry.refHandle === backbufferColorTextureHandle || textureEntry.refHandle === backbufferDepthStencilTextureHandle;
    }
    /**
     * Checks if a handle is a backbuffer color handle
     * @param handle The handle to check
     * @returns True if the handle is a backbuffer color handle
     */
    isBackbufferColor(handle) {
        if (handle === backbufferColorTextureHandle) {
            return true;
        }
        const textureEntry = this._textures.get(handle);
        if (!textureEntry) {
            return false;
        }
        return textureEntry.refHandle === backbufferColorTextureHandle;
    }
    /**
     * Checks if a handle is a backbuffer depth/stencil handle
     * @param handle The handle to check
     * @returns True if the handle is a backbuffer depth/stencil handle
     */
    isBackbufferDepthStencil(handle) {
        if (handle === backbufferDepthStencilTextureHandle) {
            return true;
        }
        const textureEntry = this._textures.get(handle);
        if (!textureEntry) {
            return false;
        }
        return textureEntry.refHandle === backbufferDepthStencilTextureHandle;
    }
    /**
     * Checks if a handle is a history texture (or points to a history texture, for a dangling handle)
     * @param handle The handle to check
     * @returns True if the handle is a history texture, otherwise false
     */
    isHistoryTexture(handle) {
        const entry = this._textures.get(handle);
        if (!entry) {
            return false;
        }
        handle = entry.refHandle ?? handle;
        return this._historyTextures.has(handle);
    }
    /**
     * Gets the creation options of a texture
     * @param handle Handle of the texture
     * @returns The creation options of the texture
     */
    getTextureCreationOptions(handle) {
        const entry = this._textures.get(handle);
        const creationOptions = entry.creationOptions;
        return {
            size: textureSizeIsObject(creationOptions.size) ? { ...creationOptions.size } : creationOptions.size,
            sizeIsPercentage: creationOptions.sizeIsPercentage,
            options: FrameGraphTextureManager.CloneTextureOptions(creationOptions.options, entry.textureIndex),
            isHistoryTexture: creationOptions.isHistoryTexture,
        };
    }
    /**
     * Gets the description of a texture
     * @param handle Handle of the texture
     * @returns The description of the texture
     */
    getTextureDescription(handle) {
        const creationOptions = this.getTextureCreationOptions(handle);
        const size = !creationOptions.sizeIsPercentage
            ? textureSizeIsObject(creationOptions.size)
                ? creationOptions.size
                : { width: creationOptions.size, height: creationOptions.size }
            : this.getAbsoluteDimensions(creationOptions.size);
        return {
            size,
            options: creationOptions.options,
        };
    }
    /**
     * Gets a texture handle or creates a new texture if the handle is not provided.
     * If handle is not provided, newTextureName and creationOptions must be provided.
     * @param handle If provided, will simply return the handle
     * @param newTextureName Name of the new texture to create
     * @param creationOptions Options to use when creating the new texture
     * @returns The handle to the texture.
     */
    getTextureHandleOrCreateTexture(handle, newTextureName, creationOptions) {
        if (handle === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("getTextureHandleOrCreateTexture: Either handle or newTextureName and creationOptions must be provided.");
            }
            return this.createRenderTargetTexture(newTextureName, creationOptions);
        }
        return handle;
    }
    /**
     * Gets a texture from a handle.
     * Note that if the texture is a history texture, the read texture for the current frame will be returned.
     * @param handle The handle of the texture
     * @returns The texture or null if not found
     */
    getTextureFromHandle(handle) {
        const historyEntry = this._historyTextures.get(handle);
        if (historyEntry) {
            return historyEntry.textures[historyEntry.index ^ 1]; // gets the read texture
        }
        return this._textures.get(handle).texture;
    }
    /**
     * Imports a texture into the texture manager
     * @param name Name of the texture
     * @param texture Texture to import
     * @param handle Existing handle to use for the texture. If not provided (default), a new handle will be created.
     * @returns The handle to the texture
     */
    importTexture(name, texture, handle) {
        if (handle !== undefined) {
            this._freeEntry(handle);
        }
        const creationOptions = {
            size: { width: texture.width, height: texture.height },
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: {
                createMipMaps: texture.generateMipMaps,
                samples: texture.samples,
                types: [texture.type],
                formats: [texture.format],
                useSRGBBuffers: [texture._useSRGBBuffer],
                creationFlags: [texture._creationFlags],
                labels: texture.label ? [texture.label] : ["imported"],
            },
        };
        return this._createHandleForTexture(name, texture, creationOptions, FrameGraphTextureNamespace.External, handle);
    }
    /**
     * Creates a new render target texture
     * If multiple textures are described in FrameGraphTextureCreationOptions, the handle of the first texture is returned, handle+1 is the handle of the second texture, etc.
     * @param name Name of the texture
     * @param creationOptions Options to use when creating the texture
     * @param handle Existing handle to use for the texture. If not provided (default), a new handle will be created.
     * @returns The handle to the texture
     */
    createRenderTargetTexture(name, creationOptions, handle) {
        return this._createHandleForTexture(name, null, {
            size: textureSizeIsObject(creationOptions.size) ? { ...creationOptions.size } : creationOptions.size,
            sizeIsPercentage: creationOptions.sizeIsPercentage,
            isHistoryTexture: creationOptions.isHistoryTexture,
            options: FrameGraphTextureManager.CloneTextureOptions(creationOptions.options),
        }, this._isRecordingTask ? FrameGraphTextureNamespace.Task : FrameGraphTextureNamespace.Graph, handle);
    }
    /**
     * Creates a (frame graph) render target wrapper
     * Note that renderTargets or renderTargetDepth can be undefined, but not both at the same time!
     * @param name Name of the render target wrapper
     * @param renderTargets Render target handles (textures) to use
     * @param renderTargetDepth Render target depth handle (texture) to use
     * @returns The created render target wrapper
     */
    createRenderTarget(name, renderTargets, renderTargetDepth) {
        const renderTarget = new FrameGraphRenderTarget(name, this, renderTargets, renderTargetDepth);
        const rtw = renderTarget.renderTargetWrapper;
        if (rtw !== undefined && renderTargets) {
            const handles = Array.isArray(renderTargets) ? renderTargets : [renderTargets];
            for (let i = 0; i < handles.length; i++) {
                let handle = handles[i];
                handle = this._textures.get(handle)?.refHandle ?? handle;
                const historyEntry = this._historyTextures.get(handle);
                if (historyEntry) {
                    historyEntry.references.push({ renderTargetWrapper: rtw, textureIndex: i });
                    rtw.setTexture(historyEntry.textures[historyEntry.index], i, false);
                }
            }
        }
        return renderTarget;
    }
    /**
     * Creates a handle which is not associated with any texture.
     * Call resolveDanglingHandle to associate the handle with a valid texture handle.
     * @returns The dangling handle
     */
    createDanglingHandle() {
        return FrameGraphTextureManager._Counter++;
    }
    /**
     * Associates a texture with a dangling handle
     * @param danglingHandle The dangling handle
     * @param handle The handle to associate with the dangling handle (if not provided, a new texture handle will be created, using the newTextureName and creationOptions parameters)
     * @param newTextureName The name of the new texture to create (if handle is not provided)
     * @param creationOptions The options to use when creating the new texture (if handle is not provided)
     */
    resolveDanglingHandle(danglingHandle, handle, newTextureName, creationOptions) {
        if (handle === undefined) {
            if (newTextureName === undefined || creationOptions === undefined) {
                throw new Error("resolveDanglingHandle: Either handle or newTextureName and creationOptions must be provided.");
            }
            this.createRenderTargetTexture(newTextureName, creationOptions, danglingHandle);
            return;
        }
        const textureEntry = this._textures.get(handle);
        if (textureEntry === undefined) {
            throw new Error(`resolveDanglingHandle: Handle ${handle} does not exist!`);
        }
        this._textures.set(danglingHandle, {
            texture: textureEntry.texture,
            refHandle: handle,
            name: textureEntry.name,
            creationOptions: {
                size: { ...textureEntry.creationOptions.size },
                options: FrameGraphTextureManager.CloneTextureOptions(textureEntry.creationOptions.options),
                sizeIsPercentage: textureEntry.creationOptions.sizeIsPercentage,
                isHistoryTexture: false,
            },
            namespace: textureEntry.namespace,
            textureIndex: textureEntry.textureIndex,
        });
    }
    /**
     * Gets the absolute dimensions of a texture.
     * @param size The size of the texture. Width and height must be expressed as a percentage of the screen size (100=100%)!
     * @param screenWidth The width of the screen (default: the width of the rendering canvas)
     * @param screenHeight The height of the screen (default: the height of the rendering canvas)
     * @returns The absolute dimensions of the texture
     */
    getAbsoluteDimensions(size, screenWidth = this.engine.getRenderWidth(true), screenHeight = this.engine.getRenderHeight(true)) {
        const { width, height } = getDimensionsFromTextureSize(size);
        return {
            width: Math.floor((width * screenWidth) / 100),
            height: Math.floor((height * screenHeight) / 100),
        };
    }
    /** @internal */
    _dispose() {
        this._releaseTextures();
    }
    /** @internal */
    _allocateTextures() {
        this._textures.forEach((entry) => {
            if (!entry.texture) {
                if (entry.refHandle !== undefined) {
                    // entry is a dangling handle which has been resolved to point to refHandle
                    // We simply update the texture to point to the refHandle texture
                    const refEntry = this._textures.get(entry.refHandle);
                    entry.texture = refEntry.texture;
                    if (refEntry.refHandle === backbufferColorTextureHandle) {
                        entry.refHandle = backbufferColorTextureHandle;
                    }
                    if (refEntry.refHandle === backbufferDepthStencilTextureHandle) {
                        entry.refHandle = backbufferDepthStencilTextureHandle;
                    }
                }
                else if (entry.namespace !== FrameGraphTextureNamespace.External) {
                    const creationOptions = entry.creationOptions;
                    const size = creationOptions.sizeIsPercentage ? this.getAbsoluteDimensions(creationOptions.size) : creationOptions.size;
                    const textureIndex = entry.textureIndex || 0;
                    const internalTextureCreationOptions = {
                        createMipMaps: creationOptions.options.createMipMaps,
                        samples: creationOptions.options.samples,
                        type: creationOptions.options.types?.[textureIndex],
                        format: creationOptions.options.formats?.[textureIndex],
                        useSRGBBuffer: creationOptions.options.useSRGBBuffers?.[textureIndex],
                        creationFlags: creationOptions.options.creationFlags?.[textureIndex],
                        label: creationOptions.options.labels?.[textureIndex] ?? `${entry.name}${textureIndex > 0 ? "#" + textureIndex : ""}`,
                        samplingMode: 1,
                        createMSAATexture: creationOptions.options.samples > 1,
                    };
                    const isDepthTexture = IsDepthTexture(internalTextureCreationOptions.format);
                    const hasStencil = HasStencilAspect(internalTextureCreationOptions.format);
                    const source = isDepthTexture && hasStencil
                        ? 12 /* InternalTextureSource.DepthStencil */
                        : isDepthTexture || hasStencil
                            ? 14 /* InternalTextureSource.Depth */
                            : 5 /* InternalTextureSource.RenderTarget */;
                    const internalTexture = this.engine._createInternalTexture(size, internalTextureCreationOptions, false, source);
                    if (isDepthTexture) {
                        internalTexture.type = GetTypeForDepthTexture(internalTexture.format);
                    }
                    entry.texture = internalTexture;
                }
            }
            if (entry.texture && entry.refHandle === undefined) {
                entry.debug?.dispose();
                entry.debug = this._createDebugTexture(entry.name, entry.texture);
            }
        });
        this._historyTextures.forEach((entry) => {
            for (let i = 0; i < entry.handles.length; i++) {
                entry.textures[i] = this._textures.get(entry.handles[i]).texture;
            }
        });
    }
    /** @internal */
    _releaseTextures(releaseAll = true) {
        this._textures.forEach((entry, handle) => {
            if (releaseAll || entry.namespace !== FrameGraphTextureNamespace.External) {
                entry.debug?.dispose();
                entry.debug = undefined;
            }
            if (entry.namespace === FrameGraphTextureNamespace.External) {
                return;
            }
            entry.texture?.dispose();
            entry.texture = null;
            if (releaseAll || entry.namespace === FrameGraphTextureNamespace.Task) {
                this._textures.delete(handle);
            }
        });
        this._historyTextures.forEach((entry) => {
            for (let i = 0; i < entry.handles.length; i++) {
                entry.textures[i] = null;
            }
        });
        if (releaseAll) {
            this._textures.clear();
            this._historyTextures.clear();
            this._addSystemTextures();
        }
    }
    /** @internal */
    _updateHistoryTextures() {
        this._historyTextures.forEach((entry) => {
            entry.index = entry.index ^ 1;
            const currentTexture = entry.textures[entry.index];
            if (currentTexture) {
                for (const { renderTargetWrapper, textureIndex } of entry.references) {
                    renderTargetWrapper.setTexture(currentTexture, textureIndex, false);
                }
            }
        });
    }
    _addSystemTextures() {
        const size = { width: this.engine.getRenderWidth(true), height: this.engine.getRenderHeight(true) };
        this._textures.set(backbufferColorTextureHandle, {
            name: "backbuffer color",
            texture: null,
            creationOptions: {
                size,
                options: {
                    createMipMaps: false,
                    samples: this.engine.getCreationOptions().antialias ? 4 : 1,
                    types: [0], // todo? get from engine
                    formats: [5], // todo? get from engine
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                    labels: ["backbuffer color"],
                },
                sizeIsPercentage: false,
            },
            namespace: FrameGraphTextureNamespace.External,
        });
        this._textures.set(backbufferDepthStencilTextureHandle, {
            name: "backbuffer depth/stencil",
            texture: null,
            creationOptions: {
                size,
                options: {
                    createMipMaps: false,
                    samples: this.engine.getCreationOptions().antialias ? 4 : 1,
                    types: [0], // todo? get from engine
                    formats: [16], // todo? get from engine
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                    labels: ["backbuffer depth/stencil"],
                },
                sizeIsPercentage: false,
            },
            namespace: FrameGraphTextureNamespace.External,
        });
    }
    _createDebugTexture(name, texture) {
        if (!this._debugTextures) {
            return;
        }
        const textureDebug = new Texture(null, this._scene);
        textureDebug.name = name;
        textureDebug._texture = texture;
        textureDebug._texture.incrementReferences();
        return textureDebug;
    }
    _freeEntry(handle) {
        const entry = this._textures.get(handle);
        if (entry) {
            entry.debug?.dispose();
            this._textures.delete(handle);
        }
    }
    _createHandleForTexture(name, texture, creationOptions, namespace, handle, textureIndex) {
        handle = handle ?? FrameGraphTextureManager._Counter++;
        textureIndex = textureIndex || 0;
        const textureName = creationOptions.isHistoryTexture ? `${name} ping` : name;
        let label = creationOptions.options.labels?.[textureIndex] ?? "";
        if (label === textureName) {
            label = "";
        }
        const textureEntry = {
            texture,
            name: `${textureName}${label ? " " + label : ""}`,
            creationOptions: {
                size: textureSizeIsObject(creationOptions.size) ? creationOptions.size : { width: creationOptions.size, height: creationOptions.size },
                options: creationOptions.options,
                sizeIsPercentage: creationOptions.sizeIsPercentage,
                isHistoryTexture: creationOptions.isHistoryTexture,
            },
            namespace,
            textureIndex,
        };
        this._textures.set(handle, textureEntry);
        if (namespace === FrameGraphTextureNamespace.External) {
            return handle;
        }
        if (creationOptions.isHistoryTexture) {
            const pongCreationOptions = {
                size: { ...textureEntry.creationOptions.size },
                options: { ...textureEntry.creationOptions.options },
                sizeIsPercentage: textureEntry.creationOptions.sizeIsPercentage,
                isHistoryTexture: false,
            };
            const pongTexture = this._createHandleForTexture(`${name} pong`, null, pongCreationOptions, namespace);
            this._historyTextures.set(handle, { textures: [null, null], handles: [handle, pongTexture], index: 0, references: [] });
            return handle;
        }
        if (creationOptions.options.types && creationOptions.options.types.length > 1 && textureIndex === 0) {
            const textureCount = creationOptions.options.types.length;
            const creationOptionsForTexture = {
                size: textureSizeIsObject(creationOptions.size) ? creationOptions.size : { width: creationOptions.size, height: creationOptions.size },
                options: creationOptions.options,
                sizeIsPercentage: creationOptions.sizeIsPercentage,
            };
            for (let i = 1; i < textureCount; i++) {
                this._createHandleForTexture(textureName, null, creationOptionsForTexture, namespace, handle + i, i);
            }
            FrameGraphTextureManager._Counter += textureCount - 1;
        }
        return handle;
    }
    /**
     * Clones a texture options
     * @param options The options to clone
     * @param textureIndex The index of the texture in the types, formats, etc array of FrameGraphTextureOptions. If not provided, all options are cloned.
     * @returns The cloned options
     */
    static CloneTextureOptions(options, textureIndex) {
        return textureIndex !== undefined
            ? {
                createMipMaps: options.createMipMaps,
                samples: options.samples,
                types: options.types ? [options.types[textureIndex]] : undefined,
                formats: options.formats ? [options.formats[textureIndex]] : undefined,
                useSRGBBuffers: options.useSRGBBuffers ? [options.useSRGBBuffers[textureIndex]] : undefined,
                creationFlags: options.creationFlags ? [options.creationFlags[textureIndex]] : undefined,
                labels: options.labels ? [options.labels[textureIndex]] : undefined,
            }
            : {
                createMipMaps: options.createMipMaps,
                samples: options.samples,
                types: options.types ? [...options.types] : undefined,
                formats: options.formats ? [...options.formats] : undefined,
                useSRGBBuffers: options.useSRGBBuffers ? [...options.useSRGBBuffers] : undefined,
                creationFlags: options.creationFlags ? [...options.creationFlags] : undefined,
                labels: options.labels ? [...options.labels] : undefined,
            };
    }
}
FrameGraphTextureManager._Counter = 2; // 0 and 1 are reserved for backbuffer textures
//# sourceMappingURL=frameGraphTextureManager.js.map