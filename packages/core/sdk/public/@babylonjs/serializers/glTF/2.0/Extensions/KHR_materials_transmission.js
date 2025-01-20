import { GLTFExporter } from "../glTFExporter.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
const NAME = "KHR_materials_transmission";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_transmission {
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
    /** Dispose */
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
        return (subs.isRefractionEnabled && subs.refractionIntensity != undefined && subs.refractionIntensity != 0) || this._hasTexturesExtension(mat);
    }
    _hasTexturesExtension(mat) {
        return mat.subSurface.refractionIntensityTexture != null;
    }
    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns true if successful
     */
    async postExportMaterialAsync(context, node, babylonMaterial) {
        if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
            this._wasUsed = true;
            const subSurface = babylonMaterial.subSurface;
            const transmissionFactor = subSurface.refractionIntensity === 0 ? undefined : subSurface.refractionIntensity;
            const volumeInfo = {
                transmissionFactor: transmissionFactor,
            };
            if (this._hasTexturesExtension(babylonMaterial)) {
                this._exporter._materialNeedsUVsSet.add(babylonMaterial);
            }
            if (subSurface.refractionIntensityTexture) {
                if (subSurface.useGltfStyleTextures) {
                    const transmissionTexture = await this._exporter._materialExporter.exportTextureAsync(subSurface.refractionIntensityTexture, "image/png" /* ImageMimeType.PNG */);
                    if (transmissionTexture) {
                        volumeInfo.transmissionTexture = transmissionTexture;
                    }
                }
                else {
                    Logger.Warn(`${context}: Exporting a subsurface refraction intensity texture without \`useGltfStyleTextures\` is not supported`);
                }
            }
            node.extensions || (node.extensions = {});
            node.extensions[NAME] = volumeInfo;
        }
        return node;
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_transmission(exporter));
//# sourceMappingURL=KHR_materials_transmission.js.map