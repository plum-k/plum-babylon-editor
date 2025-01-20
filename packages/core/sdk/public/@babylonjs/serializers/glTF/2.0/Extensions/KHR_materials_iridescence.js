import { GLTFExporter } from "../glTFExporter.js";
import { PBRBaseMaterial } from "@babylonjs/core/Materials/PBR/pbrBaseMaterial.js";
const NAME = "KHR_materials_iridescence";
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_iridescence {
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
            if (babylonMaterial.iridescence.isEnabled) {
                if (babylonMaterial.iridescence.texture) {
                    additionalTextures.push(babylonMaterial.iridescence.texture);
                }
                if (babylonMaterial.iridescence.thicknessTexture && babylonMaterial.iridescence.thicknessTexture !== babylonMaterial.iridescence.texture) {
                    additionalTextures.push(babylonMaterial.iridescence.thicknessTexture);
                }
                return additionalTextures;
            }
        }
        return [];
    }
    postExportMaterialAsync(context, node, babylonMaterial) {
        return new Promise((resolve) => {
            if (babylonMaterial instanceof PBRBaseMaterial) {
                if (!babylonMaterial.iridescence.isEnabled) {
                    resolve(node);
                    return;
                }
                this._wasUsed = true;
                node.extensions = node.extensions || {};
                const iridescenceTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.iridescence.texture);
                const iridescenceThicknessTextureInfo = this._exporter._materialExporter.getTextureInfo(babylonMaterial.iridescence.thicknessTexture);
                const iridescenceInfo = {
                    iridescenceFactor: babylonMaterial.iridescence.intensity,
                    iridescenceIor: babylonMaterial.iridescence.indexOfRefraction,
                    iridescenceThicknessMinimum: babylonMaterial.iridescence.minimumThickness,
                    iridescenceThicknessMaximum: babylonMaterial.iridescence.maximumThickness,
                    iridescenceTexture: iridescenceTextureInfo ?? undefined,
                    iridescenceThicknessTexture: iridescenceThicknessTextureInfo ?? undefined,
                };
                if (iridescenceInfo.iridescenceTexture !== null || iridescenceInfo.iridescenceThicknessTexture !== null) {
                    this._exporter._materialNeedsUVsSet.add(babylonMaterial);
                }
                node.extensions[NAME] = iridescenceInfo;
            }
            resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_iridescence(exporter));
//# sourceMappingURL=KHR_materials_iridescence.js.map