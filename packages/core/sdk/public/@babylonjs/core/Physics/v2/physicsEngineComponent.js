import { TransformNode } from "../../Meshes/transformNode.js";
import "../joinedPhysicsEngineComponent.js";
Object.defineProperty(TransformNode.prototype, "physicsBody", {
    get: function () {
        return this._physicsBody;
    },
    set: function (value) {
        if (this._physicsBody === value) {
            return;
        }
        if (this._disposePhysicsObserver) {
            this.onDisposeObservable.remove(this._disposePhysicsObserver);
        }
        this._physicsBody = value;
        if (value) {
            this._disposePhysicsObserver = this.onDisposeObservable.add(() => {
                // Physics
                if (this.physicsBody) {
                    this.physicsBody.dispose( /*!doNotRecurse*/);
                    this.physicsBody = null;
                }
            });
        }
    },
    enumerable: true,
    configurable: true,
});
/**
 * Gets the current physics body
 * @returns a physics body or null
 */
TransformNode.prototype.getPhysicsBody = function () {
    return this.physicsBody;
};
/**
 * Apply a physic impulse to the mesh
 * @param force defines the force to apply
 * @param contactPoint defines where to apply the force
 * @returns the current mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
TransformNode.prototype.applyImpulse = function (force, contactPoint) {
    if (!this.physicsBody) {
        throw new Error("No Physics Body for TransformNode");
    }
    this.physicsBody.applyImpulse(force, contactPoint);
    return this;
};
/**
 * Apply a physic angular impulse to the mesh
 * @param angularImpulse defines the torque to apply
 * @returns the current mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
TransformNode.prototype.applyAngularImpulse = function (angularImpulse) {
    if (!this.physicsBody) {
        throw new Error("No Physics Body for TransformNode");
    }
    this.physicsBody.applyAngularImpulse(angularImpulse);
    return this;
};
//# sourceMappingURL=physicsEngineComponent.js.map