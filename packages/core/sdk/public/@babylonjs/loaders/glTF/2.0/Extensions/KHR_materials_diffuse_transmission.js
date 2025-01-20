import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { GLTFLoader } from "../glTFLoader.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_materials_diffuse_transmission";
/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1825)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_diffuse_transmission {
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
        this.order = 174;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            loader.parent.transparencyAsCoverage = true;
        }
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
            promises.push(this._loadTranslucentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return Promise.all(promises).then(() => { });
        });
    }
    _loadTranslucentPropertiesAsync(context, material, babylonMaterial, extension) {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }
        const pbrMaterial = babylonMaterial;
        // Enables "translucency" texture which represents diffusely-transmitted light.
        pbrMaterial.subSurface.isTranslucencyEnabled = true;
        // Since this extension models thin-surface transmission only, we must make the
        // internal IOR == 1.0 and set the thickness to 0.
        pbrMaterial.subSurface.volumeIndexOfRefraction = 1.0;
        pbrMaterial.subSurface.minimumThickness = 0.0;
        pbrMaterial.subSurface.maximumThickness = 0.0;
        // Tint color will be used for transmission.
        pbrMaterial.subSurface.useAlbedoToTintTranslucency = false;
        if (extension.diffuseTransmissionFactor !== undefined) {
            pbrMaterial.subSurface.translucencyIntensity = extension.diffuseTransmissionFactor;
        }
        else {
            pbrMaterial.subSurface.translucencyIntensity = 0.0;
            pbrMaterial.subSurface.isTranslucencyEnabled = false;
            return Promise.resolve();
        }
        const promises = new Array();
        pbrMaterial.subSurface.useGltfStyleTextures = true;
        if (extension.diffuseTransmissionTexture) {
            extension.diffuseTransmissionTexture.nonColorData = true;
            promises.push(this._loader.loadTextureInfoAsync(`${context}/diffuseTransmissionTexture`, extension.diffuseTransmissionTexture).then((texture) => {
                texture.name = `${babylonMaterial.name} (Diffuse Transmission)`;
                pbrMaterial.subSurface.translucencyIntensityTexture = texture;
            }));
        }
        if (extension.diffuseTransmissionColorFactor !== undefined) {
            pbrMaterial.subSurface.translucencyColor = Color3.FromArray(extension.diffuseTransmissionColorFactor);
        }
        else {
            pbrMaterial.subSurface.translucencyColor = Color3.White();
        }
        if (extension.diffuseTransmissionColorTexture) {
            promises.push(this._loader.loadTextureInfoAsync(`${context}/diffuseTransmissionColorTexture`, extension.diffuseTransmissionColorTexture).then((texture) => {
                texture.name = `${babylonMaterial.name} (Diffuse Transmission Color)`;
                pbrMaterial.subSurface.translucencyColorTexture = texture;
            }));
        }
        return Promise.all(promises).then(() => { });
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_diffuse_transmission(loader));
//# sourceMappingURL=KHR_materials_diffuse_transmission.js.map