import { AbstractMesh } from "../../Meshes/abstractMesh.js";
import { PhysicsJoint } from "./physicsJoint.js";
Object.defineProperty(AbstractMesh.prototype, "physicsImpostor", {
    get: function () {
        return this._physicsImpostor;
    },
    set: function (value) {
        if (this._physicsImpostor === value) {
            return;
        }
        if (this._disposePhysicsObserver) {
            this.onDisposeObservable.remove(this._disposePhysicsObserver);
        }
        this._physicsImpostor = value;
        if (value) {
            this._disposePhysicsObserver = this.onDisposeObservable.add(() => {
                // Physics
                if (this.physicsImpostor) {
                    this.physicsImpostor.dispose( /*!doNotRecurse*/);
                    this.physicsImpostor = null;
                }
            });
        }
    },
    enumerable: true,
    configurable: true,
});
/**
 * Gets the current physics impostor
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics
 * @returns a physics impostor or null
 */
AbstractMesh.prototype.getPhysicsImpostor = function () {
    return this.physicsImpostor;
};
/**
 * Apply a physic impulse to the mesh
 * @param force defines the force to apply
 * @param contactPoint defines where to apply the force
 * @returns the current mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
AbstractMesh.prototype.applyImpulse = function (force, contactPoint) {
    if (!this.physicsImpostor) {
        return this;
    }
    this.physicsImpostor.applyImpulse(force, contactPoint);
    return this;
};
/**
 * Creates a physic joint between two meshes
 * @param otherMesh defines the other mesh to use
 * @param pivot1 defines the pivot to use on this mesh
 * @param pivot2 defines the pivot to use on the other mesh
 * @param options defines additional options (can be plugin dependent)
 * @returns the current mesh
 * @see https://www.babylonjs-playground.com/#0BS5U0#0
 */
AbstractMesh.prototype.setPhysicsLinkWith = function (otherMesh, pivot1, pivot2, options) {
    if (!this.physicsImpostor || !otherMesh.physicsImpostor) {
        return this;
    }
    this.physicsImpostor.createJoint(otherMesh.physicsImpostor, PhysicsJoint.HingeJoint, {
        mainPivot: pivot1,
        connectedPivot: pivot2,
        nativeParams: options,
    });
    return this;
};
//# sourceMappingURL=physicsEngineComponent.js.map