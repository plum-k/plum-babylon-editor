import { GLTFExporter } from "../glTFExporter.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
const NAME = "KHR_materials_ior";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_ior/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_ior {
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
    _isExtensionEnabled(mat) {
        // This extension must not be used on a material that also uses KHR_materials_unlit
        if (mat.unlit) {
            return false;
        }
        return mat.indexOfRefraction != undefined && mat.indexOfRefraction != 1.5; // 1.5 is normative default value.
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
            if (babylonMaterial instanceof PBRMaterial && this._isExtensionEnabled(babylonMaterial)) {
                this._wasUsed = true;
                const iorInfo = {
                    ior: babylonMaterial.indexOfRefraction,
                };
                node.extensions = node.extensions || {};
                node.extensions[NAME] = iorInfo;
            }
            resolve(node);
        });
    }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_materials_ior());
//# sourceMappingURL=KHR_materials_ior.js.map