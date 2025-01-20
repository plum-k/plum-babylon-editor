/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import { Logger } from "../../Misc/logger.js";
/**
 * Sampler hash codes are 19 bits long, so using a start value of 2^20 for buffer ids will ensure we can't have any collision with the sampler hash codes
 */
const bufferIdStart = 1 << 20;
/**
 * textureIdStart is added to texture ids to ensure we can't have any collision with the buffer ids / sampler hash codes.
 * 2^35 for textureIdStart means we can have:
 * - 2^(35-20) = 2^15 = 32768 possible buffer ids
 * - 2^(53-35) = 2^18 = 524288 possible texture ids
 */
const textureIdStart = 2 ** 35;
class WebGPUBindGroupCacheNode {
    constructor() {
        this.values = {};
    }
}
/** @internal */
export class WebGPUCacheBindGroups {
    static get Statistics() {
        return {
            totalCreated: WebGPUCacheBindGroups.NumBindGroupsCreatedTotal,
            lastFrameCreated: WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame,
            lookupLastFrame: WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame,
            noLookupLastFrame: WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame,
        };
    }
    static ResetCache() {
        WebGPUCacheBindGroups._Cache = new WebGPUBindGroupCacheNode();
        WebGPUCacheBindGroups.NumBindGroupsCreatedTotal = 0;
        WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame = 0;
        WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame = 0;
        WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame = 0;
    }
    constructor(device, cacheSampler, engine) {
        this.disabled = false;
        this._device = device;
        this._cacheSampler = cacheSampler;
        this._engine = engine;
    }
    endFrame() {
        WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame = WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame;
        WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame = WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame;
        WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame = WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame = 0;
        WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame = 0;
    }
    /**
     * Cache is currently based on the uniform/storage buffers, samplers and textures used by the binding groups.
     * Note that all uniform buffers have an offset of 0 in Babylon and we don't have a use case where we would have the same buffer used with different capacity values:
     * that means we don't need to factor in the offset/size of the buffer in the cache, only the id
     * @param webgpuPipelineContext
     * @param drawContext
     * @param materialContext
     * @returns a bind group array
     */
    getBindGroups(webgpuPipelineContext, drawContext, materialContext) {
        let bindGroups = undefined;
        let node = WebGPUCacheBindGroups._Cache;
        const cacheIsDisabled = this.disabled || materialContext.forceBindGroupCreation;
        if (!cacheIsDisabled) {
            if (!drawContext.isDirty(materialContext.updateId) && !materialContext.isDirty) {
                WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame++;
                return drawContext.bindGroups;
            }
            for (const bufferName of webgpuPipelineContext.shaderProcessingContext.bufferNames) {
                const uboId = (drawContext.buffers[bufferName]?.uniqueId ?? 0) + bufferIdStart;
                let nextNode = node.values[uboId];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[uboId] = nextNode;
                }
                node = nextNode;
            }
            for (const samplerName of webgpuPipelineContext.shaderProcessingContext.samplerNames) {
                const samplerHashCode = materialContext.samplers[samplerName]?.hashCode ?? 0;
                let nextNode = node.values[samplerHashCode];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[samplerHashCode] = nextNode;
                }
                node = nextNode;
            }
            for (const textureName of webgpuPipelineContext.shaderProcessingContext.textureNames) {
                const textureId = (materialContext.textures[textureName]?.texture?.uniqueId ?? 0) + textureIdStart;
                let nextNode = node.values[textureId];
                if (!nextNode) {
                    nextNode = new WebGPUBindGroupCacheNode();
                    node.values[textureId] = nextNode;
                }
                node = nextNode;
            }
            bindGroups = node.bindGroups;
        }
        drawContext.resetIsDirty(materialContext.updateId);
        materialContext.isDirty = false;
        if (bindGroups) {
            drawContext.bindGroups = bindGroups;
            WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame++;
            return bindGroups;
        }
        bindGroups = [];
        drawContext.bindGroups = bindGroups;
        if (!cacheIsDisabled) {
            node.bindGroups = bindGroups;
        }
        WebGPUCacheBindGroups.NumBindGroupsCreatedTotal++;
        WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame++;
        const bindGroupLayouts = webgpuPipelineContext.bindGroupLayouts[materialContext.textureState];
        for (let i = 0; i < webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries.length; i++) {
            const setDefinition = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries[i];
            const entries = webgpuPipelineContext.shaderProcessingContext.bindGroupEntries[i];
            for (let j = 0; j < setDefinition.length; j++) {
                const entry = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries[i][j];
                const entryInfo = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding];
                const name = entryInfo.nameInArrayOfTexture ?? entryInfo.name;
                if (entry.sampler) {
                    const bindingInfo = materialContext.samplers[name];
                    if (bindingInfo) {
                        const sampler = bindingInfo.sampler;
                        if (!sampler) {
                            if (this._engine.dbgSanityChecks) {
                                Logger.Error(`Trying to bind a null sampler! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(bindingInfo, (key, value) => (key === "texture" ? "<no dump>" : value))}, materialContext.uniqueId=${materialContext.uniqueId}`, 50);
                            }
                            continue;
                        }
                        entries[j].resource = this._cacheSampler.getSampler(sampler, false, bindingInfo.hashCode, sampler.label);
                    }
                    else {
                        Logger.Error(`Sampler "${name}" could not be bound. entry=${JSON.stringify(entry)}, materialContext=${JSON.stringify(materialContext, (key, value) => key === "texture" || key === "sampler" ? "<no dump>" : value)}`, 50);
                    }
                }
                else if (entry.texture || entry.storageTexture) {
                    const bindingInfo = materialContext.textures[name];
                    if (bindingInfo) {
                        if (this._engine.dbgSanityChecks && bindingInfo.texture === null) {
                            Logger.Error(`Trying to bind a null texture! entry=${JSON.stringify(entry)}, bindingInfo=${JSON.stringify(bindingInfo, (key, value) => key === "texture" ? "<no dump>" : value)}, materialContext.uniqueId=${materialContext.uniqueId}`, 50);
                            continue;
                        }
                        const hardwareTexture = bindingInfo.texture._hardwareTexture;
                        if (this._engine.dbgSanityChecks &&
                            (!hardwareTexture || (entry.texture && !hardwareTexture.view) || (entry.storageTexture && !hardwareTexture.viewForWriting))) {
                            Logger.Error(`Trying to bind a null gpu texture or view! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(bindingInfo, (key, value) => (key === "texture" ? "<no dump>" : value))}, isReady=${bindingInfo.texture?.isReady}, materialContext.uniqueId=${materialContext.uniqueId}`, 50);
                            continue;
                        }
                        entries[j].resource = entry.storageTexture ? hardwareTexture.viewForWriting : hardwareTexture.view;
                    }
                    else {
                        Logger.Error(`Texture "${name}" could not be bound. entry=${JSON.stringify(entry)}, materialContext=${JSON.stringify(materialContext, (key, value) => key === "texture" || key === "sampler" ? "<no dump>" : value)}`, 50);
                    }
                }
                else if (entry.externalTexture) {
                    const bindingInfo = materialContext.textures[name];
                    if (bindingInfo) {
                        if (this._engine.dbgSanityChecks && bindingInfo.texture === null) {
                            Logger.Error(`Trying to bind a null external texture! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(bindingInfo, (key, value) => (key === "texture" ? "<no dump>" : value))}, materialContext.uniqueId=${materialContext.uniqueId}`, 50);
                            continue;
                        }
                        const externalTexture = bindingInfo.texture.underlyingResource;
                        if (this._engine.dbgSanityChecks && !externalTexture) {
                            Logger.Error(`Trying to bind a null gpu external texture! entry=${JSON.stringify(entry)}, name=${name}, bindingInfo=${JSON.stringify(bindingInfo, (key, value) => (key === "texture" ? "<no dump>" : value))}, isReady=${bindingInfo.texture?.isReady}, materialContext.uniqueId=${materialContext.uniqueId}`, 50);
                            continue;
                        }
                        entries[j].resource = this._device.importExternalTexture({ source: externalTexture });
                    }
                    else {
                        Logger.Error(`Texture "${name}" could not be bound. entry=${JSON.stringify(entry)}, materialContext=${JSON.stringify(materialContext, (key, value) => key === "texture" || key === "sampler" ? "<no dump>" : value)}`, 50);
                    }
                }
                else if (entry.buffer) {
                    const dataBuffer = drawContext.buffers[name];
                    if (dataBuffer) {
                        const webgpuBuffer = dataBuffer.underlyingResource;
                        entries[j].resource.buffer = webgpuBuffer;
                        entries[j].resource.size = dataBuffer.capacity;
                    }
                    else {
                        Logger.Error(`Can't find buffer "${name}". entry=${JSON.stringify(entry)}, buffers=${JSON.stringify(drawContext.buffers)}, drawContext.uniqueId=${drawContext.uniqueId}`, 50);
                    }
                }
            }
            const groupLayout = bindGroupLayouts[i];
            bindGroups[i] = this._device.createBindGroup({
                layout: groupLayout,
                entries,
            });
        }
        return bindGroups;
    }
}
WebGPUCacheBindGroups.NumBindGroupsCreatedTotal = 0;
WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame = 0;
WebGPUCacheBindGroups.NumBindGroupsLookupLastFrame = 0;
WebGPUCacheBindGroups.NumBindGroupsNoLookupLastFrame = 0;
WebGPUCacheBindGroups._Cache = new WebGPUBindGroupCacheNode();
WebGPUCacheBindGroups._NumBindGroupsCreatedCurrentFrame = 0;
WebGPUCacheBindGroups._NumBindGroupsLookupCurrentFrame = 0;
WebGPUCacheBindGroups._NumBindGroupsNoLookupCurrentFrame = 0;
//# sourceMappingURL=webgpuCacheBindGroups.js.map