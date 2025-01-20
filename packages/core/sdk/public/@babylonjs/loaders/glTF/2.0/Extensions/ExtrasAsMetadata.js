import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "ExtrasAsMetadata";
/**
 * Store glTF extras (if present) in BJS objects' metadata
 */
export class ExtrasAsMetadata {
    _assignExtras(babylonObject, gltfProp) {
        if (gltfProp.extras && Object.keys(gltfProp.extras).length > 0) {
            const metadata = (babylonObject.metadata = babylonObject.metadata || {});
            const gltf = (metadata.gltf = metadata.gltf || {});
            gltf.extras = gltfProp.extras;
        }
    }
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines whether this extension is enabled.
         */
        this.enabled = true;
        this._loader = loader;
    }
    /** @internal */
    dispose() {
        this._loader = null;
    }
    /**
     * @internal
     */
    loadNodeAsync(context, node, assign) {
        return this._loader.loadNodeAsync(context, node, (babylonTransformNode) => {
            this._assignExtras(babylonTransformNode, node);
            assign(babylonTransformNode);
        });
    }
    /**
     * @internal
     */
    loadCameraAsync(context, camera, assign) {
        return this._loader.loadCameraAsync(context, camera, (babylonCamera) => {
            this._assignExtras(babylonCamera, camera);
            assign(babylonCamera);
        });
    }
    /**
     * @internal
     */
    createMaterial(context, material, babylonDrawMode) {
        const babylonMaterial = this._loader.createMaterial(context, material, babylonDrawMode);
        this._assignExtras(babylonMaterial, material);
        return babylonMaterial;
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, false, (loader) => new ExtrasAsMetadata(loader));
//# sourceMappingURL=ExtrasAsMetadata.js.map