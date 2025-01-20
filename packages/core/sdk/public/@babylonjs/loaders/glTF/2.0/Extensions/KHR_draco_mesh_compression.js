import { DracoDecoder } from "@babylonjs/core/Meshes/Compression/dracoDecoder.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { GLTFLoader, ArrayItem, LoadBoundingInfoFromPositionAccessor } from "../glTFLoader.js";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry.js";
const NAME = "KHR_draco_mesh_compression";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_draco_mesh_compression {
    /**
     * @internal
     */
    constructor(loader) {
        /**
         * The name of this extension.
         */
        this.name = NAME;
        /**
         * Defines whether to use the normalized flag from the glTF accessor instead of the Draco data. Defaults to true.
         */
        this.useNormalizedFlagFromAccessor = true;
        this._loader = loader;
        this.enabled = DracoDecoder.DefaultAvailable && this._loader.isExtensionUsed(NAME);
    }
    /** @internal */
    dispose() {
        delete this.dracoDecoder;
        this._loader = null;
    }
    /**
     * @internal
     */
    _loadVertexDataAsync(context, primitive, babylonMesh) {
        return GLTFLoader.LoadExtensionAsync(context, primitive, this.name, (extensionContext, extension) => {
            if (primitive.mode != undefined) {
                if (primitive.mode !== 4 /* MeshPrimitiveMode.TRIANGLES */ && primitive.mode !== 5 /* MeshPrimitiveMode.TRIANGLE_STRIP */) {
                    throw new Error(`${context}: Unsupported mode ${primitive.mode}`);
                }
            }
            const attributes = {};
            const normalized = {};
            const loadAttribute = (name, kind) => {
                const uniqueId = extension.attributes[name];
                if (uniqueId == undefined) {
                    return;
                }
                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                    babylonMesh._delayInfo.push(kind);
                }
                attributes[kind] = uniqueId;
                if (this.useNormalizedFlagFromAccessor) {
                    const accessor = ArrayItem.TryGet(this._loader.gltf.accessors, primitive.attributes[name]);
                    if (accessor) {
                        normalized[kind] = accessor.normalized || false;
                    }
                }
            };
            loadAttribute("POSITION", VertexBuffer.PositionKind);
            loadAttribute("NORMAL", VertexBuffer.NormalKind);
            loadAttribute("TANGENT", VertexBuffer.TangentKind);
            loadAttribute("TEXCOORD_0", VertexBuffer.UVKind);
            loadAttribute("TEXCOORD_1", VertexBuffer.UV2Kind);
            loadAttribute("TEXCOORD_2", VertexBuffer.UV3Kind);
            loadAttribute("TEXCOORD_3", VertexBuffer.UV4Kind);
            loadAttribute("TEXCOORD_4", VertexBuffer.UV5Kind);
            loadAttribute("TEXCOORD_5", VertexBuffer.UV6Kind);
            loadAttribute("JOINTS_0", VertexBuffer.MatricesIndicesKind);
            loadAttribute("WEIGHTS_0", VertexBuffer.MatricesWeightsKind);
            loadAttribute("COLOR_0", VertexBuffer.ColorKind);
            const bufferView = ArrayItem.Get(extensionContext, this._loader.gltf.bufferViews, extension.bufferView);
            if (!bufferView._dracoBabylonGeometry) {
                bufferView._dracoBabylonGeometry = this._loader.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                    const dracoDecoder = this.dracoDecoder || DracoDecoder.Default;
                    const positionAccessor = ArrayItem.TryGet(this._loader.gltf.accessors, primitive.attributes["POSITION"]);
                    const babylonBoundingInfo = !this._loader.parent.alwaysComputeBoundingBox && !babylonMesh.skeleton && positionAccessor ? LoadBoundingInfoFromPositionAccessor(positionAccessor) : null;
                    return dracoDecoder
                        ._decodeMeshToGeometryForGltfAsync(babylonMesh.name, this._loader.babylonScene, data, attributes, normalized, babylonBoundingInfo)
                        .catch((error) => {
                        throw new Error(`${context}: ${error.message}`);
                    });
                });
            }
            return bufferView._dracoBabylonGeometry;
        });
    }
}
unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_draco_mesh_compression(loader));
//# sourceMappingURL=KHR_draco_mesh_compression.js.map