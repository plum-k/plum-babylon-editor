import { SphericalHarmonics, SphericalPolynomial } from "@babylonjs/core/Maths/sphericalPolynomial.js";
import { Quaternion, Matrix } from "@babylonjs/core/Maths/math.vector.js";
import { RawCubeTexture } from "@babylonjs/core/Materials/Textures/rawCubeTexture.js";
import { GLTFLoader, ArrayItem } from "../glTFLoader.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "EXT_lights_image_based";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_lights_image_based/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_lights_image_based {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }
    /** @internal */
    dispose() {
        this._loader = null;
        delete this._lights;
    }
    /** @internal */
    onLoading() {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name];
            this._lights = extension.lights;
        }
    }
    /**
     * @internal
     */
    loadSceneAsync(context, scene) {
        return GLTFLoader.LoadExtensionAsync(context, scene, this.name, (extensionContext, extension) => {
            this._loader._allMaterialsDirtyRequired = true;
            const promises = new Array();
            promises.push(this._loader.loadSceneAsync(context, scene));
            this._loader.logOpen(`${extensionContext}`);
            const light = ArrayItem.Get(`${extensionContext}/light`, this._lights, extension.light);
            promises.push(this._loadLightAsync(`/extensions/${this.name}/lights/${extension.light}`, light).then((texture) => {
                this._loader.babylonScene.environmentTexture = texture;
            }));
            this._loader.logClose();
            return Promise.all(promises).then(() => { });
        });
    }
    _loadLightAsync(context, light) {
        if (!light._loaded) {
            const promises = new Array();
            this._loader.logOpen(`${context}`);
            const imageData = new Array(light.specularImages.length);
            for (let mipmap = 0; mipmap < light.specularImages.length; mipmap++) {
                const faces = light.specularImages[mipmap];
                imageData[mipmap] = new Array(faces.length);
                for (let face = 0; face < faces.length; face++) {
                    const specularImageContext = `${context}/specularImages/${mipmap}/${face}`;
                    this._loader.logOpen(`${specularImageContext}`);
                    const index = faces[face];
                    const image = ArrayItem.Get(specularImageContext, this._loader.gltf.images, index);
                    promises.push(this._loader.loadImageAsync(`/images/${index}`, image).then((data) => {
                        imageData[mipmap][face] = data;
                    }));
                    this._loader.logClose();
                }
            }
            this._loader.logClose();
            light._loaded = Promise.all(promises).then(() => {
                const babylonTexture = new RawCubeTexture(this._loader.babylonScene, null, light.specularImageSize);
                babylonTexture.name = light.name || "environment";
                light._babylonTexture = babylonTexture;
                if (light.intensity != undefined) {
                    babylonTexture.level = light.intensity;
                }
                if (light.rotation) {
                    let rotation = Quaternion.FromArray(light.rotation);
                    // Invert the rotation so that positive rotation is counter-clockwise.
                    if (!this._loader.babylonScene.useRightHandedSystem) {
                        rotation = Quaternion.Inverse(rotation);
                    }
                    Matrix.FromQuaternionToRef(rotation, babylonTexture.getReflectionTextureMatrix());
                }
                if (!light.irradianceCoefficients) {
                    throw new Error(`${context}: Irradiance coefficients are missing`);
                }
                const sphericalHarmonics = SphericalHarmonics.FromArray(light.irradianceCoefficients);
                sphericalHarmonics.scaleInPlace(light.intensity);
                sphericalHarmonics.convertIrradianceToLambertianRadiance();
                const sphericalPolynomial = SphericalPolynomial.FromHarmonics(sphericalHarmonics);
                // Compute the lod generation scale to fit exactly to the number of levels available.
                const lodGenerationScale = (imageData.length - 1) / Math.log2(light.specularImageSize);
                return babylonTexture.updateRGBDAsync(imageData, sphericalPolynomial, lodGenerationScale);
            });
        }
        return light._loaded.then(() => {
            return light._babylonTexture;
        });
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_lights_image_based(loader));
//# sourceMappingURL=EXT_lights_image_based.js.map