import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsTexture, expandToProperty, serializeAsColor3 } from "../../Misc/decorators.js";
import { Color3 } from "../../Maths/math.color.js";
import { MaterialFlags } from "../materialFlags.js";

import { MaterialPluginBase } from "../materialPluginBase.js";
import { MaterialDefines } from "../materialDefines.js";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "../materialHelper.functions.js";
/**
 * @internal
 */
export class MaterialClearCoatDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.CLEARCOAT = false;
        this.CLEARCOAT_DEFAULTIOR = false;
        this.CLEARCOAT_TEXTURE = false;
        this.CLEARCOAT_TEXTURE_ROUGHNESS = false;
        this.CLEARCOAT_TEXTUREDIRECTUV = 0;
        this.CLEARCOAT_TEXTURE_ROUGHNESSDIRECTUV = 0;
        this.CLEARCOAT_BUMP = false;
        this.CLEARCOAT_BUMPDIRECTUV = 0;
        this.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
        this.CLEARCOAT_REMAP_F0 = false;
        this.CLEARCOAT_TINT = false;
        this.CLEARCOAT_TINT_TEXTURE = false;
        this.CLEARCOAT_TINT_TEXTUREDIRECTUV = 0;
        this.CLEARCOAT_TINT_GAMMATEXTURE = false;
    }
}
/**
 * Plugin that implements the clear coat component of the PBR material
 */
export class PBRClearCoatConfiguration extends MaterialPluginBase {
    /** @internal */
    _markAllSubMeshesAsTexturesDirty() {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible() {
        return true;
    }
    constructor(material, addToPluginList = true) {
        super(material, "PBRClearCoat", 100, new MaterialClearCoatDefines(), addToPluginList);
        this._isEnabled = false;
        /**
         * Defines if the clear coat is enabled in the material.
         */
        this.isEnabled = false;
        /**
         * Defines the clear coat layer strength (between 0 and 1) it defaults to 1.
         */
        this.intensity = 1;
        /**
         * Defines the clear coat layer roughness.
         */
        this.roughness = 0;
        this._indexOfRefraction = PBRClearCoatConfiguration._DefaultIndexOfRefraction;
        /**
         * Defines the index of refraction of the clear coat.
         * This defaults to 1.5 corresponding to a 0.04 f0 or a 4% reflectance at normal incidence
         * The default fits with a polyurethane material.
         * Changing the default value is more performance intensive.
         */
        this.indexOfRefraction = PBRClearCoatConfiguration._DefaultIndexOfRefraction;
        this._texture = null;
        /**
         * Stores the clear coat values in a texture (red channel is intensity and green channel is roughness)
         * If useRoughnessFromMainTexture is false, the green channel of texture is not used and the green channel of textureRoughness is used instead
         * if textureRoughness is not empty, else no texture roughness is used
         */
        this.texture = null;
        this._useRoughnessFromMainTexture = true;
        /**
         * Indicates that the green channel of the texture property will be used for roughness (default: true)
         * If false, the green channel from textureRoughness is used for roughness
         */
        this.useRoughnessFromMainTexture = true;
        this._textureRoughness = null;
        /**
         * Stores the clear coat roughness in a texture (green channel)
         * Not used if useRoughnessFromMainTexture is true
         */
        this.textureRoughness = null;
        this._remapF0OnInterfaceChange = true;
        /**
         * Defines if the F0 value should be remapped to account for the interface change in the material.
         */
        this.remapF0OnInterfaceChange = true;
        this._bumpTexture = null;
        /**
         * Define the clear coat specific bump texture.
         */
        this.bumpTexture = null;
        this._isTintEnabled = false;
        /**
         * Defines if the clear coat tint is enabled in the material.
         */
        this.isTintEnabled = false;
        /**
         * Defines the clear coat tint of the material.
         * This is only use if tint is enabled
         */
        this.tintColor = Color3.White();
        /**
         * Defines the distance at which the tint color should be found in the
         * clear coat media.
         * This is only use if tint is enabled
         */
        this.tintColorAtDistance = 1;
        /**
         * Defines the clear coat layer thickness.
         * This is only use if tint is enabled
         */
        this.tintThickness = 1;
        this._tintTexture = null;
        /**
         * Stores the clear tint values in a texture.
         * rgb is tint
         * a is a thickness factor
         */
        this.tintTexture = null;
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
    }
    isReadyForSubMesh(defines, scene, engine) {
        if (!this._isEnabled) {
            return true;
        }
        const disableBumpMap = this._material._disableBumpMap;
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                    if (!this._texture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                if (this._textureRoughness && MaterialFlags.ClearCoatTextureEnabled) {
                    if (!this._textureRoughness.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                if (engine.getCaps().standardDerivatives && this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled && !disableBumpMap) {
                    // Bump texture cannot be not blocking.
                    if (!this._bumpTexture.isReady()) {
                        return false;
                    }
                }
                if (this._isTintEnabled && this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                    if (!this._tintTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    prepareDefinesBeforeAttributes(defines, scene) {
        if (this._isEnabled) {
            defines.CLEARCOAT = true;
            defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = this._useRoughnessFromMainTexture;
            defines.CLEARCOAT_REMAP_F0 = this._remapF0OnInterfaceChange;
            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                        PrepareDefinesForMergedUV(this._texture, defines, "CLEARCOAT_TEXTURE");
                    }
                    else {
                        defines.CLEARCOAT_TEXTURE = false;
                    }
                    if (this._textureRoughness && MaterialFlags.ClearCoatTextureEnabled) {
                        PrepareDefinesForMergedUV(this._textureRoughness, defines, "CLEARCOAT_TEXTURE_ROUGHNESS");
                    }
                    else {
                        defines.CLEARCOAT_TEXTURE_ROUGHNESS = false;
                    }
                    if (this._bumpTexture && MaterialFlags.ClearCoatBumpTextureEnabled) {
                        PrepareDefinesForMergedUV(this._bumpTexture, defines, "CLEARCOAT_BUMP");
                    }
                    else {
                        defines.CLEARCOAT_BUMP = false;
                    }
                    defines.CLEARCOAT_DEFAULTIOR = this._indexOfRefraction === PBRClearCoatConfiguration._DefaultIndexOfRefraction;
                    if (this._isTintEnabled) {
                        defines.CLEARCOAT_TINT = true;
                        if (this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                            PrepareDefinesForMergedUV(this._tintTexture, defines, "CLEARCOAT_TINT_TEXTURE");
                            defines.CLEARCOAT_TINT_GAMMATEXTURE = this._tintTexture.gammaSpace;
                        }
                        else {
                            defines.CLEARCOAT_TINT_TEXTURE = false;
                        }
                    }
                    else {
                        defines.CLEARCOAT_TINT = false;
                        defines.CLEARCOAT_TINT_TEXTURE = false;
                    }
                }
            }
        }
        else {
            defines.CLEARCOAT = false;
            defines.CLEARCOAT_TEXTURE = false;
            defines.CLEARCOAT_TEXTURE_ROUGHNESS = false;
            defines.CLEARCOAT_BUMP = false;
            defines.CLEARCOAT_TINT = false;
            defines.CLEARCOAT_TINT_TEXTURE = false;
            defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE = false;
            defines.CLEARCOAT_DEFAULTIOR = false;
            defines.CLEARCOAT_TEXTUREDIRECTUV = 0;
            defines.CLEARCOAT_TEXTURE_ROUGHNESSDIRECTUV = 0;
            defines.CLEARCOAT_BUMPDIRECTUV = 0;
            defines.CLEARCOAT_REMAP_F0 = false;
            defines.CLEARCOAT_TINT_TEXTUREDIRECTUV = 0;
            defines.CLEARCOAT_TINT_GAMMATEXTURE = false;
        }
    }
    bindForSubMesh(uniformBuffer, scene, engine, subMesh) {
        if (!this._isEnabled) {
            return;
        }
        const defines = subMesh.materialDefines;
        const isFrozen = this._material.isFrozen;
        const disableBumpMap = this._material._disableBumpMap;
        const invertNormalMapX = this._material._invertNormalMapX;
        const invertNormalMapY = this._material._invertNormalMapY;
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if ((this._texture || this._textureRoughness) && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.updateFloat4("vClearCoatInfos", this._texture?.coordinatesIndex ?? 0, this._texture?.level ?? 0, this._textureRoughness?.coordinatesIndex ?? 0, this._textureRoughness?.level ?? 0);
                if (this._texture) {
                    BindTextureMatrix(this._texture, uniformBuffer, "clearCoat");
                }
                if (this._textureRoughness && !defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE) {
                    BindTextureMatrix(this._textureRoughness, uniformBuffer, "clearCoatRoughness");
                }
            }
            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatTextureEnabled && !disableBumpMap) {
                uniformBuffer.updateFloat2("vClearCoatBumpInfos", this._bumpTexture.coordinatesIndex, this._bumpTexture.level);
                BindTextureMatrix(this._bumpTexture, uniformBuffer, "clearCoatBump");
                if (scene._mirroredCameraPosition) {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? 1.0 : -1.0, invertNormalMapY ? 1.0 : -1.0);
                }
                else {
                    uniformBuffer.updateFloat2("vClearCoatTangentSpaceParams", invertNormalMapX ? -1.0 : 1.0, invertNormalMapY ? -1.0 : 1.0);
                }
            }
            if (this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                uniformBuffer.updateFloat2("vClearCoatTintInfos", this._tintTexture.coordinatesIndex, this._tintTexture.level);
                BindTextureMatrix(this._tintTexture, uniformBuffer, "clearCoatTint");
            }
            // Clear Coat General params
            uniformBuffer.updateFloat2("vClearCoatParams", this.intensity, this.roughness);
            // Clear Coat Refraction params
            const a = 1 - this._indexOfRefraction;
            const b = 1 + this._indexOfRefraction;
            const f0 = Math.pow(-a / b, 2); // Schlicks approx: (ior1 - ior2) / (ior1 + ior2) where ior2 for air is close to vacuum = 1.
            const eta = 1 / this._indexOfRefraction;
            uniformBuffer.updateFloat4("vClearCoatRefractionParams", f0, eta, a, b);
            if (this._isTintEnabled) {
                uniformBuffer.updateFloat4("vClearCoatTintParams", this.tintColor.r, this.tintColor.g, this.tintColor.b, Math.max(0.00001, this.tintThickness));
                uniformBuffer.updateFloat("clearCoatColorAtDistance", Math.max(0.00001, this.tintColorAtDistance));
            }
        }
        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.setTexture("clearCoatSampler", this._texture);
            }
            if (this._textureRoughness && !defines.CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE && MaterialFlags.ClearCoatTextureEnabled) {
                uniformBuffer.setTexture("clearCoatRoughnessSampler", this._textureRoughness);
            }
            if (this._bumpTexture && engine.getCaps().standardDerivatives && MaterialFlags.ClearCoatBumpTextureEnabled && !disableBumpMap) {
                uniformBuffer.setTexture("clearCoatBumpSampler", this._bumpTexture);
            }
            if (this._isTintEnabled && this._tintTexture && MaterialFlags.ClearCoatTintTextureEnabled) {
                uniformBuffer.setTexture("clearCoatTintSampler", this._tintTexture);
            }
        }
    }
    hasTexture(texture) {
        if (this._texture === texture) {
            return true;
        }
        if (this._textureRoughness === texture) {
            return true;
        }
        if (this._bumpTexture === texture) {
            return true;
        }
        if (this._tintTexture === texture) {
            return true;
        }
        return false;
    }
    getActiveTextures(activeTextures) {
        if (this._texture) {
            activeTextures.push(this._texture);
        }
        if (this._textureRoughness) {
            activeTextures.push(this._textureRoughness);
        }
        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }
        if (this._tintTexture) {
            activeTextures.push(this._tintTexture);
        }
    }
    getAnimatables(animatables) {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
        if (this._textureRoughness && this._textureRoughness.animations && this._textureRoughness.animations.length > 0) {
            animatables.push(this._textureRoughness);
        }
        if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
            animatables.push(this._bumpTexture);
        }
        if (this._tintTexture && this._tintTexture.animations && this._tintTexture.animations.length > 0) {
            animatables.push(this._tintTexture);
        }
    }
    dispose(forceDisposeTextures) {
        if (forceDisposeTextures) {
            this._texture?.dispose();
            this._textureRoughness?.dispose();
            this._bumpTexture?.dispose();
            this._tintTexture?.dispose();
        }
    }
    getClassName() {
        return "PBRClearCoatConfiguration";
    }
    addFallbacks(defines, fallbacks, currentRank) {
        if (defines.CLEARCOAT_BUMP) {
            fallbacks.addFallback(currentRank++, "CLEARCOAT_BUMP");
        }
        if (defines.CLEARCOAT_TINT) {
            fallbacks.addFallback(currentRank++, "CLEARCOAT_TINT");
        }
        if (defines.CLEARCOAT) {
            fallbacks.addFallback(currentRank++, "CLEARCOAT");
        }
        return currentRank;
    }
    getSamplers(samplers) {
        samplers.push("clearCoatSampler", "clearCoatRoughnessSampler", "clearCoatBumpSampler", "clearCoatTintSampler");
    }
    getUniforms() {
        return {
            ubo: [
                { name: "vClearCoatParams", size: 2, type: "vec2" },
                { name: "vClearCoatRefractionParams", size: 4, type: "vec4" },
                { name: "vClearCoatInfos", size: 4, type: "vec4" },
                { name: "clearCoatMatrix", size: 16, type: "mat4" },
                { name: "clearCoatRoughnessMatrix", size: 16, type: "mat4" },
                { name: "vClearCoatBumpInfos", size: 2, type: "vec2" },
                { name: "vClearCoatTangentSpaceParams", size: 2, type: "vec2" },
                { name: "clearCoatBumpMatrix", size: 16, type: "mat4" },
                { name: "vClearCoatTintParams", size: 4, type: "vec4" },
                { name: "clearCoatColorAtDistance", size: 1, type: "float" },
                { name: "vClearCoatTintInfos", size: 2, type: "vec2" },
                { name: "clearCoatTintMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
/**
 * This defaults to 1.5 corresponding to a 0.04 f0 or a 4% reflectance at normal incidence
 * The default fits with a polyurethane material.
 * @internal
 */
PBRClearCoatConfiguration._DefaultIndexOfRefraction = 1.5;
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "isEnabled", void 0);
__decorate([
    serialize()
], PBRClearCoatConfiguration.prototype, "intensity", void 0);
__decorate([
    serialize()
], PBRClearCoatConfiguration.prototype, "roughness", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "indexOfRefraction", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "texture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "useRoughnessFromMainTexture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "textureRoughness", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "remapF0OnInterfaceChange", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "bumpTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "isTintEnabled", void 0);
__decorate([
    serializeAsColor3()
], PBRClearCoatConfiguration.prototype, "tintColor", void 0);
__decorate([
    serialize()
], PBRClearCoatConfiguration.prototype, "tintColorAtDistance", void 0);
__decorate([
    serialize()
], PBRClearCoatConfiguration.prototype, "tintThickness", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRClearCoatConfiguration.prototype, "tintTexture", void 0);
//# sourceMappingURL=pbrClearCoatConfiguration.js.map