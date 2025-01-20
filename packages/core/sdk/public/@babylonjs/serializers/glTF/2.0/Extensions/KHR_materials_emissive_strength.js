import { GLTFExporter } from "../glTFExporter.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
const NAME = "KHR_materials_emissive_strength";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_emissive_strength {
    constructor() {
        /** Name of this extension */
        this.name = NAME;
        /** Defines whether this extension is enabled */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._wasUsed = false;
    }
    /** Dispose */
    dispose() { }
    /** @internal */
    get wasUsed() {
        return this._wasUsed;
    }
    /**
     * After exporting a material
     * @param context GLTF context of the material
     * @param node exported GLTF node
     * @param babylonMaterial corresponding babylon material
     * @returns promise, resolves with the material
     */
    postExportMaterialAsync(context, node, babylonMaterial) {
        return new Promise((resolve) => {
            if (!(babylonMaterial instanceof PBRMaterial)) {
                return resolve(node);
            }
            const emissiveColor = babylonMaterial.emissiveColor.asArray();
            const tempEmissiveStrength = Math.max(...emissiveColor);
            if (tempEmissiveStrength > 1) {
                this._wasUsed = true;
                node.extensions || (node.extensions = {});
                const emissiveStrengthInfo = {
                    emissiveStrength: tempEmissiveStrength,
                };
                // Normalize each value of the emissive factor to have a max value of 1
                const newEmissiveFactor = babylonMaterial.emissiveColor.scale(1 / emissiveStrengthInfo.emissiveStrength);
                node.emissiveFactor = newEmissiveFactor.asArray();
                node.extensions[NAME] = emissiveStrengthInfo;
            }
            return resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_emissive_strength());
//# sourceMappingURL=KHR_materials_emissive_strength.js.map