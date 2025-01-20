import { GLTFExporter } from "../glTFExporter.js";
import { PBRBaseMaterial } from "@babylonjs/core/Materials/PBR/pbrBaseMaterial.js";
const NAME = "KHR_materials_anisotropy";
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_anisotropy {
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
    postExportMaterialAdditionalTextures(context, node, babylonMaterial) {
        const additionalTextures = [];
        if (babylonMaterial instanceof PBRBaseMaterial) {
            if (babylonMaterial.anisotropy.isEnabled && !babylonMaterial.anisotropy.legacy) {
                if (babylonMaterial.anisotropy.texture) {
                    additionalTextures.push(babylonMaterial.anisotropy.texture);
                }
                return additionalTextures;
            }
        }
        return [];
    }
    postExportMaterialAsync(context, node, babylonMaterial) {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRBaseMaterial) {
                if (!babylonMaterial.anisotropy.isEnabled || babylonMaterial.anisotropy.legacy) {
                    resolve(node);
                    return;
                }
                this._wasUsed = true;
                node.extensions = node.extensions || {};
                const anisotropyTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.anisotropy.texture);
                const anisotropyInfo = {
                    anisotropyStrength: babylonMaterial.anisotropy.intensity,
                    anisotropyRotation: babylonMaterial.anisotropy.angle,
                    anisotropyTexture: anisotropyTextureInfo ?? undefined,
                };
                if (anisotropyInfo.anisotropyTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }
                node.extensions[NAME] = anisotropyInfo;
            }
            resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_anisotropy(exporter));
//# sourceMappingURL=KHR_materials_anisotropy.js.map