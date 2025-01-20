import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { GLTFLoader } from "../glTFLoader.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_materials_iridescence";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_iridescence {
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
        this.order = 195;
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
            const promises = new Array();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadIridescencePropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => { });
        });
    }
    _loadIridescencePropertiesAsync(context, properties, babylonMaterial) {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }
        const promises = new Array();
        babylonMaterial.iridescence.isEnabled = true;
        babylonMaterial.iridescence.intensity = properties.iridescenceFactor ?? 0;
        babylonMaterial.iridescence.indexOfRefraction = properties.iridescenceIor ?? properties.iridescenceIOR ?? 1.3;
        babylonMaterial.iridescence.minimumThickness = properties.iridescenceThicknessMinimum ?? 100;
        babylonMaterial.iridescence.maximumThickness = properties.iridescenceThicknessMaximum ?? 400;
        if (properties.iridescenceTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/iridescenceTexture`, properties.iridescenceTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Iridescence)`;
                babylonMaterial.iridescence.texture = texture;
            }));
        }
        if (properties.iridescenceThicknessTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/iridescenceThicknessTexture`, properties.iridescenceThicknessTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Iridescence Thickness)`;
                babylonMaterial.iridescence.thicknessTexture = texture;
            }));
        }
        return Promise.all(promises).then(() => { });
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_iridescence(loader));
//# sourceMappingURL=KHR_materials_iridescence.js.map