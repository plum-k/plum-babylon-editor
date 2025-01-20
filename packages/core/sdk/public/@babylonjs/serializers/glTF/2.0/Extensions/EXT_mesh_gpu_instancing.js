import { GLTFExporter } from "../glTFExporter.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import { TmpVectors, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { ConvertToRightHandedPosition, ConvertToRightHandedRotation } from "../glTFUtilities.js";
const NAME = "EXT_mesh_gpu_instancing";
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_mesh_gpu_instancing {
    constructor(exporter) {
        /** Name of this extension */
        this.name = NAME;
        /** Defines whether this extension is enabled */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._wasUsed = false;
        this._exporter = exporter;
    }
    dispose() { }
    /** @internal */
    get wasUsed() {
        return this._wasUsed;
    }
    /**
     * After node is exported
     * @param context the GLTF context when loading the asset
     * @param node the node exported
     * @param babylonNode the corresponding babylon node
     * @param nodeMap map from babylon node id to node index
     * @param convertToRightHanded true if we need to convert data from left hand to right hand system.
     * @param dataWriter binary writer
     * @returns nullable promise, resolves with the node
     */
    postExportNodeAsync(context, node, babylonNode, nodeMap, convertToRightHanded, dataWriter) {
        return new Promise((resolve) => {
            if (node && babylonNode instanceof Mesh) {
                if (babylonNode.hasThinInstances && this._exporter) {
                    this._wasUsed = true;
                    const noTranslation = Vector3.Zero();
                    const noRotation = Quaternion.Identity();
                    const noScale = Vector3.One();
                    // retrieve all the instance world matrix
                    const matrix = babylonNode.thinInstanceGetWorldMatrices();
                    const iwt = TmpVectors.Vector3[2];
                    const iwr = TmpVectors.Quaternion[1];
                    const iws = TmpVectors.Vector3[3];
                    let hasAnyInstanceWorldTranslation = false;
                    let hasAnyInstanceWorldRotation = false;
                    let hasAnyInstanceWorldScale = false;
                    // prepare temp buffers
                    const translationBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);
                    const rotationBuffer = new Float32Array(babylonNode.thinInstanceCount * 4);
                    const scaleBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);
                    let i = 0;
                    for (const m of matrix) {
                        m.decompose(iws, iwr, iwt);
                        if (convertToRightHanded) {
                            ConvertToRightHandedPosition(iwt);
                            ConvertToRightHandedRotation(iwr);
                        }
                        // fill the temp buffer
                        translationBuffer.set(iwt.asArray(), i * 3);
                        rotationBuffer.set(iwr.normalize().asArray(), i * 4); // ensure the quaternion is normalized
                        scaleBuffer.set(iws.asArray(), i * 3);
                        // this is where we decide if there is any transformation
                        hasAnyInstanceWorldTranslation = hasAnyInstanceWorldTranslation || !iwt.equalsWithEpsilon(noTranslation);
                        hasAnyInstanceWorldRotation = hasAnyInstanceWorldRotation || !iwr.equalsWithEpsilon(noRotation);
                        hasAnyInstanceWorldScale = hasAnyInstanceWorldScale || !iws.equalsWithEpsilon(noScale);
                        i++;
                    }
                    const extension = {
                        attributes: {},
                    };
                    // do we need to write TRANSLATION ?
                    if (hasAnyInstanceWorldTranslation) {
                        extension.attributes["TRANSLATION"] = this._buildAccessor(translationBuffer, "VEC3" /* AccessorType.VEC3 */, babylonNode.thinInstanceCount, dataWriter, 5126 /* AccessorComponentType.FLOAT */);
                    }
                    // do we need to write ROTATION ?
                    if (hasAnyInstanceWorldRotation) {
                        const componentType = 5126 /* AccessorComponentType.FLOAT */; // we decided to stay on FLOAT for now see https://github.com/BabylonJS/Babylon.js/pull/12495
                        extension.attributes["ROTATION"] = this._buildAccessor(rotationBuffer, "VEC4" /* AccessorType.VEC4 */, babylonNode.thinInstanceCount, dataWriter, componentType);
                    }
                    // do we need to write SCALE ?
                    if (hasAnyInstanceWorldScale) {
                        extension.attributes["SCALE"] = this._buildAccessor(scaleBuffer, "VEC3" /* AccessorType.VEC3 */, babylonNode.thinInstanceCount, dataWriter, 5126 /* AccessorComponentType.FLOAT */);
                    }
                    /* eslint-enable @typescript-eslint/naming-convention*/
                    node.extensions = node.extensions || {};
                    node.extensions[NAME] = extension;
                }
            }
            resolve(node);
        });
    }
    _buildAccessor(buffer, type, count, binaryWriter, componentType) {
        // write the buffer
        const bufferOffset = binaryWriter.byteOffset;
        switch (componentType) {
            case 5126 /* AccessorComponentType.FLOAT */: {
                for (let i = 0; i != buffer.length; i++) {
                    binaryWriter.writeFloat32(buffer[i]);
                }
                break;
            }
            case 5120 /* AccessorComponentType.BYTE */: {
                for (let i = 0; i != buffer.length; i++) {
                    binaryWriter.writeInt8(buffer[i] * 127);
                }
                break;
            }
            case 5122 /* AccessorComponentType.SHORT */: {
                for (let i = 0; i != buffer.length; i++) {
                    binaryWriter.writeInt16(buffer[i] * 32767);
                }
                break;
            }
        }
        // build the buffer view
        const bv = { buffer: 0, byteOffset: bufferOffset, byteLength: buffer.length * VertexBuffer.GetTypeByteLength(componentType) };
        const bufferViewIndex = this._exporter._bufferViews.length;
        this._exporter._bufferViews.push(bv);
        // finally build the accessor
        const accessorIndex = this._exporter._accessors.length;
        const accessor = {
            bufferView: bufferViewIndex,
            componentType: componentType,
            count: count,
            type: type,
            normalized: componentType == 5120 /* AccessorComponentType.BYTE */ || componentType == 5122 /* AccessorComponentType.SHORT */,
        };
        this._exporter._accessors.push(accessor);
        return accessorIndex;
    }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_mesh_gpu_instancing(exporter));
//# sourceMappingURL=EXT_mesh_gpu_instancing.js.map