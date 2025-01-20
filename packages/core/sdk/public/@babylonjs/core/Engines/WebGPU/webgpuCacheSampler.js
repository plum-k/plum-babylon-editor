
const filterToBits = [
    0 | (0 << 1) | (0 << 2), // not used
    0 | (0 << 1) | (0 << 2), // TEXTURE_NEAREST_SAMPLINGMODE / TEXTURE_NEAREST_NEAREST
    1 | (1 << 1) | (0 << 2), // TEXTURE_BILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR
    1 | (1 << 1) | (1 << 2), // TEXTURE_TRILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR_MIPLINEAR
    0 | (0 << 1) | (0 << 2), // TEXTURE_NEAREST_NEAREST_MIPNEAREST
    0 | (1 << 1) | (0 << 2), // TEXTURE_NEAREST_LINEAR_MIPNEAREST
    0 | (1 << 1) | (1 << 2), // TEXTURE_NEAREST_LINEAR_MIPLINEAR
    0 | (1 << 1) | (0 << 2), // TEXTURE_NEAREST_LINEAR
    0 | (0 << 1) | (1 << 2), // TEXTURE_NEAREST_NEAREST_MIPLINEAR
    1 | (0 << 1) | (0 << 2), // TEXTURE_LINEAR_NEAREST_MIPNEAREST
    1 | (0 << 1) | (1 << 2), // TEXTURE_LINEAR_NEAREST_MIPLINEAR
    1 | (1 << 1) | (0 << 2), // TEXTURE_LINEAR_LINEAR_MIPNEAREST
    1 | (0 << 1) | (0 << 2), // TEXTURE_LINEAR_NEAREST
];
// subtract 0x01FF from the comparison function value before indexing this array!
const comparisonFunctionToBits = [
    (0 << 3) | (0 << 4) | (0 << 5) | (0 << 6), // undefined
    (0 << 3) | (0 << 4) | (0 << 5) | (1 << 6), // NEVER
    (0 << 3) | (0 << 4) | (1 << 5) | (0 << 6), // LESS
    (0 << 3) | (0 << 4) | (1 << 5) | (1 << 6), // EQUAL
    (0 << 3) | (1 << 4) | (0 << 5) | (0 << 6), // LEQUAL
    (0 << 3) | (1 << 4) | (0 << 5) | (1 << 6), // GREATER
    (0 << 3) | (1 << 4) | (1 << 5) | (0 << 6), // NOTEQUAL
    (0 << 3) | (1 << 4) | (1 << 5) | (1 << 6), // GEQUAL
    (1 << 3) | (0 << 4) | (0 << 5) | (0 << 6), // ALWAYS
];
const filterNoMipToBits = [
    0 << 7, // not used
    1 << 7, // TEXTURE_NEAREST_SAMPLINGMODE / TEXTURE_NEAREST_NEAREST
    1 << 7, // TEXTURE_BILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR
    0 << 7, // TEXTURE_TRILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR_MIPLINEAR
    0 << 7, // TEXTURE_NEAREST_NEAREST_MIPNEAREST
    0 << 7, // TEXTURE_NEAREST_LINEAR_MIPNEAREST
    0 << 7, // TEXTURE_NEAREST_LINEAR_MIPLINEAR
    1 << 7, // TEXTURE_NEAREST_LINEAR
    0 << 7, // TEXTURE_NEAREST_NEAREST_MIPLINEAR
    0 << 7, // TEXTURE_LINEAR_NEAREST_MIPNEAREST
    0 << 7, // TEXTURE_LINEAR_NEAREST_MIPLINEAR
    0 << 7, // TEXTURE_LINEAR_LINEAR_MIPNEAREST
    1 << 7, // TEXTURE_LINEAR_NEAREST
];
/** @internal */
export class WebGPUCacheSampler {
    constructor(device) {
        this._samplers = {};
        this._device = device;
        this.disabled = false;
    }
    static GetSamplerHashCode(sampler) {
        // The WebGPU spec currently only allows values 1 and 4 for anisotropy
        const anisotropy = sampler._cachedAnisotropicFilteringLevel ? sampler._cachedAnisotropicFilteringLevel : 1;
        const code = filterToBits[sampler.samplingMode] +
            comparisonFunctionToBits[(sampler._comparisonFunction || 0x0202) - 0x0200 + 1] +
            filterNoMipToBits[sampler.samplingMode] + // handle the lodMinClamp = lodMaxClamp = 0 case when no filter used for mip mapping
            ((sampler._cachedWrapU ?? 1) << 8) +
            ((sampler._cachedWrapV ?? 1) << 10) +
            ((sampler._cachedWrapR ?? 1) << 12) +
            ((sampler.useMipMaps ? 1 : 0) << 14) + // need to factor this in because _getSamplerFilterDescriptor depends on samplingMode AND useMipMaps!
            (anisotropy << 15);
        return code;
    }
    static _GetSamplerFilterDescriptor(sampler, anisotropy) {
        let magFilter, minFilter, mipmapFilter, lodMinClamp, lodMaxClamp;
        const useMipMaps = sampler.useMipMaps;
        switch (sampler.samplingMode) {
            case 11:
                magFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                minFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case 3:
            case 3:
                magFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                minFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                if (!useMipMaps) {
                    mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                    lodMinClamp = lodMaxClamp = 0;
                }
                else {
                    mipmapFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                }
                break;
            case 8:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                if (!useMipMaps) {
                    mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                    lodMinClamp = lodMaxClamp = 0;
                }
                else {
                    mipmapFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                }
                break;
            case 4:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case 5:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case 6:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                if (!useMipMaps) {
                    mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                    lodMinClamp = lodMaxClamp = 0;
                }
                else {
                    mipmapFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                }
                break;
            case 7:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                lodMinClamp = lodMaxClamp = 0;
                break;
            case 1:
            case 1:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                lodMinClamp = lodMaxClamp = 0;
                break;
            case 9:
                magFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case 10:
                magFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                if (!useMipMaps) {
                    mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                    lodMinClamp = lodMaxClamp = 0;
                }
                else {
                    mipmapFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                }
                break;
            case 2:
            case 2:
                magFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                minFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                lodMinClamp = lodMaxClamp = 0;
                break;
            case 12:
                magFilter = "linear" /* WebGPUConstants.FilterMode.Linear */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                lodMinClamp = lodMaxClamp = 0;
                break;
            default:
                magFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                minFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                mipmapFilter = "nearest" /* WebGPUConstants.FilterMode.Nearest */;
                lodMinClamp = lodMaxClamp = 0;
                break;
        }
        if (anisotropy > 1 && (lodMinClamp !== 0 || lodMaxClamp !== 0) && mipmapFilter !== "nearest" /* WebGPUConstants.FilterMode.Nearest */) {
            return {
                magFilter: "linear" /* WebGPUConstants.FilterMode.Linear */,
                minFilter: "linear" /* WebGPUConstants.FilterMode.Linear */,
                mipmapFilter: "linear" /* WebGPUConstants.FilterMode.Linear */,
                anisotropyEnabled: true,
            };
        }
        return {
            magFilter,
            minFilter,
            mipmapFilter,
            lodMinClamp,
            lodMaxClamp,
        };
    }
    static _GetWrappingMode(mode) {
        switch (mode) {
            case 1:
                return "repeat" /* WebGPUConstants.AddressMode.Repeat */;
            case 0:
                return "clamp-to-edge" /* WebGPUConstants.AddressMode.ClampToEdge */;
            case 2:
                return "mirror-repeat" /* WebGPUConstants.AddressMode.MirrorRepeat */;
        }
        return "repeat" /* WebGPUConstants.AddressMode.Repeat */;
    }
    static _GetSamplerWrappingDescriptor(sampler) {
        return {
            addressModeU: this._GetWrappingMode(sampler._cachedWrapU),
            addressModeV: this._GetWrappingMode(sampler._cachedWrapV),
            addressModeW: this._GetWrappingMode(sampler._cachedWrapR),
        };
    }
    static _GetSamplerDescriptor(sampler, label) {
        const anisotropy = sampler.useMipMaps && sampler._cachedAnisotropicFilteringLevel ? sampler._cachedAnisotropicFilteringLevel : 1;
        const filterDescriptor = this._GetSamplerFilterDescriptor(sampler, anisotropy);
        return {
            label,
            ...filterDescriptor,
            ...this._GetSamplerWrappingDescriptor(sampler),
            compare: sampler._comparisonFunction ? WebGPUCacheSampler.GetCompareFunction(sampler._comparisonFunction) : undefined,
            maxAnisotropy: filterDescriptor.anisotropyEnabled ? anisotropy : 1,
        };
    }
    static GetCompareFunction(compareFunction) {
        switch (compareFunction) {
            case 519:
                return "always" /* WebGPUConstants.CompareFunction.Always */;
            case 514:
                return "equal" /* WebGPUConstants.CompareFunction.Equal */;
            case 516:
                return "greater" /* WebGPUConstants.CompareFunction.Greater */;
            case 518:
                return "greater-equal" /* WebGPUConstants.CompareFunction.GreaterEqual */;
            case 513:
                return "less" /* WebGPUConstants.CompareFunction.Less */;
            case 515:
                return "less-equal" /* WebGPUConstants.CompareFunction.LessEqual */;
            case 512:
                return "never" /* WebGPUConstants.CompareFunction.Never */;
            case 517:
                return "not-equal" /* WebGPUConstants.CompareFunction.NotEqual */;
            default:
                return "less" /* WebGPUConstants.CompareFunction.Less */;
        }
    }
    getSampler(sampler, bypassCache = false, hash = 0, label) {
        if (this.disabled) {
            return this._device.createSampler(WebGPUCacheSampler._GetSamplerDescriptor(sampler, label));
        }
        if (bypassCache) {
            hash = 0;
        }
        else if (hash === 0) {
            hash = WebGPUCacheSampler.GetSamplerHashCode(sampler);
        }
        let gpuSampler = bypassCache ? undefined : this._samplers[hash];
        if (!gpuSampler) {
            gpuSampler = this._device.createSampler(WebGPUCacheSampler._GetSamplerDescriptor(sampler, label));
            if (!bypassCache) {
                this._samplers[hash] = gpuSampler;
            }
        }
        return gpuSampler;
    }
}
//# sourceMappingURL=webgpuCacheSampler.js.map