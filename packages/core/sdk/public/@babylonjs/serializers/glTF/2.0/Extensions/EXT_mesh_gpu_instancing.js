import { GLTFExporter } from "../glTFExporter.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import { TmpVectors, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
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
     * @param bufferManager buffer manager
     * @returns nullable promise, resolves with the node
     */
    postExportNodeAsync(context, node, babylonNode, nodeMap, convertToRightHanded, bufferManager) {
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
                        extension.attributes["TRANSLATION"] = this._buildAccessor(translationBuffer, "VEC3" /* AccessorType.VEC3 */, babylonNode.thinInstanceCount, bufferManager);
                    }
                    // do we need to write ROTATION ?
                    if (hasAnyInstanceWorldRotation) {
                        // we decided to stay on FLOAT for now see https://github.com/BabylonJS/Babylon.js/pull/12495
                        extension.attributes["ROTATION"] = this._buildAccessor(rotationBuffer, "VEC4" /* AccessorType.VEC4 */, babylonNode.thinInstanceCount, bufferManager);
                    }
                    // do we need to write SCALE ?
                    if (hasAnyInstanceWorldScale) {
                        extension.attributes["SCALE"] = this._buildAccessor(scaleBuffer, "VEC3" /* AccessorType.VEC3 */, babylonNode.thinInstanceCount, bufferManager);
                    }
                    /* eslint-enable @typescript-eslint/naming-convention*/
                    node.extensions = node.extensions || {};
                    node.extensions[NAME] = extension;
                }
            }
            resolve(node);
        });
    }
    _buildAccessor(buffer, type, count, bufferManager) {
        // build the buffer view
        const bv = bufferManager.createBufferView(buffer);
        // finally build the accessor
        const accessor = bufferManager.createAccessor(bv, type, 5126 /* AccessorComponentType.FLOAT */, count);
        this._exporter._accessors.push(accessor);
        return this._exporter._accessors.length - 1;
    }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_mesh_gpu_instancing(exporter));
//# sourceMappingURL=EXT_mesh_gpu_instancing.js.map