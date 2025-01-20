/**
 * This is a holder class for the physics joint created by the physics plugin
 * It holds a set of functions to control the underlying joint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsJoint {
    /**
     * Initializes the physics joint
     * @param type The type of the physics joint
     * @param jointData The data for the physics joint
     */
    constructor(
    /**
     * The type of the physics joint
     */
    type, 
    /**
     * The data for the physics joint
     */
    jointData) {
        this.type = type;
        this.jointData = jointData;
        jointData.nativeParams = jointData.nativeParams || {};
    }
    /**
     * Gets the physics joint
     */
    get physicsJoint() {
        return this._physicsJoint;
    }
    /**
     * Sets the physics joint
     */
    set physicsJoint(newJoint) {
        this._physicsJoint = newJoint;
    }
    /**
     * Sets the physics plugin
     */
    set physicsPlugin(physicsPlugin) {
        this._physicsPlugin = physicsPlugin;
    }
    /**
     * Execute a function that is physics-plugin specific.
     * @param {Function} func the function that will be executed.
     *                        It accepts two parameters: the physics world and the physics joint
     */
    executeNativeFunction(func) {
        func(this._physicsPlugin.world, this._physicsJoint);
    }
}
//TODO check if the native joints are the same
//Joint Types
/**
 * Distance-Joint type
 */
PhysicsJoint.DistanceJoint = 0;
/**
 * Hinge-Joint type
 */
PhysicsJoint.HingeJoint = 1;
/**
 * Ball-and-Socket joint type
 */
PhysicsJoint.BallAndSocketJoint = 2;
/**
 * Wheel-Joint type
 */
PhysicsJoint.WheelJoint = 3;
/**
 * Slider-Joint type
 */
PhysicsJoint.SliderJoint = 4;
//OIMO
/**
 * Prismatic-Joint type
 */
PhysicsJoint.PrismaticJoint = 5;
//
/**
 * Universal-Joint type
 * ENERGY FTW! (compare with this - @see http://ode-wiki.org/wiki/index.php?title=Manual:_Joint_Types_and_Functions)
 */
PhysicsJoint.UniversalJoint = 6;
/**
 * Hinge-Joint 2 type
 */
PhysicsJoint.Hinge2Joint = PhysicsJoint.WheelJoint;
//Cannon
/**
 * Point to Point Joint type.  Similar to a Ball-Joint.  Different in parameters
 */
PhysicsJoint.PointToPointJoint = 8;
//Cannon only at the moment
/**
 * Spring-Joint type
 */
PhysicsJoint.SpringJoint = 9;
/**
 * Lock-Joint type
 */
PhysicsJoint.LockJoint = 10;
/**
 * A class representing a physics distance joint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class DistanceJoint extends PhysicsJoint {
    /**
     *
     * @param jointData The data for the Distance-Joint
     */
    constructor(jointData) {
        super(PhysicsJoint.DistanceJoint, jointData);
    }
    /**
     * Update the predefined distance.
     * @param maxDistance The maximum preferred distance
     * @param minDistance The minimum preferred distance
     */
    updateDistance(maxDistance, minDistance) {
        this._physicsPlugin.updateDistanceJoint(this, maxDistance, minDistance);
    }
}
/**
 * Represents a Motor-Enabled Joint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class MotorEnabledJoint extends PhysicsJoint {
    /**
     * Initializes the Motor-Enabled Joint
     * @param type The type of the joint
     * @param jointData The physical joint data for the joint
     */
    constructor(type, jointData) {
        super(type, jointData);
    }
    /**
     * Set the motor values.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param force the force to apply
     * @param maxForce max force for this motor.
     */
    setMotor(force, maxForce) {
        this._physicsPlugin.setMotor(this, force || 0, maxForce);
    }
    /**
     * Set the motor's limits.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param upperLimit The upper limit of the motor
     * @param lowerLimit The lower limit of the motor
     */
    setLimit(upperLimit, lowerLimit) {
        this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
    }
}
/**
 * This class represents a single physics Hinge-Joint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class HingeJoint extends MotorEnabledJoint {
    /**
     * Initializes the Hinge-Joint
     * @param jointData The joint data for the Hinge-Joint
     */
    constructor(jointData) {
        super(PhysicsJoint.HingeJoint, jointData);
    }
    /**
     * Set the motor values.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param {number} force the force to apply
     * @param {number} maxForce max force for this motor.
     */
    setMotor(force, maxForce) {
        this._physicsPlugin.setMotor(this, force || 0, maxForce);
    }
    /**
     * Set the motor's limits.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param upperLimit The upper limit of the motor
     * @param lowerLimit The lower limit of the motor
     */
    setLimit(upperLimit, lowerLimit) {
        this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
    }
}
/**
 * This class represents a dual hinge physics joint (same as wheel joint)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class Hinge2Joint extends MotorEnabledJoint {
    /**
     * Initializes the Hinge2-Joint
     * @param jointData The joint data for the Hinge2-Joint
     */
    constructor(jointData) {
        super(PhysicsJoint.Hinge2Joint, jointData);
    }
    /**
     * Set the motor values.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param targetSpeed the speed the motor is to reach
     * @param maxForce max force for this motor.
     * @param motorIndex motor's index, 0 or 1.
     */
    setMotor(targetSpeed, maxForce, motorIndex = 0) {
        this._physicsPlugin.setMotor(this, targetSpeed || 0, maxForce, motorIndex);
    }
    /**
     * Set the motor limits.
     * Attention, this function is plugin specific. Engines won't react 100% the same.
     * @param upperLimit the upper limit
     * @param lowerLimit lower limit
     * @param motorIndex the motor's index, 0 or 1.
     */
    setLimit(upperLimit, lowerLimit, motorIndex = 0) {
        this._physicsPlugin.setLimit(this, upperLimit, lowerLimit, motorIndex);
    }
}
//# sourceMappingURL=physicsJoint.js.map