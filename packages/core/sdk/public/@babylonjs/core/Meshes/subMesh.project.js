
import { TmpVectors, Vector3 } from "../Maths/math.vector.js";
import { SubMesh } from "./subMesh.js";
/**
 * @internal
 */
SubMesh.prototype._projectOnTrianglesToRef = function (vector, positions, indices, step, checkStopper, ref) {
    // Triangles test
    const proj = TmpVectors.Vector3[0];
    const tmp = TmpVectors.Vector3[1];
    let distance = +Infinity;
    for (let index = this.indexStart; index < this.indexStart + this.indexCount - (3 - step); index += step) {
        const indexA = indices[index];
        const indexB = indices[index + 1];
        const indexC = indices[index + 2];
        if (checkStopper && indexC === 0xffffffff) {
            index += 2;
            continue;
        }
        const p0 = positions[indexA];
        const p1 = positions[indexB];
        const p2 = positions[indexC];
        // stay defensive and don't check against undefined positions.
        if (!p0 || !p1 || !p2) {
            continue;
        }
        const tmpDist = Vector3.ProjectOnTriangleToRef(vector, p0, p1, p2, tmp);
        if (tmpDist < distance) {
            proj.copyFrom(tmp);
            distance = tmpDist;
        }
    }
    ref.copyFrom(proj);
    return distance;
};
/**
 * @internal
 */
SubMesh.prototype._projectOnUnIndexedTrianglesToRef = function (vector, positions, indices, ref) {
    // Triangles test
    const proj = TmpVectors.Vector3[0];
    const tmp = TmpVectors.Vector3[1];
    let distance = +Infinity;
    for (let index = this.verticesStart; index < this.verticesStart + this.verticesCount; index += 3) {
        const p0 = positions[index];
        const p1 = positions[index + 1];
        const p2 = positions[index + 2];
        const tmpDist = Vector3.ProjectOnTriangleToRef(vector, p0, p1, p2, tmp);
        if (tmpDist < distance) {
            proj.copyFrom(tmp);
            distance = tmpDist;
        }
    }
    ref.copyFrom(proj);
    return distance;
};
SubMesh.prototype.projectToRef = function (vector, positions, indices, ref) {
    const material = this.getMaterial();
    if (!material) {
        return -1;
    }
    let step = 3;
    let checkStopper = false;
    switch (material.fillMode) {
        case 3:
        case 5:
        case 6:
        case 8:
            return -1;
        case 7:
            step = 1;
            checkStopper = true;
            break;
        default:
            break;
    }
    // LineMesh first as it's also a Mesh...
    if (material.fillMode === 4) {
        return -1;
    }
    else {
        // Check if mesh is unindexed
        if (!indices.length && this._mesh._unIndexed) {
            return this._projectOnUnIndexedTrianglesToRef(vector, positions, indices, ref);
        }
        return this._projectOnTrianglesToRef(vector, positions, indices, step, checkStopper, ref);
    }
};
//# sourceMappingURL=subMesh.project.js.map