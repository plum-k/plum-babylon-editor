import { PhysicsPrestepType } from "./IPhysicsEnginePlugin.js";
import { Vector3, Quaternion, TmpVectors } from "../../Maths/math.vector.js";
/**
 * PhysicsBody is useful for creating a physics body that can be used in a physics engine. It allows
 * the user to set the mass and velocity of the body, which can then be used to calculate the
 * motion of the body in the physics engine.
 */
export class PhysicsBody {
    /**
     * Disable pre-step that consists in updating Physics Body from Transform Node Translation/Orientation.
     * True by default for maximum performance.
     */
    get disablePreStep() {
        return this._prestepType == PhysicsPrestepType.DISABLED;
    }
    set disablePreStep(value) {
        this._prestepType = value ? PhysicsPrestepType.DISABLED : PhysicsPrestepType.TELEPORT;
    }
    /**
     * Constructs a new physics body for the given node.
     * @param transformNode - The Transform Node to construct the physics body for. For better performance, it is advised that this node does not have a parent.
     * @param motionType - The motion type of the physics body. The options are:
     *  - PhysicsMotionType.STATIC - Static bodies are not moving and unaffected by forces or collisions. They are good for level boundaries or terrain.
     *  - PhysicsMotionType.DYNAMIC - Dynamic bodies are fully simulated. They can move and collide with other objects.
     *  - PhysicsMotionType.ANIMATED - They behave like dynamic bodies, but they won't be affected by other bodies, but still push other bodies out of the way.
     * @param startsAsleep - Whether the physics body should start in a sleeping state (not a guarantee). Defaults to false.
     * @param scene - The scene containing the physics engine.
     *
     * This code is useful for creating a physics body for a given Transform Node in a scene.
     * It checks the version of the physics engine and the physics plugin, and initializes the body accordingly.
     * It also sets the node's rotation quaternion if it is not already set. Finally, it adds the body to the physics engine.
     */
    constructor(transformNode, motionType, startsAsleep, scene) {
        /**
         * V2 Physics plugin private data for single Transform
         */
        this._pluginData = undefined;
        /**
         * V2 Physics plugin private data for instances
         */
        this._pluginDataInstances = [];
        /**
         * If the collision callback is enabled
         */
        this._collisionCBEnabled = false;
        /**
         * If the collision ended callback is enabled
         */
        this._collisionEndedCBEnabled = false;
        /**
         * Disable sync from physics to transformNode. This value is set to true at body creation or at motionType setting when the body is not dynamic.
         */
        this.disableSync = false;
        this._isDisposed = false;
        this._shape = null;
        this._prestepType = PhysicsPrestepType.DISABLED;
        if (!scene) {
            return;
        }
        const physicsEngine = scene.getPhysicsEngine();
        if (!physicsEngine) {
            throw new Error("No Physics Engine available.");
        }
        this._physicsEngine = physicsEngine;
        if (physicsEngine.getPluginVersion() != 2) {
            throw new Error("Plugin version is incorrect. Expected version 2.");
        }
        const physicsPlugin = physicsEngine.getPhysicsPlugin();
        if (!physicsPlugin) {
            throw new Error("No Physics Plugin available.");
        }
        this._physicsPlugin = physicsPlugin;
        if (!transformNode.rotationQuaternion) {
            transformNode.rotationQuaternion = Quaternion.FromEulerAngles(transformNode.rotation.x, transformNode.rotation.y, transformNode.rotation.z);
        }
        this.startAsleep = startsAsleep;
        this._motionType = motionType;
        // only dynamic and animated body needs sync from physics to transformNode
        this.disableSync = motionType == 0 /* PhysicsMotionType.STATIC */;
        // instances?
        const m = transformNode;
        if (m.hasThinInstances) {
            this._physicsPlugin.initBodyInstances(this, motionType, m);
        }
        else {
            // single instance
            if (transformNode.parent) {
                // Force computation of world matrix so that the parent transforms are correctly reflected in absolutePosition/absoluteRotationQuaternion.
                transformNode.computeWorldMatrix(true);
            }
            this._physicsPlugin.initBody(this, motionType, transformNode.absolutePosition, transformNode.absoluteRotationQuaternion);
        }
        this.transformNode = transformNode;
        transformNode.physicsBody = this;
        physicsEngine.addBody(this);
        this._nodeDisposeObserver = transformNode.onDisposeObservable.add(() => {
            this.dispose();
        });
    }
    /**
     * Returns the string "PhysicsBody".
     * @returns "PhysicsBody"
     */
    getClassName() {
        return "PhysicsBody";
    }
    /**
     * Clone the PhysicsBody to a new body and assign it to the transformNode parameter
     * @param transformNode transformNode that will be used for the cloned PhysicsBody
     * @returns the newly cloned PhysicsBody
     */
    clone(transformNode) {
        const clonedBody = new PhysicsBody(transformNode, this.getMotionType(), this.startAsleep, this.transformNode.getScene());
        clonedBody.shape = this.shape;
        clonedBody.setMassProperties(this.getMassProperties());
        clonedBody.setLinearDamping(this.getLinearDamping());
        clonedBody.setAngularDamping(this.getAngularDamping());
        return clonedBody;
    }
    /**
     * If a physics body is connected to an instanced node, update the number physic instances to match the number of node instances.
     */
    updateBodyInstances() {
        const m = this.transformNode;
        if (m.hasThinInstances) {
            this._physicsPlugin.updateBodyInstances(this, m);
        }
    }
    /**
     * This returns the number of internal instances of the physics body
     */
    get numInstances() {
        return this._pluginDataInstances.length;
    }
    /**
     * Get the motion type of the physics body. Can be STATIC, DYNAMIC, or ANIMATED.
     */
    get motionType() {
        return this._motionType;
    }
    /**
     * Sets the shape of the physics body.
     * @param shape - The shape of the physics body.
     *
     * This method is useful for setting the shape of the physics body, which is necessary for the physics engine to accurately simulate the body's behavior.
     * The shape is used to calculate the body's mass, inertia, and other properties.
     */
    set shape(shape) {
        this._shape = shape;
        if (shape) {
            this._physicsPlugin.setShape(this, shape);
        }
    }
    /**
     * Retrieves the physics shape associated with this object.
     *
     * @returns The physics shape associated with this object, or `undefined` if no
     * shape is associated.
     *
     * This method is useful for retrieving the physics shape associated with this object,
     * which can be used to apply physical forces to the object or to detect collisions.
     */
    get shape() {
        return this._shape;
    }
    /**
     * Returns the bounding box of the physics body.
     * @returns The bounding box of the physics body.
     */
    getBoundingBox() {
        return this._physicsPlugin.getBodyBoundingBox(this);
    }
    /**
     * Sets the event mask for the physics engine.
     *
     * @param eventMask - A bitmask that determines which events will be sent to the physics engine.
     * @param instanceIndex - If this body is instanced, the index of the instance to set the event mask for.
     *
     * This method is useful for setting the event mask for the physics engine, which determines which events
     * will be sent to the physics engine. This allows the user to control which events the physics engine will respond to.
     */
    setEventMask(eventMask, instanceIndex) {
        this._physicsPlugin.setEventMask(this, eventMask, instanceIndex);
    }
    /**
     * Gets the event mask of the physics engine.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the event mask for.
     * @returns The event mask of the physics engine.
     *
     * This method is useful for getting the event mask of the physics engine,
     * which is used to determine which events the engine will respond to.
     * This is important for ensuring that the engine is responding to the correct events and not
     * wasting resources on unnecessary events.
     */
    getEventMask(instanceIndex) {
        return this._physicsPlugin.getEventMask(this, instanceIndex);
    }
    /**
     * Sets the motion type of the physics body. Can be STATIC, DYNAMIC, or ANIMATED.
     * @param motionType - The motion type to set.
     * @param instanceIndex - If this body is instanced, the index of the instance to set the motion type for.
     */
    setMotionType(motionType, instanceIndex) {
        this.disableSync = motionType == 0 /* PhysicsMotionType.STATIC */;
        this._physicsPlugin.setMotionType(this, motionType, instanceIndex);
    }
    /**
     * Gets the motion type of the physics body. Can be STATIC, DYNAMIC, or ANIMATED.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the motion type for.
     * @returns The motion type of the physics body.
     */
    getMotionType(instanceIndex) {
        return this._physicsPlugin.getMotionType(this, instanceIndex);
    }
    /**
     * Set the prestep type of the body
     * @param prestepType prestep type provided by PhysicsPrestepType
     */
    setPrestepType(prestepType) {
        this._prestepType = prestepType;
    }
    /**
     * Get the current prestep type of the body
     * @returns the type of prestep associated with the body and its instance index
     */
    getPrestepType() {
        return this._prestepType;
    }
    /**
     * Computes the mass properties of the physics object, based on the set of physics shapes this body uses.
     * This method is useful for computing the initial mass properties of a physics object, such as its mass,
     * inertia, and center of mass; these values are important for accurately simulating the physics of the
     * object in the physics engine, and computing values based on the shape will provide you with reasonable
     * initial values, which you can then customize.
     * @param instanceIndex - The index of the instance to compute the mass properties for.
     * @returns The mass properties of the object.
     */
    computeMassProperties(instanceIndex) {
        return this._physicsPlugin.computeMassProperties(this, instanceIndex);
    }
    /**
     * Sets the mass properties of the physics object.
     *
     * @param massProps - The mass properties to set.
     * @param instanceIndex - The index of the instance to set the mass properties for. If not defined, the mass properties will be set for all instances.
     *
     * This method is useful for setting the mass properties of a physics object, such as its mass,
     * inertia, and center of mass. This is important for accurately simulating the physics of the object in the physics engine.
     */
    setMassProperties(massProps, instanceIndex) {
        this._physicsPlugin.setMassProperties(this, massProps, instanceIndex);
    }
    /**
     * Retrieves the mass properties of the object.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the mass properties for.
     * @returns The mass properties of the object.
     *
     * This method is useful for physics simulations, as it allows the user to
     * retrieve the mass properties of the object, such as its mass, center of mass,
     * and moment of inertia. This information is necessary for accurate physics
     * simulations.
     */
    getMassProperties(instanceIndex) {
        return this._physicsPlugin.getMassProperties(this, instanceIndex);
    }
    /**
     * Sets the linear damping of the physics body.
     *
     * @param damping - The linear damping value.
     * @param instanceIndex - If this body is instanced, the index of the instance to set the linear damping for.
     *
     * This method is useful for controlling the linear damping of the physics body,
     * which is the rate at which the body's velocity decreases over time. This is useful for simulating
     * the effects of air resistance or other forms of friction.
     */
    setLinearDamping(damping, instanceIndex) {
        this._physicsPlugin.setLinearDamping(this, damping, instanceIndex);
    }
    /**
     * Gets the linear damping of the physics body.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the linear damping for.
     * @returns The linear damping of the physics body.
     *
     * This method is useful for retrieving the linear damping of the physics body, which is the amount of
     * resistance the body has to linear motion. This is useful for simulating realistic physics behavior
     * in a game.
     */
    getLinearDamping(instanceIndex) {
        return this._physicsPlugin.getLinearDamping(this, instanceIndex);
    }
    /**
     * Sets the angular damping of the physics body.
     * @param damping The angular damping of the body.
     * @param instanceIndex - If this body is instanced, the index of the instance to set the angular damping for.
     *
     * This method is useful for controlling the angular velocity of a physics body.
     * By setting the damping, the body's angular velocity will be reduced over time, simulating the effect of friction.
     * This can be used to create realistic physical behavior in a physics engine.
     */
    setAngularDamping(damping, instanceIndex) {
        this._physicsPlugin.setAngularDamping(this, damping, instanceIndex);
    }
    /**
     * Gets the angular damping of the physics body.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the angular damping for.
     *
     * @returns The angular damping of the physics body.
     *
     * This method is useful for getting the angular damping of the physics body,
     * which is the rate of reduction of the angular velocity over time.
     * This is important for simulating realistic physics behavior in a game.
     */
    getAngularDamping(instanceIndex) {
        return this._physicsPlugin.getAngularDamping(this, instanceIndex);
    }
    /**
     * Sets the linear velocity of the physics object.
     * @param linVel - The linear velocity to set.
     * @param instanceIndex - If this body is instanced, the index of the instance to set the linear velocity for.
     *
     * This method is useful for setting the linear velocity of a physics object,
     * which is necessary for simulating realistic physics in a game engine.
     * By setting the linear velocity, the physics object will move in the direction and speed specified by the vector.
     * This allows for realistic physics simulations, such as simulating the motion of a ball rolling down a hill.
     */
    setLinearVelocity(linVel, instanceIndex) {
        this._physicsPlugin.setLinearVelocity(this, linVel, instanceIndex);
    }
    /**
     * Gets the linear velocity of the physics body and stores it in the given vector3.
     * @param linVel - The vector3 to store the linear velocity in.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the linear velocity for.
     *
     * This method is useful for getting the linear velocity of a physics body in a physics engine.
     * This can be used to determine the speed and direction of the body, which can be used to calculate the motion of the body.
     */
    getLinearVelocityToRef(linVel, instanceIndex) {
        this._physicsPlugin.getLinearVelocityToRef(this, linVel, instanceIndex);
    }
    /**
     * Gets the linear velocity of the physics body as a new vector3.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the linear velocity for.
     * @returns The linear velocity of the physics body.
     *
     * This method is useful for getting the linear velocity of a physics body in a physics engine.
     * This can be used to determine the speed and direction of the body, which can be used to calculate the motion of the body.
     */
    getLinearVelocity(instanceIndex) {
        const ref = new Vector3();
        this.getLinearVelocityToRef(ref, instanceIndex);
        return ref;
    }
    /**
     * Sets the angular velocity of the physics object.
     * @param angVel - The angular velocity to set.
     * @param instanceIndex - If this body is instanced, the index of the instance to set the angular velocity for.
     *
     * This method is useful for setting the angular velocity of a physics object, which is necessary for
     * simulating realistic physics behavior. The angular velocity is used to determine the rate of rotation of the object,
     * which is important for simulating realistic motion.
     */
    setAngularVelocity(angVel, instanceIndex) {
        this._physicsPlugin.setAngularVelocity(this, angVel, instanceIndex);
    }
    /**
     * Gets the angular velocity of the physics body and stores it in the given vector3.
     * @param angVel - The vector3 to store the angular velocity in.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the angular velocity for.
     *
     * This method is useful for getting the angular velocity of a physics body, which can be used to determine the body's
     * rotational speed. This information can be used to create realistic physics simulations.
     */
    getAngularVelocityToRef(angVel, instanceIndex) {
        this._physicsPlugin.getAngularVelocityToRef(this, angVel, instanceIndex);
    }
    /**
     * Gets the angular velocity of the physics body as a new vector3.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the angular velocity for.
     * @returns The angular velocity of the physics body.
     *
     * This method is useful for getting the angular velocity of a physics body, which can be used to determine the body's
     * rotational speed. This information can be used to create realistic physics simulations.
     */
    getAngularVelocity(instanceIndex) {
        const ref = new Vector3();
        this.getAngularVelocityToRef(ref, instanceIndex);
        return ref;
    }
    /**
     * Applies an impulse to the physics object.
     *
     * @param impulse The impulse vector.
     * @param location The location of the impulse.
     * @param instanceIndex For a instanced body, the instance to where the impulse should be applied. If not specified, the impulse is applied to all instances.
     *
     * This method is useful for applying an impulse to a physics object, which can be used to simulate physical forces such as gravity,
     * collisions, and explosions. This can be used to create realistic physics simulations in a game or other application.
     */
    applyImpulse(impulse, location, instanceIndex) {
        this._physicsPlugin.applyImpulse(this, impulse, location, instanceIndex);
    }
    /**
     * Add torque to a physics body
     * @param angularImpulse The angular impulse vector.
     * @param instanceIndex For a instanced body, the instance to where the impulse should be applied. If not specified, the impulse is applied to all instances.
     */
    applyAngularImpulse(angularImpulse, instanceIndex) {
        this._physicsPlugin.applyAngularImpulse(this, angularImpulse, instanceIndex);
    }
    /**
     * Applies a force to the physics object.
     *
     * @param force The force vector.
     * @param location The location of the force.
     * @param instanceIndex For a instanced body, the instance to where the force should be applied. If not specified, the force is applied to all instances.
     *
     * This method is useful for applying a force to a physics object, which can be used to simulate physical forces such as gravity,
     * collisions, and explosions. This can be used to create realistic physics simulations in a game or other application.
     */
    applyForce(force, location, instanceIndex) {
        this._physicsPlugin.applyForce(this, force, location, instanceIndex);
    }
    /**
     * Retrieves the geometry of the body from the physics plugin.
     *
     * @returns The geometry of the body.
     *
     * This method is useful for retrieving the geometry of the body from the physics plugin, which can be used for various physics calculations.
     */
    getGeometry() {
        return this._physicsPlugin.getBodyGeometry(this);
    }
    /**
     * Returns an observable that will be notified for when a collision starts or continues for this PhysicsBody
     * @returns Observable
     */
    getCollisionObservable() {
        return this._physicsPlugin.getCollisionObservable(this);
    }
    /**
     * Returns an observable that will be notified when the body has finished colliding with another body
     * @returns
     */
    getCollisionEndedObservable() {
        return this._physicsPlugin.getCollisionEndedObservable(this);
    }
    /**
     * Enable or disable collision callback for this PhysicsBody.
     * @param enabled true if PhysicsBody's collision will rise a collision event and notifies the observable
     */
    setCollisionCallbackEnabled(enabled) {
        this._collisionCBEnabled = enabled;
        this._physicsPlugin.setCollisionCallbackEnabled(this, enabled);
    }
    /**
     * Enable or disable collision ended callback for this PhysicsBody.
     * @param enabled true if PhysicsBody's collision ended will rise a collision event and notifies the observable
     */
    setCollisionEndedCallbackEnabled(enabled) {
        this._collisionEndedCBEnabled = enabled;
        this._physicsPlugin.setCollisionEndedCallbackEnabled(this, enabled);
    }
    /**
     * Get the center of the object in world space.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the center for.
     * @returns geometric center of the associated mesh
     */
    getObjectCenterWorld(instanceIndex) {
        const ref = new Vector3();
        return this.getObjectCenterWorldToRef(ref, instanceIndex);
    }
    /**
     * Get the center of the object in world space.
     * @param ref - The vector3 to store the result in.
     * @param instanceIndex - If this body is instanced, the index of the instance to get the center for.
     * @returns geometric center of the associated mesh
     */
    getObjectCenterWorldToRef(ref, instanceIndex) {
        if (this._pluginDataInstances?.length > 0) {
            const index = instanceIndex || 0;
            const matrixData = this.transformNode._thinInstanceDataStorage.matrixData;
            if (matrixData) {
                ref.set(matrixData[index * 16 + 12], matrixData[index * 16 + 13], matrixData[index * 16 + 14]);
            }
        }
        else {
            ref.copyFrom(this.transformNode.position);
        }
        return ref;
    }
    /**
     * Adds a constraint to the physics engine.
     *
     * @param childBody - The body to which the constraint will be applied.
     * @param constraint - The constraint to be applied.
     * @param instanceIndex - If this body is instanced, the index of the instance to which the constraint will be applied. If not specified, no constraint will be applied.
     * @param childInstanceIndex - If the child body is instanced, the index of the instance to which the constraint will be applied. If not specified, no constraint will be applied.
     *
     */
    addConstraint(childBody, constraint, instanceIndex, childInstanceIndex) {
        this._physicsPlugin.addConstraint(this, childBody, constraint, instanceIndex, childInstanceIndex);
    }
    /**
     * Sync with a bone
     * @param bone The bone that the impostor will be synced to.
     * @param boneMesh The mesh that the bone is influencing.
     * @param jointPivot The pivot of the joint / bone in local space.
     * @param distToJoint Optional distance from the impostor to the joint.
     * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
     * @param boneAxis Optional vector3 axis the bone is aligned with
     */
    syncWithBone(bone, boneMesh, jointPivot, distToJoint, adjustRotation, boneAxis) {
        const mesh = this.transformNode;
        if (mesh.rotationQuaternion) {
            if (adjustRotation) {
                const tempQuat = TmpVectors.Quaternion[0];
                bone.getRotationQuaternionToRef(1 /* Space.WORLD */, boneMesh, tempQuat);
                tempQuat.multiplyToRef(adjustRotation, mesh.rotationQuaternion);
            }
            else {
                bone.getRotationQuaternionToRef(1 /* Space.WORLD */, boneMesh, mesh.rotationQuaternion);
            }
        }
        const pos = TmpVectors.Vector3[0];
        const boneDir = TmpVectors.Vector3[1];
        if (!boneAxis) {
            boneAxis = TmpVectors.Vector3[2];
            boneAxis.x = 0;
            boneAxis.y = 1;
            boneAxis.z = 0;
        }
        bone.getDirectionToRef(boneAxis, boneMesh, boneDir);
        bone.getAbsolutePositionToRef(boneMesh, pos);
        if ((distToJoint === undefined || distToJoint === null) && jointPivot) {
            distToJoint = jointPivot.length();
        }
        if (distToJoint !== undefined && distToJoint !== null) {
            pos.x += boneDir.x * distToJoint;
            pos.y += boneDir.y * distToJoint;
            pos.z += boneDir.z * distToJoint;
        }
        mesh.setAbsolutePosition(pos);
    }
    /**
     * Executes a callback on the body or all of the instances of a body
     * @param callback the callback to execute
     */
    iterateOverAllInstances(callback) {
        if (this._pluginDataInstances?.length > 0) {
            for (let i = 0; i < this._pluginDataInstances.length; i++) {
                callback(this, i);
            }
        }
        else {
            callback(this, undefined);
        }
    }
    /**
     * Sets the gravity factor of the physics body
     * @param factor the gravity factor to set
     * @param instanceIndex the instance of the body to set, if undefined all instances will be set
     */
    setGravityFactor(factor, instanceIndex) {
        this._physicsPlugin.setGravityFactor(this, factor, instanceIndex);
    }
    /**
     * Gets the gravity factor of the physics body
     * @param instanceIndex the instance of the body to get, if undefined the value of first instance will be returned
     * @returns the gravity factor
     */
    getGravityFactor(instanceIndex) {
        return this._physicsPlugin.getGravityFactor(this, instanceIndex);
    }
    /**
     * Set the target transformation (position and rotation) of the body, such that the body will set its velocity to reach that target
     * @param position The target position
     * @param rotation The target rotation
     * @param instanceIndex The index of the instance in an instanced body
     */
    setTargetTransform(position, rotation, instanceIndex) {
        this._physicsPlugin.setTargetTransform(this, position, rotation, instanceIndex);
    }
    /**
     * Returns if the body has been disposed.
     * @returns true if disposed, false otherwise.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Disposes the body from the physics engine.
     *
     * This method is useful for cleaning up the physics engine when a body is no longer needed. Disposing the body will free up resources and prevent memory leaks.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        // Disable collisions CB so it doesn't fire when the body is disposed
        if (this._collisionCBEnabled) {
            this.setCollisionCallbackEnabled(false);
        }
        if (this._collisionEndedCBEnabled) {
            this.setCollisionEndedCallbackEnabled(false);
        }
        if (this._nodeDisposeObserver) {
            this.transformNode.onDisposeObservable.remove(this._nodeDisposeObserver);
            this._nodeDisposeObserver = null;
        }
        this._physicsEngine.removeBody(this);
        this._physicsPlugin.removeBody(this);
        this._physicsPlugin.disposeBody(this);
        this.transformNode.physicsBody = null;
        this._pluginData = null;
        this._pluginDataInstances.length = 0;
        this._isDisposed = true;
        this.shape = null;
    }
}
//# sourceMappingURL=physicsBody.js.map