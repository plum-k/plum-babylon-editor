import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { GLTFLoader } from "../glTFLoader.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_materials_anisotropy";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_anisotropy {
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
        babylonMaterial.anisotropy.isEnabled = true;
        babylonMaterial.anisotropy.intensity = properties.anisotropyStrength ?? 0;
        babylonMaterial.anisotropy.angle = properties.anisotropyRotation ?? 0;
        if (properties.anisotropyTexture) {
            properties.anisotropyTexture.nonColorData = true;
            promises.push(this._loader.loadTextureInfoAsync(`${context}/anisotropyTexture`, properties.anisotropyTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Anisotropy Intensity)`;
                babylonMaterial.anisotropy.texture = texture;
            }));
        }
        return Promise.all(promises).then(() => { });
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_anisotropy(loader));
//# sourceMappingURL=KHR_materials_anisotropy.js.map