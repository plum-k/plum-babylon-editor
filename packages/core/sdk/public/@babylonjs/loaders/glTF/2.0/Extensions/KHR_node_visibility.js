import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_node_visibility";
/**
 * Loader extension for KHR_node_visibility
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_node_visibility {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }
    async onReady() {
        this._loader.gltf.nodes?.forEach((node) => {
            node._primitiveBabylonMeshes?.forEach((mesh) => {
                mesh.inheritVisibility = true;
            });
            // When the JSON Pointer is used we need to change both the transform node and the primitive meshes to the new value.
            if (node.extensions?.KHR_node_visibility) {
                if (node.extensions?.KHR_node_visibility.visible === false) {
                    if (node._babylonTransformNode) {
                        node._babylonTransformNode.isVisible = false;
                    }
                    node._primitiveBabylonMeshes?.forEach((mesh) => {
                        mesh.isVisible = false;
                    });
                }
            }
        });
    }
    dispose() {
        this._loader = null;
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_node_visibility(loader));
//# sourceMappingURL=KHR_node_visibility.js.map