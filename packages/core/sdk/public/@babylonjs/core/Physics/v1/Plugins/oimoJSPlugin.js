import { PhysicsImpostor } from "../physicsImpostor.js";
import { PhysicsJoint } from "../physicsJoint.js";
import { Vector3, Quaternion } from "../../../Maths/math.vector.js";
import { Logger } from "../../../Misc/logger.js";
import { PhysicsRaycastResult } from "../../physicsRaycastResult.js";
import { Epsilon } from "../../../Maths/math.constants.js";
/** @internal */
export class OimoJSPlugin {
    constructor(_useDeltaForWorldStep = true, iterations, oimoInjection = OIMO) {
        this._useDeltaForWorldStep = _useDeltaForWorldStep;
        this.name = "OimoJSPlugin";
        this._fixedTimeStep = 1 / 60;
        this._tmpImpostorsArray = [];
        this._tmpPositionVector = Vector3.Zero();
        this.BJSOIMO = oimoInjection;
        this.world = new this.BJSOIMO.World({
            iterations: iterations,
        });
        this.world.clear();
        this._raycastResult = new PhysicsRaycastResult();
    }
    /**
     *
     * @returns plugin version
     */
    getPluginVersion() {
        return 1;
    }
    setGravity(gravity) {
        this.world.gravity.set(gravity.x, gravity.y, gravity.z);
    }
    setTimeStep(timeStep) {
        this.world.timeStep = timeStep;
    }
    getTimeStep() {
        return this.world.timeStep;
    }
    executeStep(delta, impostors) {
        impostors.forEach(function (impostor) {
            impostor.beforeStep();
        });
        this.world.timeStep = this._useDeltaForWorldStep ? delta : this._fixedTimeStep;
        this.world.step();
        impostors.forEach((impostor) => {
            impostor.afterStep();
            //update the ordered impostors array
            this._tmpImpostorsArray[impostor.uniqueId] = impostor;
        });
        //check for collisions
        let contact = this.world.contacts;
        while (contact !== null) {
            if (contact.touching && !contact.body1.sleeping && !contact.body2.sleeping) {
                contact = contact.next;
                continue;
            }
            //is this body colliding with any other? get the impostor
            const mainImpostor = this._tmpImpostorsArray[+contact.body1.name];
            const collidingImpostor = this._tmpImpostorsArray[+contact.body2.name];
            if (!mainImpostor || !collidingImpostor) {
                contact = contact.next;
                continue;
            }
            mainImpostor.onCollide({ body: collidingImpostor.physicsBody, point: null, distance: 0, impulse: 0, normal: null });
            collidingImpostor.onCollide({ body: mainImpostor.physicsBody, point: null, distance: 0, impulse: 0, normal: null });
            contact = contact.next;
        }
    }
    applyImpulse(impostor, force, contactPoint) {
        const mass = impostor.physicsBody.mass;
        impostor.physicsBody.applyImpulse(contactPoint.scale(this.world.invScale), force.scale(this.world.invScale * mass));
    }
    applyForce(impostor, force, contactPoint) {
        Logger.Warn("Oimo doesn't support applying force. Using impulse instead.");
        this.applyImpulse(impostor, force, contactPoint);
    }
    generatePhysicsBody(impostor) {
        //parent-child relationship. Does this impostor has a parent impostor?
        if (impostor.parent) {
            if (impostor.physicsBody) {
                this.removePhysicsBody(impostor);
                //TODO is that needed?
                impostor.forceUpdate();
            }
            return;
        }
        if (impostor.isBodyInitRequired()) {
            const bodyConfig = {
                name: impostor.uniqueId,
                //Oimo must have mass, also for static objects.
                config: [impostor.getParam("mass") || 0.001, impostor.getParam("friction"), impostor.getParam("restitution")],
                size: [],
                type: [],
                pos: [],
                posShape: [],
                rot: [],
                rotShape: [],
                move: impostor.getParam("mass") !== 0,
                density: impostor.getParam("mass"),
                friction: impostor.getParam("friction"),
                restitution: impostor.getParam("restitution"),
                //Supporting older versions of Oimo
                world: this.world,
            };
            const impostors = [impostor];
            const addToArray = (parent) => {
                if (!parent.getChildMeshes) {
                    return;
                }
                parent.getChildMeshes().forEach(function (m) {
                    if (m.physicsImpostor) {
                        impostors.push(m.physicsImpostor);
                        //m.physicsImpostor._init();
                    }
                });
            };
            addToArray(impostor.object);
            const checkWithEpsilon = (value) => {
                return Math.max(value, Epsilon);
            };
            const globalQuaternion = new Quaternion();
            impostors.forEach((i) => {
                if (!i.object.rotationQuaternion) {
                    return;
                }
                //get the correct bounding box
                const oldQuaternion = i.object.rotationQuaternion;
                globalQuaternion.copyFrom(oldQuaternion);
                i.object.rotationQuaternion.set(0, 0, 0, 1);
                i.object.computeWorldMatrix(true);
                const rot = globalQuaternion.toEulerAngles();
                const impostorExtents = i.getObjectExtents();
                // eslint-disable-next-line no-loss-of-precision
                const radToDeg = 57.295779513082320876;
                if (i === impostor) {
                    const center = impostor.getObjectCenter();
                    impostor.object.getAbsolutePivotPoint().subtractToRef(center, this._tmpPositionVector);
                    this._tmpPositionVector.divideInPlace(impostor.object.scaling);
                    //Can also use Array.prototype.push.apply
                    bodyConfig.pos.push(center.x);
                    bodyConfig.pos.push(center.y);
                    bodyConfig.pos.push(center.z);
                    bodyConfig.posShape.push(0, 0, 0);
                    bodyConfig.rotShape.push(0, 0, 0);
                }
                else {
                    const localPosition = i.object.position.clone();
                    bodyConfig.posShape.push(localPosition.x);
                    bodyConfig.posShape.push(localPosition.y);
                    bodyConfig.posShape.push(localPosition.z);
                    // bodyConfig.pos.push(0, 0, 0);
                    bodyConfig.rotShape.push(rot.x * radToDeg, rot.y * radToDeg, rot.z * radToDeg);
                }
                i.object.rotationQuaternion.copyFrom(globalQuaternion);
                // register mesh
                switch (i.type) {
                    case PhysicsImpostor.ParticleImpostor:
                        Logger.Warn("No Particle support in OIMO.js. using SphereImpostor instead");
                    // eslint-disable-next-line no-fallthrough
                    case PhysicsImpostor.SphereImpostor: {
                        const radiusX = impostorExtents.x;
                        const radiusY = impostorExtents.y;
                        const radiusZ = impostorExtents.z;
                        const size = Math.max(checkWithEpsilon(radiusX), checkWithEpsilon(radiusY), checkWithEpsilon(radiusZ)) / 2;
                        bodyConfig.type.push("sphere");
                        //due to the way oimo works with compounds, add 3 times
                        bodyConfig.size.push(size);
                        bodyConfig.size.push(size);
                        bodyConfig.size.push(size);
                        break;
                    }
                    case PhysicsImpostor.CylinderImpostor: {
                        const sizeX = checkWithEpsilon(impostorExtents.x) / 2;
                        const sizeY = checkWithEpsilon(impostorExtents.y);
                        bodyConfig.type.push("cylinder");
                        bodyConfig.size.push(sizeX);
                        bodyConfig.size.push(sizeY);
                        //due to the way oimo works with compounds, add one more value.
                        bodyConfig.size.push(sizeY);
                        break;
                    }
                    case PhysicsImpostor.PlaneImpostor:
                    case PhysicsImpostor.BoxImpostor:
                    default: {
                        const sizeX = checkWithEpsilon(impostorExtents.x);
                        const sizeY = checkWithEpsilon(impostorExtents.y);
                        const sizeZ = checkWithEpsilon(impostorExtents.z);
                        bodyConfig.type.push("box");
                        //if (i === impostor) {
                        bodyConfig.size.push(sizeX);
                        bodyConfig.size.push(sizeY);
                        bodyConfig.size.push(sizeZ);
                        //} else {
                        //    bodyConfig.size.push(0,0,0);
                        //}
                        break;
                    }
                }
                //actually not needed, but hey...
                i.object.rotationQuaternion = oldQuaternion;
            });
            impostor.physicsBody = this.world.add(bodyConfig);
            // set the quaternion, ignoring the previously defined (euler) rotation
            impostor.physicsBody.resetQuaternion(globalQuaternion);
            // update with delta 0, so the body will receive the new rotation.
            impostor.physicsBody.updatePosition(0);
        }
        else {
            this._tmpPositionVector.copyFromFloats(0, 0, 0);
        }
        impostor.setDeltaPosition(this._tmpPositionVector);
        //this._tmpPositionVector.addInPlace(impostor.mesh.getBoundingInfo().boundingBox.center);
        //this.setPhysicsBodyTransformation(impostor, this._tmpPositionVector, impostor.mesh.rotationQuaternion);
    }
    removePhysicsBody(impostor) {
        //impostor.physicsBody.dispose();
        this.world.removeRigidBody(impostor.physicsBody);
    }
    generateJoint(impostorJoint) {
        const mainBody = impostorJoint.mainImpostor.physicsBody;
        const connectedBody = impostorJoint.connectedImpostor.physicsBody;
        if (!mainBody || !connectedBody) {
            return;
        }
        const jointData = impostorJoint.joint.jointData;
        const options = jointData.nativeParams || {};
        let type;
        const nativeJointData = {
            body1: mainBody,
            body2: connectedBody,
            axe1: options.axe1 || (jointData.mainAxis ? jointData.mainAxis.asArray() : null),
            axe2: options.axe2 || (jointData.connectedAxis ? jointData.connectedAxis.asArray() : null),
            pos1: options.pos1 || (jointData.mainPivot ? jointData.mainPivot.asArray() : null),
            pos2: options.pos2 || (jointData.connectedPivot ? jointData.connectedPivot.asArray() : null),
            min: options.min,
            max: options.max,
            collision: options.collision || jointData.collision,
            spring: options.spring,
            //supporting older version of Oimo
            world: this.world,
        };
        switch (impostorJoint.joint.type) {
            case PhysicsJoint.BallAndSocketJoint:
                type = "jointBall";
                break;
            case PhysicsJoint.SpringJoint: {
                Logger.Warn("OIMO.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
                const springData = jointData;
                nativeJointData.min = springData.length || nativeJointData.min;
                //Max should also be set, just make sure it is at least min
                nativeJointData.max = Math.max(nativeJointData.min, nativeJointData.max);
            }
            // eslint-disable-next-line no-fallthrough
            case PhysicsJoint.DistanceJoint:
                type = "jointDistance";
                nativeJointData.max = jointData.maxDistance;
                break;
            case PhysicsJoint.PrismaticJoint:
                type = "jointPrisme";
                break;
            case PhysicsJoint.SliderJoint:
                type = "jointSlide";
                break;
            case PhysicsJoint.WheelJoint:
                type = "jointWheel";
                break;
            case PhysicsJoint.HingeJoint:
            default:
                type = "jointHinge";
                break;
        }
        nativeJointData.type = type;
        impostorJoint.joint.physicsJoint = this.world.add(nativeJointData);
    }
    removeJoint(impostorJoint) {
        //Bug in Oimo prevents us from disposing a joint in the playground
        //joint.joint.physicsJoint.dispose();
        //So we will bruteforce it!
        try {
            this.world.removeJoint(impostorJoint.joint.physicsJoint);
        }
        catch (e) {
            Logger.Warn(e);
        }
    }
    isSupported() {
        return this.BJSOIMO !== undefined;
    }
    setTransformationFromPhysicsBody(impostor) {
        if (!impostor.physicsBody.sleeping) {
            if (impostor.physicsBody.shapes.next) {
                let parent = impostor.physicsBody.shapes;
                while (parent.next) {
                    parent = parent.next;
                }
                impostor.object.position.set(parent.position.x, parent.position.y, parent.position.z);
            }
            else {
                const pos = impostor.physicsBody.getPosition();
                impostor.object.position.set(pos.x, pos.y, pos.z);
            }
            if (impostor.object.rotationQuaternion) {
                const quat = impostor.physicsBody.getQuaternion();
                impostor.object.rotationQuaternion.set(quat.x, quat.y, quat.z, quat.w);
            }
        }
    }
    setPhysicsBodyTransformation(impostor, newPosition, newRotation) {
        const body = impostor.physicsBody;
        // disable bidirectional for compound meshes
        if (impostor.physicsBody.shapes.next) {
            return;
        }
        body.position.set(newPosition.x, newPosition.y, newPosition.z);
        body.orientation.set(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
        body.syncShapes();
        body.awake();
    }
    /*private _getLastShape(body: any): any {
        var lastShape = body.shapes;
        while (lastShape.next) {
            lastShape = lastShape.next;
        }
        return lastShape;
    }*/
    setLinearVelocity(impostor, velocity) {
        impostor.physicsBody.linearVelocity.set(velocity.x, velocity.y, velocity.z);
    }
    setAngularVelocity(impostor, velocity) {
        impostor.physicsBody.angularVelocity.set(velocity.x, velocity.y, velocity.z);
    }
    getLinearVelocity(impostor) {
        const v = impostor.physicsBody.linearVelocity;
        if (!v) {
            return null;
        }
        return new Vector3(v.x, v.y, v.z);
    }
    getAngularVelocity(impostor) {
        const v = impostor.physicsBody.angularVelocity;
        if (!v) {
            return null;
        }
        return new Vector3(v.x, v.y, v.z);
    }
    setBodyMass(impostor, mass) {
        const staticBody = mass === 0;
        //this will actually set the body's density and not its mass.
        //But this is how oimo treats the mass variable.
        impostor.physicsBody.shapes.density = staticBody ? 1 : mass;
        impostor.physicsBody.setupMass(staticBody ? 0x2 : 0x1);
    }
    getBodyMass(impostor) {
        return impostor.physicsBody.shapes.density;
    }
    getBodyFriction(impostor) {
        return impostor.physicsBody.shapes.friction;
    }
    setBodyFriction(impostor, friction) {
        impostor.physicsBody.shapes.friction = friction;
    }
    getBodyRestitution(impostor) {
        return impostor.physicsBody.shapes.restitution;
    }
    setBodyRestitution(impostor, restitution) {
        impostor.physicsBody.shapes.restitution = restitution;
    }
    sleepBody(impostor) {
        impostor.physicsBody.sleep();
    }
    wakeUpBody(impostor) {
        impostor.physicsBody.awake();
    }
    updateDistanceJoint(joint, maxDistance, minDistance) {
        joint.physicsJoint.limitMotor.upperLimit = maxDistance;
        if (minDistance !== void 0) {
            joint.physicsJoint.limitMotor.lowerLimit = minDistance;
        }
    }
    setMotor(joint, speed, force, motorIndex) {
        if (force !== undefined) {
            Logger.Warn("OimoJS plugin currently has unexpected behavior when using setMotor with force parameter");
        }
        else {
            force = 1e6;
        }
        speed *= -1;
        //TODO separate rotational and transational motors.
        const motor = motorIndex
            ? joint.physicsJoint.rotationalLimitMotor2
            : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
        if (motor) {
            motor.setMotor(speed, force);
        }
    }
    setLimit(joint, upperLimit, lowerLimit, motorIndex) {
        //TODO separate rotational and transational motors.
        const motor = motorIndex
            ? joint.physicsJoint.rotationalLimitMotor2
            : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
        if (motor) {
            motor.setLimit(upperLimit, lowerLimit === void 0 ? -upperLimit : lowerLimit);
        }
    }
    syncMeshWithImpostor(mesh, impostor) {
        const body = impostor.physicsBody;
        mesh.position.x = body.position.x;
        mesh.position.y = body.position.y;
        mesh.position.z = body.position.z;
        if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.x = body.orientation.x;
            mesh.rotationQuaternion.y = body.orientation.y;
            mesh.rotationQuaternion.z = body.orientation.z;
            mesh.rotationQuaternion.w = body.orientation.w;
        }
    }
    getRadius(impostor) {
        return impostor.physicsBody.shapes.radius;
    }
    getBoxSizeToRef(impostor, result) {
        const shape = impostor.physicsBody.shapes;
        result.x = shape.halfWidth * 2;
        result.y = shape.halfHeight * 2;
        result.z = shape.halfDepth * 2;
    }
    dispose() {
        this.world.clear();
    }
    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    raycast(from, to) {
        Logger.Warn("raycast is not currently supported by the Oimo physics plugin");
        this._raycastResult.reset(from, to);
        return this._raycastResult;
    }
    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param result resulting PhysicsRaycastResult
     */
    raycastToRef(from, to, result) {
        Logger.Warn("raycast is not currently supported by the Oimo physics plugin");
        result.reset(from, to);
    }
}
//# sourceMappingURL=oimoJSPlugin.js.map