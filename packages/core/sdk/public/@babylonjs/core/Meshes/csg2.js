import { Mesh } from "./mesh.js";
import { VertexData } from "./mesh.vertexData.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Logger } from "../Misc/logger.js";
import { MultiMaterial } from "../Materials/multiMaterial.js";
import { SubMesh } from "./subMesh.js";
import { _LoadScriptModuleAsync } from "../Misc/tools.internals.js";
import { Vector3 } from "../Maths/math.vector.js";
/**
 * Main manifold library
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let Manifold;
/**
 * Manifold mesh
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let ManifoldMesh;
/**
 * First ID to use for materials indexing
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let FirstID;
/**
 * Wrapper around the Manifold library
 * https://manifoldcad.org/
 * Use this class to perform fast boolean operations on meshes
 * #IW43EB#15 - basic operations
 * #JUKXQD#6104 - skull vs box
 * #JUKXQD#6111 - skull vs vertex data
 */
export class CSG2 {
    /**
     * Return the size of a vertex (at least 3 for the position)
     */
    get numProp() {
        return this._numProp;
    }
    constructor(manifold, numProp, vertexStructure) {
        this._manifold = manifold;
        this._numProp = numProp;
        this._vertexStructure = vertexStructure;
    }
    _process(operation, csg) {
        if (this.numProp !== csg.numProp) {
            throw new Error("CSG must be used with geometries having the same number of properties");
        }
        return new CSG2(Manifold[operation](this._manifold, csg._manifold), this.numProp, this._vertexStructure);
    }
    /**
     * Run a difference operation between two CSG
     * @param csg defines the CSG to use to create the difference
     * @returns a new csg
     */
    subtract(csg) {
        return this._process("difference", csg);
    }
    /**
     * Run an intersection operation between two CSG
     * @param csg defines the CSG to use to create the intersection
     * @returns a new csg
     */
    intersect(csg) {
        return this._process("intersection", csg);
    }
    /**
     * Run an union operation between two CSG
     * @param csg defines the CSG to use to create the union
     * @returns a new csg
     */
    add(csg) {
        return this._process("union", csg);
    }
    /**
     * Print debug information about the CSG
     */
    printDebug() {
        Logger.Log("Genus:" + this._manifold.genus());
        const properties = this._manifold.getProperties();
        Logger.Log("Volume:" + properties.volume);
        Logger.Log("surface area:" + properties.surfaceArea);
    }
    /**
     * Generate a vertex data from the CSG
     * @param options defines the options to use to rebuild the vertex data
     * @returns a new vertex data
     */
    toVertexData(options) {
        const localOptions = {
            rebuildNormals: false,
            ...options,
        };
        const vertexData = new VertexData();
        const normalComponent = this._vertexStructure.find((c) => c.kind === VertexBuffer.NormalKind);
        const manifoldMesh = this._manifold.getMesh(localOptions.rebuildNormals && normalComponent ? [3, 4, 5] : undefined);
        vertexData.indices = manifoldMesh.triVerts.length > 65535 ? new Uint32Array(manifoldMesh.triVerts) : new Uint16Array(manifoldMesh.triVerts);
        for (let i = 0; i < manifoldMesh.triVerts.length; i += 3) {
            vertexData.indices[i] = manifoldMesh.triVerts[i + 2];
            vertexData.indices[i + 1] = manifoldMesh.triVerts[i + 1];
            vertexData.indices[i + 2] = manifoldMesh.triVerts[i];
        }
        const vertexCount = manifoldMesh.vertProperties.length / manifoldMesh.numProp;
        // Attributes
        let offset = 0;
        for (let componentIndex = 0; componentIndex < this._vertexStructure.length; componentIndex++) {
            const component = this._vertexStructure[componentIndex];
            const data = new Float32Array(vertexCount * component.stride);
            for (let i = 0; i < vertexCount; i++) {
                for (let strideIndex = 0; strideIndex < component.stride; strideIndex++) {
                    data[i * component.stride + strideIndex] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + offset + strideIndex];
                }
            }
            vertexData.set(data, component.kind);
            offset += component.stride;
        }
        // Rebuild mesh from vertex data
        return vertexData;
    }
    /**
     * Generate a mesh from the CSG
     * @param name defines the name of the mesh
     * @param scene defines the scene to use to create the mesh
     * @param options defines the options to use to rebuild the mesh
     * @returns a new Mesh
     */
    toMesh(name, scene, options) {
        const localOptions = {
            rebuildNormals: false,
            centerMesh: true,
            ...options,
        };
        const vertexData = this.toVertexData({ rebuildNormals: localOptions.rebuildNormals });
        const normalComponent = this._vertexStructure.find((c) => c.kind === VertexBuffer.NormalKind);
        const manifoldMesh = this._manifold.getMesh(localOptions.rebuildNormals && normalComponent ? [3, 4, 5] : undefined);
        const vertexCount = manifoldMesh.vertProperties.length / manifoldMesh.numProp;
        // Rebuild mesh from vertex data
        const output = new Mesh(name, scene);
        vertexData.applyToMesh(output);
        // Center mesh
        if (localOptions.centerMesh) {
            const extents = output.getBoundingInfo().boundingSphere.center;
            output.position.set(-extents.x, -extents.y, -extents.z);
            output.bakeCurrentTransformIntoVertices();
        }
        // Submeshes
        let id = manifoldMesh.runOriginalID[0];
        let start = manifoldMesh.runIndex[0];
        let materialIndex = 0;
        const materials = [];
        scene = output.getScene();
        for (let run = 0; run < manifoldMesh.numRun; ++run) {
            const nextID = manifoldMesh.runOriginalID[run + 1];
            if (nextID !== id) {
                const end = manifoldMesh.runIndex[run + 1];
                new SubMesh(materialIndex, 0, vertexCount, start, end - start, output);
                materials.push(scene.getMaterialByUniqueID(id - FirstID) || scene.defaultMaterial);
                id = nextID;
                start = end;
                materialIndex++;
            }
        }
        if (localOptions.materialToUse) {
            output.material = localOptions.materialToUse;
        }
        else {
            if (materials.length > 1) {
                const multiMaterial = new MultiMaterial(name, scene);
                multiMaterial.subMaterials = materials;
                output.material = multiMaterial;
            }
            else {
                output.material = materials[0];
            }
        }
        return output;
    }
    /**
     * Dispose the CSG resources
     */
    dispose() {
        if (this._manifold) {
            this._manifold.delete();
            this._manifold = null;
        }
    }
    static _ProcessData(vertexCount, triVerts, structure, numProp, runIndex, runOriginalID) {
        const vertProperties = new Float32Array(vertexCount * structure.reduce((acc, cur) => acc + cur.stride, 0));
        for (let i = 0; i < vertexCount; i++) {
            let offset = 0;
            for (let idx = 0; idx < structure.length; idx++) {
                const component = structure[idx];
                for (let strideIndex = 0; strideIndex < component.stride; strideIndex++) {
                    vertProperties[i * numProp + offset + strideIndex] = component.data[i * component.stride + strideIndex];
                }
                offset += component.stride;
            }
        }
        const manifoldMesh = new ManifoldMesh({ numProp: numProp, vertProperties, triVerts, runIndex, runOriginalID });
        manifoldMesh.merge();
        let returnValue;
        try {
            returnValue = new CSG2(new Manifold(manifoldMesh), numProp, structure);
        }
        catch (e) {
            throw new Error("Error while creating the CSG: " + e.message);
        }
        return returnValue;
    }
    static _Construct(data, worldMatrix, runIndex, runOriginalID) {
        // Create the MeshGL for I/O with Manifold library.
        const triVerts = new Uint32Array(data.indices.length);
        // Revert order
        for (let i = 0; i < data.indices.length; i += 3) {
            triVerts[i] = data.indices[i + 2];
            triVerts[i + 1] = data.indices[i + 1];
            triVerts[i + 2] = data.indices[i];
        }
        const tempVector3 = new Vector3();
        let numProp = 3;
        const structure = [{ stride: 3, kind: VertexBuffer.PositionKind }];
        if (!worldMatrix) {
            structure[0].data = data.positions;
        }
        else {
            const positions = new Float32Array(data.positions.length);
            for (let i = 0; i < data.positions.length; i += 3) {
                Vector3.TransformCoordinatesFromFloatsToRef(data.positions[i], data.positions[i + 1], data.positions[i + 2], worldMatrix, tempVector3);
                tempVector3.toArray(positions, i);
            }
            structure[0].data = positions;
        }
        // Normals
        const sourceNormals = data.normals;
        if (sourceNormals) {
            numProp += 3;
            structure.push({ stride: 3, kind: VertexBuffer.NormalKind });
            if (!worldMatrix) {
                structure[1].data = sourceNormals;
            }
            else {
                const normals = new Float32Array(sourceNormals.length);
                for (let i = 0; i < sourceNormals.length; i += 3) {
                    Vector3.TransformNormalFromFloatsToRef(sourceNormals[i], sourceNormals[i + 1], sourceNormals[i + 2], worldMatrix, tempVector3);
                    tempVector3.toArray(normals, i);
                }
                structure[1].data = normals;
            }
        }
        // UVs
        for (const kind of [VertexBuffer.UVKind, VertexBuffer.UV2Kind, VertexBuffer.UV3Kind, VertexBuffer.UV4Kind, VertexBuffer.UV5Kind, VertexBuffer.UV6Kind]) {
            const sourceUV = data[kind === VertexBuffer.UVKind ? "uvs" : kind];
            if (sourceUV) {
                numProp += 2;
                structure.push({ stride: 2, kind: kind, data: sourceUV });
            }
        }
        // Colors
        const sourceColors = data.colors;
        if (sourceColors) {
            numProp += 4;
            structure.push({ stride: 4, kind: VertexBuffer.ColorKind, data: sourceColors });
        }
        return this._ProcessData(data.positions.length / 3, triVerts, structure, numProp, runIndex, runOriginalID);
    }
    /**
     * Create a new Constructive Solid Geometry from a vertexData
     * @param vertexData defines the vertexData to use to create the CSG
     * @returns a new CSG2 class
     */
    static FromVertexData(vertexData) {
        const sourceVertices = vertexData.positions;
        const sourceIndices = vertexData.indices;
        if (!sourceVertices || !sourceIndices) {
            throw new Error("The vertexData must at least have positions and indices");
        }
        return this._Construct(vertexData, null);
    }
    /**
     * Create a new Constructive Solid Geometry from a mesh
     * @param mesh defines the mesh to use to create the CSG
     * @param ignoreWorldMatrix defines if the world matrix should be ignored
     * @returns a new CSG2 class
     */
    static FromMesh(mesh, ignoreWorldMatrix = false) {
        const sourceVertices = mesh.getVerticesData(VertexBuffer.PositionKind);
        const sourceIndices = mesh.getIndices();
        const worldMatrix = mesh.computeWorldMatrix(true);
        if (!sourceVertices || !sourceIndices) {
            throw new Error("The mesh must at least have positions and indices");
        }
        // Create a triangle run for each submesh (material)
        const starts = [...Array(mesh.subMeshes.length)].map((_, idx) => mesh.subMeshes[idx].indexStart);
        // Map the materials to ID.
        const sourceMaterial = mesh.material || mesh.getScene().defaultMaterial;
        const isMultiMaterial = sourceMaterial.getClassName() === "MultiMaterial";
        const originalIDs = [...Array(mesh.subMeshes.length)].map((_, idx) => {
            if (isMultiMaterial) {
                return FirstID + sourceMaterial.subMaterials[mesh.subMeshes[idx].materialIndex].uniqueId;
            }
            return FirstID + sourceMaterial.uniqueId;
        });
        // List the runs in sequence.
        const indices = Array.from(starts.keys());
        indices.sort((a, b) => starts[a] - starts[b]);
        const runIndex = new Uint32Array(indices.map((i) => starts[i]));
        const runOriginalID = new Uint32Array(indices.map((i) => originalIDs[i]));
        // Process
        const data = {
            positions: sourceVertices,
            indices: sourceIndices,
            normals: mesh.getVerticesData(VertexBuffer.NormalKind),
            colors: mesh.getVerticesData(VertexBuffer.ColorKind),
            uvs: mesh.getVerticesData(VertexBuffer.UVKind),
            uvs2: mesh.getVerticesData(VertexBuffer.UV2Kind),
            uvs3: mesh.getVerticesData(VertexBuffer.UV3Kind),
            uvs4: mesh.getVerticesData(VertexBuffer.UV4Kind),
            uvs5: mesh.getVerticesData(VertexBuffer.UV5Kind),
            uvs6: mesh.getVerticesData(VertexBuffer.UV6Kind),
        };
        return this._Construct(data, ignoreWorldMatrix ? null : worldMatrix, runIndex, runOriginalID);
    }
}
/**
 * Checks if the Manifold library is ready
 * @returns true if the Manifold library is ready
 */
export function IsCSG2Ready() {
    return Manifold !== undefined;
}
/**
 * Initialize the Manifold library
 * @param options defines the options to use to initialize the library
 */
export async function InitializeCSG2Async(options) {
    const localOptions = {
        manifoldUrl: "https://unpkg.com/manifold-3d@3.0.0",
        ...options,
    };
    if (localOptions.manifoldInstance) {
        Manifold = localOptions.manifoldInstance;
        ManifoldMesh = localOptions.manifoldMeshInstance;
    }
    else {
        const result = await _LoadScriptModuleAsync(`
            import Module from '${localOptions.manifoldUrl}/manifold.js';
            const wasm = await Module();
            wasm.setup();
            const {Manifold, Mesh} = wasm;
            const returnedValue =  {Manifold, Mesh};
        `);
        Manifold = result.Manifold;
        ManifoldMesh = result.Mesh;
    }
    // Reserve IDs for materials (we consider that there will be no more than 65536 materials)
    FirstID = Manifold.reserveIDs(65536);
}
//# sourceMappingURL=csg2.js.map