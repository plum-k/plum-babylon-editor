import { Vector3 } from "../Maths/math.vector.js";
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _MeshCollisionData {
    constructor() {
        this._checkCollisions = false;
        this._collisionMask = -1;
        this._collisionGroup = -1;
        this._surroundingMeshes = null;
        this._collider = null;
        this._oldPositionForCollisions = new Vector3(0, 0, 0);
        this._diffPositionForCollisions = new Vector3(0, 0, 0);
        this._collisionResponse = true;
    }
}
//# sourceMappingURL=meshCollisionData.js.map