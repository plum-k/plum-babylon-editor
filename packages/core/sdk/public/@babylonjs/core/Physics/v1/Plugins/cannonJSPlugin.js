import { Logger } from "../../../Misc/logger.js";
import { Vector3, Matrix, Quaternion } from "../../../Maths/math.vector.js";
import { VertexBuffer } from "../../../Buffers/buffer.js";
import { PhysicsImpostor } from "../physicsImpostor.js";
import { PhysicsJoint } from "../physicsJoint.js";
import { PhysicsRaycastResult } from "../../physicsRaycastResult.js";
import { PhysicsEngine } from "../physicsEngine.js";
import { Epsilon } from "../../../Maths/math.constants.js";
/** @internal */
export class CannonJSPlugin {
    constructor(_useDeltaForWorldStep = true, iterations = 10, cannonInjection = CANNON) {
        this._useDeltaForWorldStep = _useDeltaForWorldStep;
        this.name = "CannonJSPlugin";
        this._physicsMaterials = new Array();
        this._fixedTimeStep = 1 / 60;
        this._physicsBodiesToRemoveAfterStep = new Array();
        this._firstFrame = true;
        this._tmpQuaternion = new Quaternion();
        this._minus90X = new Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
        this._plus90X = new Quaternion(0.7071067811865475, 0, 0, 0.7071067811865475);
        this._tmpPosition = Vector3.Zero();
        this._tmpDeltaPosition = Vector3.Zero();
        this._tmpUnityRotation = new Quaternion();
        this.BJSCANNON = cannonInjection;
        if (!this.isSupported()) {
            Logger.Error("CannonJS is not available. Please make sure you included the js file.");
            return;
        }
        this._extendNamespace();
        this.world = new this.BJSCANNON.World();
        this.world.broadphase = new this.BJSCANNON.NaiveBroadphase();
        this.world.solver.iterations = iterations;
        this._cannonRaycastResult = new this.BJSCANNON.RaycastResult();
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
        const vec = gravity;
        this.world.gravity.set(vec.x, vec.y, vec.z);
    }
    setTimeStep(timeStep) {
        this._fixedTimeStep = timeStep;
    }
    getTimeStep() {
        return this._fixedTimeStep;
    }
    executeStep(delta, impostors) {
        // due to cannon's architecture, the first frame's before-step is skipped.
        if (this._firstFrame) {
            this._firstFrame = false;
            for (const impostor of impostors) {
                if (!(impostor.type == PhysicsImpostor.HeightmapImpostor || impostor.type === PhysicsImpostor.PlaneImpostor)) {
                    impostor.beforeStep();
                }
            }
        }
        this.world.step(this._useDeltaForWorldStep ? delta : this._fixedTimeStep);
        this._removeMarkedPhysicsBodiesFromWorld();
    }
    _removeMarkedPhysicsBodiesFromWorld() {
        if (this._physicsBodiesToRemoveAfterStep.length > 0) {
            this._physicsBodiesToRemoveAfterStep.forEach((physicsBody) => {
                if (typeof this.world.removeBody === "function") {
                    this.world.removeBody(physicsBody);
                }
                else {
                    this.world.remove(physicsBody);
                }
            });
            this._physicsBodiesToRemoveAfterStep.length = 0;
        }
    }
    applyImpulse(impostor, force, contactPoint) {
        const worldPoint = new this.BJSCANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
        const impulse = new this.BJSCANNON.Vec3(force.x, force.y, force.z);
        impostor.physicsBody.applyImpulse(impulse, worldPoint);
    }
    applyForce(impostor, force, contactPoint) {
        const worldPoint = new this.BJSCANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
        const impulse = new this.BJSCANNON.Vec3(force.x, force.y, force.z);
        impostor.physicsBody.applyForce(impulse, worldPoint);
    }
    generatePhysicsBody(impostor) {
        // When calling forceUpdate generatePhysicsBody is called again, ensure that the updated body does not instantly collide with removed body
        this._removeMarkedPhysicsBodiesFromWorld();
        //parent-child relationship. Does this impostor have a parent impostor?
        if (impostor.parent) {
            if (impostor.physicsBody) {
                this.removePhysicsBody(impostor);
                //TODO is that needed?
                impostor.forceUpdate();
            }
            return;
        }
        //should a new body be created for this impostor?
        if (impostor.isBodyInitRequired()) {
            const shape = this._createShape(impostor);
            if (!shape) {
                Logger.Warn("It was not possible to create a physics body for this object.");
                return;
            }
            //unregister events if body is being changed
            const oldBody = impostor.physicsBody;
            if (oldBody) {
                this.removePhysicsBody(impostor);
            }
            //create the body and material
            const material = this._addMaterial("mat-" + impostor.uniqueId, impostor.getParam("friction"), impostor.getParam("restitution"));
            const bodyCreationObject = {
                mass: impostor.getParam("mass"),
                material: material,
            };
            // A simple extend, in case native options were used.
            const nativeOptions = impostor.getParam("nativeOptions");
            for (const key in nativeOptions) {
                if (Object.prototype.hasOwnProperty.call(nativeOptions, key)) {
                    bodyCreationObject[key] = nativeOptions[key];
                }
            }
            impostor.physicsBody = new this.BJSCANNON.Body(bodyCreationObject);
            impostor.physicsBody.addEventListener("collide", impostor.onCollide);
            this.world.addEventListener("preStep", impostor.beforeStep);
            this.world.addEventListener("postStep", impostor.afterStep);
            impostor.physicsBody.addShape(shape);
            if (typeof this.world.addBody === "function") {
                this.world.addBody(impostor.physicsBody);
            }
            else {
                this.world.add(impostor.physicsBody);
            }
            //try to keep the body moving in the right direction by taking old properties.
            //Should be tested!
            if (oldBody) {
                ["force", "torque", "velocity", "angularVelocity"].forEach(function (param) {
                    const vec = oldBody[param];
                    impostor.physicsBody[param].set(vec.x, vec.y, vec.z);
                });
            }
            this._processChildMeshes(impostor);
        }
        //now update the body's transformation
        this._updatePhysicsBodyTransformation(impostor);
    }
    _processChildMeshes(mainImpostor) {
        const meshChildren = mainImpostor.object.getChildMeshes ? mainImpostor.object.getChildMeshes(true) : [];
        const mainRotation = mainImpostor.object.rotationQuaternion;
        if (mainRotation) {
            mainRotation.conjugateToRef(this._tmpQuaternion);
        }
        else {
            this._tmpQuaternion.set(0, 0, 0, 1);
        }
        if (meshChildren.length) {
            const processMesh = (mesh) => {
                if (!mesh.rotationQuaternion) {
                    return;
                }
                const childImpostor = mesh.getPhysicsImpostor();
                if (childImpostor) {
                    const parent = childImpostor.parent;
                    if (parent !== mainImpostor && mesh.parent) {
                        const pPosition = mesh.getAbsolutePosition().subtract(mesh.parent.getAbsolutePosition());
                        const q = mesh.rotationQuaternion.multiply(this._tmpQuaternion);
                        if (childImpostor.physicsBody) {
                            this.removePhysicsBody(childImpostor);
                            childImpostor.physicsBody = null;
                        }
                        childImpostor.parent = mainImpostor;
                        childImpostor.resetUpdateFlags();
                        mainImpostor.physicsBody.addShape(this._createShape(childImpostor), new this.BJSCANNON.Vec3(pPosition.x, pPosition.y, pPosition.z), new this.BJSCANNON.Quaternion(q.x, q.y, q.z, q.w));
                        //Add the mass of the children.
                        mainImpostor.physicsBody.mass += childImpostor.getParam("mass");
                    }
                }
                mesh.getChildMeshes(true)
                    .filter((m) => !!m.physicsImpostor)
                    .forEach(processMesh);
            };
            meshChildren.filter((m) => !!m.physicsImpostor).forEach(processMesh);
        }
    }
    removePhysicsBody(impostor) {
        impostor.physicsBody.removeEventListener("collide", impostor.onCollide);
        this.world.removeEventListener("preStep", impostor.beforeStep);
        this.world.removeEventListener("postStep", impostor.afterStep);
        // Only remove the physics body after the physics step to avoid disrupting cannon's internal state
        if (this._physicsBodiesToRemoveAfterStep.indexOf(impostor.physicsBody) === -1) {
            this._physicsBodiesToRemoveAfterStep.push(impostor.physicsBody);
        }
    }
    generateJoint(impostorJoint) {
        const mainBody = impostorJoint.mainImpostor.physicsBody;
        const connectedBody = impostorJoint.connectedImpostor.physicsBody;
        if (!mainBody || !connectedBody) {
            return;
        }
        let constraint;
        const jointData = impostorJoint.joint.jointData;
        //TODO - https://github.com/schteppe/this.BJSCANNON.js/blob/gh-pages/demos/collisionFilter.html
        const constraintData = {
            pivotA: jointData.mainPivot ? new this.BJSCANNON.Vec3().set(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z) : null,
            pivotB: jointData.connectedPivot ? new this.BJSCANNON.Vec3().set(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z) : null,
            axisA: jointData.mainAxis ? new this.BJSCANNON.Vec3().set(jointData.mainAxis.x, jointData.mainAxis.y, jointData.mainAxis.z) : null,
            axisB: jointData.connectedAxis ? new this.BJSCANNON.Vec3().set(jointData.connectedAxis.x, jointData.connectedAxis.y, jointData.connectedAxis.z) : null,
            maxForce: jointData.nativeParams.maxForce,
            collideConnected: !!jointData.collision,
        };
        switch (impostorJoint.joint.type) {
            case PhysicsJoint.HingeJoint:
            case PhysicsJoint.Hinge2Joint:
                constraint = new this.BJSCANNON.HingeConstraint(mainBody, connectedBody, constraintData);
                break;
            case PhysicsJoint.DistanceJoint:
                constraint = new this.BJSCANNON.DistanceConstraint(mainBody, connectedBody, jointData.maxDistance || 2);
                break;
            case PhysicsJoint.SpringJoint: {
                const springData = jointData;
                constraint = new this.BJSCANNON.Spring(mainBody, connectedBody, {
                    restLength: springData.length,
                    stiffness: springData.stiffness,
                    damping: springData.damping,
                    localAnchorA: constraintData.pivotA,
                    localAnchorB: constraintData.pivotB,
                });
                break;
            }
            case PhysicsJoint.LockJoint:
                constraint = new this.BJSCANNON.LockConstraint(mainBody, connectedBody, constraintData);
                break;
            case PhysicsJoint.PointToPointJoint:
            case PhysicsJoint.BallAndSocketJoint:
            default:
                constraint = new this.BJSCANNON.PointToPointConstraint(mainBody, constraintData.pivotA, connectedBody, constraintData.pivotB, constraintData.maxForce);
                break;
        }
        //set the collideConnected flag after the creation, since DistanceJoint ignores it.
        constraint.collideConnected = !!jointData.collision;
        impostorJoint.joint.physicsJoint = constraint;
        //don't add spring as constraint, as it is not one.
        if (impostorJoint.joint.type !== PhysicsJoint.SpringJoint) {
            this.world.addConstraint(constraint);
        }
        else {
            impostorJoint.joint.jointData.forceApplicationCallback =
                impostorJoint.joint.jointData.forceApplicationCallback ||
                    function () {
                        constraint.applyForce();
                    };
            impostorJoint.mainImpostor.registerAfterPhysicsStep(impostorJoint.joint.jointData.forceApplicationCallback);
        }
    }
    removeJoint(impostorJoint) {
        if (impostorJoint.joint.type !== PhysicsJoint.SpringJoint) {
            this.world.removeConstraint(impostorJoint.joint.physicsJoint);
        }
        else {
            impostorJoint.mainImpostor.unregisterAfterPhysicsStep(impostorJoint.joint.jointData.forceApplicationCallback);
        }
    }
    _addMaterial(name, friction, restitution) {
        let index;
        let mat;
        for (index = 0; index < this._physicsMaterials.length; index++) {
            mat = this._physicsMaterials[index];
            if (mat.friction === friction && mat.restitution === restitution) {
                return mat;
            }
        }
        const currentMat = new this.BJSCANNON.Material(name);
        currentMat.friction = friction;
        currentMat.restitution = restitution;
        this._physicsMaterials.push(currentMat);
        return currentMat;
    }
    _checkWithEpsilon(value) {
        return value < Epsilon ? Epsilon : value;
    }
    _createShape(impostor) {
        const object = impostor.object;
        let returnValue;
        const impostorExtents = impostor.getObjectExtents();
        switch (impostor.type) {
            case PhysicsImpostor.SphereImpostor: {
                const radiusX = impostorExtents.x;
                const radiusY = impostorExtents.y;
                const radiusZ = impostorExtents.z;
                returnValue = new this.BJSCANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);
                break;
            }
            //TMP also for cylinder - TODO Cannon supports cylinder natively.
            case PhysicsImpostor.CylinderImpostor: {
                let nativeParams = impostor.getParam("nativeOptions");
                if (!nativeParams) {
                    nativeParams = {};
                }
                const radiusTop = nativeParams.radiusTop !== undefined ? nativeParams.radiusTop : this._checkWithEpsilon(impostorExtents.x) / 2;
                const radiusBottom = nativeParams.radiusBottom !== undefined ? nativeParams.radiusBottom : this._checkWithEpsilon(impostorExtents.x) / 2;
                const height = nativeParams.height !== undefined ? nativeParams.height : this._checkWithEpsilon(impostorExtents.y);
                const numSegments = nativeParams.numSegments !== undefined ? nativeParams.numSegments : 16;
                returnValue = new this.BJSCANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
                // Rotate 90 degrees as this shape is horizontal in cannon
                const quat = new this.BJSCANNON.Quaternion();
                quat.setFromAxisAngle(new this.BJSCANNON.Vec3(1, 0, 0), -Math.PI / 2);
                const translation = new this.BJSCANNON.Vec3(0, 0, 0);
                returnValue.transformAllPoints(translation, quat);
                break;
            }
            case PhysicsImpostor.BoxImpostor: {
                const box = impostorExtents.scale(0.5);
                returnValue = new this.BJSCANNON.Box(new this.BJSCANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z)));
                break;
            }
            case PhysicsImpostor.PlaneImpostor:
                Logger.Warn("Attention, PlaneImposter might not behave as you expect. Consider using BoxImposter instead");
                returnValue = new this.BJSCANNON.Plane();
                break;
            case PhysicsImpostor.MeshImpostor: {
                // should transform the vertex data to world coordinates!!
                const rawVerts = object.getVerticesData ? object.getVerticesData(VertexBuffer.PositionKind) : [];
                const rawFaces = object.getIndices ? object.getIndices() : [];
                if (!rawVerts) {
                    Logger.Warn("Tried to create a MeshImpostor for an object without vertices. This will fail.");
                    return;
                }
                // get only scale! so the object could transform correctly.
                const oldPosition = object.position.clone();
                const oldRotation = object.rotation && object.rotation.clone();
                const oldQuaternion = object.rotationQuaternion && object.rotationQuaternion.clone();
                object.position.copyFromFloats(0, 0, 0);
                object.rotation && object.rotation.copyFromFloats(0, 0, 0);
                object.rotationQuaternion && object.rotationQuaternion.copyFrom(impostor.getParentsRotation());
                object.rotationQuaternion && object.parent && object.rotationQuaternion.conjugateInPlace();
                const transform = object.computeWorldMatrix(true);
                // convert rawVerts to object space
                const transformedVertices = [];
                let index;
                for (index = 0; index < rawVerts.length; index += 3) {
                    Vector3.TransformCoordinates(Vector3.FromArray(rawVerts, index), transform).toArray(transformedVertices, index);
                }
                Logger.Warn("MeshImpostor only collides against spheres.");
                returnValue = new this.BJSCANNON.Trimesh(transformedVertices, rawFaces);
                //now set back the transformation!
                object.position.copyFrom(oldPosition);
                oldRotation && object.rotation && object.rotation.copyFrom(oldRotation);
                oldQuaternion && object.rotationQuaternion && object.rotationQuaternion.copyFrom(oldQuaternion);
                break;
            }
            case PhysicsImpostor.HeightmapImpostor: {
                const oldPosition2 = object.position.clone();
                const oldRotation2 = object.rotation && object.rotation.clone();
                const oldQuaternion2 = object.rotationQuaternion && object.rotationQuaternion.clone();
                object.position.copyFromFloats(0, 0, 0);
                object.rotation && object.rotation.copyFromFloats(0, 0, 0);
                object.rotationQuaternion && object.rotationQuaternion.copyFrom(impostor.getParentsRotation());
                object.rotationQuaternion && object.parent && object.rotationQuaternion.conjugateInPlace();
                object.rotationQuaternion && object.rotationQuaternion.multiplyInPlace(this._minus90X);
                returnValue = this._createHeightmap(object);
                object.position.copyFrom(oldPosition2);
                oldRotation2 && object.rotation && object.rotation.copyFrom(oldRotation2);
                oldQuaternion2 && object.rotationQuaternion && object.rotationQuaternion.copyFrom(oldQuaternion2);
                object.computeWorldMatrix(true);
                break;
            }
            case PhysicsImpostor.ParticleImpostor:
                returnValue = new this.BJSCANNON.Particle();
                break;
            case PhysicsImpostor.NoImpostor:
                returnValue = new this.BJSCANNON.Box(new this.BJSCANNON.Vec3(0, 0, 0));
                break;
        }
        return returnValue;
    }
    _createHeightmap(object, pointDepth) {
        let pos = object.getVerticesData(VertexBuffer.PositionKind);
        const transform = object.computeWorldMatrix(true);
        // convert rawVerts to object space
        const transformedVertices = [];
        let index;
        for (index = 0; index < pos.length; index += 3) {
            Vector3.TransformCoordinates(Vector3.FromArray(pos, index), transform).toArray(transformedVertices, index);
        }
        pos = transformedVertices;
        const matrix = new Array();
        //For now pointDepth will not be used and will be automatically calculated.
        //Future reference - try and find the best place to add a reference to the pointDepth variable.
        const arraySize = pointDepth || ~~(Math.sqrt(pos.length / 3) - 1);
        const boundingInfo = object.getBoundingInfo();
        const dim = Math.min(boundingInfo.boundingBox.extendSizeWorld.x, boundingInfo.boundingBox.extendSizeWorld.y);
        const minY = boundingInfo.boundingBox.extendSizeWorld.z;
        const elementSize = (dim * 2) / arraySize;
        for (let i = 0; i < pos.length; i = i + 3) {
            const x = Math.round(pos[i + 0] / elementSize + arraySize / 2);
            const z = Math.round((pos[i + 1] / elementSize - arraySize / 2) * -1);
            const y = -pos[i + 2] + minY;
            if (!matrix[x]) {
                matrix[x] = [];
            }
            if (!matrix[x][z]) {
                matrix[x][z] = y;
            }
            matrix[x][z] = Math.max(y, matrix[x][z]);
        }
        for (let x = 0; x <= arraySize; ++x) {
            if (!matrix[x]) {
                let loc = 1;
                while (!matrix[(x + loc) % arraySize]) {
                    loc++;
                }
                matrix[x] = matrix[(x + loc) % arraySize].slice();
                //console.log("missing x", x);
            }
            for (let z = 0; z <= arraySize; ++z) {
                if (!matrix[x][z]) {
                    let loc = 1;
                    let newValue;
                    while (newValue === undefined) {
                        newValue = matrix[x][(z + loc++) % arraySize];
                    }
                    matrix[x][z] = newValue;
                }
            }
        }
        const shape = new this.BJSCANNON.Heightfield(matrix, {
            elementSize: elementSize,
        });
        //For future reference, needed for body transformation
        shape.minY = minY;
        return shape;
    }
    _updatePhysicsBodyTransformation(impostor) {
        const object = impostor.object;
        //make sure it is updated...
        object.computeWorldMatrix && object.computeWorldMatrix(true);
        if (!object.getBoundingInfo()) {
            return;
        }
        const center = impostor.getObjectCenter();
        //m.getAbsolutePosition().subtract(m.getBoundingInfo().boundingBox.centerWorld)
        // The delta between the mesh position and the mesh bounding box center
        this._tmpDeltaPosition.copyFrom(object.getAbsolutePivotPoint().subtract(center));
        this._tmpDeltaPosition.divideInPlace(impostor.object.scaling);
        this._tmpPosition.copyFrom(center);
        let quaternion = object.rotationQuaternion;
        if (!quaternion) {
            return;
        }
        //is shape is a plane or a heightmap, it must be rotated 90 degs in the X axis.
        //ideally these would be rotated at time of creation like cylinder but they dont extend ConvexPolyhedron
        if (impostor.type === PhysicsImpostor.PlaneImpostor || impostor.type === PhysicsImpostor.HeightmapImpostor) {
            //-90 DEG in X, precalculated
            quaternion = quaternion.multiply(this._minus90X);
            //Invert! (Precalculated, 90 deg in X)
            //No need to clone. this will never change.
            impostor.setDeltaRotation(this._plus90X);
        }
        //If it is a heightfield, if should be centered.
        if (impostor.type === PhysicsImpostor.HeightmapImpostor) {
            const mesh = object;
            let boundingInfo = mesh.getBoundingInfo();
            //calculate the correct body position:
            const rotationQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = this._tmpUnityRotation;
            mesh.computeWorldMatrix(true);
            //get original center with no rotation
            const c = center.clone();
            let oldPivot = mesh.getPivotMatrix();
            if (oldPivot) {
                // create a copy the pivot Matrix as it is modified in place
                oldPivot = oldPivot.clone();
            }
            else {
                oldPivot = Matrix.Identity();
            }
            //calculate the new center using a pivot (since this.BJSCANNON.js doesn't center height maps)
            const p = Matrix.Translation(boundingInfo.boundingBox.extendSizeWorld.x, 0, -boundingInfo.boundingBox.extendSizeWorld.z);
            mesh.setPreTransformMatrix(p);
            mesh.computeWorldMatrix(true);
            // force bounding box recomputation
            boundingInfo = mesh.getBoundingInfo();
            //calculate the translation
            const translation = boundingInfo.boundingBox.centerWorld.subtract(center).subtract(mesh.position).negate();
            this._tmpPosition.copyFromFloats(translation.x, translation.y - boundingInfo.boundingBox.extendSizeWorld.y, translation.z);
            //add it inverted to the delta
            this._tmpDeltaPosition.copyFrom(boundingInfo.boundingBox.centerWorld.subtract(c));
            this._tmpDeltaPosition.y += boundingInfo.boundingBox.extendSizeWorld.y;
            //rotation is back
            mesh.rotationQuaternion = rotationQuaternion;
            mesh.setPreTransformMatrix(oldPivot);
            mesh.computeWorldMatrix(true);
        }
        else if (impostor.type === PhysicsImpostor.MeshImpostor) {
            this._tmpDeltaPosition.copyFromFloats(0, 0, 0);
        }
        impostor.setDeltaPosition(this._tmpDeltaPosition);
        //Now update the impostor object
        impostor.physicsBody.position.set(this._tmpPosition.x, this._tmpPosition.y, this._tmpPosition.z);
        impostor.physicsBody.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }
    setTransformationFromPhysicsBody(impostor) {
        impostor.object.position.set(impostor.physicsBody.position.x, impostor.physicsBody.position.y, impostor.physicsBody.position.z);
        if (impostor.object.rotationQuaternion) {
            const q = impostor.physicsBody.quaternion;
            impostor.object.rotationQuaternion.set(q.x, q.y, q.z, q.w);
        }
    }
    setPhysicsBodyTransformation(impostor, newPosition, newRotation) {
        impostor.physicsBody.position.set(newPosition.x, newPosition.y, newPosition.z);
        impostor.physicsBody.quaternion.set(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
    }
    isSupported() {
        return this.BJSCANNON !== undefined;
    }
    setLinearVelocity(impostor, velocity) {
        impostor.physicsBody.velocity.set(velocity.x, velocity.y, velocity.z);
    }
    setAngularVelocity(impostor, velocity) {
        impostor.physicsBody.angularVelocity.set(velocity.x, velocity.y, velocity.z);
    }
    getLinearVelocity(impostor) {
        const v = impostor.physicsBody.velocity;
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
        impostor.physicsBody.mass = mass;
        impostor.physicsBody.updateMassProperties();
    }
    getBodyMass(impostor) {
        return impostor.physicsBody.mass;
    }
    getBodyFriction(impostor) {
        return impostor.physicsBody.material.friction;
    }
    setBodyFriction(impostor, friction) {
        impostor.physicsBody.material.friction = friction;
    }
    getBodyRestitution(impostor) {
        return impostor.physicsBody.material.restitution;
    }
    setBodyRestitution(impostor, restitution) {
        impostor.physicsBody.material.restitution = restitution;
    }
    sleepBody(impostor) {
        impostor.physicsBody.sleep();
    }
    wakeUpBody(impostor) {
        impostor.physicsBody.wakeUp();
    }
    updateDistanceJoint(joint, maxDistance) {
        joint.physicsJoint.distance = maxDistance;
    }
    setMotor(joint, speed, maxForce, motorIndex) {
        if (!motorIndex) {
            joint.physicsJoint.enableMotor();
            joint.physicsJoint.setMotorSpeed(speed);
            if (maxForce) {
                this.setLimit(joint, maxForce);
            }
        }
    }
    setLimit(joint, minForce, maxForce) {
        joint.physicsJoint.motorEquation.maxForce = maxForce;
        joint.physicsJoint.motorEquation.minForce = minForce === void 0 ? -minForce : minForce;
    }
    syncMeshWithImpostor(mesh, impostor) {
        const body = impostor.physicsBody;
        mesh.position.x = body.position.x;
        mesh.position.y = body.position.y;
        mesh.position.z = body.position.z;
        if (mesh.rotationQuaternion) {
            mesh.rotationQuaternion.x = body.quaternion.x;
            mesh.rotationQuaternion.y = body.quaternion.y;
            mesh.rotationQuaternion.z = body.quaternion.z;
            mesh.rotationQuaternion.w = body.quaternion.w;
        }
    }
    getRadius(impostor) {
        const shape = impostor.physicsBody.shapes[0];
        return shape.boundingSphereRadius;
    }
    getBoxSizeToRef(impostor, result) {
        const shape = impostor.physicsBody.shapes[0];
        result.x = shape.halfExtents.x * 2;
        result.y = shape.halfExtents.y * 2;
        result.z = shape.halfExtents.z * 2;
    }
    dispose() { }
    _extendNamespace() {
        //this will force cannon to execute at least one step when using interpolation
        const step_tmp1 = new this.BJSCANNON.Vec3();
        const engine = this.BJSCANNON;
        this.BJSCANNON.World.prototype.step = function (dt, timeSinceLastCalled, maxSubSteps) {
            maxSubSteps = maxSubSteps || 10;
            timeSinceLastCalled = timeSinceLastCalled || 0;
            if (timeSinceLastCalled === 0) {
                this.internalStep(dt);
                this.time += dt;
            }
            else {
                let internalSteps = Math.floor((this.time + timeSinceLastCalled) / dt) - Math.floor(this.time / dt);
                internalSteps = Math.min(internalSteps, maxSubSteps) || 1;
                const t0 = performance.now();
                for (let i = 0; i !== internalSteps; i++) {
                    this.internalStep(dt);
                    if (performance.now() - t0 > dt * 1000) {
                        break;
                    }
                }
                this.time += timeSinceLastCalled;
                const h = this.time % dt;
                const h_div_dt = h / dt;
                const interpvelo = step_tmp1;
                const bodies = this.bodies;
                for (let j = 0; j !== bodies.length; j++) {
                    const b = bodies[j];
                    if (b.type !== engine.Body.STATIC && b.sleepState !== engine.Body.SLEEPING) {
                        b.position.vsub(b.previousPosition, interpvelo);
                        interpvelo.scale(h_div_dt, interpvelo);
                        b.position.vadd(interpvelo, b.interpolatedPosition);
                    }
                    else {
                        b.interpolatedPosition.set(b.position.x, b.position.y, b.position.z);
                        b.interpolatedQuaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
                    }
                }
            }
        };
    }
    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    raycast(from, to) {
        this._raycastResult.reset(from, to);
        this.raycastToRef(from, to, this._raycastResult);
        return this._raycastResult;
    }
    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param result resulting PhysicsRaycastResult
     */
    raycastToRef(from, to, result) {
        this._cannonRaycastResult.reset();
        this.world.raycastClosest(from, to, {}, this._cannonRaycastResult);
        result.reset(from, to);
        if (this._cannonRaycastResult.hasHit) {
            // TODO: do we also want to get the body it hit?
            result.setHitData({
                x: this._cannonRaycastResult.hitNormalWorld.x,
                y: this._cannonRaycastResult.hitNormalWorld.y,
                z: this._cannonRaycastResult.hitNormalWorld.z,
            }, {
                x: this._cannonRaycastResult.hitPointWorld.x,
                y: this._cannonRaycastResult.hitPointWorld.y,
                z: this._cannonRaycastResult.hitPointWorld.z,
            });
            result.setHitDistance(this._cannonRaycastResult.distance);
        }
    }
}
PhysicsEngine.DefaultPluginFactory = () => {
    return new CannonJSPlugin();
};
//# sourceMappingURL=cannonJSPlugin.js.map