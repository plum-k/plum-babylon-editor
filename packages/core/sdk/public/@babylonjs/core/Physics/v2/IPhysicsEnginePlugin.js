/** How a specific axis can be constrained */
export var PhysicsConstraintAxisLimitMode;
(function (PhysicsConstraintAxisLimitMode) {
    /*
     * The axis is not restricted at all
     */
    PhysicsConstraintAxisLimitMode[PhysicsConstraintAxisLimitMode["FREE"] = 0] = "FREE";
    /*
     * The axis has a minimum/maximum limit
     */
    PhysicsConstraintAxisLimitMode[PhysicsConstraintAxisLimitMode["LIMITED"] = 1] = "LIMITED";
    /*
     * The axis allows no relative movement of the pivots
     */
    PhysicsConstraintAxisLimitMode[PhysicsConstraintAxisLimitMode["LOCKED"] = 2] = "LOCKED";
})(PhysicsConstraintAxisLimitMode || (PhysicsConstraintAxisLimitMode = {}));
/** The constraint specific axis to use when setting Friction, `ConstraintAxisLimitMode`, max force, ... */
export var PhysicsConstraintAxis;
(function (PhysicsConstraintAxis) {
    /*
     * Translation along the primary axis of the constraint (i.e. the
     * direction specified by PhysicsConstraintParameters.axisA/axisB)
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["LINEAR_X"] = 0] = "LINEAR_X";
    /*
     * Translation along the second axis of the constraint (i.e. the
     * direction specified by PhysicsConstraintParameters.perpAxisA/perpAxisB)
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["LINEAR_Y"] = 1] = "LINEAR_Y";
    /*
     * Translation along the third axis of the constraint. This axis is
     * computed from the cross product of axisA/axisB and perpAxisA/perpAxisB)
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["LINEAR_Z"] = 2] = "LINEAR_Z";
    /*
     * Rotation around the primary axis of the constraint (i.e. the
     * axis specified by PhysicsConstraintParameters.axisA/axisB)
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["ANGULAR_X"] = 3] = "ANGULAR_X";
    /*
     * Rotation around the second axis of the constraint (i.e. the
     * axis specified by PhysicsConstraintParameters.perpAxisA/perpAxisB)
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["ANGULAR_Y"] = 4] = "ANGULAR_Y";
    /*
     * Rotation around the third axis of the constraint. This axis is
     * computed from the cross product of axisA/axisB and perpAxisA/perpAxisB)
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["ANGULAR_Z"] = 5] = "ANGULAR_Z";
    /*
     * A 3D distance limit; similar to specifying the LINEAR_X/Y/Z axes
     * individually, but the distance calculation uses all three axes
     * simultaneously, instead of individually.
     */
    PhysicsConstraintAxis[PhysicsConstraintAxis["LINEAR_DISTANCE"] = 6] = "LINEAR_DISTANCE";
})(PhysicsConstraintAxis || (PhysicsConstraintAxis = {}));
/** Type of Constraint */
export var PhysicsConstraintType;
(function (PhysicsConstraintType) {
    /**
     * A ball and socket constraint will attempt to line up the pivot
     * positions in each body, and have no restrictions on rotation
     */
    PhysicsConstraintType[PhysicsConstraintType["BALL_AND_SOCKET"] = 1] = "BALL_AND_SOCKET";
    /**
     * A distance constraint will attempt to keep the pivot locations
     * within a specified distance.
     */
    PhysicsConstraintType[PhysicsConstraintType["DISTANCE"] = 2] = "DISTANCE";
    /**
     * A hinge constraint will keep the pivot positions aligned as well
     * as two angular axes. The remaining angular axis will be free to rotate.
     */
    PhysicsConstraintType[PhysicsConstraintType["HINGE"] = 3] = "HINGE";
    /**
     * A slider constraint allows bodies to translate along one axis and
     * rotate about the same axis. The remaining two axes are locked in
     * place
     */
    PhysicsConstraintType[PhysicsConstraintType["SLIDER"] = 4] = "SLIDER";
    /**
     * A lock constraint will attempt to keep the pivots completely lined
     * up between both bodies, allowing no relative movement.
     */
    PhysicsConstraintType[PhysicsConstraintType["LOCK"] = 5] = "LOCK";
    /*
     * A prismatic will lock the rotations of the bodies, and allow translation
     * only along one axis
     */
    PhysicsConstraintType[PhysicsConstraintType["PRISMATIC"] = 6] = "PRISMATIC";
    /*
     * A generic constraint; this starts with no limits on how the bodies can
     * move relative to each other, but limits can be added via the PhysicsConstraint
     * interfaces. This can be used to specify a large variety of constraints
     */
    PhysicsConstraintType[PhysicsConstraintType["SIX_DOF"] = 7] = "SIX_DOF";
})(PhysicsConstraintType || (PhysicsConstraintType = {}));
/** Type of Shape */
export var PhysicsShapeType;
(function (PhysicsShapeType) {
    PhysicsShapeType[PhysicsShapeType["SPHERE"] = 0] = "SPHERE";
    PhysicsShapeType[PhysicsShapeType["CAPSULE"] = 1] = "CAPSULE";
    PhysicsShapeType[PhysicsShapeType["CYLINDER"] = 2] = "CYLINDER";
    PhysicsShapeType[PhysicsShapeType["BOX"] = 3] = "BOX";
    PhysicsShapeType[PhysicsShapeType["CONVEX_HULL"] = 4] = "CONVEX_HULL";
    PhysicsShapeType[PhysicsShapeType["CONTAINER"] = 5] = "CONTAINER";
    PhysicsShapeType[PhysicsShapeType["MESH"] = 6] = "MESH";
    PhysicsShapeType[PhysicsShapeType["HEIGHTFIELD"] = 7] = "HEIGHTFIELD";
})(PhysicsShapeType || (PhysicsShapeType = {}));
/** Optional motor which attempts to move a body at a specific velocity, or at a specific position */
export var PhysicsConstraintMotorType;
(function (PhysicsConstraintMotorType) {
    PhysicsConstraintMotorType[PhysicsConstraintMotorType["NONE"] = 0] = "NONE";
    PhysicsConstraintMotorType[PhysicsConstraintMotorType["VELOCITY"] = 1] = "VELOCITY";
    PhysicsConstraintMotorType[PhysicsConstraintMotorType["POSITION"] = 2] = "POSITION";
})(PhysicsConstraintMotorType || (PhysicsConstraintMotorType = {}));
export var PhysicsEventType;
(function (PhysicsEventType) {
    PhysicsEventType["COLLISION_STARTED"] = "COLLISION_STARTED";
    PhysicsEventType["COLLISION_CONTINUED"] = "COLLISION_CONTINUED";
    PhysicsEventType["COLLISION_FINISHED"] = "COLLISION_FINISHED";
    PhysicsEventType["TRIGGER_ENTERED"] = "TRIGGER_ENTERED";
    PhysicsEventType["TRIGGER_EXITED"] = "TRIGGER_EXITED";
})(PhysicsEventType || (PhysicsEventType = {}));
/**
 * Indicates how the body will behave.
 */
export var PhysicsMotionType;
(function (PhysicsMotionType) {
    PhysicsMotionType[PhysicsMotionType["STATIC"] = 0] = "STATIC";
    PhysicsMotionType[PhysicsMotionType["ANIMATED"] = 1] = "ANIMATED";
    PhysicsMotionType[PhysicsMotionType["DYNAMIC"] = 2] = "DYNAMIC";
})(PhysicsMotionType || (PhysicsMotionType = {}));
/**
 * Indicates how to handle position/rotation change of transform node attached to a physics body
 */
export var PhysicsPrestepType;
(function (PhysicsPrestepType) {
    PhysicsPrestepType[PhysicsPrestepType["DISABLED"] = 0] = "DISABLED";
    PhysicsPrestepType[PhysicsPrestepType["TELEPORT"] = 1] = "TELEPORT";
    PhysicsPrestepType[PhysicsPrestepType["ACTION"] = 2] = "ACTION";
})(PhysicsPrestepType || (PhysicsPrestepType = {}));
/**
 * Controls the body sleep mode.
 */
export var PhysicsActivationControl;
(function (PhysicsActivationControl) {
    PhysicsActivationControl[PhysicsActivationControl["SIMULATION_CONTROLLED"] = 0] = "SIMULATION_CONTROLLED";
    PhysicsActivationControl[PhysicsActivationControl["ALWAYS_ACTIVE"] = 1] = "ALWAYS_ACTIVE";
    PhysicsActivationControl[PhysicsActivationControl["ALWAYS_INACTIVE"] = 2] = "ALWAYS_INACTIVE";
})(PhysicsActivationControl || (PhysicsActivationControl = {}));
//# sourceMappingURL=IPhysicsEnginePlugin.js.map