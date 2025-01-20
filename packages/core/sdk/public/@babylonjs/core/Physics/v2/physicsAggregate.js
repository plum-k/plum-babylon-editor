import { PhysicsBody } from "./physicsBody.js";
import { PhysicsShape } from "./physicsShape.js";
import { Logger } from "../../Misc/logger.js";
import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector.js";
import { WithinEpsilon } from "../../Maths/math.scalar.functions.js";
import { BoundingBox } from "../../Culling/boundingBox.js";
/**
 * Helper class to create and interact with a PhysicsAggregate.
 * This is a transition object that works like Physics Plugin V1 Impostors.
 * This helper instanciate all mandatory physics objects to get a body/shape and material.
 * It's less efficient that handling body and shapes independently but for prototyping or
 * a small numbers of physics objects, it's good enough.
 */
export class PhysicsAggregate {
    constructor(
    /**
     * The physics-enabled object used as the physics aggregate
     */
    transformNode, 
    /**
     * The type of the physics aggregate
     */
    type, _options = { mass: 0 }, _scene) {
        this.transformNode = transformNode;
        this.type = type;
        this._options = _options;
        this._scene = _scene;
        this._disposeShapeWhenDisposed = true;
        //sanity check!
        if (!this.transformNode) {
            Logger.Error("No object was provided. A physics object is obligatory");
            return;
        }
        const m = transformNode;
        if (this.transformNode.parent && this._options.mass !== 0 && m.hasThinInstances) {
            Logger.Warn("A physics body has been created for an object which has a parent and thin instances. Babylon physics currently works in local space so unexpected issues may occur.");
        }
        // Legacy support for old syntax.
        if (!this._scene && transformNode.getScene) {
            this._scene = transformNode.getScene();
        }
        if (!this._scene) {
            return;
        }
        //default options params
        this._options.mass = _options.mass === void 0 ? 0 : _options.mass;
        this._options.friction = _options.friction === void 0 ? 0.2 : _options.friction;
        this._options.restitution = _options.restitution === void 0 ? 0.2 : _options.restitution;
        const motionType = this._options.mass === 0 ? 0 /* PhysicsMotionType.STATIC */ : 2 /* PhysicsMotionType.DYNAMIC */;
        const startAsleep = this._options.startAsleep ?? false;
        this.body = new PhysicsBody(transformNode, motionType, startAsleep, this._scene);
        this._addSizeOptions();
        if (type.getClassName && type.getClassName() === "PhysicsShape") {
            this.shape = type;
            this._disposeShapeWhenDisposed = false;
        }
        else {
            this.shape = new PhysicsShape({ type: type, parameters: this._options }, this._scene);
        }
        if (this._options.isTriggerShape) {
            this.shape.isTrigger = true;
        }
        this.material = { friction: this._options.friction, restitution: this._options.restitution };
        this.body.shape = this.shape;
        this.shape.material = this.material;
        this.body.setMassProperties({ mass: this._options.mass });
        this._nodeDisposeObserver = this.transformNode.onDisposeObservable.add(() => {
            this.dispose();
        });
    }
    _getObjectBoundingBox() {
        if (this.transformNode.getRawBoundingInfo) {
            return this.transformNode.getRawBoundingInfo().boundingBox;
        }
        else {
            return new BoundingBox(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
        }
    }
    _hasVertices(node) {
        return node?.getTotalVertices() > 0;
    }
    _addSizeOptions() {
        this.transformNode.computeWorldMatrix(true);
        const bb = this._getObjectBoundingBox();
        const extents = TmpVectors.Vector3[0];
        extents.copyFrom(bb.extendSize);
        extents.scaleInPlace(2);
        extents.multiplyInPlace(this.transformNode.absoluteScaling);
        // In case we had any negative scaling, we need to take the absolute value of the extents.
        extents.x = Math.abs(extents.x);
        extents.y = Math.abs(extents.y);
        extents.z = Math.abs(extents.z);
        const min = TmpVectors.Vector3[1];
        min.copyFrom(bb.minimum);
        min.multiplyInPlace(this.transformNode.absoluteScaling);
        if (!this._options.center) {
            const center = new Vector3();
            center.copyFrom(bb.center);
            center.multiplyInPlace(this.transformNode.absoluteScaling);
            this._options.center = center;
        }
        switch (this.type) {
            case 0 /* PhysicsShapeType.SPHERE */:
                if (!this._options.radius && WithinEpsilon(extents.x, extents.y, 0.0001) && WithinEpsilon(extents.x, extents.z, 0.0001)) {
                    this._options.radius = extents.x / 2;
                }
                else if (!this._options.radius) {
                    Logger.Warn("Non uniform scaling is unsupported for sphere shapes. Setting the radius to the biggest bounding box extent.");
                    this._options.radius = Math.max(extents.x, extents.y, extents.z) / 2;
                }
                break;
            case 1 /* PhysicsShapeType.CAPSULE */:
                {
                    const capRadius = extents.x / 2;
                    this._options.radius = this._options.radius ?? capRadius;
                    this._options.pointA = this._options.pointA ?? new Vector3(0, min.y + capRadius, 0);
                    this._options.pointB = this._options.pointB ?? new Vector3(0, min.y + extents.y - capRadius, 0);
                }
                break;
            case 2 /* PhysicsShapeType.CYLINDER */:
                {
                    const capRadius = extents.x / 2;
                    this._options.radius = this._options.radius ?? capRadius;
                    this._options.pointA = this._options.pointA ?? new Vector3(0, min.y, 0);
                    this._options.pointB = this._options.pointB ?? new Vector3(0, min.y + extents.y, 0);
                }
                break;
            case 6 /* PhysicsShapeType.MESH */:
            case 4 /* PhysicsShapeType.CONVEX_HULL */:
            case 7 /* PhysicsShapeType.HEIGHTFIELD */:
                if (!this._options.mesh && this._hasVertices(this.transformNode)) {
                    this._options.mesh = this.transformNode;
                }
                else if (!this._options.mesh || !this._hasVertices(this._options.mesh)) {
                    throw new Error("No valid mesh was provided for mesh or convex hull shape parameter. Please provide a mesh with valid geometry (number of vertices greater than 0).");
                }
                break;
            case 3 /* PhysicsShapeType.BOX */:
                this._options.extents = this._options.extents ?? new Vector3(extents.x, extents.y, extents.z);
                this._options.rotation = this._options.rotation ?? Quaternion.Identity();
                break;
        }
    }
    /**
     * Releases the body, shape and material
     */
    dispose() {
        if (this._nodeDisposeObserver) {
            this.body.transformNode.onDisposeObservable.remove(this._nodeDisposeObserver);
            this._nodeDisposeObserver = null;
        }
        this.body.dispose();
        if (this._disposeShapeWhenDisposed) {
            this.shape.dispose();
        }
    }
}
//# sourceMappingURL=physicsAggregate.js.map