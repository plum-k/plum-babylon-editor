import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsTexture, expandToProperty } from "../../Misc/decorators.js";
import { MaterialFlags } from "../materialFlags.js";

import { MaterialPluginBase } from "../materialPluginBase.js";
import { MaterialDefines } from "../materialDefines.js";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "../materialHelper.functions.js";
/**
 * @internal
 */
export class MaterialIridescenceDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.IRIDESCENCE = false;
        this.IRIDESCENCE_TEXTURE = false;
        this.IRIDESCENCE_TEXTUREDIRECTUV = 0;
        this.IRIDESCENCE_THICKNESS_TEXTURE = false;
        this.IRIDESCENCE_THICKNESS_TEXTUREDIRECTUV = 0;
    }
}
/**
 * Plugin that implements the iridescence (thin film) component of the PBR material
 */
export class PBRIridescenceConfiguration extends MaterialPluginBase {
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
        super(material, "PBRIridescence", 110, new MaterialIridescenceDefines(), addToPluginList);
        this._isEnabled = false;
        /**
         * Defines if the iridescence is enabled in the material.
         */
        this.isEnabled = false;
        /**
         * Defines the iridescence layer strength (between 0 and 1) it defaults to 1.
         */
        this.intensity = 1;
        /**
         * Defines the minimum thickness of the thin-film layer given in nanometers (nm).
         */
        this.minimumThickness = PBRIridescenceConfiguration._DefaultMinimumThickness;
        /**
         * Defines the maximum thickness of the thin-film layer given in nanometers (nm). This will be the thickness used if not thickness texture has been set.
         */
        this.maximumThickness = PBRIridescenceConfiguration._DefaultMaximumThickness;
        /**
         * Defines the maximum thickness of the thin-film layer given in nanometers (nm).
         */
        this.indexOfRefraction = PBRIridescenceConfiguration._DefaultIndexOfRefraction;
        this._texture = null;
        /**
         * Stores the iridescence intensity in a texture (red channel)
         */
        this.texture = null;
        this._thicknessTexture = null;
        /**
         * Stores the iridescence thickness in a texture (green channel)
         */
        this.thicknessTexture = null;
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
    }
    isReadyForSubMesh(defines, scene) {
        if (!this._isEnabled) {
            return true;
        }
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this._texture && MaterialFlags.IridescenceTextureEnabled) {
                    if (!this._texture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
                if (this._thicknessTexture && MaterialFlags.IridescenceTextureEnabled) {
                    if (!this._thicknessTexture.isReadyOrNotBlocking()) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    prepareDefinesBeforeAttributes(defines, scene) {
        if (this._isEnabled) {
            defines.IRIDESCENCE = true;
            if (defines._areTexturesDirty) {
                if (scene.texturesEnabled) {
                    if (this._texture && MaterialFlags.IridescenceTextureEnabled) {
                        PrepareDefinesForMergedUV(this._texture, defines, "IRIDESCENCE_TEXTURE");
                    }
                    else {
                        defines.IRIDESCENCE_TEXTURE = false;
                    }
                    if (this._thicknessTexture && MaterialFlags.IridescenceTextureEnabled) {
                        PrepareDefinesForMergedUV(this._thicknessTexture, defines, "IRIDESCENCE_THICKNESS_TEXTURE");
                    }
                    else {
                        defines.IRIDESCENCE_THICKNESS_TEXTURE = false;
                    }
                }
            }
        }
        else {
            defines.IRIDESCENCE = false;
            defines.IRIDESCENCE_TEXTURE = false;
            defines.IRIDESCENCE_THICKNESS_TEXTURE = false;
            defines.IRIDESCENCE_TEXTUREDIRECTUV = 0;
            defines.IRIDESCENCE_THICKNESS_TEXTUREDIRECTUV = 0;
        }
    }
    bindForSubMesh(uniformBuffer, scene) {
        if (!this._isEnabled) {
            return;
        }
        const isFrozen = this._material.isFrozen;
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if ((this._texture || this._thicknessTexture) && MaterialFlags.IridescenceTextureEnabled) {
                uniformBuffer.updateFloat4("vIridescenceInfos", this._texture?.coordinatesIndex ?? 0, this._texture?.level ?? 0, this._thicknessTexture?.coordinatesIndex ?? 0, this._thicknessTexture?.level ?? 0);
                if (this._texture) {
                    BindTextureMatrix(this._texture, uniformBuffer, "iridescence");
                }
                if (this._thicknessTexture) {
                    BindTextureMatrix(this._thicknessTexture, uniformBuffer, "iridescenceThickness");
                }
            }
            // Clear Coat General params
            uniformBuffer.updateFloat4("vIridescenceParams", this.intensity, this.indexOfRefraction, this.minimumThickness, this.maximumThickness);
        }
        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.IridescenceTextureEnabled) {
                uniformBuffer.setTexture("iridescenceSampler", this._texture);
            }
            if (this._thicknessTexture && MaterialFlags.IridescenceTextureEnabled) {
                uniformBuffer.setTexture("iridescenceThicknessSampler", this._thicknessTexture);
            }
        }
    }
    hasTexture(texture) {
        if (this._texture === texture) {
            return true;
        }
        if (this._thicknessTexture === texture) {
            return true;
        }
        return false;
    }
    getActiveTextures(activeTextures) {
        if (this._texture) {
            activeTextures.push(this._texture);
        }
        if (this._thicknessTexture) {
            activeTextures.push(this._thicknessTexture);
        }
    }
    getAnimatables(animatables) {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
        if (this._thicknessTexture && this._thicknessTexture.animations && this._thicknessTexture.animations.length > 0) {
            animatables.push(this._thicknessTexture);
        }
    }
    dispose(forceDisposeTextures) {
        if (forceDisposeTextures) {
            this._texture?.dispose();
            this._thicknessTexture?.dispose();
        }
    }
    getClassName() {
        return "PBRIridescenceConfiguration";
    }
    addFallbacks(defines, fallbacks, currentRank) {
        if (defines.IRIDESCENCE) {
            fallbacks.addFallback(currentRank++, "IRIDESCENCE");
        }
        return currentRank;
    }
    getSamplers(samplers) {
        samplers.push("iridescenceSampler", "iridescenceThicknessSampler");
    }
    getUniforms() {
        return {
            ubo: [
                { name: "vIridescenceParams", size: 4, type: "vec4" },
                { name: "vIridescenceInfos", size: 4, type: "vec4" },
                { name: "iridescenceMatrix", size: 16, type: "mat4" },
                { name: "iridescenceThicknessMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
/**
 * The default minimum thickness of the thin-film layer given in nanometers (nm).
 * Defaults to 100 nm.
 * @internal
 */
PBRIridescenceConfiguration._DefaultMinimumThickness = 100;
/**
 * The default maximum thickness of the thin-film layer given in nanometers (nm).
 * Defaults to 400 nm.
 * @internal
 */
PBRIridescenceConfiguration._DefaultMaximumThickness = 400;
/**
 * The default index of refraction of the thin-film layer.
 * Defaults to 1.3
 * @internal
 */
PBRIridescenceConfiguration._DefaultIndexOfRefraction = 1.3;
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRIridescenceConfiguration.prototype, "isEnabled", void 0);
__decorate([
    serialize()
], PBRIridescenceConfiguration.prototype, "intensity", void 0);
__decorate([
    serialize()
], PBRIridescenceConfiguration.prototype, "minimumThickness", void 0);
__decorate([
    serialize()
], PBRIridescenceConfiguration.prototype, "maximumThickness", void 0);
__decorate([
    serialize()
], PBRIridescenceConfiguration.prototype, "indexOfRefraction", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRIridescenceConfiguration.prototype, "texture", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRIridescenceConfiguration.prototype, "thicknessTexture", void 0);
//# sourceMappingURL=pbrIridescenceConfiguration.js.map