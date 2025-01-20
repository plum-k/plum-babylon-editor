import { __decorate } from "../../tslib.es6.js";
import { serialize, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";
import { PBRBaseSimpleMaterial } from "./pbrBaseSimpleMaterial.js";
import { RegisterClass } from "../../Misc/typeStore.js";
/**
 * The PBR material of BJS following the metal roughness convention.
 *
 * This fits to the PBR convention in the GLTF definition:
 * https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness/README.md
 */
export class PBRMetallicRoughnessMaterial extends PBRBaseSimpleMaterial {
    /**
     * Instantiates a new PBRMetalRoughnessMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name, scene) {
        super(name, scene);
        this._useRoughnessFromMetallicTextureAlpha = false;
        this._useRoughnessFromMetallicTextureGreen = true;
        this._useMetallnessFromMetallicTextureBlue = true;
        this.metallic = 1.0;
        this.roughness = 1.0;
    }
    /**
     * @returns the current class name of the material.
     */
    getClassName() {
        return "PBRMetallicRoughnessMaterial";
    }
    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     * @returns cloned material instance
     */
    clone(name) {
        const clone = SerializationHelper.Clone(() => new PBRMetallicRoughnessMaterial(name, this.getScene()), this);
        clone.id = name;
        clone.name = name;
        this.clearCoat.copyTo(clone.clearCoat);
        this.anisotropy.copyTo(clone.anisotropy);
        this.brdf.copyTo(clone.brdf);
        this.sheen.copyTo(clone.sheen);
        this.subSurface.copyTo(clone.subSurface);
        return clone;
    }
    /**
     * Serialize the material to a parsable JSON object.
     * @returns the JSON object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.PBRMetallicRoughnessMaterial";
        if (!this.clearCoat.doNotSerialize) {
            serializationObject.clearCoat = this.clearCoat.serialize();
        }
        if (!this.anisotropy.doNotSerialize) {
            serializationObject.anisotropy = this.anisotropy.serialize();
        }
        if (!this.brdf.doNotSerialize) {
            serializationObject.brdf = this.brdf.serialize();
        }
        if (!this.sheen.doNotSerialize) {
            serializationObject.sheen = this.sheen.serialize();
        }
        if (!this.subSurface.doNotSerialize) {
            serializationObject.subSurface = this.subSurface.serialize();
        }
        if (!this.iridescence.doNotSerialize) {
            serializationObject.iridescence = this.iridescence.serialize();
        }
        return serializationObject;
    }
    /**
     * Parses a JSON object corresponding to the serialize function.
     * @param source - JSON source object.
     * @param scene - Defines the scene we are parsing for
     * @param rootUrl - Defines the rootUrl of this parsed object
     * @returns a new PBRMetalRoughnessMaterial
     */
    static Parse(source, scene, rootUrl) {
        const material = SerializationHelper.Parse(() => new PBRMetallicRoughnessMaterial(source.name, scene), source, scene, rootUrl);
        if (source.clearCoat) {
            material.clearCoat.parse(source.clearCoat, scene, rootUrl);
        }
        if (source.anisotropy) {
            material.anisotropy.parse(source.anisotropy, scene, rootUrl);
        }
        if (source.brdf) {
            material.brdf.parse(source.brdf, scene, rootUrl);
        }
        if (source.sheen) {
            material.sheen.parse(source.sheen, scene, rootUrl);
        }
        if (source.subSurface) {
            material.subSurface.parse(source.subSurface, scene, rootUrl);
        }
        if (source.iridescence) {
            material.iridescence.parse(source.iridescence, scene, rootUrl);
        }
        return material;
    }
}
__decorate([
    serializeAsColor3(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoColor")
], PBRMetallicRoughnessMaterial.prototype, "baseColor", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoTexture")
], PBRMetallicRoughnessMaterial.prototype, "baseTexture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMetallicRoughnessMaterial.prototype, "metallic", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], PBRMetallicRoughnessMaterial.prototype, "roughness", void 0);
__decorate([
    serializeAsTexture(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty", "_metallicTexture")
], PBRMetallicRoughnessMaterial.prototype, "metallicRoughnessTexture", void 0);
RegisterClass("BABYLON.PBRMetallicRoughnessMaterial", PBRMetallicRoughnessMaterial);
//# sourceMappingURL=pbrMetallicRoughnessMaterial.js.map