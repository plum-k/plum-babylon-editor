import { GLTFExporter } from "../glTFExporter.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
const NAME = "KHR_materials_unlit";
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_unlit {
    constructor() {
        /** Name of this extension */
        this.name = NAME;
        /** Defines whether this extension is enabled */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._wasUsed = false;
    }
    /** @internal */
    get wasUsed() {
        return this._wasUsed;
    }
    dispose() { }
    postExportMaterialAsync(context, node, babylonMaterial) {
        return new Promise((resolve) => {
            let unlitMaterial = false;
            if (babylonMaterial instanceof PBRMaterial) {
                unlitMaterial = babylonMaterial.unlit;
            }
            else if (babylonMaterial instanceof StandardMaterial) {
                unlitMaterial = babylonMaterial.disableLighting;
            }
            if (unlitMaterial) {
                this._wasUsed = true;
                if (node.extensions == null) {
                    node.extensions = {};
                }
                node.extensions[NAME] = {};
            }
            resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, () => new KHR_materials_unlit());
//# sourceMappingURL=KHR_materials_unlit.js.map