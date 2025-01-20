import { GLTFExporter } from "../glTFExporter.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
const NAME = "KHR_materials_diffuse_transmission";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1825)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_diffuse_transmission {
    constructor(exporter) {
        /** Name of this extension */
        this.name = NAME;
        /** Defines whether this extension is enabled */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._wasUsed = false;
        this._exporter = exporter;
    }
    dispose() { }
    /** @internal */
    get wasUsed() {
        return this._wasUsed;
    }
    /**
     * After exporting a material, deal with additional textures
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns array of additional textures to export
     */
    postExportMaterialAdditionalTextures(context, node, babylonMaterial) {
        const additionalTextures = [];
        if (babylonMaterial instanceof PBRMaterial) {
            if (this._isExtensionEnabled(babylonMaterial)) {
                if (babylonMaterial.subSurface.thicknessTexture) {
                    additionalTextures.push(babylonMaterial.subSurface.thicknessTexture);
                }
                return additionalTextures;
            }
        }
        return additionalTextures;
    }
    _isExtensionEnabled(mat) {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        const subs = mat.subSurface;
        if (!subs.isTranslucencyEnabled) {
            return false;
        }
        return (!mat.unlit &&
            !subs.useAlbedoToTintTranslucency &&
            subs.useGltfStyleTextures &&
            subs.volumeIndexOfRefraction === 1 &&
            subs.minimumThickness === 0 &&
            subs.maximumThickness === 0);
    }
    _hasTexturesExtension(mat) {
        return mat.subSurface.translucencyIntensityTexture != null || mat.subSurface.translucencyColorTexture != null;
    }
    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns promise that resolves with the updated node
     */
    postExportMaterialAsync(context, node, babylonMaterial) {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;
                const subs = babylonMaterial.subSurface;
                const diffuseTransmissionFactor = subs.translucencyIntensity == 1 ? undefined : subs.translucencyIntensity;
                const diffuseTransmissionTexture = this._exporter._materialExporter.getTextureInfo(subs.translucencyIntensityTexture) ?? undefined;
                const diffuseTransmissionColorFactor = !subs.translucencyColor || subs.translucencyColor.equalsFloats(1.0, 1.0, 1.0) ? undefined : subs.translucencyColor.asArray();
                const diffuseTransmissionColorTexture = this._exporter._materialExporter.getTextureInfo(subs.translucencyColorTexture) ?? undefined;
                const diffuseTransmissionInfo = {
                    diffuseTransmissionFactor,
                    diffuseTransmissionTexture,
                    diffuseTransmissionColorFactor,
                    diffuseTransmissionColorTexture,
                };
                if (this._hasTexturesExtension(babylonMaterial)) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }
                node.extensions = node.extensions || {};
                node.extensions[NAME] = diffuseTransmissionInfo;
            }
            resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_diffuse_transmission(exporter));
//# sourceMappingURL=KHR_materials_diffuse_transmission.js.map