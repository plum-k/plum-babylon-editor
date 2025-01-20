/**
 * This is a holder class for the physics constraint created by the physics plugin
 * It holds a set of functions to control the underlying constraint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsConstraint {
    /**
     * Constructs a new constraint for the physics constraint.
     * @param type The type of constraint to create.
     * @param options The options for the constraint.
     * @param scene The scene the constraint belongs to.
     *
     * This code is useful for creating a new constraint for the physics engine. It checks if the scene has a physics engine, and if the plugin version is correct.
     * If all checks pass, it initializes the constraint with the given type and options.
     */
    constructor(type, options, scene) {
        /**
         * V2 Physics plugin private data for a physics material
         */
        this._pluginData = undefined;
        if (!scene) {
            throw new Error("Missing scene parameter for constraint constructor.");
        }
        const physicsEngine = scene.getPhysicsEngine();
        if (!physicsEngine) {
            throw new Error("No Physics Engine available.");
        }
        if (physicsEngine.getPluginVersion() != 2) {
            throw new Error("Plugin version is incorrect. Expected version 2.");
        }
        const physicsPlugin = physicsEngine.getPhysicsPlugin();
        if (!physicsPlugin) {
            throw new Error("No Physics Plugin available.");
        }
        this._physicsPlugin = physicsPlugin;
        this._options = options;
        this._type = type;
    }
    /**
     * Gets the type of the constraint.
     *
     * @returns The type of the constraint.
     *
     */
    get type() {
        return this._type;
    }
    /**
     * Retrieves the options of the physics constraint.
     *
     * @returns The physics constraint parameters.
     *
     */
    get options() {
        return this._options;
    }
    /**
     * Enable/disable the constraint
     * @param isEnabled value for the constraint
     */
    set isEnabled(isEnabled) {
        this._physicsPlugin.setEnabled(this, isEnabled);
    }
    /**
     *
     * @returns true if constraint is enabled
     */
    get isEnabled() {
        return this._physicsPlugin.getEnabled(this);
    }
    /**
     * Enables or disables collisions for the physics engine.
     *
     * @param isEnabled - A boolean value indicating whether collisions should be enabled or disabled.
     *
     */
    set isCollisionsEnabled(isEnabled) {
        this._physicsPlugin.setCollisionsEnabled(this, isEnabled);
    }
    /**
     * Gets whether collisions are enabled for this physics object.
     *
     * @returns `true` if collisions are enabled, `false` otherwise.
     *
     */
    get isCollisionsEnabled() {
        return this._physicsPlugin.getCollisionsEnabled(this);
    }
    /**
     * Gets all bodies that are using this constraint
     * @returns
     */
    getBodiesUsingConstraint() {
        return this._physicsPlugin.getBodiesUsingConstraint(this);
    }
    /**
     * Disposes the constraint from the physics engine.
     *
     * This method is useful for cleaning up the physics engine when a body is no longer needed. Disposing the body will free up resources and prevent memory leaks.
     */
    dispose() {
        this._physicsPlugin.disposeConstraint(this);
    }
}
/**
 * This describes a single limit used by Physics6DoFConstraint
 */
export class Physics6DoFLimit {
}
/**
 * A generic constraint, which can be used to build more complex constraints than those specified
 * in PhysicsConstraintType. The axis and pivot options in PhysicsConstraintParameters define the space
 * the constraint operates in. This constraint contains a set of limits, which restrict the
 * relative movement of the bodies in that coordinate system
 */
export class Physics6DoFConstraint extends PhysicsConstraint {
    constructor(constraintParams, limits, scene) {
        super(7 /* PhysicsConstraintType.SIX_DOF */, constraintParams, scene);
        this.limits = limits;
    }
    /**
     * Sets the friction of the given axis of the physics engine.
     * @param axis - The axis of the physics engine to set the friction for.
     * @param friction - The friction to set for the given axis.
     *
     */
    setAxisFriction(axis, friction) {
        this._physicsPlugin.setAxisFriction(this, axis, friction);
    }
    /**
     * Gets the friction of the given axis of the physics engine.
     * @param axis - The axis of the physics engine.
     * @returns The friction of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisFriction(axis) {
        return this._physicsPlugin.getAxisFriction(this, axis);
    }
    /**
     * Sets the limit mode for the given axis of the constraint.
     * @param axis The axis to set the limit mode for.
     * @param limitMode The limit mode to set.
     *
     * This method is useful for setting the limit mode for a given axis of the constraint. This is important for
     * controlling the behavior of the physics engine when the constraint is reached. By setting the limit mode,
     * the engine can be configured to either stop the motion of the objects, or to allow them to continue
     * moving beyond the constraint.
     */
    setAxisMode(axis, limitMode) {
        this._physicsPlugin.setAxisMode(this, axis, limitMode);
    }
    /**
     * Gets the limit mode of the given axis of the constraint.
     *
     * @param axis - The axis of the constraint.
     * @returns The limit mode of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisMode(axis) {
        return this._physicsPlugin.getAxisMode(this, axis);
    }
    /**
     * Sets the minimum limit of a given axis of a constraint.
     * @param axis - The axis of the constraint.
     * @param minLimit - The minimum limit of the axis.
     *
     */
    setAxisMinLimit(axis, minLimit) {
        this._physicsPlugin.setAxisMinLimit(this, axis, minLimit);
    }
    /**
     * Gets the minimum limit of the given axis of the physics engine.
     * @param axis - The axis of the physics engine.
     * @returns The minimum limit of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisMinLimit(axis) {
        return this._physicsPlugin.getAxisMinLimit(this, axis);
    }
    /**
     * Sets the maximum limit of the given axis for the physics engine.
     * @param axis - The axis to set the limit for.
     * @param limit - The maximum limit of the axis.
     *
     * This method is useful for setting the maximum limit of the given axis for the physics engine,
     * which can be used to control the movement of the physics object. This helps to ensure that the
     * physics object does not move beyond the given limit.
     */
    setAxisMaxLimit(axis, limit) {
        this._physicsPlugin.setAxisMaxLimit(this, axis, limit);
    }
    /**
     * Gets the maximum limit of the given axis of the physics engine.
     * @param axis - The axis of the physics engine.
     * @returns The maximum limit of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisMaxLimit(axis) {
        return this._physicsPlugin.getAxisMaxLimit(this, axis);
    }
    /**
     * Sets the motor type of the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @param motorType - The type of motor to use.
     */
    setAxisMotorType(axis, motorType) {
        this._physicsPlugin.setAxisMotorType(this, axis, motorType);
    }
    /**
     * Gets the motor type of the specified axis of the constraint.
     *
     * @param axis - The axis of the constraint.
     * @returns The motor type of the specified axis, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisMotorType(axis) {
        return this._physicsPlugin.getAxisMotorType(this, axis);
    }
    /**
     * Sets the target velocity of the motor associated with the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @param target - The target velocity of the motor.
     *
     * This method is useful for setting the target velocity of the motor associated with the given axis of the constraint.
     */
    setAxisMotorTarget(axis, target) {
        this._physicsPlugin.setAxisMotorTarget(this, axis, target);
    }
    /**
     * Gets the target velocity of the motor associated to the given constraint axis.
     * @param axis - The constraint axis associated to the motor.
     * @returns The target velocity of the motor, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisMotorTarget(axis) {
        return this._physicsPlugin.getAxisMotorTarget(this, axis);
    }
    /**
     * Sets the maximum force of the motor of the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @param maxForce - The maximum force of the motor.
     *
     */
    setAxisMotorMaxForce(axis, maxForce) {
        this._physicsPlugin.setAxisMotorMaxForce(this, axis, maxForce);
    }
    /**
     * Gets the maximum force of the motor of the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @returns The maximum force of the motor, or null if the constraint hasn't been initialized yet.
     *
     */
    getAxisMotorMaxForce(axis) {
        return this._physicsPlugin.getAxisMotorMaxForce(this, axis);
    }
}
/**
 * Represents a Ball and Socket Constraint, used to simulate a joint
 * This class is useful for simulating a joint between two bodies in a physics engine.
 * It allows for the two bodies to move relative to each other in a way that mimics a ball and socket joint, such as a shoulder or hip joint.
 * @param pivotA - The first pivot, defined locally in the first body frame
 * @param pivotB - The second pivot, defined locally in the second body frame
 * @param axisA - The axis of the first body
 * @param axisB - The axis of the second body
 * @param scene - The scene the constraint is applied to
 * @returns The Ball and Socket Constraint
 */
export class BallAndSocketConstraint extends PhysicsConstraint {
    constructor(pivotA, pivotB, axisA, axisB, scene) {
        super(1 /* PhysicsConstraintType.BALL_AND_SOCKET */, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
/**
 * Creates a distance constraint.
 *
 * This code is useful for creating a distance constraint in a physics engine.
 * A distance constraint is a type of constraint that keeps two objects at a certain distance from each other.
 * The scene is used to add the constraint to the physics engine.
 * @param maxDistance distance between bodies
 * @param scene The scene the constraint belongs to
 * @returns DistanceConstraint
 */
export class DistanceConstraint extends PhysicsConstraint {
    constructor(maxDistance, scene) {
        super(2 /* PhysicsConstraintType.DISTANCE */, { maxDistance: maxDistance }, scene);
    }
}
/**
 * Creates a HingeConstraint, which is a type of PhysicsConstraint.
 *
 * This code is useful for creating a HingeConstraint, which is a type of PhysicsConstraint.
 * This constraint is used to simulate a hinge joint between two rigid bodies, allowing them to rotate around a single axis.
 * @param pivotA - The first pivot point, in world space.
 * @param pivotB - The second pivot point, in world space.
 * @param scene - The scene the constraint is used in.
 * @returns The new HingeConstraint.
 */
export class HingeConstraint extends PhysicsConstraint {
    constructor(pivotA, pivotB, axisA, axisB, scene) {
        super(3 /* PhysicsConstraintType.HINGE */, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
/**
 * Creates a SliderConstraint, which is a type of PhysicsConstraint.
 *
 * This code is useful for creating a SliderConstraint, which is a type of PhysicsConstraint.
 * It allows the user to specify the two pivots and two axes of the constraint in world space, as well as the scene the constraint belongs to.
 * This is useful for creating a constraint between two rigid bodies that allows them to move along a certain axis.
 * @param pivotA - The first pivot of the constraint, in world space.
 * @param pivotB - The second pivot of the constraint, in world space.
 * @param axisA - The first axis of the constraint, in world space.
 * @param axisB - The second axis of the constraint, in world space.
 * @param scene - The scene the constraint belongs to.
 * @returns The created SliderConstraint.
 */
export class SliderConstraint extends PhysicsConstraint {
    constructor(pivotA, pivotB, axisA, axisB, scene) {
        super(4 /* PhysicsConstraintType.SLIDER */, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
/**
 * Creates a LockConstraint, which is a type of PhysicsConstraint.
 *
 * This code is useful for creating a LockConstraint, which is a type of PhysicsConstraint.
 * It takes in two pivots and two axes in local space, as well as the scene the constraint belongs to, and creates a LockConstraint.
 * @param pivotA - The first pivot of the constraint in local space.
 * @param pivotB - The second pivot of the constraint in local space.
 * @param axisA - The first axis of the constraint in local space.
 * @param axisB - The second axis of the constraint in local space.
 * @param scene - The scene the constraint belongs to.
 * @returns The created LockConstraint.
 */
export class LockConstraint extends PhysicsConstraint {
    constructor(pivotA, pivotB, axisA, axisB, scene) {
        super(5 /* PhysicsConstraintType.LOCK */, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
/**
 * Creates a PrismaticConstraint, which is a type of PhysicsConstraint.
 *
 * This code is useful for creating a PrismaticConstraint, which is a type of PhysicsConstraint.
 * It takes in two pivots and two axes in local space, as well as the scene the constraint belongs to, and creates a PrismaticConstraint.
 * @param pivotA - The first pivot of the constraint in local space.
 * @param pivotB - The second pivot of the constraint in local space.
 * @param axisA - The first axis of the constraint in local space.
 * @param axisB - The second axis of the constraint in local space.
 * @param scene - The scene the constraint belongs to.
 * @returns The created LockConstraint.
 */
export class PrismaticConstraint extends PhysicsConstraint {
    constructor(pivotA, pivotB, axisA, axisB, scene) {
        super(6 /* PhysicsConstraintType.PRISMATIC */, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
/**
 * Creates a SpringConstraint, which is a type of Physics6DoFConstraint. This constraint applies a force at the ends which is proportional
 * to the distance between ends, and a stiffness and damping factor. The force is calculated as (stiffness * positionError) - (damping * velocity)
 *
 * @param pivotA - The first pivot of the constraint in local space.
 * @param pivotB - The second pivot of the constraint in local space.
 * @param axisA - The first axis of the constraint in local space.
 * @param axisB - The second axis of the constraint in local space.
 * @param minDistance - The minimum distance between the two pivots.
 * @param maxDistance - The maximum distance between the two pivots.
 * @param stiffness - The stiffness of the spring.
 * @param damping - The damping of the spring.
 * @param scene - The scene the constraint belongs to.
 * @returns The created SpringConstraint.
 */
export class SpringConstraint extends Physics6DoFConstraint {
    constructor(pivotA, pivotB, axisA, axisB, minDistance, maxDistance, stiffness, damping, scene) {
        super({ pivotA, pivotB, axisA, axisB }, [{ axis: 6 /* PhysicsConstraintAxis.LINEAR_DISTANCE */, minLimit: minDistance, maxLimit: maxDistance, stiffness, damping }], scene);
    }
}
//# sourceMappingURL=physicsConstraint.js.map