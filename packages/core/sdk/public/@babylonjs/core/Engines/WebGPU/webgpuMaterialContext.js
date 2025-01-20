/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import { ExternalTexture } from "../../Materials/Textures/externalTexture.js";

import { WebGPUCacheSampler } from "./webgpuCacheSampler.js";
/** @internal */
export class WebGPUMaterialContext {
    get forceBindGroupCreation() {
        // If there is at least one external texture to bind, we must recreate the bind groups each time
        // because we need to retrieve a new texture each frame (by calling device.importExternalTexture)
        return this._numExternalTextures > 0;
    }
    get hasFloatOrDepthTextures() {
        return this._numFloatOrDepthTextures > 0;
    }
    constructor() {
        this.uniqueId = WebGPUMaterialContext._Counter++;
        this.updateId = 0;
        this.textureState = 0;
        this.reset();
    }
    reset() {
        this.samplers = {};
        this.textures = {};
        this.isDirty = true;
        this._numFloatOrDepthTextures = 0;
        this._numExternalTextures = 0;
    }
    setSampler(name, sampler) {
        let samplerCache = this.samplers[name];
        let currentHashCode = -1;
        if (!samplerCache) {
            this.samplers[name] = samplerCache = { sampler, hashCode: 0 };
        }
        else {
            currentHashCode = samplerCache.hashCode;
        }
        samplerCache.sampler = sampler;
        samplerCache.hashCode = sampler ? WebGPUCacheSampler.GetSamplerHashCode(sampler) : 0;
        const isDirty = currentHashCode !== samplerCache.hashCode;
        if (isDirty) {
            this.updateId++;
        }
        this.isDirty || (this.isDirty = isDirty);
    }
    setTexture(name, texture) {
        let textureCache = this.textures[name];
        let currentTextureId = -1;
        if (!textureCache) {
            this.textures[name] = textureCache = { texture, isFloatOrDepthTexture: false, isExternalTexture: false };
        }
        else {
            currentTextureId = textureCache.texture?.uniqueId ?? -1;
        }
        if (textureCache.isExternalTexture) {
            this._numExternalTextures--;
        }
        if (textureCache.isFloatOrDepthTexture) {
            this._numFloatOrDepthTextures--;
        }
        if (texture) {
            textureCache.isFloatOrDepthTexture =
                texture.type === 1 ||
                    (texture.format >= 13 && texture.format <= 18);
            textureCache.isExternalTexture = ExternalTexture.IsExternalTexture(texture);
            if (textureCache.isFloatOrDepthTexture) {
                this._numFloatOrDepthTextures++;
            }
            if (textureCache.isExternalTexture) {
                this._numExternalTextures++;
            }
        }
        else {
            textureCache.isFloatOrDepthTexture = false;
            textureCache.isExternalTexture = false;
        }
        textureCache.texture = texture;
        const isDirty = currentTextureId !== (texture?.uniqueId ?? -1);
        if (isDirty) {
            this.updateId++;
        }
        this.isDirty || (this.isDirty = isDirty);
    }
}
WebGPUMaterialContext._Counter = 0;
//# sourceMappingURL=webgpuMaterialContext.js.map