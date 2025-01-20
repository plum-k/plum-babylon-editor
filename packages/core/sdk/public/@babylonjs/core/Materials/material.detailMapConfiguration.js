import { __decorate } from "../tslib.es6.js";
import { Material } from "./material.js";
import { serialize, expandToProperty, serializeAsTexture } from "../Misc/decorators.js";
import { MaterialFlags } from "./materialFlags.js";
import { MaterialDefines } from "./materialDefines.js";
import { MaterialPluginBase } from "./materialPluginBase.js";

import { BindTextureMatrix, PrepareDefinesForMergedUV } from "./materialHelper.functions.js";
/**
 * @internal
 */
export class MaterialDetailMapDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.DETAIL = false;
        this.DETAILDIRECTUV = 0;
        this.DETAIL_NORMALBLENDMETHOD = 0;
    }
}
/**
 * Plugin that implements the detail map component of a material
 *
 * Inspired from:
 *   Unity: https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@9.0/manual/Mask-Map-and-Detail-Map.html and https://docs.unity3d.com/Manual/StandardShaderMaterialParameterDetail.html
 *   Unreal: https://docs.unrealengine.com/en-US/Engine/Rendering/Materials/HowTo/DetailTexturing/index.html
 *   Cryengine: https://docs.cryengine.com/display/SDKDOC2/Detail+Maps
 */
export class DetailMapConfiguration extends MaterialPluginBase {
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
        super(material, "DetailMap", 140, new MaterialDetailMapDefines(), addToPluginList);
        this._texture = null;
        /**
         * Defines how strongly the detail diffuse/albedo channel is blended with the regular diffuse/albedo texture
         * Bigger values mean stronger blending
         */
        this.diffuseBlendLevel = 1;
        /**
         * Defines how strongly the detail roughness channel is blended with the regular roughness value
         * Bigger values mean stronger blending. Only used with PBR materials
         */
        this.roughnessBlendLevel = 1;
        /**
         * Defines how strong the bump effect from the detail map is
         * Bigger values mean stronger effect
         */
        this.bumpLevel = 1;
        this._normalBlendMethod = Material.MATERIAL_NORMALBLENDMETHOD_WHITEOUT;
        this._isEnabled = false;
        /**
         * Enable or disable the detail map on this material
         */
        this.isEnabled = false;
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
    }
    isReadyForSubMesh(defines, scene, engine) {
        if (!this._isEnabled) {
            return true;
        }
        if (defines._areTexturesDirty && scene.texturesEnabled) {
            if (engine.getCaps().standardDerivatives && this._texture && MaterialFlags.DetailTextureEnabled) {
                // Detail texture cannot be not blocking.
                if (!this._texture.isReady()) {
                    return false;
                }
            }
        }
        return true;
    }
    prepareDefines(defines, scene) {
        if (this._isEnabled) {
            defines.DETAIL_NORMALBLENDMETHOD = this._normalBlendMethod;
            const engine = scene.getEngine();
            if (defines._areTexturesDirty) {
                if (engine.getCaps().standardDerivatives && this._texture && MaterialFlags.DetailTextureEnabled && this._isEnabled) {
                    PrepareDefinesForMergedUV(this._texture, defines, "DETAIL");
                    defines.DETAIL_NORMALBLENDMETHOD = this._normalBlendMethod;
                }
                else {
                    defines.DETAIL = false;
                }
            }
        }
        else {
            defines.DETAIL = false;
        }
    }
    bindForSubMesh(uniformBuffer, scene) {
        if (!this._isEnabled) {
            return;
        }
        const isFrozen = this._material.isFrozen;
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            if (this._texture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.updateFloat4("vDetailInfos", this._texture.coordinatesIndex, this.diffuseBlendLevel, this.bumpLevel, this.roughnessBlendLevel);
                BindTextureMatrix(this._texture, uniformBuffer, "detail");
            }
        }
        // Textures
        if (scene.texturesEnabled) {
            if (this._texture && MaterialFlags.DetailTextureEnabled) {
                uniformBuffer.setTexture("detailSampler", this._texture);
            }
        }
    }
    hasTexture(texture) {
        if (this._texture === texture) {
            return true;
        }
        return false;
    }
    getActiveTextures(activeTextures) {
        if (this._texture) {
            activeTextures.push(this._texture);
        }
    }
    getAnimatables(animatables) {
        if (this._texture && this._texture.animations && this._texture.animations.length > 0) {
            animatables.push(this._texture);
        }
    }
    dispose(forceDisposeTextures) {
        if (forceDisposeTextures) {
            this._texture?.dispose();
        }
    }
    getClassName() {
        return "DetailMapConfiguration";
    }
    getSamplers(samplers) {
        samplers.push("detailSampler");
    }
    getUniforms() {
        return {
            ubo: [
                { name: "vDetailInfos", size: 4, type: "vec4" },
                { name: "detailMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
__decorate([
    serializeAsTexture("detailTexture"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], DetailMapConfiguration.prototype, "texture", void 0);
__decorate([
    serialize()
], DetailMapConfiguration.prototype, "diffuseBlendLevel", void 0);
__decorate([
    serialize()
], DetailMapConfiguration.prototype, "roughnessBlendLevel", void 0);
__decorate([
    serialize()
], DetailMapConfiguration.prototype, "bumpLevel", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], DetailMapConfiguration.prototype, "normalBlendMethod", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], DetailMapConfiguration.prototype, "isEnabled", void 0);
//# sourceMappingURL=material.detailMapConfiguration.js.map