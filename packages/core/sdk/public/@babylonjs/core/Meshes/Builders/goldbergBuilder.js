import { Vector3 } from "../../Maths/math.vector.js";
import { Color4 } from "../../Maths/math.color.js";
import { Mesh } from "../../Meshes/mesh.js";
import { VertexData } from "../mesh.vertexData.js";
import { Logger } from "../../Misc/logger.js";
import { _PrimaryIsoTriangle, GeodesicData } from "../geodesicMesh.js";
import { GoldbergMesh } from "../goldbergMesh.js";
import { useOpenGLOrientationForUV } from "../../Compat/compatibilityOptions.js";
/**
 * Creates the Mesh for a Goldberg Polyhedron
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * @param goldbergData polyhedronData defining the Goldberg polyhedron
 * @returns GoldbergSphere mesh
 */
export function CreateGoldbergVertexData(options, goldbergData) {
    const size = options.size;
    const sizeX = options.sizeX || size || 1;
    const sizeY = options.sizeY || size || 1;
    const sizeZ = options.sizeZ || size || 1;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;
    const positions = [];
    const indices = [];
    const normals = [];
    const uvs = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let v = 0; v < goldbergData.vertex.length; v++) {
        minX = Math.min(minX, goldbergData.vertex[v][0] * sizeX);
        maxX = Math.max(maxX, goldbergData.vertex[v][0] * sizeX);
        minY = Math.min(minY, goldbergData.vertex[v][1] * sizeY);
        maxY = Math.max(maxY, goldbergData.vertex[v][1] * sizeY);
    }
    let index = 0;
    for (let f = 0; f < goldbergData.face.length; f++) {
        const verts = goldbergData.face[f];
        const a = Vector3.FromArray(goldbergData.vertex[verts[0]]);
        const b = Vector3.FromArray(goldbergData.vertex[verts[2]]);
        const c = Vector3.FromArray(goldbergData.vertex[verts[1]]);
        const ba = b.subtract(a);
        const ca = c.subtract(a);
        const norm = Vector3.Cross(ca, ba).normalize();
        for (let v = 0; v < verts.length; v++) {
            normals.push(norm.x, norm.y, norm.z);
            const pdata = goldbergData.vertex[verts[v]];
            positions.push(pdata[0] * sizeX, pdata[1] * sizeY, pdata[2] * sizeZ);
            const vCoord = (pdata[1] * sizeY - minY) / (maxY - minY);
            uvs.push((pdata[0] * sizeX - minX) / (maxX - minX), useOpenGLOrientationForUV ? 1 - vCoord : vCoord);
        }
        for (let v = 0; v < verts.length - 2; v++) {
            indices.push(index, index + v + 2, index + v + 1);
        }
        index += verts.length;
    }
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    return vertexData;
}
/**
 * Creates the Mesh for a Goldberg Polyhedron which is made from 12 pentagonal and the rest hexagonal faces
 * @see https://en.wikipedia.org/wiki/Goldberg_polyhedron
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/polyhedra/goldberg_poly
 * @param name defines the name of the mesh
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * @param scene defines the hosting scene
 * @returns Goldberg mesh
 */
export function CreateGoldberg(name, options, scene = null) {
    const size = options.size;
    const sizeX = options.sizeX || size || 1;
    const sizeY = options.sizeY || size || 1;
    const sizeZ = options.sizeZ || size || 1;
    let m = options.m || 1;
    if (m !== Math.floor(m)) {
        m = Math.floor(m);
        Logger.Warn("m not an integer only floor(m) used");
    }
    let n = options.n || 0;
    if (n !== Math.floor(n)) {
        n = Math.floor(n);
        Logger.Warn("n not an integer only floor(n) used");
    }
    if (n > m) {
        const temp = n;
        n = m;
        m = temp;
        Logger.Warn("n > m therefore m and n swapped");
    }
    const primTri = new _PrimaryIsoTriangle();
    primTri.build(m, n);
    const geodesicData = GeodesicData.BuildGeodesicData(primTri);
    const goldbergData = geodesicData.toGoldbergPolyhedronData();
    const goldberg = new GoldbergMesh(name, scene);
    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    goldberg._originalBuilderSideOrientation = options.sideOrientation;
    const vertexData = CreateGoldbergVertexData(options, goldbergData);
    vertexData.applyToMesh(goldberg, options.updatable);
    goldberg.goldbergData.nbSharedFaces = geodesicData.sharedNodes;
    goldberg.goldbergData.nbUnsharedFaces = geodesicData.poleNodes;
    goldberg.goldbergData.adjacentFaces = geodesicData.adjacentFaces;
    goldberg.goldbergData.nbFaces = goldberg.goldbergData.nbSharedFaces + goldberg.goldbergData.nbUnsharedFaces;
    goldberg.goldbergData.nbFacesAtPole = (goldberg.goldbergData.nbUnsharedFaces - 12) / 12;
    for (let f = 0; f < geodesicData.vertex.length; f++) {
        goldberg.goldbergData.faceCenters.push(Vector3.FromArray(geodesicData.vertex[f]));
        goldberg.goldbergData.faceCenters[f].x *= sizeX;
        goldberg.goldbergData.faceCenters[f].y *= sizeY;
        goldberg.goldbergData.faceCenters[f].z *= sizeZ;
        goldberg.goldbergData.faceColors.push(new Color4(1, 1, 1, 1));
    }
    for (let f = 0; f < goldbergData.face.length; f++) {
        const verts = goldbergData.face[f];
        const a = Vector3.FromArray(goldbergData.vertex[verts[0]]);
        const b = Vector3.FromArray(goldbergData.vertex[verts[2]]);
        const c = Vector3.FromArray(goldbergData.vertex[verts[1]]);
        const ba = b.subtract(a);
        const ca = c.subtract(a);
        const norm = Vector3.Cross(ca, ba).normalize();
        const z = Vector3.Cross(ca, norm).normalize();
        goldberg.goldbergData.faceXaxis.push(ca.normalize());
        goldberg.goldbergData.faceYaxis.push(norm);
        goldberg.goldbergData.faceZaxis.push(z);
    }
    return goldberg;
}
//# sourceMappingURL=goldbergBuilder.js.map