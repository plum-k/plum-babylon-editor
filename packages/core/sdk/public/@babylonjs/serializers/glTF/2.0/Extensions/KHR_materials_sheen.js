import { GLTFExporter } from "../glTFExporter.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
const NAME = "KHR_materials_sheen";
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_sheen {
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
        if (babylonMaterial instanceof PBRMaterial) {
            if (babylonMaterial.sheen.isEnabled && babylonMaterial.sheen.texture) {
                return [babylonMaterial.sheen.texture];
            }
        }
        return [];
    }
    postExportMaterialAsync(context, node, babylonMaterial) {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRMaterial) {
                if (!babylonMaterial.sheen.isEnabled) {
                    resolve(node);
                    return;
                }
                this._wasUsed = true;
                if (node.extensions == null) {
                    node.extensions = {};
                }
                const sheenInfo = {
                    sheenColorFactor: babylonMaterial.sheen.color.asArray(),
                    sheenRoughnessFactor: babylonMaterial.sheen.roughness ?? 0,
                };
                if (sheenInfo.sheenColorTexture !== null || sheenInfo.sheenRoughnessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }
                if (babylonMaterial.sheen.texture) {
                    sheenInfo.sheenColorTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.sheen.texture) ?? undefined;
                }
                if (babylonMaterial.sheen.textureRoughness && !babylonMaterial.sheen.useRoughnessFromMainTexture) {
                    sheenInfo.sheenRoughnessTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.sheen.textureRoughness) ?? undefined;
                }
                else if (babylonMaterial.sheen.texture && babylonMaterial.sheen.useRoughnessFromMainTexture) {
                    sheenInfo.sheenRoughnessTexture = this._exporter._materialExporter.getTextureInfo(babylonMaterial.sheen.texture) ?? undefined;
                }
                node.extensions[NAME] = sheenInfo;
            }
            resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_sheen(exporter));
//# sourceMappingURL=KHR_materials_sheen.js.map