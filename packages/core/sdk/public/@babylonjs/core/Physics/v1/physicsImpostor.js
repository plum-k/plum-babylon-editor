import { Logger } from "../../Misc/logger.js";
import { BuildArray } from "../../Misc/arrayTools.js";
import { Vector3, Quaternion } from "../../Maths/math.vector.js";
import { AbstractMesh } from "../../Meshes/abstractMesh.js";
import { Mesh } from "../../Meshes/mesh.js";
import { PhysicsJoint } from "./physicsJoint.js";
Mesh._PhysicsImpostorParser = function (scene, physicObject, jsonObject) {
    return new PhysicsImpostor(physicObject, jsonObject.physicsImpostor, {
        mass: jsonObject.physicsMass,
        friction: jsonObject.physicsFriction,
        restitution: jsonObject.physicsRestitution,
    }, scene);
};
/**
 * Represents a physics imposter
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsImpostor {
    /**
     * Specifies if the physics imposter is disposed
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Gets the mass of the physics imposter
     */
    get mass() {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyMass(this) : 0;
    }
    set mass(value) {
        this.setMass(value);
    }
    /**
     * Gets the coefficient of friction
     */
    get friction() {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyFriction(this) : 0;
    }
    /**
     * Sets the coefficient of friction
     */
    set friction(value) {
        if (!this._physicsEngine) {
            return;
        }
        this._physicsEngine.getPhysicsPlugin().setBodyFriction(this, value);
    }
    /**
     * Gets the coefficient of restitution
     */
    get restitution() {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyRestitution(this) : 0;
    }
    /**
     * Sets the coefficient of restitution
     */
    set restitution(value) {
        if (!this._physicsEngine) {
            return;
        }
        this._physicsEngine.getPhysicsPlugin().setBodyRestitution(this, value);
    }
    /**
     * Gets the pressure of a soft body; only supported by the AmmoJSPlugin
     */
    get pressure() {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyPressure) {
            return 0;
        }
        return plugin.getBodyPressure(this);
    }
    /**
     * Sets the pressure of a soft body; only supported by the AmmoJSPlugin
     */
    set pressure(value) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyPressure) {
            return;
        }
        plugin.setBodyPressure(this, value);
    }
    /**
     * Gets the stiffness of a soft body; only supported by the AmmoJSPlugin
     */
    get stiffness() {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.getBodyStiffness) {
            return 0;
        }
        return plugin.getBodyStiffness(this);
    }
    /**
     * Sets the stiffness of a soft body; only supported by the AmmoJSPlugin
     */
    set stiffness(value) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyStiffness) {
            return;
        }
        plugin.setBodyStiffness(this, value);
    }
    /**
     * Gets the velocityIterations of a soft body; only supported by the AmmoJSPlugin
     */
    get velocityIterations() {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.getBodyVelocityIterations) {
            return 0;
        }
        return plugin.getBodyVelocityIterations(this);
    }
    /**
     * Sets the velocityIterations of a soft body; only supported by the AmmoJSPlugin
     */
    set velocityIterations(value) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyVelocityIterations) {
            return;
        }
        plugin.setBodyVelocityIterations(this, value);
    }
    /**
     * Gets the positionIterations of a soft body; only supported by the AmmoJSPlugin
     */
    get positionIterations() {
        if (!this._physicsEngine) {
            return 0;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.getBodyPositionIterations) {
            return 0;
        }
        return plugin.getBodyPositionIterations(this);
    }
    /**
     * Sets the positionIterations of a soft body; only supported by the AmmoJSPlugin
     */
    set positionIterations(value) {
        if (!this._physicsEngine) {
            return;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.setBodyPositionIterations) {
            return;
        }
        plugin.setBodyPositionIterations(this, value);
    }
    /**
     * Initializes the physics imposter
     * @param object The physics-enabled object used as the physics imposter
     * @param type The type of the physics imposter. Types are available as static members of this class.
     * @param _options The options for the physics imposter
     * @param _scene The Babylon scene
     */
    constructor(
    /**
     * The physics-enabled object used as the physics imposter
     */
    object, 
    /**
     * The type of the physics imposter
     */
    type, _options = { mass: 0 }, _scene) {
        this.object = object;
        this.type = type;
        this._options = _options;
        this._scene = _scene;
        /** @internal */
        this._pluginData = {};
        this._bodyUpdateRequired = false;
        this._onBeforePhysicsStepCallbacks = new Array();
        this._onAfterPhysicsStepCallbacks = new Array();
        /** @internal */
        this._onPhysicsCollideCallbacks = [];
        this._deltaPosition = Vector3.Zero();
        this._isDisposed = false;
        /**
         * @internal
         */
        this.soft = false;
        /**
         * @internal
         */
        this.segments = 0;
        //temp variables for parent rotation calculations
        //private _mats: Array<Matrix> = [new Matrix(), new Matrix()];
        this._tmpQuat = new Quaternion();
        this._tmpQuat2 = new Quaternion();
        /**
         * this function is executed by the physics engine.
         */
        this.beforeStep = () => {
            if (!this._physicsEngine) {
                return;
            }
            this.object.translate(this._deltaPosition, -1);
            this._deltaRotationConjugated &&
                this.object.rotationQuaternion &&
                this.object.rotationQuaternion.multiplyToRef(this._deltaRotationConjugated, this.object.rotationQuaternion);
            this.object.computeWorldMatrix(false);
            if (this.object.parent && this.object.rotationQuaternion) {
                this.getParentsRotation();
                this._tmpQuat.multiplyToRef(this.object.rotationQuaternion, this._tmpQuat);
            }
            else {
                this._tmpQuat.copyFrom(this.object.rotationQuaternion || new Quaternion());
            }
            if (!this._options.disableBidirectionalTransformation) {
                this.object.rotationQuaternion &&
                    this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(this, /*bInfo.boundingBox.centerWorld*/ this.object.getAbsolutePosition(), this._tmpQuat);
            }
            this._onBeforePhysicsStepCallbacks.forEach((func) => {
                func(this);
            });
        };
        /**
         * this function is executed by the physics engine
         */
        this.afterStep = () => {
            if (!this._physicsEngine) {
                return;
            }
            this._onAfterPhysicsStepCallbacks.forEach((func) => {
                func(this);
            });
            this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(this);
            // object has now its world rotation. needs to be converted to local.
            if (this.object.parent && this.object.rotationQuaternion) {
                this.getParentsRotation();
                this._tmpQuat.conjugateInPlace();
                this._tmpQuat.multiplyToRef(this.object.rotationQuaternion, this.object.rotationQuaternion);
            }
            // take the position set and make it the absolute position of this object.
            this.object.setAbsolutePosition(this.object.position);
            if (this._deltaRotation) {
                this.object.rotationQuaternion && this.object.rotationQuaternion.multiplyToRef(this._deltaRotation, this.object.rotationQuaternion);
                this._deltaPosition.applyRotationQuaternionToRef(this._deltaRotation, PhysicsImpostor._TmpVecs[0]);
                this.object.translate(PhysicsImpostor._TmpVecs[0], 1);
            }
            else {
                this.object.translate(this._deltaPosition, 1);
            }
            this.object.computeWorldMatrix(true);
        };
        /**
         * Legacy collision detection event support
         */
        this.onCollideEvent = null;
        /**
         *  define an onCollide function to call when this impostor collides against a different body
         * @param e collide event data
         */
        this.onCollide = (e) => {
            if (!this._onPhysicsCollideCallbacks.length && !this.onCollideEvent) {
                return;
            }
            if (!this._physicsEngine) {
                return;
            }
            const otherImpostor = this._physicsEngine.getImpostorWithPhysicsBody(e.body);
            if (otherImpostor) {
                // Legacy collision detection event support
                if (this.onCollideEvent) {
                    this.onCollideEvent(this, otherImpostor);
                }
                this._onPhysicsCollideCallbacks
                    .filter((obj) => {
                    return obj.otherImpostors.indexOf(otherImpostor) !== -1;
                })
                    .forEach((obj) => {
                    obj.callback(this, otherImpostor, e.point, e.distance, e.impulse, e.normal);
                });
            }
        };
        //sanity check!
        if (!this.object) {
            Logger.Error("No object was provided. A physics object is obligatory");
            return;
        }
        if (this.object.parent && _options.mass !== 0) {
            Logger.Warn("A physics impostor has been created for an object which has a parent. Babylon physics currently works in local space so unexpected issues may occur.");
        }
        // Legacy support for old syntax.
        if (!this._scene && object.getScene) {
            this._scene = object.getScene();
        }
        if (!this._scene) {
            return;
        }
        if (this.type > 100) {
            this.soft = true;
        }
        this._physicsEngine = this._scene.getPhysicsEngine();
        if (!this._physicsEngine) {
            Logger.Error("Physics not enabled. Please use scene.enablePhysics(...) before creating impostors.");
        }
        else {
            //set the object's quaternion, if not set
            if (!this.object.rotationQuaternion) {
                if (this.object.rotation) {
                    this.object.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.object.rotation.y, this.object.rotation.x, this.object.rotation.z);
                }
                else {
                    this.object.rotationQuaternion = new Quaternion();
                }
            }
            //default options params
            this._options.mass = _options.mass === void 0 ? 0 : _options.mass;
            this._options.friction = _options.friction === void 0 ? 0.2 : _options.friction;
            this._options.restitution = _options.restitution === void 0 ? 0.2 : _options.restitution;
            if (this.soft) {
                //softbody mass must be above 0;
                this._options.mass = this._options.mass > 0 ? this._options.mass : 1;
                this._options.pressure = _options.pressure === void 0 ? 200 : _options.pressure;
                this._options.stiffness = _options.stiffness === void 0 ? 1 : _options.stiffness;
                this._options.velocityIterations = _options.velocityIterations === void 0 ? 20 : _options.velocityIterations;
                this._options.positionIterations = _options.positionIterations === void 0 ? 20 : _options.positionIterations;
                this._options.fixedPoints = _options.fixedPoints === void 0 ? 0 : _options.fixedPoints;
                this._options.margin = _options.margin === void 0 ? 0 : _options.margin;
                this._options.damping = _options.damping === void 0 ? 0 : _options.damping;
                this._options.path = _options.path === void 0 ? null : _options.path;
                this._options.shape = _options.shape === void 0 ? null : _options.shape;
            }
            this._joints = [];
            //If the mesh has a parent, don't initialize the physicsBody. Instead wait for the parent to do that.
            if (!this.object.parent || this._options.ignoreParent) {
                this._init();
            }
            else if (this.object.parent.physicsImpostor) {
                Logger.Warn("You must affect impostors to children before affecting impostor to parent.");
            }
        }
    }
    /**
     * This function will completely initialize this impostor.
     * It will create a new body - but only if this mesh has no parent.
     * If it has, this impostor will not be used other than to define the impostor
     * of the child mesh.
     * @internal
     */
    _init() {
        if (!this._physicsEngine) {
            return;
        }
        this._physicsEngine.removeImpostor(this);
        this.physicsBody = null;
        this._parent = this._parent || this._getPhysicsParent();
        if (!this._isDisposed && (!this.parent || this._options.ignoreParent)) {
            this._physicsEngine.addImpostor(this);
        }
    }
    _getPhysicsParent() {
        if (this.object.parent instanceof AbstractMesh) {
            const parentMesh = this.object.parent;
            return parentMesh.physicsImpostor;
        }
        return null;
    }
    /**
     * Should a new body be generated.
     * @returns boolean specifying if body initialization is required
     */
    isBodyInitRequired() {
        return this._bodyUpdateRequired || (!this._physicsBody && (!this._parent || !!this._options.ignoreParent));
    }
    /**
     * Sets the updated scaling
     */
    setScalingUpdated() {
        this.forceUpdate();
    }
    /**
     * Force a regeneration of this or the parent's impostor's body.
     * Use with caution - This will remove all previously-instantiated joints.
     */
    forceUpdate() {
        this._init();
        if (this.parent && !this._options.ignoreParent) {
            this.parent.forceUpdate();
        }
    }
    /*public get mesh(): AbstractMesh {
        return this._mesh;
    }*/
    /**
     * Gets the body that holds this impostor. Either its own, or its parent.
     */
    get physicsBody() {
        return this._parent && !this._options.ignoreParent ? this._parent.physicsBody : this._physicsBody;
    }
    /**
     * Get the parent of the physics imposter
     * @returns Physics imposter or null
     */
    get parent() {
        return !this._options.ignoreParent && this._parent ? this._parent : null;
    }
    /**
     * Sets the parent of the physics imposter
     */
    set parent(value) {
        this._parent = value;
    }
    /**
     * Set the physics body. Used mainly by the physics engine/plugin
     */
    set physicsBody(physicsBody) {
        if (this._physicsBody && this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().removePhysicsBody(this);
        }
        this._physicsBody = physicsBody;
        this.resetUpdateFlags();
    }
    /**
     * Resets the update flags
     */
    resetUpdateFlags() {
        this._bodyUpdateRequired = false;
    }
    /**
     * Gets the object extents
     * @returns the object extents
     */
    getObjectExtents() {
        if (this.object.getBoundingInfo) {
            const q = this.object.rotationQuaternion;
            const scaling = this.object.scaling.clone();
            //reset rotation
            this.object.rotationQuaternion = PhysicsImpostor.IDENTITY_QUATERNION;
            //calculate the world matrix with no rotation
            const worldMatrix = this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
            if (worldMatrix) {
                worldMatrix.decompose(scaling, undefined, undefined);
            }
            const boundingInfo = this.object.getBoundingInfo();
            // get the global scaling of the object
            const size = boundingInfo.boundingBox.extendSize.scale(2).multiplyInPlace(scaling);
            size.x = Math.abs(size.x);
            size.y = Math.abs(size.y);
            size.z = Math.abs(size.z);
            //bring back the rotation
            this.object.rotationQuaternion = q;
            //calculate the world matrix with the new rotation
            this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
            return size;
        }
        else {
            return PhysicsImpostor.DEFAULT_OBJECT_SIZE;
        }
    }
    /**
     * Gets the object center
     * @returns The object center
     */
    getObjectCenter() {
        if (this.object.getBoundingInfo) {
            const boundingInfo = this.object.getBoundingInfo();
            return boundingInfo.boundingBox.centerWorld;
        }
        else {
            return this.object.position;
        }
    }
    /**
     * Get a specific parameter from the options parameters
     * @param paramName The object parameter name
     * @returns The object parameter
     */
    getParam(paramName) {
        return this._options[paramName];
    }
    /**
     * Sets a specific parameter in the options given to the physics plugin
     * @param paramName The parameter name
     * @param value The value of the parameter
     */
    setParam(paramName, value) {
        this._options[paramName] = value;
        this._bodyUpdateRequired = true;
    }
    /**
     * Specifically change the body's mass. Won't recreate the physics body object
     * @param mass The mass of the physics imposter
     */
    setMass(mass) {
        if (this.getParam("mass") !== mass) {
            this.setParam("mass", mass);
        }
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().setBodyMass(this, mass);
        }
    }
    /**
     * Gets the linear velocity
     * @returns  linear velocity or null
     */
    getLinearVelocity() {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this) : Vector3.Zero();
    }
    /**
     * Sets the linear velocity
     * @param velocity  linear velocity or null
     */
    setLinearVelocity(velocity) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
        }
    }
    /**
     * Gets the angular velocity
     * @returns angular velocity or null
     */
    getAngularVelocity() {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this) : Vector3.Zero();
    }
    /**
     * Sets the angular velocity
     * @param velocity The velocity or null
     */
    setAngularVelocity(velocity) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, velocity);
        }
    }
    /**
     * Execute a function with the physics plugin native code
     * Provide a function the will have two variables - the world object and the physics body object
     * @param func The function to execute with the physics plugin native code
     */
    executeNativeFunction(func) {
        if (this._physicsEngine) {
            func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
        }
    }
    /**
     * Register a function that will be executed before the physics world is stepping forward
     * @param func The function to execute before the physics world is stepped forward
     */
    registerBeforePhysicsStep(func) {
        this._onBeforePhysicsStepCallbacks.push(func);
    }
    /**
     * Unregister a function that will be executed before the physics world is stepping forward
     * @param func The function to execute before the physics world is stepped forward
     */
    unregisterBeforePhysicsStep(func) {
        const index = this._onBeforePhysicsStepCallbacks.indexOf(func);
        if (index > -1) {
            this._onBeforePhysicsStepCallbacks.splice(index, 1);
        }
        else {
            Logger.Warn("Function to remove was not found");
        }
    }
    /**
     * Register a function that will be executed after the physics step
     * @param func The function to execute after physics step
     */
    registerAfterPhysicsStep(func) {
        this._onAfterPhysicsStepCallbacks.push(func);
    }
    /**
     * Unregisters a function that will be executed after the physics step
     * @param func The function to execute after physics step
     */
    unregisterAfterPhysicsStep(func) {
        const index = this._onAfterPhysicsStepCallbacks.indexOf(func);
        if (index > -1) {
            this._onAfterPhysicsStepCallbacks.splice(index, 1);
        }
        else {
            Logger.Warn("Function to remove was not found");
        }
    }
    /**
     * register a function that will be executed when this impostor collides against a different body
     * @param collideAgainst Physics imposter, or array of physics imposters to collide against
     * @param func Callback that is executed on collision
     */
    registerOnPhysicsCollide(collideAgainst, func) {
        const collidedAgainstList = collideAgainst instanceof Array ? collideAgainst : [collideAgainst];
        this._onPhysicsCollideCallbacks.push({ callback: func, otherImpostors: collidedAgainstList });
    }
    /**
     * Unregisters the physics imposter's collision callback
     * @param collideAgainst The physics object to collide against
     * @param func Callback to execute on collision
     */
    unregisterOnPhysicsCollide(collideAgainst, func) {
        const collidedAgainstList = collideAgainst instanceof Array ? collideAgainst : [collideAgainst];
        let index = -1;
        const found = this._onPhysicsCollideCallbacks.some((cbDef, idx) => {
            if (cbDef.callback === func && cbDef.otherImpostors.length === collidedAgainstList.length) {
                // chcek the arrays match
                const sameList = cbDef.otherImpostors.every((impostor) => {
                    return collidedAgainstList.indexOf(impostor) > -1;
                });
                if (sameList) {
                    index = idx;
                }
                return sameList;
            }
            return false;
        });
        if (found) {
            this._onPhysicsCollideCallbacks.splice(index, 1);
        }
        else {
            Logger.Warn("Function to remove was not found");
        }
    }
    /**
     * Get the parent rotation
     * @returns The parent rotation
     */
    getParentsRotation() {
        let parent = this.object.parent;
        this._tmpQuat.copyFromFloats(0, 0, 0, 1);
        while (parent) {
            if (parent.rotationQuaternion) {
                this._tmpQuat2.copyFrom(parent.rotationQuaternion);
            }
            else {
                Quaternion.RotationYawPitchRollToRef(parent.rotation.y, parent.rotation.x, parent.rotation.z, this._tmpQuat2);
            }
            this._tmpQuat.multiplyToRef(this._tmpQuat2, this._tmpQuat);
            parent = parent.parent;
        }
        return this._tmpQuat;
    }
    /**
     * Apply a force
     * @param force The force to apply
     * @param contactPoint The contact point for the force
     * @returns The physics imposter
     */
    applyForce(force, contactPoint) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
        }
        return this;
    }
    /**
     * Apply an impulse
     * @param force The impulse force
     * @param contactPoint The contact point for the impulse force
     * @returns The physics imposter
     */
    applyImpulse(force, contactPoint) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
        }
        return this;
    }
    /**
     * A help function to create a joint
     * @param otherImpostor A physics imposter used to create a joint
     * @param jointType The type of joint
     * @param jointData The data for the joint
     * @returns The physics imposter
     */
    createJoint(otherImpostor, jointType, jointData) {
        const joint = new PhysicsJoint(jointType, jointData);
        this.addJoint(otherImpostor, joint);
        return this;
    }
    /**
     * Add a joint to this impostor with a different impostor
     * @param otherImpostor A physics imposter used to add a joint
     * @param joint The joint to add
     * @returns The physics imposter
     */
    addJoint(otherImpostor, joint) {
        this._joints.push({
            otherImpostor: otherImpostor,
            joint: joint,
        });
        if (this._physicsEngine) {
            this._physicsEngine.addJoint(this, otherImpostor, joint);
        }
        return this;
    }
    /**
     * Add an anchor to a cloth impostor
     * @param otherImpostor rigid impostor to anchor to
     * @param width ratio across width from 0 to 1
     * @param height ratio up height from 0 to 1
     * @param influence the elasticity between cloth impostor and anchor from 0, very stretchy to 1, little stretch
     * @param noCollisionBetweenLinkedBodies when true collisions between cloth impostor and anchor are ignored; default false
     * @returns impostor the soft imposter
     */
    addAnchor(otherImpostor, width, height, influence, noCollisionBetweenLinkedBodies) {
        if (!this._physicsEngine) {
            return this;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.appendAnchor) {
            return this;
        }
        if (this._physicsEngine) {
            plugin.appendAnchor(this, otherImpostor, width, height, influence, noCollisionBetweenLinkedBodies);
        }
        return this;
    }
    /**
     * Add a hook to a rope impostor
     * @param otherImpostor rigid impostor to anchor to
     * @param length ratio across rope from 0 to 1
     * @param influence the elasticity between rope impostor and anchor from 0, very stretchy to 1, little stretch
     * @param noCollisionBetweenLinkedBodies when true collisions between soft impostor and anchor are ignored; default false
     * @returns impostor the rope imposter
     */
    addHook(otherImpostor, length, influence, noCollisionBetweenLinkedBodies) {
        if (!this._physicsEngine) {
            return this;
        }
        const plugin = this._physicsEngine.getPhysicsPlugin();
        if (!plugin.appendAnchor) {
            return this;
        }
        if (this._physicsEngine) {
            plugin.appendHook(this, otherImpostor, length, influence, noCollisionBetweenLinkedBodies);
        }
        return this;
    }
    /**
     * Will keep this body still, in a sleep mode.
     * @returns the physics imposter
     */
    sleep() {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().sleepBody(this);
        }
        return this;
    }
    /**
     * Wake the body up.
     * @returns The physics imposter
     */
    wakeUp() {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().wakeUpBody(this);
        }
        return this;
    }
    /**
     * Clones the physics imposter
     * @param newObject The physics imposter clones to this physics-enabled object
     * @returns A nullable physics imposter
     */
    clone(newObject) {
        if (!newObject) {
            return null;
        }
        return new PhysicsImpostor(newObject, this.type, this._options, this._scene);
    }
    /**
     * Disposes the physics imposter
     */
    dispose( /*disposeChildren: boolean = true*/) {
        //no dispose if no physics engine is available.
        if (!this._physicsEngine) {
            return;
        }
        this._joints.forEach((j) => {
            if (this._physicsEngine) {
                this._physicsEngine.removeJoint(this, j.otherImpostor, j.joint);
            }
        });
        //dispose the physics body
        this._physicsEngine.removeImpostor(this);
        if (this.parent) {
            this.parent.forceUpdate();
        }
        else {
            /*this._object.getChildMeshes().forEach(function(mesh) {
                if (mesh.physicsImpostor) {
                    if (disposeChildren) {
                        mesh.physicsImpostor.dispose();
                        mesh.physicsImpostor = null;
                    }
                }
            })*/
        }
        this._isDisposed = true;
    }
    /**
     * Sets the delta position
     * @param position The delta position amount
     */
    setDeltaPosition(position) {
        this._deltaPosition.copyFrom(position);
    }
    /**
     * Sets the delta rotation
     * @param rotation The delta rotation amount
     */
    setDeltaRotation(rotation) {
        if (!this._deltaRotation) {
            this._deltaRotation = new Quaternion();
        }
        this._deltaRotation.copyFrom(rotation);
        this._deltaRotationConjugated = this._deltaRotation.conjugate();
    }
    /**
     * Gets the box size of the physics imposter and stores the result in the input parameter
     * @param result Stores the box size
     * @returns The physics imposter
     */
    getBoxSizeToRef(result) {
        if (this._physicsEngine) {
            this._physicsEngine.getPhysicsPlugin().getBoxSizeToRef(this, result);
        }
        return this;
    }
    /**
     * Gets the radius of the physics imposter
     * @returns Radius of the physics imposter
     */
    getRadius() {
        return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getRadius(this) : 0;
    }
    /**
     * Sync a bone with this impostor
     * @param bone The bone to sync to the impostor.
     * @param boneMesh The mesh that the bone is influencing.
     * @param jointPivot The pivot of the joint / bone in local space.
     * @param distToJoint Optional distance from the impostor to the joint.
     * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
     */
    syncBoneWithImpostor(bone, boneMesh, jointPivot, distToJoint, adjustRotation) {
        const tempVec = PhysicsImpostor._TmpVecs[0];
        const mesh = this.object;
        if (mesh.rotationQuaternion) {
            if (adjustRotation) {
                const tempQuat = PhysicsImpostor._TmpQuat;
                mesh.rotationQuaternion.multiplyToRef(adjustRotation, tempQuat);
                bone.setRotationQuaternion(tempQuat, 1 /* Space.WORLD */, boneMesh);
            }
            else {
                bone.setRotationQuaternion(mesh.rotationQuaternion, 1 /* Space.WORLD */, boneMesh);
            }
        }
        tempVec.x = 0;
        tempVec.y = 0;
        tempVec.z = 0;
        if (jointPivot) {
            tempVec.x = jointPivot.x;
            tempVec.y = jointPivot.y;
            tempVec.z = jointPivot.z;
            bone.getDirectionToRef(tempVec, boneMesh, tempVec);
            if (distToJoint === undefined || distToJoint === null) {
                distToJoint = jointPivot.length();
            }
            tempVec.x *= distToJoint;
            tempVec.y *= distToJoint;
            tempVec.z *= distToJoint;
        }
        if (bone.getParent()) {
            tempVec.addInPlace(mesh.getAbsolutePosition());
            bone.setAbsolutePosition(tempVec, boneMesh);
        }
        else {
            boneMesh.setAbsolutePosition(mesh.getAbsolutePosition());
            boneMesh.position.x -= tempVec.x;
            boneMesh.position.y -= tempVec.y;
            boneMesh.position.z -= tempVec.z;
        }
    }
    /**
     * Sync impostor to a bone
     * @param bone The bone that the impostor will be synced to.
     * @param boneMesh The mesh that the bone is influencing.
     * @param jointPivot The pivot of the joint / bone in local space.
     * @param distToJoint Optional distance from the impostor to the joint.
     * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
     * @param boneAxis Optional vector3 axis the bone is aligned with
     */
    syncImpostorWithBone(bone, boneMesh, jointPivot, distToJoint, adjustRotation, boneAxis) {
        const mesh = this.object;
        if (mesh.rotationQuaternion) {
            if (adjustRotation) {
                const tempQuat = PhysicsImpostor._TmpQuat;
                bone.getRotationQuaternionToRef(1 /* Space.WORLD */, boneMesh, tempQuat);
                tempQuat.multiplyToRef(adjustRotation, mesh.rotationQuaternion);
            }
            else {
                bone.getRotationQuaternionToRef(1 /* Space.WORLD */, boneMesh, mesh.rotationQuaternion);
            }
        }
        const pos = PhysicsImpostor._TmpVecs[0];
        const boneDir = PhysicsImpostor._TmpVecs[1];
        if (!boneAxis) {
            boneAxis = PhysicsImpostor._TmpVecs[2];
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
}
/**
 * The default object size of the imposter
 */
PhysicsImpostor.DEFAULT_OBJECT_SIZE = new Vector3(1, 1, 1);
/**
 * The identity quaternion of the imposter
 */
PhysicsImpostor.IDENTITY_QUATERNION = Quaternion.Identity();
PhysicsImpostor._TmpVecs = BuildArray(3, Vector3.Zero);
PhysicsImpostor._TmpQuat = Quaternion.Identity();
//Impostor types
/**
 * No-Imposter type
 */
PhysicsImpostor.NoImpostor = 0;
/**
 * Sphere-Imposter type
 */
PhysicsImpostor.SphereImpostor = 1;
/**
 * Box-Imposter type
 */
PhysicsImpostor.BoxImpostor = 2;
/**
 * Plane-Imposter type
 */
PhysicsImpostor.PlaneImpostor = 3;
/**
 * Mesh-imposter type (Only available to objects with vertices data)
 */
PhysicsImpostor.MeshImpostor = 4;
/**
 * Capsule-Impostor type (Ammo.js plugin only)
 */
PhysicsImpostor.CapsuleImpostor = 6;
/**
 * Cylinder-Imposter type
 */
PhysicsImpostor.CylinderImpostor = 7;
/**
 * Particle-Imposter type
 */
PhysicsImpostor.ParticleImpostor = 8;
/**
 * Heightmap-Imposter type
 */
PhysicsImpostor.HeightmapImpostor = 9;
/**
 * ConvexHull-Impostor type (Ammo.js plugin only)
 */
PhysicsImpostor.ConvexHullImpostor = 10;
/**
 * Custom-Imposter type (Ammo.js plugin only)
 */
PhysicsImpostor.CustomImpostor = 100;
/**
 * Rope-Imposter type
 */
PhysicsImpostor.RopeImpostor = 101;
/**
 * Cloth-Imposter type
 */
PhysicsImpostor.ClothImpostor = 102;
/**
 * Softbody-Imposter type
 */
PhysicsImpostor.SoftbodyImpostor = 103;
//# sourceMappingURL=physicsImpostor.js.map