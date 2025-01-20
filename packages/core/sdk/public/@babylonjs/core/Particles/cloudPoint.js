import { Color4, Vector2, Vector3, TmpVectors, Quaternion } from "../Maths/math.js";
/**
 * Represents one particle of a points cloud system.
 */
export class CloudPoint {
    /**
     * Creates a Point Cloud object.
     * Don't create particles manually, use instead the PCS internal tools like _addParticle()
     * @param particleIndex (integer) is the particle index in the PCS pool. It's also the particle identifier.
     * @param group (PointsGroup) is the group the particle belongs to
     * @param groupId (integer) is the group identifier in the PCS.
     * @param idxInGroup (integer) is the index of the particle in the current point group (ex: the 10th point of addPoints(30))
     * @param pcs defines the PCS it is associated to
     */
    constructor(particleIndex, group, groupId, idxInGroup, pcs) {
        /**
         * particle global index
         */
        this.idx = 0;
        /**
         * The color of the particle
         */
        this.color = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * The world space position of the particle.
         */
        this.position = Vector3.Zero();
        /**
         * The world space rotation of the particle. (Not use if rotationQuaternion is set)
         */
        this.rotation = Vector3.Zero();
        /**
         * The uv of the particle.
         */
        this.uv = new Vector2(0.0, 0.0);
        /**
         * The current speed of the particle.
         */
        this.velocity = Vector3.Zero();
        /**
         * The pivot point in the particle local space.
         */
        this.pivot = Vector3.Zero();
        /**
         * Must the particle be translated from its pivot point in its local space ?
         * In this case, the pivot point is set at the origin of the particle local space and the particle is translated.
         * Default : false
         */
        this.translateFromPivot = false;
        /**
         * Index of this particle in the global "positions" array (Internal use)
         * @internal
         */
        this._pos = 0;
        /**
         * @internal Index of this particle in the global "indices" array (Internal use)
         */
        this._ind = 0;
        /**
         * Group id of this particle
         */
        this.groupId = 0;
        /**
         * Index of the particle in its group id (Internal use)
         */
        this.idxInGroup = 0;
        /**
         * @internal Still set as invisible in order to skip useless computations (Internal use)
         */
        this._stillInvisible = false;
        /**
         * @internal Last computed particle rotation matrix
         */
        this._rotationMatrix = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        /**
         * Parent particle Id, if any.
         * Default null.
         */
        this.parentId = null;
        /**
         * @internal Internal global position in the PCS.
         */
        this._globalPosition = Vector3.Zero();
        this.idx = particleIndex;
        this._group = group;
        this.groupId = groupId;
        this.idxInGroup = idxInGroup;
        this._pcs = pcs;
    }
    /**
     * get point size
     */
    get size() {
        return this.size;
    }
    /**
     * Set point size
     */
    set size(scale) {
        this.size = scale;
    }
    /**
     * Legacy support, changed quaternion to rotationQuaternion
     */
    get quaternion() {
        return this.rotationQuaternion;
    }
    /**
     * Legacy support, changed quaternion to rotationQuaternion
     */
    set quaternion(q) {
        this.rotationQuaternion = q;
    }
    /**
     * Returns a boolean. True if the particle intersects a mesh, else false
     * The intersection is computed on the particle position and Axis Aligned Bounding Box (AABB) or Sphere
     * @param target is the object (point or mesh) what the intersection is computed against
     * @param isSphere is boolean flag when false (default) bounding box of mesh is used, when true the bounding sphere is used
     * @returns true if it intersects
     */
    intersectsMesh(target, isSphere) {
        if (!target.hasBoundingInfo) {
            return false;
        }
        if (!this._pcs.mesh) {
            throw new Error("Point Cloud System doesnt contain the Mesh");
        }
        if (isSphere) {
            return target.getBoundingInfo().boundingSphere.intersectsPoint(this.position.add(this._pcs.mesh.position));
        }
        const bbox = target.getBoundingInfo().boundingBox;
        const maxX = bbox.maximumWorld.x;
        const minX = bbox.minimumWorld.x;
        const maxY = bbox.maximumWorld.y;
        const minY = bbox.minimumWorld.y;
        const maxZ = bbox.maximumWorld.z;
        const minZ = bbox.minimumWorld.z;
        const x = this.position.x + this._pcs.mesh.position.x;
        const y = this.position.y + this._pcs.mesh.position.y;
        const z = this.position.z + this._pcs.mesh.position.z;
        return minX <= x && x <= maxX && minY <= y && y <= maxY && minZ <= z && z <= maxZ;
    }
    /**
     * get the rotation matrix of the particle
     * @internal
     */
    getRotationMatrix(m) {
        let quaternion;
        if (this.rotationQuaternion) {
            quaternion = this.rotationQuaternion;
        }
        else {
            quaternion = TmpVectors.Quaternion[0];
            const rotation = this.rotation;
            Quaternion.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, quaternion);
        }
        quaternion.toRotationMatrix(m);
    }
}
/**
 * Represents a group of points in a points cloud system
 *  * PCS internal tool, don't use it manually.
 */
export class PointsGroup {
    /**
     * Get or set the groupId
     * @deprecated Please use groupId instead
     */
    get groupID() {
        return this.groupId;
    }
    set groupID(groupID) {
        this.groupId = groupID;
    }
    /**
     * Creates a points group object. This is an internal reference to produce particles for the PCS.
     * PCS internal tool, don't use it manually.
     * @internal
     */
    constructor(id, posFunction) {
        this.groupId = id;
        this._positionFunction = posFunction;
    }
}
//# sourceMappingURL=cloudPoint.js.map