import { GLTFExporter } from "../glTFExporter.js";
import { DracoEncoder } from "@babylonjs/core/Meshes/Compression/dracoEncoder.js";
import { GetFloatData, GetTypeByteLength } from "@babylonjs/core/Buffers/bufferUtils.js";
import { GetAccessorElementCount } from "../glTFUtilities.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
const NAME = "KHR_draco_mesh_compression";
function getDracoAttributeName(glTFName) {
    if (glTFName === "POSITION") {
        return "POSITION";
    }
    else if (glTFName === "NORMAL") {
        return "NORMAL";
    }
    else if (glTFName.startsWith("COLOR")) {
        return "COLOR";
    }
    else if (glTFName.startsWith("TEXCOORD")) {
        return "TEX_COORD";
    }
    return "GENERIC";
}
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_draco_mesh_compression {
    /** @internal */
    get wasUsed() {
        return this._wasUsed;
    }
    /** @internal */
    constructor(exporter) {
        /** Name of this extension */
        this.name = NAME;
        /** KHR_draco_mesh_compression is required, as uncompressed fallback data is not yet implemented. */
        this.required = true;
        /** BufferViews used for Draco data, which may be eligible for removal after Draco encoding */
        this._bufferViewsUsed = new Set();
        /** Accessors that were replaced with Draco data, which may be eligible for removal after Draco encoding */
        this._accessorsUsed = new Set();
        /** Promise pool for Draco encoding work */
        this._encodePromises = [];
        this._wasUsed = false;
        this.enabled = exporter.options.meshCompressionMethod === "Draco" && DracoEncoder.DefaultAvailable;
    }
    /** @internal */
    dispose() { }
    /** @internal */
    postExportMeshPrimitive(primitive, bufferManager, accessors) {
        if (!this.enabled) {
            return;
        }
        if (primitive.mode !== 4 /* MeshPrimitiveMode.TRIANGLES */ && primitive.mode !== 5 /* MeshPrimitiveMode.TRIANGLE_STRIP */) {
            Logger.Warn("Cannot compress primitive with mode " + primitive.mode + ".");
            return;
        }
        // Collect bufferViews and accessors used by this primitive
        const primitiveBufferViews = [];
        const primitiveAccessors = [];
        // Prepare indices for Draco encoding
        let indices = null;
        if (primitive.indices !== undefined) {
            const accessor = accessors[primitive.indices];
            const bufferView = bufferManager.getBufferView(accessor);
            // Per exportIndices, indices must be either Uint16Array or Uint32Array
            indices = bufferManager.getData(bufferView);
            primitiveBufferViews.push(bufferView);
            primitiveAccessors.push(accessor);
        }
        // Prepare attributes for Draco encoding
        const attributes = [];
        for (const [name, accessorIndex] of Object.entries(primitive.attributes)) {
            const accessor = accessors[accessorIndex];
            const bufferView = bufferManager.getBufferView(accessor);
            const data = bufferManager.getData(bufferView);
            const size = GetAccessorElementCount(accessor.type);
            // TODO: Implement a way to preserve original data type, as Draco can handle more than just floats
            // TODO: Add flag in DracoEncoder API to prevent copying data (a second time) to transferable buffer
            const floatData = GetFloatData(data, size, accessor.componentType, accessor.byteOffset || 0, bufferView.byteStride || GetTypeByteLength(accessor.componentType) * size, accessor.normalized || false, accessor.count); // Because data is a TypedArray, GetFloatData will return a Float32Array
            attributes.push({ kind: name, dracoName: getDracoAttributeName(name), size: GetAccessorElementCount(accessor.type), data: floatData });
            primitiveBufferViews.push(bufferView);
            primitiveAccessors.push(accessor);
        }
        // Use sequential encoding to preserve vertex order for cases like morph targets
        const options = {
            method: primitive.targets ? "MESH_SEQUENTIAL_ENCODING" : "MESH_EDGEBREAKER_ENCODING",
        };
        const promise = DracoEncoder.Default._encodeAsync(attributes, indices, options)
            .then((encodedData) => {
            if (!encodedData) {
                Logger.Error("Draco encoding failed for primitive.");
                return;
            }
            const dracoInfo = {
                bufferView: -1, // bufferView will be set to a real index later, when we write the binary and decide bufferView ordering
                attributes: encodedData.attributeIDs,
            };
            const bufferView = bufferManager.createBufferView(encodedData.data);
            bufferManager.setBufferView(dracoInfo, bufferView);
            for (const bufferView of primitiveBufferViews) {
                this._bufferViewsUsed.add(bufferView);
            }
            for (const accessor of primitiveAccessors) {
                this._accessorsUsed.add(accessor);
            }
            primitive.extensions || (primitive.extensions = {});
            primitive.extensions[NAME] = dracoInfo;
        })
            .catch((error) => {
            Logger.Error("Draco encoding failed for primitive: " + error);
        });
        this._encodePromises.push(promise);
        this._wasUsed = true;
    }
    /** @internal */
    async preGenerateBinaryAsync(bufferManager) {
        if (!this.enabled) {
            return;
        }
        await Promise.all(this._encodePromises);
        // Cull obsolete bufferViews that were replaced with Draco data
        this._bufferViewsUsed.forEach((bufferView) => {
            const references = bufferManager.getPropertiesWithBufferView(bufferView);
            const onlyUsedByEncodedPrimitives = references.every((object) => {
                return this._accessorsUsed.has(object); // has() can handle any object, but TS doesn't know that
            });
            if (onlyUsedByEncodedPrimitives) {
                bufferManager.removeBufferView(bufferView);
            }
        });
        this._bufferViewsUsed.clear();
        this._accessorsUsed.clear();
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_draco_mesh_compression(exporter));
//# sourceMappingURL=KHR_draco_mesh_compression.js.map