import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators.js";
import { Color3 } from "../../Maths/math.color.js";
import { PBRBaseMaterial } from "./pbrBaseMaterial.js";
/**
 * The Physically based simple base material of BJS.
 *
 * This enables better naming and convention enforcements on top of the pbrMaterial.
 * It is used as the base class for both the specGloss and metalRough conventions.
 */
export class PBRBaseSimpleMaterial extends PBRBaseMaterial {
    /**
     * Gets the current double sided mode.
     */
    get doubleSided() {
        return this._twoSidedLighting;
    }
    /**
     * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
     */
    set doubleSided(value) {
        if (this._twoSidedLighting === value) {
            return;
        }
        this._twoSidedLighting = value;
        this.backFaceCulling = !value;
        this._markAllSubMeshesAsTexturesDirty();
    }
    /**
     * Instantiates a new PBRMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name, scene) {
        super(name, scene);
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        this.maxSimultaneousLights = 4;
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        this.disableLighting = false;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        this.invertNormalMapX = false;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        this.invertNormalMapY = false;
        /**
         * Emissivie color used to self-illuminate the model.
         */
        this.emissiveColor = new Color3(0, 0, 0);
        /**
         * Occlusion Channel Strength.
         */
        this.occlusionStrength = 1.0;
        /**
         * If true, the light map contains occlusion information instead of lighting info.
         */
        this.useLightmapAsShadowmap = false;
        this._useAlphaFromAlbedoTexture = true;
        this._useAmbientInGrayScale = true;
    }
    getClassName() {
        return "PBRBaseSimpleMaterial";
    }
}
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], PBRBaseSimpleMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], PBRBaseSimpleMaterial.prototype, "disableLighting", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectionTexture")
], PBRBaseSimpleMaterial.prototype, "environmentTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRBaseSimpleMaterial.prototype, "invertNormalMapX", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRBaseSimpleMaterial.prototype, "invertNormalMapY", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_bumpTexture")
], PBRBaseSimpleMaterial.prototype, "normalTexture", void 0);
__decorate([
    serializeAsColor3("emissive"),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRBaseSimpleMaterial.prototype, "emissiveColor", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRBaseSimpleMaterial.prototype, "emissiveTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_ambientTextureStrength")
], PBRBaseSimpleMaterial.prototype, "occlusionStrength", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_ambientTexture")
], PBRBaseSimpleMaterial.prototype, "occlusionTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_alphaCutOff")
], PBRBaseSimpleMaterial.prototype, "alphaCutOff", void 0);
__decorate([
    serialize()
], PBRBaseSimpleMaterial.prototype, "doubleSided", null);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", null)
], PBRBaseSimpleMaterial.prototype, "lightmapTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRBaseSimpleMaterial.prototype, "useLightmapAsShadowmap", void 0);
//# sourceMappingURL=pbrBaseSimpleMaterial.js.map