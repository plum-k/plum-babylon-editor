import { Logger } from "../../Misc/logger.js";
/** @internal */
export class WebGPUComputeContext {
    getBindGroups(bindings, computePipeline, bindingsMapping) {
        if (!bindingsMapping) {
            throw new Error("WebGPUComputeContext.getBindGroups: bindingsMapping is required until browsers support reflection for wgsl shaders!");
        }
        if (this._bindGroups.length === 0) {
            const bindGroupEntriesExist = this._bindGroupEntries.length > 0;
            for (const key in bindings) {
                const binding = bindings[key], location = bindingsMapping[key], group = location.group, index = location.binding, type = binding.type, object = binding.object;
                let indexInGroupEntries = binding.indexInGroupEntries;
                let entries = this._bindGroupEntries[group];
                if (!entries) {
                    entries = this._bindGroupEntries[group] = [];
                }
                switch (type) {
                    case 5 /* ComputeBindingType.Sampler */: {
                        const sampler = object;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            entries[indexInGroupEntries].resource = this._cacheSampler.getSampler(sampler);
                        }
                        else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: this._cacheSampler.getSampler(sampler),
                            });
                        }
                        break;
                    }
                    case 0 /* ComputeBindingType.Texture */:
                    case 4 /* ComputeBindingType.TextureWithoutSampler */: {
                        const texture = object;
                        const hardwareTexture = texture._texture._hardwareTexture;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            if (type === 0 /* ComputeBindingType.Texture */) {
                                entries[indexInGroupEntries++].resource = this._cacheSampler.getSampler(texture._texture);
                            }
                            entries[indexInGroupEntries].resource = hardwareTexture.view;
                        }
                        else {
                            binding.indexInGroupEntries = entries.length;
                            if (type === 0 /* ComputeBindingType.Texture */) {
                                entries.push({
                                    binding: index - 1,
                                    resource: this._cacheSampler.getSampler(texture._texture),
                                });
                            }
                            entries.push({
                                binding: index,
                                resource: hardwareTexture.view,
                            });
                        }
                        break;
                    }
                    case 1 /* ComputeBindingType.StorageTexture */: {
                        const texture = object;
                        const hardwareTexture = texture._texture._hardwareTexture;
                        if ((hardwareTexture.textureAdditionalUsages & 8 /* WebGPUConstants.TextureUsage.StorageBinding */) === 0) {
                            Logger.Error(`computeDispatch: The texture (name=${texture.name}, uniqueId=${texture.uniqueId}) is not a storage texture!`, 50);
                        }
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            entries[indexInGroupEntries].resource = hardwareTexture.viewForWriting;
                        }
                        else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: hardwareTexture.viewForWriting,
                            });
                        }
                        break;
                    }
                    case 6 /* ComputeBindingType.ExternalTexture */: {
                        const texture = object;
                        const externalTexture = texture.underlyingResource;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            entries[indexInGroupEntries].resource = this._device.importExternalTexture({ source: externalTexture });
                        }
                        else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: this._device.importExternalTexture({ source: externalTexture }),
                            });
                        }
                        break;
                    }
                    case 2 /* ComputeBindingType.UniformBuffer */:
                    case 3 /* ComputeBindingType.StorageBuffer */:
                    case 7 /* ComputeBindingType.DataBuffer */: {
                        const dataBuffer = type === 7 /* ComputeBindingType.DataBuffer */
                            ? object
                            : type === 2 /* ComputeBindingType.UniformBuffer */
                                ? object.getBuffer()
                                : object.getBuffer();
                        const webgpuBuffer = dataBuffer.underlyingResource;
                        if (indexInGroupEntries !== undefined && bindGroupEntriesExist) {
                            entries[indexInGroupEntries].resource.buffer = webgpuBuffer;
                            entries[indexInGroupEntries].resource.size = dataBuffer.capacity;
                        }
                        else {
                            binding.indexInGroupEntries = entries.length;
                            entries.push({
                                binding: index,
                                resource: {
                                    buffer: webgpuBuffer,
                                    offset: 0,
                                    size: dataBuffer.capacity,
                                },
                            });
                        }
                        break;
                    }
                }
            }
            for (let i = 0; i < this._bindGroupEntries.length; ++i) {
                const entries = this._bindGroupEntries[i];
                if (!entries) {
                    this._bindGroups[i] = undefined;
                    continue;
                }
                this._bindGroups[i] = this._device.createBindGroup({
                    layout: computePipeline.getBindGroupLayout(i),
                    entries,
                });
            }
            this._bindGroups.length = this._bindGroupEntries.length;
        }
        return this._bindGroups;
    }
    constructor(device, cacheSampler) {
        this._device = device;
        this._cacheSampler = cacheSampler;
        this.uniqueId = WebGPUComputeContext._Counter++;
        this._bindGroupEntries = [];
        this.clear();
    }
    clear() {
        this._bindGroups = [];
        // Don't reset _bindGroupEntries if they have already been created, they are still ok even if we have to clear _bindGroups (the layout of the compute shader can't change once created)
    }
}
WebGPUComputeContext._Counter = 0;
//# sourceMappingURL=webgpuComputeContext.js.map