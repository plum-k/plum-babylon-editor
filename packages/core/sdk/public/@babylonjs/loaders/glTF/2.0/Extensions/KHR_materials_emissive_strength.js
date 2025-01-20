import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { GLTFLoader } from "../glTFLoader.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_materials_emissive_strength";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_emissive_strength {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines a number that determines the order the extensions are applied.
         */
        this.order = 170;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @internal */
    dispose() {
        this._loader = null;
    }
    /**
     * @internal
     */
    loadMaterialPropertiesAsync(context, material, babylonMaterial) {
        return GLTFLoader.LoadExtensionAsync(context, material, this.name, (extensionContext, extension) => {
            return this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial).then(() => {
                this._loadEmissiveProperties(extensionContext, extension, babylonMaterial);
            });
        });
    }
    _loadEmissiveProperties(context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }
        if (properties.emissiveStrength !== undefined) {
            babylonMaterial.emissiveIntensity = properties.emissiveStrength;
        }
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_emissive_strength(loader));
//# sourceMappingURL=KHR_materials_emissive_strength.js.map