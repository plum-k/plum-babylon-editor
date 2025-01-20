import { Matrix, Quaternion, TmpVectors, Vector3 } from "../../../Maths/math.vector.js";
import { PhysicsPrestepType, } from "../IPhysicsEnginePlugin.js";
import { Logger } from "../../../Misc/logger.js";
import { PhysicsShape } from "../physicsShape.js";
import { BoundingBox } from "../../../Culling/boundingBox.js";
import { Mesh } from "../../../Meshes/mesh.js";
import { InstancedMesh } from "../../../Meshes/instancedMesh.js";
import { VertexBuffer } from "../../../Buffers/buffer.js";
import { BuildArray } from "../../../Misc/arrayTools.js";
import { Observable } from "../../../Misc/observable.js";
class MeshAccumulator {
    /**
     * Constructor of the mesh accumulator
     * @param mesh - The mesh used to compute the world matrix.
     * @param collectIndices - use mesh indices
     * @param scene - The scene used to determine the right handed system.
     *
     * Merge mesh and its children so whole hierarchy can be used as a mesh shape or convex hull
     */
    constructor(mesh, collectIndices, scene) {
        this._vertices = []; /// Vertices in body space
        this._indices = [];
        this._isRightHanded = scene.useRightHandedSystem;
        this._collectIndices = collectIndices;
    }
    /**
     * Adds a mesh to the physics engine.
     * @param mesh The mesh to add.
     * @param includeChildren Whether to include the children of the mesh.
     *
     * This method adds a mesh to the physics engine by computing the world matrix,
     * multiplying it with the body from world matrix, and then transforming the
     * coordinates of the mesh's vertices. It also adds the indices of the mesh
     * to the physics engine. If includeChildren is true, it will also add the
     * children of the mesh to the physics engine, ignoring any children which
     * have a physics impostor. This is useful for creating a physics engine
     * that accurately reflects the mesh and its children.
     */
    addNodeMeshes(mesh, includeChildren) {
        // Force absoluteScaling to be computed; we're going to use that to bake
        // the scale of any parent nodes into this shape, as physics engines
        // usually use rigid transforms, so can't handle arbitrary scale.
        mesh.computeWorldMatrix(true);
        const rootScaled = TmpVectors.Matrix[0];
        Matrix.ScalingToRef(mesh.absoluteScaling.x, mesh.absoluteScaling.y, mesh.absoluteScaling.z, rootScaled);
        if (mesh instanceof Mesh) {
            this._addMesh(mesh, rootScaled);
        }
        else if (mesh instanceof InstancedMesh) {
            this._addMesh(mesh.sourceMesh, rootScaled);
        }
        if (includeChildren) {
            const worldToRoot = TmpVectors.Matrix[1];
            mesh.computeWorldMatrix().invertToRef(worldToRoot);
            const worldToRootScaled = TmpVectors.Matrix[2];
            worldToRoot.multiplyToRef(rootScaled, worldToRootScaled);
            const children = mesh.getChildMeshes(false);
            //  Ignore any children which have a physics body.
            //  Other plugin implementations do not have this check, which appears to be
            //  a bug, as otherwise, the mesh will have a duplicate collider
            children
                .filter((m) => !m.physicsBody)
                .forEach((m) => {
                const childToWorld = m.computeWorldMatrix();
                const childToRootScaled = TmpVectors.Matrix[3];
                childToWorld.multiplyToRef(worldToRootScaled, childToRootScaled);
                if (m instanceof Mesh) {
                    this._addMesh(m, childToRootScaled);
                }
                else if (m instanceof InstancedMesh) {
                    this._addMesh(m.sourceMesh, childToRootScaled);
                }
            });
        }
    }
    _addMesh(mesh, meshToRoot) {
        const vertexData = mesh.getVerticesData(VertexBuffer.PositionKind) || [];
        const numVerts = vertexData.length / 3;
        const indexOffset = this._vertices.length;
        for (let v = 0; v < numVerts; v++) {
            const pos = new Vector3(vertexData[v * 3 + 0], vertexData[v * 3 + 1], vertexData[v * 3 + 2]);
            this._vertices.push(Vector3.TransformCoordinates(pos, meshToRoot));
        }
        if (this._collectIndices) {
            const meshIndices = mesh.getIndices();
            if (meshIndices) {
                for (let i = 0; i < meshIndices.length; i += 3) {
                    // Havok wants the correct triangle winding to enable the interior triangle optimization
                    if (this._isRightHanded) {
                        this._indices.push(meshIndices[i + 0] + indexOffset);
                        this._indices.push(meshIndices[i + 1] + indexOffset);
                        this._indices.push(meshIndices[i + 2] + indexOffset);
                    }
                    else {
                        this._indices.push(meshIndices[i + 2] + indexOffset);
                        this._indices.push(meshIndices[i + 1] + indexOffset);
                        this._indices.push(meshIndices[i + 0] + indexOffset);
                    }
                }
            }
        }
    }
    /**
     * Allocate and populate the vertex positions inside the physics plugin.
     *
     * @param plugin - The plugin to allocate the memory in.
     * @returns An array of floats, whose backing memory is inside the plugin. The array contains the
     * positions of the mesh vertices, where a position is defined by three floats. You must call
     * freeBuffer() on the returned array once you have finished with it, in order to free the
     * memory inside the plugin..
     */
    getVertices(plugin) {
        const nFloats = this._vertices.length * 3;
        const bytesPerFloat = 4;
        const nBytes = nFloats * bytesPerFloat;
        const bufferBegin = plugin._malloc(nBytes);
        const ret = new Float32Array(plugin.HEAPU8.buffer, bufferBegin, nFloats);
        for (let i = 0; i < this._vertices.length; i++) {
            ret[i * 3 + 0] = this._vertices[i].x;
            ret[i * 3 + 1] = this._vertices[i].y;
            ret[i * 3 + 2] = this._vertices[i].z;
        }
        return { offset: bufferBegin, numObjects: nFloats };
    }
    freeBuffer(plugin, arr) {
        plugin._free(arr.offset);
    }
    /**
     * Allocate and populate the triangle indices inside the physics plugin
     *
     * @param plugin - The plugin to allocate the memory in.
     * @returns A new Int32Array, whose backing memory is inside the plugin. The array contains the indices
     * of the triangle positions, where a single triangle is defined by three indices. You must call
     * freeBuffer() on this array once you have finished with it, to free the memory inside the plugin..
     */
    getTriangles(plugin) {
        const bytesPerInt = 4;
        const nBytes = this._indices.length * bytesPerInt;
        const bufferBegin = plugin._malloc(nBytes);
        const ret = new Int32Array(plugin.HEAPU8.buffer, bufferBegin, this._indices.length);
        for (let i = 0; i < this._indices.length; i++) {
            ret[i] = this._indices[i];
        }
        return { offset: bufferBegin, numObjects: this._indices.length };
    }
}
class BodyPluginData {
    constructor(bodyId) {
        this.hpBodyId = bodyId;
        this.userMassProps = { centerOfMass: undefined, mass: undefined, inertia: undefined, inertiaOrientation: undefined };
    }
}
/*
class ShapePath
{
    public colliderId: number;
    public pathData: number;
}
*/
class CollisionContactPoint {
    constructor() {
        this.bodyId = BigInt(0); //0,2
        //public colliderId: number = 0; //2,4
        //public shapePath: ShapePath = new ShapePath(); //4,8
        this.position = new Vector3(); //8,11
        this.normal = new Vector3(); //11,14
        //public triIdx: number = 0; //14,15
    }
}
class CollisionEvent {
    constructor() {
        this.contactOnA = new CollisionContactPoint(); //1
        this.contactOnB = new CollisionContactPoint();
        this.impulseApplied = 0;
        this.type = 0;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static readToRef(buffer, offset, eventOut) {
        const intBuf = new Int32Array(buffer, offset);
        const floatBuf = new Float32Array(buffer, offset);
        const offA = 2;
        eventOut.contactOnA.bodyId = BigInt(intBuf[offA]); //<todo Need to get the high+low words!
        eventOut.contactOnA.position.set(floatBuf[offA + 8], floatBuf[offA + 9], floatBuf[offA + 10]);
        eventOut.contactOnA.normal.set(floatBuf[offA + 11], floatBuf[offA + 12], floatBuf[offA + 13]);
        const offB = 18;
        eventOut.contactOnB.bodyId = BigInt(intBuf[offB]);
        eventOut.contactOnB.position.set(floatBuf[offB + 8], floatBuf[offB + 9], floatBuf[offB + 10]);
        eventOut.contactOnB.normal.set(floatBuf[offB + 11], floatBuf[offB + 12], floatBuf[offB + 13]);
        eventOut.impulseApplied = floatBuf[offB + 13 + 3];
        eventOut.type = intBuf[0];
    }
}
class TriggerEvent {
    constructor() {
        this.bodyIdA = BigInt(0);
        this.bodyIdB = BigInt(0);
        this.type = 0;
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static readToRef(buffer, offset, eventOut) {
        const intBuf = new Int32Array(buffer, offset);
        eventOut.type = intBuf[0];
        eventOut.bodyIdA = BigInt(intBuf[2]);
        eventOut.bodyIdB = BigInt(intBuf[6]);
    }
}
/**
 * The Havok Physics plugin
 */
export class HavokPlugin {
    constructor(_useDeltaForWorldStep = true, hpInjection = HK) {
        this._useDeltaForWorldStep = _useDeltaForWorldStep;
        /**
         * Reference to the WASM library
         */
        this._hknp = {};
        /**
         * Name of the plugin
         */
        this.name = "HavokPlugin";
        this._fixedTimeStep = 1 / 60;
        this._tmpVec3 = BuildArray(3, Vector3.Zero);
        this._bodies = new Map();
        this._shapes = new Map();
        this._bodyCollisionObservable = new Map();
        // Map from constraint id to the pair of bodies, where the first is the parent and the second is the child
        this._constraintToBodyIdPair = new Map();
        this._bodyCollisionEndedObservable = new Map();
        /**
         * Observable for collision started and collision continued events
         */
        this.onCollisionObservable = new Observable();
        /**
         * Observable for collision ended events
         */
        this.onCollisionEndedObservable = new Observable();
        /**
         * Observable for trigger entered and trigger exited events
         */
        this.onTriggerCollisionObservable = new Observable();
        if (typeof hpInjection === "function") {
            Logger.Error("Havok is not ready. Please make sure you await HK() before using the plugin.");
            return;
        }
        else {
            this._hknp = hpInjection;
        }
        if (!this.isSupported()) {
            Logger.Error("Havok is not available. Please make sure you included the js file.");
            return;
        }
        this.world = this._hknp.HP_World_Create()[1];
        this._queryCollector = this._hknp.HP_QueryCollector_Create(1)[1];
    }
    /**
     * If this plugin is supported
     * @returns true if its supported
     */
    isSupported() {
        return this._hknp !== undefined;
    }
    /**
     * Sets the gravity of the physics world.
     *
     * @param gravity - The gravity vector to set.
     *
     */
    setGravity(gravity) {
        this._hknp.HP_World_SetGravity(this.world, this._bVecToV3(gravity));
    }
    /**
     * Sets the fixed time step for the physics engine.
     *
     * @param timeStep - The fixed time step to use for the physics engine.
     *
     */
    setTimeStep(timeStep) {
        this._fixedTimeStep = timeStep;
    }
    /**
     * Gets the fixed time step used by the physics engine.
     *
     * @returns The fixed time step used by the physics engine.
     *
     */
    getTimeStep() {
        return this._fixedTimeStep;
    }
    /**
     * Executes a single step of the physics engine.
     *
     * @param delta The time delta in seconds since the last step.
     * @param physicsBodies An array of physics bodies to be simulated.
     *
     * This method is useful for simulating the physics engine. It sets the physics body transformation,
     * steps the world, syncs the physics body, and notifies collisions. This allows for the physics engine
     * to accurately simulate the physics bodies in the world.
     */
    executeStep(delta, physicsBodies) {
        for (const physicsBody of physicsBodies) {
            if (physicsBody.disablePreStep) {
                continue;
            }
            this.setPhysicsBodyTransformation(physicsBody, physicsBody.transformNode);
        }
        const deltaTime = this._useDeltaForWorldStep ? delta : this._fixedTimeStep;
        this._hknp.HP_World_SetIdealStepTime(this.world, deltaTime);
        this._hknp.HP_World_Step(this.world, deltaTime);
        this._bodyBuffer = this._hknp.HP_World_GetBodyBuffer(this.world)[1];
        for (const physicsBody of physicsBodies) {
            if (!physicsBody.disableSync) {
                this.sync(physicsBody);
            }
        }
        this._notifyCollisions();
        this._notifyTriggers();
    }
    /**
     * Returns the version of the physics engine plugin.
     *
     * @returns The version of the physics engine plugin.
     *
     * This method is useful for determining the version of the physics engine plugin that is currently running.
     */
    getPluginVersion() {
        return 2;
    }
    /**
     * Set the maximum allowed linear and angular velocities
     * @param maxLinearVelocity maximum allowed linear velocity
     * @param maxAngularVelocity maximum allowed angular velocity
     */
    setVelocityLimits(maxLinearVelocity, maxAngularVelocity) {
        this._hknp.HP_World_SetSpeedLimit(this.world, maxLinearVelocity, maxAngularVelocity);
    }
    /**
     * @returns maximum allowed linear velocity
     */
    getMaxLinearVelocity() {
        const limits = this._hknp.HP_World_GetSpeedLimit(this.world);
        return limits[1];
    }
    /**
     * @returns maximum allowed angular velocity
     */
    getMaxAngularVelocity() {
        const limits = this._hknp.HP_World_GetSpeedLimit(this.world);
        return limits[2];
    }
    /**
     * Initializes a physics body with the given position and orientation.
     *
     * @param body - The physics body to initialize.
     * @param motionType - The motion type of the body.
     * @param position - The position of the body.
     * @param orientation - The orientation of the body.
     * This code is useful for initializing a physics body with the given position and orientation.
     * It creates a plugin data for the body and adds it to the world. It then converts the position
     * and orientation to a transform and sets the body's transform to the given values.
     */
    initBody(body, motionType, position, orientation) {
        body._pluginData = new BodyPluginData(this._hknp.HP_Body_Create()[1]);
        this._internalSetMotionType(body._pluginData, motionType);
        const transform = [this._bVecToV3(position), this._bQuatToV4(orientation)]; //<todo temp transform?
        this._hknp.HP_Body_SetQTransform(body._pluginData.hpBodyId, transform);
        this._hknp.HP_World_AddBody(this.world, body._pluginData.hpBodyId, body.startAsleep);
        this._bodies.set(body._pluginData.hpBodyId[0], { body: body, index: 0 });
    }
    /**
     * Removes a body from the world. To dispose of a body, it is necessary to remove it from the world first.
     *
     * @param body - The body to remove.
     */
    removeBody(body) {
        if (body._pluginDataInstances && body._pluginDataInstances.length > 0) {
            for (const instance of body._pluginDataInstances) {
                this._bodyCollisionObservable.delete(instance.hpBodyId[0]);
                this._hknp.HP_World_RemoveBody(this.world, instance.hpBodyId);
                this._bodies.delete(instance.hpBodyId[0]);
            }
        }
        if (body._pluginData) {
            this._bodyCollisionObservable.delete(body._pluginData.hpBodyId[0]);
            this._hknp.HP_World_RemoveBody(this.world, body._pluginData.hpBodyId);
            this._bodies.delete(body._pluginData.hpBodyId[0]);
        }
    }
    /**
     * Initializes the body instances for a given physics body and mesh.
     *
     * @param body - The physics body to initialize.
     * @param motionType - How the body will be handled by the engine
     * @param mesh - The mesh to initialize.
     *
     * This code is useful for creating a physics body from a mesh. It creates a
     * body instance for each instance of the mesh and adds it to the world. It also
     * sets the position of the body instance to the position of the mesh instance.
     * This allows for the physics engine to accurately simulate the mesh in the
     * world.
     */
    initBodyInstances(body, motionType, mesh) {
        const instancesCount = mesh._thinInstanceDataStorage?.instancesCount ?? 0;
        const matrixData = mesh._thinInstanceDataStorage.matrixData;
        if (!matrixData) {
            return; // TODO: error handling
        }
        this._createOrUpdateBodyInstances(body, motionType, matrixData, 0, instancesCount, false);
        body._pluginDataInstances.forEach((bodyId, index) => {
            this._bodies.set(bodyId.hpBodyId[0], { body: body, index: index });
        });
    }
    _createOrUpdateBodyInstances(body, motionType, matrixData, startIndex, endIndex, update) {
        const rotation = TmpVectors.Quaternion[0];
        const rotationMatrix = Matrix.Identity();
        for (let i = startIndex; i < endIndex; i++) {
            const position = [matrixData[i * 16 + 12], matrixData[i * 16 + 13], matrixData[i * 16 + 14]];
            let hkbody;
            if (!update) {
                hkbody = this._hknp.HP_Body_Create()[1];
            }
            else {
                hkbody = body._pluginDataInstances[i].hpBodyId;
            }
            rotationMatrix.setRowFromFloats(0, matrixData[i * 16 + 0], matrixData[i * 16 + 1], matrixData[i * 16 + 2], 0);
            rotationMatrix.setRowFromFloats(1, matrixData[i * 16 + 4], matrixData[i * 16 + 5], matrixData[i * 16 + 6], 0);
            rotationMatrix.setRowFromFloats(2, matrixData[i * 16 + 8], matrixData[i * 16 + 9], matrixData[i * 16 + 10], 0);
            Quaternion.FromRotationMatrixToRef(rotationMatrix, rotation);
            const transform = [position, [rotation.x, rotation.y, rotation.z, rotation.w]];
            this._hknp.HP_Body_SetQTransform(hkbody, transform);
            if (!update) {
                const pluginData = new BodyPluginData(hkbody);
                if (body._pluginDataInstances.length) {
                    // If an instance already exists, copy any user-provided mass properties
                    pluginData.userMassProps = body._pluginDataInstances[0].userMassProps;
                }
                this._internalSetMotionType(pluginData, motionType);
                this._internalUpdateMassProperties(pluginData);
                body._pluginDataInstances.push(pluginData);
                this._hknp.HP_World_AddBody(this.world, hkbody, body.startAsleep);
                pluginData.worldTransformOffset = this._hknp.HP_Body_GetWorldTransformOffset(hkbody)[1];
            }
        }
    }
    /**
     * Update the internal body instances for a given physics body to match the instances in a mesh.
     * @param body the body that will be updated
     * @param mesh the mesh with reference instances
     */
    updateBodyInstances(body, mesh) {
        const instancesCount = mesh._thinInstanceDataStorage?.instancesCount ?? 0;
        const matrixData = mesh._thinInstanceDataStorage.matrixData;
        if (!matrixData) {
            return; // TODO: error handling
        }
        const pluginInstancesCount = body._pluginDataInstances.length;
        const motionType = this.getMotionType(body);
        if (instancesCount > pluginInstancesCount) {
            this._createOrUpdateBodyInstances(body, motionType, matrixData, pluginInstancesCount, instancesCount, false);
            const firstBodyShape = this._hknp.HP_Body_GetShape(body._pluginDataInstances[0].hpBodyId)[1];
            // firstBodyShape[0] might be 0 in the case where thin instances data is set (with thinInstancesSetBuffer call) after body creation
            // in that case, use the shape provided at body creation.
            if (!firstBodyShape[0]) {
                firstBodyShape[0] = body.shape?._pluginData[0];
            }
            for (let i = pluginInstancesCount; i < instancesCount; i++) {
                this._hknp.HP_Body_SetShape(body._pluginDataInstances[i].hpBodyId, firstBodyShape);
                this._internalUpdateMassProperties(body._pluginDataInstances[i]);
                this._bodies.set(body._pluginDataInstances[i].hpBodyId[0], { body: body, index: i });
            }
        }
        else if (instancesCount < pluginInstancesCount) {
            const instancesToRemove = pluginInstancesCount - instancesCount;
            for (let i = 0; i < instancesToRemove; i++) {
                const hkbody = body._pluginDataInstances.pop();
                this._bodies.delete(hkbody.hpBodyId[0]);
                this._hknp.HP_World_RemoveBody(this.world, hkbody.hpBodyId);
                this._hknp.HP_Body_Release(hkbody.hpBodyId);
            }
            this._createOrUpdateBodyInstances(body, motionType, matrixData, 0, instancesCount, true);
        }
    }
    /**
     * Synchronizes the transform of a physics body with its transform node.
     * @param body - The physics body to synchronize.
     *
     * This function is useful for keeping the physics body's transform in sync with its transform node.
     * This is important for ensuring that the physics body is accurately represented in the physics engine.
     */
    sync(body) {
        this.syncTransform(body, body.transformNode);
    }
    /**
     * Synchronizes the transform of a physics body with the transform of its
     * corresponding transform node.
     *
     * @param body - The physics body to synchronize.
     * @param transformNode - The destination Transform Node.
     *
     * This code is useful for synchronizing the position and orientation of a
     * physics body with the position and orientation of its corresponding
     * transform node. This is important for ensuring that the physics body and
     * the transform node are in the same position and orientation in the scene.
     * This is necessary for the physics engine to accurately simulate the
     * physical behavior of the body.
     */
    syncTransform(body, transformNode) {
        if (body._pluginDataInstances.length) {
            // instances
            const m = transformNode;
            const matrixData = m._thinInstanceDataStorage.matrixData;
            if (!matrixData) {
                return; // TODO: error handling
            }
            const instancesCount = body._pluginDataInstances.length;
            for (let i = 0; i < instancesCount; i++) {
                const bufOffset = body._pluginDataInstances[i].worldTransformOffset;
                const transformBuffer = new Float32Array(this._hknp.HEAPU8.buffer, this._bodyBuffer + bufOffset, 16);
                const index = i * 16;
                for (let mi = 0; mi < 15; mi++) {
                    if ((mi & 3) != 3) {
                        matrixData[index + mi] = transformBuffer[mi];
                    }
                }
                matrixData[index + 15] = 1;
            }
            m.thinInstanceBufferUpdated("matrix");
        }
        else {
            try {
                // regular
                const bodyTransform = this._hknp.HP_Body_GetQTransform(body._pluginData.hpBodyId)[1];
                const bodyTranslation = bodyTransform[0];
                const bodyOrientation = bodyTransform[1];
                const quat = TmpVectors.Quaternion[0];
                quat.set(bodyOrientation[0], bodyOrientation[1], bodyOrientation[2], bodyOrientation[3]);
                const parent = transformNode.parent;
                // transform position/orientation in parent space
                if (parent && !parent.getWorldMatrix().isIdentity()) {
                    parent.computeWorldMatrix(true);
                    // Save scaling for future use
                    TmpVectors.Vector3[1].copyFrom(transformNode.scaling);
                    quat.normalize();
                    const finalTransform = TmpVectors.Matrix[0];
                    const finalTranslation = TmpVectors.Vector3[0];
                    finalTranslation.copyFromFloats(bodyTranslation[0], bodyTranslation[1], bodyTranslation[2]);
                    Matrix.ComposeToRef(transformNode.absoluteScaling, quat, finalTranslation, finalTransform);
                    const parentInverseTransform = TmpVectors.Matrix[1];
                    parent.getWorldMatrix().invertToRef(parentInverseTransform);
                    const localTransform = TmpVectors.Matrix[2];
                    finalTransform.multiplyToRef(parentInverseTransform, localTransform);
                    localTransform.decomposeToTransformNode(transformNode);
                    transformNode.rotationQuaternion?.normalize();
                    // Keep original scaling. Re-injecting scaling can introduce discontinuity between frames. Basically, it grows or shrinks.
                    transformNode.scaling.copyFrom(TmpVectors.Vector3[1]);
                }
                else {
                    transformNode.position.set(bodyTranslation[0], bodyTranslation[1], bodyTranslation[2]);
                    if (transformNode.rotationQuaternion) {
                        transformNode.rotationQuaternion.copyFrom(quat);
                    }
                    else {
                        quat.toEulerAnglesToRef(transformNode.rotation);
                    }
                }
            }
            catch (e) {
                Logger.Error(`Syncing transform failed for node ${transformNode.name}: ${e.message}...`);
            }
        }
    }
    /**
     * Sets the shape of a physics body.
     * @param body - The physics body to set the shape for.
     * @param shape - The physics shape to set.
     *
     * This function is used to set the shape of a physics body. It is useful for
     * creating a physics body with a specific shape, such as a box or a sphere,
     * which can then be used to simulate physical interactions in a physics engine.
     * This function is especially useful for meshes with multiple instances, as it
     * will set the shape for each instance of the mesh.
     */
    setShape(body, shape) {
        const shapeHandle = shape && shape._pluginData ? shape._pluginData : BigInt(0);
        if (!(body.transformNode instanceof Mesh) || !body.transformNode._thinInstanceDataStorage?.matrixData) {
            this._hknp.HP_Body_SetShape(body._pluginData.hpBodyId, shapeHandle);
            this._internalUpdateMassProperties(body._pluginData);
            return;
        }
        const m = body.transformNode;
        const instancesCount = m._thinInstanceDataStorage?.instancesCount ?? 0;
        for (let i = 0; i < instancesCount; i++) {
            this._hknp.HP_Body_SetShape(body._pluginDataInstances[i].hpBodyId, shapeHandle);
            this._internalUpdateMassProperties(body._pluginDataInstances[i]);
        }
    }
    /**
     * Returns a reference to the first instance of the plugin data for a physics body.
     * @param body
     * @param instanceIndex
     * @returns a reference to the first instance
     */
    _getPluginReference(body, instanceIndex) {
        return body._pluginDataInstances?.length ? body._pluginDataInstances[instanceIndex ?? 0] : body._pluginData;
    }
    /**
     * Gets the shape of a physics body. This will create a new shape object
     *
     * @param body - The physics body.
     * @returns The shape of the physics body.
     *
     */
    getShape(body) {
        const pluginRef = this._getPluginReference(body);
        const shapePluginData = this._hknp.HP_Body_GetShape(pluginRef.hpBodyId)[1];
        if (shapePluginData != 0) {
            const scene = body.transformNode.getScene();
            return new PhysicsShape({ pluginData: shapePluginData }, scene);
        }
        return null;
    }
    /**
     * Gets the type of a physics shape.
     * @param shape - The physics shape to get the type for.
     * @returns The type of the physics shape.
     *
     */
    getShapeType(shape) {
        if (shape.type) {
            return shape.type;
        }
        else {
            //<todo This returns a native type!
            return this._hknp.HP_Shape_GetType(shape._pluginData);
        }
    }
    /**
     * Sets the event mask of a physics body.
     * @param body - The physics body to set the event mask for.
     * @param eventMask - The event mask to set.
     * @param instanceIndex - The index of the instance to set the event mask for
     *
     * This function is useful for setting the event mask of a physics body, which is used to determine which events the body will respond to. This is important for ensuring that the physics engine is able to accurately simulate the behavior of the body in the game world.
     */
    setEventMask(body, eventMask, instanceIndex) {
        this._applyToBodyOrInstances(body, (bodyPluginData) => {
            this._hknp.HP_Body_SetEventMask(bodyPluginData.hpBodyId, eventMask);
        }, instanceIndex);
    }
    /**
     * Retrieves the event mask of a physics body.
     *
     * @param body - The physics body to retrieve the event mask from.
     * @param instanceIndex - The index of the instance to retrieve the event mask from.
     * @returns The event mask of the physics body.
     *
     */
    getEventMask(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        return this._hknp.HP_Body_GetEventMask(pluginRef.hpBodyId)[1];
    }
    _fromMassPropertiesTuple(massPropsTuple) {
        return {
            centerOfMass: Vector3.FromArray(massPropsTuple[0]),
            mass: massPropsTuple[1],
            inertia: Vector3.FromArray(massPropsTuple[2]),
            inertiaOrientation: Quaternion.FromArray(massPropsTuple[3]),
        };
    }
    _internalUpdateMassProperties(pluginData) {
        // Recompute the mass based on the shape
        const newProps = this._internalComputeMassProperties(pluginData);
        const massProps = pluginData.userMassProps;
        // Override the computed values with any the user has set
        if (massProps.centerOfMass) {
            newProps[0] = massProps.centerOfMass.asArray();
        }
        if (massProps.mass != undefined) {
            newProps[1] = massProps.mass;
        }
        if (massProps.inertia) {
            newProps[2] = massProps.inertia.asArray();
        }
        if (massProps.inertiaOrientation) {
            newProps[3] = massProps.inertiaOrientation.asArray();
        }
        this._hknp.HP_Body_SetMassProperties(pluginData.hpBodyId, newProps);
    }
    _internalSetMotionType(pluginData, motionType) {
        switch (motionType) {
            case 0 /* PhysicsMotionType.STATIC */:
                this._hknp.HP_Body_SetMotionType(pluginData.hpBodyId, this._hknp.MotionType.STATIC);
                break;
            case 1 /* PhysicsMotionType.ANIMATED */:
                this._hknp.HP_Body_SetMotionType(pluginData.hpBodyId, this._hknp.MotionType.KINEMATIC);
                break;
            case 2 /* PhysicsMotionType.DYNAMIC */:
                this._hknp.HP_Body_SetMotionType(pluginData.hpBodyId, this._hknp.MotionType.DYNAMIC);
                break;
        }
    }
    /**
     * sets the motion type of a physics body.
     * @param body - The physics body to set the motion type for.
     * @param motionType - The motion type to set.
     * @param instanceIndex - The index of the instance to set the motion type for. If undefined, the motion type of all the bodies will be set.
     */
    setMotionType(body, motionType, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginData) => {
            this._internalSetMotionType(pluginData, motionType);
        }, instanceIndex);
    }
    /**
     * Gets the motion type of a physics body.
     * @param body - The physics body to get the motion type from.
     * @param instanceIndex - The index of the instance to get the motion type from. If not specified, the motion type of the first instance will be returned.
     * @returns The motion type of the physics body.
     */
    getMotionType(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        const type = this._hknp.HP_Body_GetMotionType(pluginRef.hpBodyId)[1];
        switch (type) {
            case this._hknp.MotionType.STATIC:
                return 0 /* PhysicsMotionType.STATIC */;
            case this._hknp.MotionType.KINEMATIC:
                return 1 /* PhysicsMotionType.ANIMATED */;
            case this._hknp.MotionType.DYNAMIC:
                return 2 /* PhysicsMotionType.DYNAMIC */;
        }
        throw new Error("Unknown motion type: " + type);
    }
    /**
     * sets the activation control mode of a physics body, for instance if you need the body to never sleep.
     * @param body - The physics body to set the activation control mode.
     * @param controlMode - The activation control mode.
     */
    setActivationControl(body, controlMode) {
        switch (controlMode) {
            case 1 /* PhysicsActivationControl.ALWAYS_ACTIVE */:
                this._hknp.HP_Body_SetActivationControl(body._pluginData.hpBodyId, this._hknp.ActivationControl.ALWAYS_ACTIVE);
                break;
            case 2 /* PhysicsActivationControl.ALWAYS_INACTIVE */:
                this._hknp.HP_Body_SetActivationControl(body._pluginData.hpBodyId, this._hknp.ActivationControl.ALWAYS_INACTIVE);
                break;
            case 0 /* PhysicsActivationControl.SIMULATION_CONTROLLED */:
                this._hknp.HP_Body_SetActivationControl(body._pluginData.hpBodyId, this._hknp.ActivationControl.SIMULATION_CONTROLLED);
                break;
        }
    }
    _internalComputeMassProperties(pluginData) {
        const shapeRes = this._hknp.HP_Body_GetShape(pluginData.hpBodyId);
        if (shapeRes[0] == this._hknp.Result.RESULT_OK) {
            const shapeMass = this._hknp.HP_Shape_BuildMassProperties(shapeRes[1]);
            if (shapeMass[0] == this._hknp.Result.RESULT_OK) {
                return shapeMass[1];
            }
        }
        // Failed; return a unit inertia
        return [[0, 0, 0], 1, [1, 1, 1], [0, 0, 0, 1]];
    }
    /**
     * Computes the mass properties of a physics body, from it's shape
     *
     * @param body - The physics body to copmute the mass properties of
     * @param instanceIndex - The index of the instance to compute the mass properties of.
     * @returns The mass properties of the physics body.
     */
    computeMassProperties(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        const computed = this._internalComputeMassProperties(pluginRef);
        return this._fromMassPropertiesTuple(computed);
    }
    /**
     * Sets the mass properties of a physics body.
     *
     * @param body - The physics body to set the mass properties of.
     * @param massProps - The mass properties to set.
     * @param instanceIndex - The index of the instance to set the mass properties of. If undefined, the mass properties of all the bodies will be set.
     * This function is useful for setting the mass properties of a physics body,
     * such as its mass, inertia, and center of mass. This is important for
     * accurately simulating the physics of the body in the physics engine.
     *
     */
    setMassProperties(body, massProps, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginData) => {
            pluginData.userMassProps = massProps;
            this._internalUpdateMassProperties(pluginData);
        }, instanceIndex);
    }
    /**
     * Gets the mass properties of a physics body.
     * @param body - The physics body to get the mass properties from.
     * @param instanceIndex - The index of the instance to get the mass properties from. If not specified, the mass properties of the first instance will be returned.
     * @returns The mass properties of the physics body.
     */
    getMassProperties(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        const massPropsTuple = this._hknp.HP_Body_GetMassProperties(pluginRef.hpBodyId)[1];
        return this._fromMassPropertiesTuple(massPropsTuple);
    }
    /**
     * Sets the linear damping of the given body.
     * @param body - The body to set the linear damping for.
     * @param damping - The linear damping to set.
     * @param instanceIndex - The index of the instance to set the linear damping for. If not specified, the linear damping of the first instance will be set.
     *
     * This method is useful for controlling the linear damping of a body in a physics engine.
     * Linear damping is a force that opposes the motion of the body, and is proportional to the velocity of the body.
     * This method allows the user to set the linear damping of a body, which can be used to control the motion of the body.
     */
    setLinearDamping(body, damping, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginData) => {
            this._hknp.HP_Body_SetLinearDamping(pluginData.hpBodyId, damping);
        }, instanceIndex);
    }
    /**
     * Gets the linear damping of the given body.
     * @param body - The body to get the linear damping from.
     * @param instanceIndex - The index of the instance to get the linear damping from. If not specified, the linear damping of the first instance will be returned.
     * @returns The linear damping of the given body.
     *
     * This method is useful for getting the linear damping of a body in a physics engine.
     * Linear damping is a force that opposes the motion of the body and is proportional to the velocity of the body.
     * It is used to simulate the effects of air resistance and other forms of friction.
     */
    getLinearDamping(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        return this._hknp.HP_Body_GetLinearDamping(pluginRef.hpBodyId)[1];
    }
    /**
     * Sets the angular damping of a physics body.
     * @param body - The physics body to set the angular damping for.
     * @param damping - The angular damping value to set.
     * @param instanceIndex - The index of the instance to set the angular damping for. If not specified, the angular damping of the first instance will be set.
     *
     * This function is useful for controlling the angular velocity of a physics body.
     * By setting the angular damping, the body's angular velocity will be reduced over time, allowing for more realistic physics simulations.
     */
    setAngularDamping(body, damping, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginData) => {
            this._hknp.HP_Body_SetAngularDamping(pluginData.hpBodyId, damping);
        }, instanceIndex);
    }
    /**
     * Gets the angular damping of a physics body.
     * @param body - The physics body to get the angular damping from.
     * @param instanceIndex - The index of the instance to get the angular damping from. If not specified, the angular damping of the first instance will be returned.
     * @returns The angular damping of the body.
     *
     * This function is useful for retrieving the angular damping of a physics body,
     * which is used to control the rotational motion of the body. The angular damping is a value between 0 and 1, where 0 is no damping and 1 is full damping.
     */
    getAngularDamping(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        return this._hknp.HP_Body_GetAngularDamping(pluginRef.hpBodyId)[1];
    }
    /**
     * Sets the linear velocity of a physics body.
     * @param body - The physics body to set the linear velocity of.
     * @param linVel - The linear velocity to set.
     * @param instanceIndex - The index of the instance to set the linear velocity of. If not specified, the linear velocity of the first instance will be set.
     *
     * This function is useful for setting the linear velocity of a physics body, which is necessary for simulating
     * motion in a physics engine. The linear velocity is the speed and direction of the body's movement.
     */
    setLinearVelocity(body, linVel, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginData) => {
            this._hknp.HP_Body_SetLinearVelocity(pluginData.hpBodyId, this._bVecToV3(linVel));
        }, instanceIndex);
    }
    /**
     * Gets the linear velocity of a physics body and stores it in a given vector.
     * @param body - The physics body to get the linear velocity from.
     * @param linVel - The vector to store the linear velocity in.
     * @param instanceIndex - The index of the instance to get the linear velocity from. If not specified, the linear velocity of the first instance will be returned.
     *
     * This function is useful for retrieving the linear velocity of a physics body,
     * which can be used to determine the speed and direction of the body. This
     * information can be used to simulate realistic physics behavior in a game.
     */
    getLinearVelocityToRef(body, linVel, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        const lv = this._hknp.HP_Body_GetLinearVelocity(pluginRef.hpBodyId)[1];
        this._v3ToBvecRef(lv, linVel);
    }
    /*
     * Apply an operation either to all instances of a body, if instanceIndex is not specified, or to a specific instance.
     */
    _applyToBodyOrInstances(body, fnToApply, instanceIndex) {
        if (body._pluginDataInstances?.length > 0 && instanceIndex === undefined) {
            for (let i = 0; i < body._pluginDataInstances.length; i++) {
                fnToApply(body._pluginDataInstances[i]);
            }
        }
        else {
            fnToApply(this._getPluginReference(body, instanceIndex));
        }
    }
    /**
     * Applies an impulse to a physics body at a given location.
     * @param body - The physics body to apply the impulse to.
     * @param impulse - The impulse vector to apply.
     * @param location - The location in world space to apply the impulse.
     * @param instanceIndex - The index of the instance to apply the impulse to. If not specified, the impulse will be applied to all instances.
     *
     * This method is useful for applying an impulse to a physics body at a given location.
     * This can be used to simulate physical forces such as explosions, collisions, and gravity.
     */
    applyImpulse(body, impulse, location, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginRef) => {
            this._hknp.HP_Body_ApplyImpulse(pluginRef.hpBodyId, this._bVecToV3(location), this._bVecToV3(impulse));
        }, instanceIndex);
    }
    /**
     * Applies an angular impulse(torque) to a physics body
     * @param body - The physics body to apply the impulse to.
     * @param angularImpulse - The torque value
     * @param instanceIndex - The index of the instance to apply the impulse to. If not specified, the impulse will be applied to all instances.
     */
    applyAngularImpulse(body, angularImpulse, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginRef) => {
            this._hknp.HP_Body_ApplyAngularImpulse(pluginRef.hpBodyId, this._bVecToV3(angularImpulse));
        }, instanceIndex);
    }
    /**
     * Applies a force to a physics body at a given location.
     * @param body - The physics body to apply the impulse to.
     * @param force - The force vector to apply.
     * @param location - The location in world space to apply the impulse.
     * @param instanceIndex - The index of the instance to apply the force to. If not specified, the force will be applied to all instances.
     *
     * This method is useful for applying a force to a physics body at a given location.
     * This can be used to simulate physical forces such as explosions, collisions, and gravity.
     */
    applyForce(body, force, location, instanceIndex) {
        force.scaleToRef(this.getTimeStep(), this._tmpVec3[0]);
        this.applyImpulse(body, this._tmpVec3[0], location, instanceIndex);
    }
    /**
     * Sets the angular velocity of a physics body.
     *
     * @param body - The physics body to set the angular velocity of.
     * @param angVel - The angular velocity to set.
     * @param instanceIndex - The index of the instance to set the angular velocity of. If not specified, the angular velocity of the first instance will be set.
     *
     * This function is useful for setting the angular velocity of a physics body in a physics engine.
     * This allows for more realistic simulations of physical objects, as they can be given a rotational velocity.
     */
    setAngularVelocity(body, angVel, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginRef) => {
            this._hknp.HP_Body_SetAngularVelocity(pluginRef.hpBodyId, this._bVecToV3(angVel));
        }, instanceIndex);
    }
    /**
     * Gets the angular velocity of a body.
     * @param body - The body to get the angular velocity from.
     * @param angVel - The vector3 to store the angular velocity.
     * @param instanceIndex - The index of the instance to get the angular velocity from. If not specified, the angular velocity of the first instance will be returned.
     *
     * This method is useful for getting the angular velocity of a body in a physics engine. It
     * takes the body and a vector3 as parameters and stores the angular velocity of the body
     * in the vector3. This is useful for getting the angular velocity of a body in order to
     * calculate the motion of the body in the physics engine.
     */
    getAngularVelocityToRef(body, angVel, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        const av = this._hknp.HP_Body_GetAngularVelocity(pluginRef.hpBodyId)[1];
        this._v3ToBvecRef(av, angVel);
    }
    /**
     * Sets the transformation of the given physics body to the given transform node.
     * @param body The physics body to set the transformation for.
     * @param node The transform node to set the transformation from.
     * Sets the transformation of the given physics body to the given transform node.
     *
     * This function is useful for setting the transformation of a physics body to a
     * transform node, which is necessary for the physics engine to accurately simulate
     * the motion of the body. It also takes into account instances of the transform
     * node, which is necessary for accurate simulation of multiple bodies with the
     * same transformation.
     */
    setPhysicsBodyTransformation(body, node) {
        if (body.getPrestepType() == PhysicsPrestepType.TELEPORT) {
            const transformNode = body.transformNode;
            if (body.numInstances > 0) {
                // instances
                const m = transformNode;
                const matrixData = m._thinInstanceDataStorage.matrixData;
                if (!matrixData) {
                    return; // TODO: error handling
                }
                const instancesCount = body.numInstances;
                this._createOrUpdateBodyInstances(body, body.getMotionType(), matrixData, 0, instancesCount, true);
            }
            else {
                // regular
                this._hknp.HP_Body_SetQTransform(body._pluginData.hpBodyId, this._getTransformInfos(node));
            }
        }
        else if (body.getPrestepType() == PhysicsPrestepType.ACTION) {
            this.setTargetTransform(body, node.absolutePosition, node.absoluteRotationQuaternion);
        }
        else if (body.getPrestepType() == PhysicsPrestepType.DISABLED) {
            Logger.Warn("Prestep type is set to DISABLED. Unable to set physics body transformation.");
        }
        else {
            Logger.Warn("Invalid prestep type set to physics body.");
        }
    }
    /**
     * Set the target transformation (position and rotation) of the body, such that the body will set its velocity to reach that target
     * @param body The physics body to set the target transformation for.
     * @param position The target position
     * @param rotation The target rotation
     * @param instanceIndex The index of the instance in an instanced body
     */
    setTargetTransform(body, position, rotation, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginRef) => {
            this._hknp.HP_Body_SetTargetQTransform(pluginRef.hpBodyId, [this._bVecToV3(position), this._bQuatToV4(rotation)]);
        }, instanceIndex);
    }
    /**
     * Sets the gravity factor of a body
     * @param body the physics body to set the gravity factor for
     * @param factor the gravity factor
     * @param instanceIndex the index of the instance in an instanced body
     */
    setGravityFactor(body, factor, instanceIndex) {
        this._applyToBodyOrInstances(body, (pluginRef) => {
            this._hknp.HP_Body_SetGravityFactor(pluginRef.hpBodyId, factor);
        }, instanceIndex);
    }
    /**
     * Get the gravity factor of a body
     * @param body the physics body to get the gravity factor from
     * @param instanceIndex the index of the instance in an instanced body. If not specified, the gravity factor of the first instance will be returned.
     * @returns the gravity factor
     */
    getGravityFactor(body, instanceIndex) {
        const pluginRef = this._getPluginReference(body, instanceIndex);
        return this._hknp.HP_Body_GetGravityFactor(pluginRef.hpBodyId)[1];
    }
    /**
     * Disposes a physics body.
     *
     * @param body - The physics body to dispose.
     *
     * This method is useful for releasing the resources associated with a physics body when it is no longer needed.
     * This is important for avoiding memory leaks in the physics engine.
     */
    disposeBody(body) {
        if (body._pluginDataInstances && body._pluginDataInstances.length > 0) {
            for (const instance of body._pluginDataInstances) {
                this._hknp.HP_Body_Release(instance.hpBodyId);
                instance.hpBodyId = undefined;
            }
        }
        if (body._pluginData) {
            this._hknp.HP_Body_Release(body._pluginData.hpBodyId);
            body._pluginData.hpBodyId = undefined;
        }
    }
    _createOptionsFromGroundMesh(options) {
        const mesh = options.groundMesh;
        if (!mesh) {
            return;
        }
        let pos = mesh.getVerticesData(VertexBuffer.PositionKind);
        const transform = mesh.computeWorldMatrix(true);
        // convert rawVerts to object space
        const transformedVertices = [];
        let index;
        for (index = 0; index < pos.length; index += 3) {
            Vector3.FromArrayToRef(pos, index, TmpVectors.Vector3[0]);
            Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[0], transform, TmpVectors.Vector3[1]);
            TmpVectors.Vector3[1].toArray(transformedVertices, index);
        }
        pos = transformedVertices;
        const arraySize = ~~(Math.sqrt(pos.length / 3) - 1);
        const boundingInfo = mesh.getBoundingInfo();
        const dim = Math.min(boundingInfo.boundingBox.extendSizeWorld.x, boundingInfo.boundingBox.extendSizeWorld.z);
        const minX = boundingInfo.boundingBox.minimumWorld.x;
        const minY = boundingInfo.boundingBox.minimumWorld.y;
        const minZ = boundingInfo.boundingBox.minimumWorld.z;
        const matrix = new Float32Array((arraySize + 1) * (arraySize + 1));
        const elementSize = (dim * 2) / arraySize;
        for (let i = 0; i < matrix.length; i++) {
            matrix[i] = minY;
        }
        for (let i = 0; i < pos.length; i = i + 3) {
            const x = Math.round((pos[i + 0] - minX) / elementSize);
            const z = arraySize - Math.round((pos[i + 2] - minZ) / elementSize);
            const y = pos[i + 1] - minY;
            matrix[z * (arraySize + 1) + x] = y;
        }
        options.numHeightFieldSamplesX = arraySize + 1;
        options.numHeightFieldSamplesZ = arraySize + 1;
        options.heightFieldSizeX = boundingInfo.boundingBox.extendSizeWorld.x * 2;
        options.heightFieldSizeZ = boundingInfo.boundingBox.extendSizeWorld.z * 2;
        options.heightFieldData = matrix;
    }
    /**
     * Initializes a physics shape with the given type and parameters.
     * @param shape - The physics shape to initialize.
     * @param type - The type of shape to initialize.
     * @param options - The parameters for the shape.
     *
     * This code is useful for initializing a physics shape with the given type and parameters.
     * It allows for the creation of a sphere, box, capsule, container, cylinder, mesh, and heightfield.
     * Depending on the type of shape, different parameters are required.
     * For example, a sphere requires a radius, while a box requires extents and a rotation.
     */
    initShape(shape, type, options) {
        switch (type) {
            case 0 /* PhysicsShapeType.SPHERE */:
                {
                    const radius = options.radius || 1;
                    const center = options.center ? this._bVecToV3(options.center) : [0, 0, 0];
                    shape._pluginData = this._hknp.HP_Shape_CreateSphere(center, radius)[1];
                }
                break;
            case 3 /* PhysicsShapeType.BOX */:
                {
                    const rotation = options.rotation ? this._bQuatToV4(options.rotation) : [0, 0, 0, 1];
                    const extent = options.extents ? this._bVecToV3(options.extents) : [1, 1, 1];
                    const center = options.center ? this._bVecToV3(options.center) : [0, 0, 0];
                    shape._pluginData = this._hknp.HP_Shape_CreateBox(center, rotation, extent)[1];
                }
                break;
            case 1 /* PhysicsShapeType.CAPSULE */:
                {
                    const pointA = options.pointA ? this._bVecToV3(options.pointA) : [0, 0, 0];
                    const pointB = options.pointB ? this._bVecToV3(options.pointB) : [0, 1, 0];
                    const radius = options.radius || 0;
                    shape._pluginData = this._hknp.HP_Shape_CreateCapsule(pointA, pointB, radius)[1];
                }
                break;
            case 5 /* PhysicsShapeType.CONTAINER */:
                {
                    shape._pluginData = this._hknp.HP_Shape_CreateContainer()[1];
                }
                break;
            case 2 /* PhysicsShapeType.CYLINDER */:
                {
                    const pointA = options.pointA ? this._bVecToV3(options.pointA) : [0, 0, 0];
                    const pointB = options.pointB ? this._bVecToV3(options.pointB) : [0, 1, 0];
                    const radius = options.radius || 0;
                    shape._pluginData = this._hknp.HP_Shape_CreateCylinder(pointA, pointB, radius)[1];
                }
                break;
            case 4 /* PhysicsShapeType.CONVEX_HULL */:
            case 6 /* PhysicsShapeType.MESH */:
                {
                    const mesh = options.mesh;
                    if (mesh) {
                        const includeChildMeshes = !!options.includeChildMeshes;
                        const needIndices = type != 4 /* PhysicsShapeType.CONVEX_HULL */;
                        const accum = new MeshAccumulator(mesh, needIndices, mesh?.getScene());
                        accum.addNodeMeshes(mesh, includeChildMeshes);
                        const positions = accum.getVertices(this._hknp);
                        const numVec3s = positions.numObjects / 3;
                        if (type == 4 /* PhysicsShapeType.CONVEX_HULL */) {
                            shape._pluginData = this._hknp.HP_Shape_CreateConvexHull(positions.offset, numVec3s)[1];
                        }
                        else {
                            const triangles = accum.getTriangles(this._hknp);
                            const numTriangles = triangles.numObjects / 3;
                            shape._pluginData = this._hknp.HP_Shape_CreateMesh(positions.offset, numVec3s, triangles.offset, numTriangles)[1];
                            accum.freeBuffer(this._hknp, triangles);
                        }
                        accum.freeBuffer(this._hknp, positions);
                    }
                    else {
                        throw new Error("No mesh provided to create physics shape.");
                    }
                }
                break;
            case 7 /* PhysicsShapeType.HEIGHTFIELD */:
                {
                    if (options.groundMesh) {
                        // update options with datas from groundMesh
                        this._createOptionsFromGroundMesh(options);
                    }
                    if (options.numHeightFieldSamplesX && options.numHeightFieldSamplesZ && options.heightFieldSizeX && options.heightFieldSizeZ && options.heightFieldData) {
                        const totalNumHeights = options.numHeightFieldSamplesX * options.numHeightFieldSamplesZ;
                        const numBytes = totalNumHeights * 4;
                        const bufferBegin = this._hknp._malloc(numBytes);
                        const heightBuffer = new Float32Array(this._hknp.HEAPU8.buffer, bufferBegin, totalNumHeights);
                        for (let x = 0; x < options.numHeightFieldSamplesX; x++) {
                            for (let z = 0; z < options.numHeightFieldSamplesZ; z++) {
                                const hkBufferIndex = z * options.numHeightFieldSamplesX + x;
                                const bjsBufferIndex = (options.numHeightFieldSamplesX - 1 - x) * options.numHeightFieldSamplesZ + z;
                                heightBuffer[hkBufferIndex] = options.heightFieldData[bjsBufferIndex];
                            }
                        }
                        const scaleX = options.heightFieldSizeX / (options.numHeightFieldSamplesX - 1);
                        const scaleZ = options.heightFieldSizeZ / (options.numHeightFieldSamplesZ - 1);
                        shape._pluginData = this._hknp.HP_Shape_CreateHeightField(options.numHeightFieldSamplesX, options.numHeightFieldSamplesZ, [scaleX, 1, scaleZ], bufferBegin)[1];
                        this._hknp._free(bufferBegin);
                    }
                    else {
                        throw new Error("Missing required heightfield parameters");
                    }
                }
                break;
            default:
                throw new Error("Unsupported Shape Type.");
                break;
        }
        this._shapes.set(shape._pluginData[0], shape);
    }
    /**
     * Sets the shape filter membership mask of a body
     * @param shape - The physics body to set the shape filter membership mask for.
     * @param membershipMask - The shape filter membership mask to set.
     */
    setShapeFilterMembershipMask(shape, membershipMask) {
        const collideWith = this._hknp.HP_Shape_GetFilterInfo(shape._pluginData)[1][1];
        this._hknp.HP_Shape_SetFilterInfo(shape._pluginData, [membershipMask, collideWith]);
    }
    /**
     * Gets the shape filter membership mask of a body
     * @param shape - The physics body to get the shape filter membership mask from.
     * @returns The shape filter membership mask of the given body.
     */
    getShapeFilterMembershipMask(shape) {
        return this._hknp.HP_Shape_GetFilterInfo(shape._pluginData)[1][0];
    }
    /**
     * Sets the shape filter collide mask of a body
     * @param shape - The physics body to set the shape filter collide mask for.
     * @param collideMask - The shape filter collide mask to set.
     */
    setShapeFilterCollideMask(shape, collideMask) {
        const membership = this._hknp.HP_Shape_GetFilterInfo(shape._pluginData)[1][0];
        this._hknp.HP_Shape_SetFilterInfo(shape._pluginData, [membership, collideMask]);
    }
    /**
     * Gets the shape filter collide mask of a body
     * @param shape - The physics body to get the shape filter collide mask from.
     * @returns The shape filter collide mask of the given body.
     */
    getShapeFilterCollideMask(shape) {
        return this._hknp.HP_Shape_GetFilterInfo(shape._pluginData)[1][1];
    }
    /**
     * Sets the material of a physics shape.
     * @param shape - The physics shape to set the material of.
     * @param material - The material to set.
     *
     */
    setMaterial(shape, material) {
        const dynamicFriction = material.friction ?? 0.5;
        const staticFriction = material.staticFriction ?? dynamicFriction;
        const restitution = material.restitution ?? 0.0;
        const frictionCombine = material.frictionCombine ?? 1 /* PhysicsMaterialCombineMode.MINIMUM */;
        const restitutionCombine = material.restitutionCombine ?? 2 /* PhysicsMaterialCombineMode.MAXIMUM */;
        const hpMaterial = [staticFriction, dynamicFriction, restitution, this._materialCombineToNative(frictionCombine), this._materialCombineToNative(restitutionCombine)];
        this._hknp.HP_Shape_SetMaterial(shape._pluginData, hpMaterial);
    }
    /**
     * Gets the material associated with a physics shape.
     * @param shape - The shape to get the material from.
     * @returns The material associated with the shape.
     */
    getMaterial(shape) {
        const hkMaterial = this._hknp.HP_Shape_GetMaterial(shape._pluginData)[1];
        return {
            staticFriction: hkMaterial[0],
            friction: hkMaterial[1],
            restitution: hkMaterial[2],
            frictionCombine: this._nativeToMaterialCombine(hkMaterial[3]),
            restitutionCombine: this._nativeToMaterialCombine(hkMaterial[4]),
        };
    }
    /**
     * Sets the density of a physics shape.
     * @param shape - The physics shape to set the density of.
     * @param density - The density to set.
     *
     */
    setDensity(shape, density) {
        this._hknp.HP_Shape_SetDensity(shape._pluginData, density);
    }
    /**
     * Calculates the density of a given physics shape.
     *
     * @param shape - The physics shape to calculate the density of.
     * @returns The density of the given physics shape.
     *
     */
    getDensity(shape) {
        return this._hknp.HP_Shape_GetDensity(shape._pluginData)[1];
    }
    /**
     * Gets the transform infos of a given transform node.
     * This code is useful for getting the position and orientation of a given transform node.
     * It first checks if the node has a rotation quaternion, and if not, it creates one from the node's rotation.
     * It then creates an array containing the position and orientation of the node and returns it.
     * @param node - The transform node.
     * @returns An array containing the position and orientation of the node.
     */
    _getTransformInfos(node) {
        if (node.parent) {
            node.computeWorldMatrix(true);
            return [this._bVecToV3(node.absolutePosition), this._bQuatToV4(node.absoluteRotationQuaternion)];
        }
        let orientation = TmpVectors.Quaternion[0];
        if (node.rotationQuaternion) {
            orientation = node.rotationQuaternion;
        }
        else {
            const r = node.rotation;
            Quaternion.FromEulerAnglesToRef(r.x, r.y, r.z, orientation);
        }
        const transform = [this._bVecToV3(node.position), this._bQuatToV4(orientation)];
        return transform;
    }
    /**
     * Adds a child shape to the given shape.
     * @param shape - The parent shape.
     * @param newChild - The child shape to add.
     * @param translation - The relative translation of the child from the parent shape
     * @param rotation - The relative rotation of the child from the parent shape
     * @param scale - The relative scale scale of the child from the parent shaep
     *
     */
    addChild(shape, newChild, translation, rotation, scale) {
        const transformNative = [
            translation ? this._bVecToV3(translation) : [0, 0, 0],
            rotation ? this._bQuatToV4(rotation) : [0, 0, 0, 1],
            scale ? this._bVecToV3(scale) : [1, 1, 1],
        ];
        this._hknp.HP_Shape_AddChild(shape._pluginData, newChild._pluginData, transformNative);
    }
    /**
     * Removes a child shape from a parent shape.
     * @param shape - The parent shape.
     * @param childIndex - The index of the child shape to remove.
     *
     */
    removeChild(shape, childIndex) {
        this._hknp.HP_Shape_RemoveChild(shape._pluginData, childIndex);
    }
    /**
     * Returns the number of children of the given shape.
     *
     * @param shape - The shape to get the number of children from.
     * @returns The number of children of the given shape.
     *
     */
    getNumChildren(shape) {
        return this._hknp.HP_Shape_GetNumChildren(shape._pluginData)[1];
    }
    /**
     * Marks the shape as a trigger
     * @param shape the shape to mark as a trigger
     * @param isTrigger if the shape is a trigger
     */
    setTrigger(shape, isTrigger) {
        this._hknp.HP_Shape_SetTrigger(shape._pluginData, isTrigger);
    }
    /**
     * Calculates the bounding box of a given physics shape.
     *
     * @param _shape - The physics shape to calculate the bounding box for.
     * @returns The calculated bounding box.
     *
     * This method is useful for physics engines as it allows to calculate the
     * boundaries of a given shape. Knowing the boundaries of a shape is important
     * for collision detection and other physics calculations.
     */
    getBoundingBox(_shape) {
        // get local AABB
        const aabb = this._hknp.HP_Shape_GetBoundingBox(_shape._pluginData, [
            [0, 0, 0],
            [0, 0, 0, 1],
        ])[1];
        TmpVectors.Vector3[0].set(aabb[0][0], aabb[0][1], aabb[0][2]); // min
        TmpVectors.Vector3[1].set(aabb[1][0], aabb[1][1], aabb[1][2]); // max
        const boundingbox = new BoundingBox(TmpVectors.Vector3[0], TmpVectors.Vector3[1], Matrix.IdentityReadOnly);
        return boundingbox;
    }
    /**
     * Calculates the world bounding box of a given physics body.
     *
     * @param body - The physics body to calculate the bounding box for.
     * @returns The calculated bounding box.
     *
     * This method is useful for physics engines as it allows to calculate the
     * boundaries of a given body.
     */
    getBodyBoundingBox(body) {
        // get local AABB
        const aabb = this.getBoundingBox(body.shape);
        const boundingbox = new BoundingBox(aabb.minimum, aabb.maximum, body.transformNode.getWorldMatrix());
        return boundingbox;
    }
    /**
     * Gets the geometry of a physics body.
     *
     * @param body - The physics body.
     * @returns An object containing the positions and indices of the body's geometry.
     *
     */
    getBodyGeometry(body) {
        const dataInfo = body._pluginDataInstances?.length > 0 ? body._pluginDataInstances[0] : body._pluginData;
        const shape = this._hknp.HP_Body_GetShape(dataInfo.hpBodyId)[1];
        const geometryRes = this._hknp.HP_Shape_CreateDebugDisplayGeometry(shape);
        if (geometryRes[0] != this._hknp.Result.RESULT_OK) {
            return { positions: [], indices: [] };
        }
        const geometryInfo = this._hknp.HP_DebugGeometry_GetInfo(geometryRes[1])[1];
        const positionsInPlugin = new Float32Array(this._hknp.HEAPU8.buffer, geometryInfo[0], geometryInfo[1] * 3); // 3 floats per position
        const indicesInPlugin = new Uint32Array(this._hknp.HEAPU8.buffer, geometryInfo[2], geometryInfo[3] * 3); // 3 indices per triangle
        // HP_DebugGeometry_Release will free the buffer in the plugin. To avoid a
        // use-after-free, we need  to make a copy of the data here.
        const positions = positionsInPlugin.slice(0);
        const indices = indicesInPlugin.slice(0);
        this._hknp.HP_DebugGeometry_Release(geometryRes[1]);
        return { positions: positions, indices: indices };
    }
    /**
     * Releases a physics shape from the physics engine.
     *
     * @param shape - The physics shape to be released.
     *
     * This method is useful for releasing a physics shape from the physics engine, freeing up resources and preventing memory leaks.
     */
    disposeShape(shape) {
        this._hknp.HP_Shape_Release(shape._pluginData);
        shape._pluginData = undefined;
    }
    // constraint
    /**
     * Initializes a physics constraint with the given parameters.
     *
     * @param constraint - The physics constraint to be initialized.
     * @param body - The main body
     * @param childBody - The child body.
     * @param instanceIndex - If this body is instanced, the index of the instance to which the constraint will be applied. If not specified, no constraint will be applied.
     * @param childInstanceIndex - If the child body is instanced, the index of the instance to which the constraint will be applied. If not specified, no constraint will be applied.
     *
     * This function is useful for setting up a physics constraint in a physics engine.
     */
    initConstraint(constraint, body, childBody, instanceIndex, childInstanceIndex) {
        const type = constraint.type;
        const options = constraint.options;
        if (!type || !options) {
            Logger.Warn("No constraint type or options. Constraint is invalid.");
            return;
        }
        if ((body._pluginDataInstances.length > 0 && instanceIndex === undefined) || (childBody._pluginDataInstances.length > 0 && childInstanceIndex === undefined)) {
            Logger.Warn("Body is instanced but no instance index was specified. Constraint will not be applied.");
            return;
        }
        constraint._pluginData = constraint._pluginData ?? [];
        const jointId = this._hknp.HP_Constraint_Create()[1];
        constraint._pluginData.push(jointId);
        // body parenting
        const bodyA = this._getPluginReference(body, instanceIndex).hpBodyId;
        const bodyB = this._getPluginReference(childBody, childInstanceIndex).hpBodyId;
        this._hknp.HP_Constraint_SetParentBody(jointId, bodyA);
        this._hknp.HP_Constraint_SetChildBody(jointId, bodyB);
        this._constraintToBodyIdPair.set(jointId[0], [bodyA[0], bodyB[0]]);
        // anchors
        const pivotA = options.pivotA ? this._bVecToV3(options.pivotA) : this._bVecToV3(Vector3.Zero());
        const axisA = options.axisA ?? new Vector3(1, 0, 0);
        const perpAxisA = this._tmpVec3[0];
        if (options.perpAxisA) {
            perpAxisA.copyFrom(options.perpAxisA);
        }
        else {
            axisA.getNormalToRef(perpAxisA);
        }
        this._hknp.HP_Constraint_SetAnchorInParent(jointId, pivotA, this._bVecToV3(axisA), this._bVecToV3(perpAxisA));
        const pivotB = options.pivotB ? this._bVecToV3(options.pivotB) : this._bVecToV3(Vector3.Zero());
        const axisB = options.axisB ?? new Vector3(1, 0, 0);
        const perpAxisB = this._tmpVec3[0];
        if (options.perpAxisB) {
            perpAxisB.copyFrom(options.perpAxisB);
        }
        else {
            axisB.getNormalToRef(perpAxisB);
        }
        this._hknp.HP_Constraint_SetAnchorInChild(jointId, pivotB, this._bVecToV3(axisB), this._bVecToV3(perpAxisB));
        // Save the options that were used for initializing the constraint for debugging purposes
        // Check first to avoid copying the same options multiple times
        if (!constraint._initOptions) {
            constraint._initOptions = {
                axisA: axisA.clone(),
                axisB: axisB.clone(),
                perpAxisA: perpAxisA.clone(),
                perpAxisB: perpAxisB.clone(),
                pivotA: new Vector3(pivotA[0], pivotA[1], pivotA[2]),
                pivotB: new Vector3(pivotB[0], pivotB[1], pivotB[2]),
            };
        }
        if (type == 5 /* PhysicsConstraintType.LOCK */) {
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_X, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_X, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
        }
        else if (type == 2 /* PhysicsConstraintType.DISTANCE */) {
            const distance = options.maxDistance || 0;
            const dist3d = this._hknp.ConstraintAxis.LINEAR_DISTANCE;
            this._hknp.HP_Constraint_SetAxisMode(jointId, dist3d, this._hknp.ConstraintAxisLimitMode.LIMITED);
            this._hknp.HP_Constraint_SetAxisMinLimit(jointId, dist3d, distance);
            this._hknp.HP_Constraint_SetAxisMaxLimit(jointId, dist3d, distance);
        }
        else if (type == 3 /* PhysicsConstraintType.HINGE */) {
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_X, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
        }
        else if (type == 6 /* PhysicsConstraintType.PRISMATIC */) {
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_X, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
        }
        else if (type == 4 /* PhysicsConstraintType.SLIDER */) {
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.ANGULAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
        }
        else if (type == 1 /* PhysicsConstraintType.BALL_AND_SOCKET */) {
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_X, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Y, this._hknp.ConstraintAxisLimitMode.LOCKED);
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._hknp.ConstraintAxis.LINEAR_Z, this._hknp.ConstraintAxisLimitMode.LOCKED);
        }
        else if (type == 7 /* PhysicsConstraintType.SIX_DOF */) {
            const sixdofData = constraint;
            for (const l of sixdofData.limits) {
                const axId = this._constraintAxisToNative(l.axis);
                if ((l.minLimit ?? -1) == 0 && (l.maxLimit ?? -1) == 0) {
                    this._hknp.HP_Constraint_SetAxisMode(jointId, axId, this._hknp.ConstraintAxisLimitMode.LOCKED);
                }
                else {
                    if (l.minLimit != undefined) {
                        this._hknp.HP_Constraint_SetAxisMode(jointId, axId, this._hknp.ConstraintAxisLimitMode.LIMITED);
                        this._hknp.HP_Constraint_SetAxisMinLimit(jointId, axId, l.minLimit);
                    }
                    if (l.maxLimit != undefined) {
                        this._hknp.HP_Constraint_SetAxisMode(jointId, axId, this._hknp.ConstraintAxisLimitMode.LIMITED);
                        this._hknp.HP_Constraint_SetAxisMaxLimit(jointId, axId, l.maxLimit);
                    }
                }
                if (l.stiffness) {
                    this._hknp.HP_Constraint_SetAxisStiffness(jointId, axId, l.stiffness);
                }
                if (l.damping) {
                    this._hknp.HP_Constraint_SetAxisDamping(jointId, axId, l.damping);
                }
            }
        }
        else {
            throw new Error("Unsupported Constraint Type.");
        }
        const collisionEnabled = !!options.collision;
        this._hknp.HP_Constraint_SetCollisionsEnabled(jointId, collisionEnabled);
        this._hknp.HP_Constraint_SetEnabled(jointId, true);
    }
    /**
     * Get a list of all the pairs of bodies that are connected by this constraint.
     * @param constraint the constraint to search from
     * @returns a list of parent, child pairs
     */
    getBodiesUsingConstraint(constraint) {
        const pairs = [];
        for (const jointId of constraint._pluginData) {
            const bodyIds = this._constraintToBodyIdPair.get(jointId[0]);
            if (bodyIds) {
                const parentBodyInfo = this._bodies.get(bodyIds[0]);
                const childBodyInfo = this._bodies.get(bodyIds[1]);
                if (parentBodyInfo && childBodyInfo) {
                    pairs.push({ parentBody: parentBodyInfo.body, parentBodyIndex: parentBodyInfo.index, childBody: childBodyInfo.body, childBodyIndex: childBodyInfo.index });
                }
            }
        }
        return pairs;
    }
    /**
     * Adds a constraint to the physics engine.
     *
     * @param body - The main body to which the constraint is applied.
     * @param childBody - The body to which the constraint is applied.
     * @param constraint - The constraint to be applied.
     * @param instanceIndex - If this body is instanced, the index of the instance to which the constraint will be applied. If not specified, no constraint will be applied.
     * @param childInstanceIndex - If the child body is instanced, the index of the instance to which the constraint will be applied. If not specified, no constraint will be applied.
     */
    addConstraint(body, childBody, constraint, instanceIndex, childInstanceIndex) {
        //<todo It's real weird that initConstraint() is called only after adding to a body!
        this.initConstraint(constraint, body, childBody, instanceIndex, childInstanceIndex);
    }
    /**
     * Enables or disables a constraint in the physics engine.
     * @param constraint - The constraint to enable or disable.
     * @param isEnabled - Whether the constraint should be enabled or disabled.
     *
     */
    setEnabled(constraint, isEnabled) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetEnabled(jointId, isEnabled);
        }
    }
    /**
     * Gets the enabled state of the given constraint.
     * @param constraint - The constraint to get the enabled state from.
     * @returns The enabled state of the given constraint.
     *
     */
    getEnabled(constraint) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetEnabled(firstId)[1];
        }
        return false;
    }
    /**
     * Enables or disables collisions for the given constraint.
     * @param constraint - The constraint to enable or disable collisions for.
     * @param isEnabled - Whether collisions should be enabled or disabled.
     *
     */
    setCollisionsEnabled(constraint, isEnabled) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetCollisionsEnabled(jointId, isEnabled);
        }
    }
    /**
     * Gets whether collisions are enabled for the given constraint.
     * @param constraint - The constraint to get collisions enabled for.
     * @returns Whether collisions are enabled for the given constraint.
     *
     */
    getCollisionsEnabled(constraint) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetCollisionsEnabled(firstId)[1];
        }
        return false;
    }
    /**
     * Sets the friction of the given axis of the given constraint.
     *
     * @param constraint - The constraint to set the friction of.
     * @param axis - The axis of the constraint to set the friction of.
     * @param friction - The friction to set.
     *
     */
    setAxisFriction(constraint, axis, friction) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisFriction(jointId, this._constraintAxisToNative(axis), friction);
        }
    }
    /**
     * Gets the friction value of the specified axis of the given constraint.
     *
     * @param constraint - The constraint to get the axis friction from.
     * @param axis - The axis to get the friction from.
     * @returns The friction value of the specified axis.
     *
     */
    getAxisFriction(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetAxisFriction(firstId, this._constraintAxisToNative(axis))[1];
        }
        return null;
    }
    /**
     * Sets the limit mode of the specified axis of the given constraint.
     * @param constraint - The constraint to set the axis mode of.
     * @param axis - The axis to set the limit mode of.
     * @param limitMode - The limit mode to set.
     */
    setAxisMode(constraint, axis, limitMode) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisMode(jointId, this._constraintAxisToNative(axis), this._limitModeToNative(limitMode));
        }
    }
    /**
     * Gets the axis limit mode of the given constraint.
     *
     * @param constraint - The constraint to get the axis limit mode from.
     * @param axis - The axis to get the limit mode from.
     * @returns The axis limit mode of the given constraint.
     *
     */
    getAxisMode(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            const mode = this._hknp.HP_Constraint_GetAxisMode(firstId, this._constraintAxisToNative(axis))[1];
            return this._nativeToLimitMode(mode);
        }
        return null;
    }
    /**
     * Sets the minimum limit of the given axis of the given constraint.
     * @param constraint - The constraint to set the minimum limit of.
     * @param axis - The axis to set the minimum limit of.
     * @param limit - The minimum limit to set.
     *
     */
    setAxisMinLimit(constraint, axis, limit) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisMinLimit(jointId, this._constraintAxisToNative(axis), limit);
        }
    }
    /**
     * Gets the minimum limit of the specified axis of the given constraint.
     * @param constraint - The constraint to get the minimum limit from.
     * @param axis - The axis to get the minimum limit from.
     * @returns The minimum limit of the specified axis of the given constraint.
     *
     */
    getAxisMinLimit(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetAxisMinLimit(firstId, this._constraintAxisToNative(axis))[1];
        }
        return null;
    }
    /**
     * Sets the maximum limit of the given axis of the given constraint.
     * @param constraint - The constraint to set the maximum limit of the given axis.
     * @param axis - The axis to set the maximum limit of.
     * @param limit - The maximum limit to set.
     *
     */
    setAxisMaxLimit(constraint, axis, limit) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisMaxLimit(jointId, this._constraintAxisToNative(axis), limit);
        }
    }
    /**
     * Gets the maximum limit of the given axis of the given constraint.
     *
     * @param constraint - The constraint to get the maximum limit from.
     * @param axis - The axis to get the maximum limit from.
     * @returns The maximum limit of the given axis of the given constraint.
     *
     */
    getAxisMaxLimit(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetAxisMaxLimit(firstId, this._constraintAxisToNative(axis))[1];
        }
        return null;
    }
    /**
     * Sets the motor type of the given axis of the given constraint.
     * @param constraint - The constraint to set the motor type of.
     * @param axis - The axis of the constraint to set the motor type of.
     * @param motorType - The motor type to set.
     *
     */
    setAxisMotorType(constraint, axis, motorType) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisMotorType(jointId, this._constraintAxisToNative(axis), this._constraintMotorTypeToNative(motorType));
        }
    }
    /**
     * Gets the motor type of the specified axis of the given constraint.
     * @param constraint - The constraint to get the motor type from.
     * @param axis - The axis of the constraint to get the motor type from.
     * @returns The motor type of the specified axis of the given constraint.
     *
     */
    getAxisMotorType(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._nativeToMotorType(this._hknp.HP_Constraint_GetAxisMotorType(firstId, this._constraintAxisToNative(axis))[1]);
        }
        return null;
    }
    /**
     * Sets the target of an axis motor of a constraint.
     *
     * @param constraint - The constraint to set the axis motor target of.
     * @param axis - The axis of the constraint to set the motor target of.
     * @param target - The target of the axis motor.
     *
     */
    setAxisMotorTarget(constraint, axis, target) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisMotorTarget(jointId, this._constraintAxisToNative(axis), target);
        }
    }
    /**
     * Gets the target of the motor of the given axis of the given constraint.
     *
     * @param constraint - The constraint to get the motor target from.
     * @param axis - The axis of the constraint to get the motor target from.
     * @returns The target of the motor of the given axis of the given constraint.
     *
     */
    getAxisMotorTarget(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetAxisMotorTarget(constraint._pluginData, this._constraintAxisToNative(axis))[1];
        }
        return null;
    }
    /**
     * Sets the maximum force that can be applied by the motor of the given constraint axis.
     * @param constraint - The constraint to set the motor max force for.
     * @param axis - The axis of the constraint to set the motor max force for.
     * @param maxForce - The maximum force that can be applied by the motor.
     *
     */
    setAxisMotorMaxForce(constraint, axis, maxForce) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetAxisMotorMaxForce(jointId, this._constraintAxisToNative(axis), maxForce);
        }
    }
    /**
     * Gets the maximum force of the motor of the given constraint axis.
     *
     * @param constraint - The constraint to get the motor maximum force from.
     * @param axis - The axis of the constraint to get the motor maximum force from.
     * @returns The maximum force of the motor of the given constraint axis.
     *
     */
    getAxisMotorMaxForce(constraint, axis) {
        const firstId = constraint._pluginData && constraint._pluginData[0];
        if (firstId) {
            return this._hknp.HP_Constraint_GetAxisMotorMaxForce(firstId, this._constraintAxisToNative(axis))[1];
        }
        return null;
    }
    /**
     * Disposes a physics constraint.
     *
     * @param constraint - The physics constraint to dispose.
     *
     * This method is useful for releasing the resources associated with a physics constraint, such as
     * the Havok constraint, when it is no longer needed. This is important for avoiding memory leaks.
     */
    disposeConstraint(constraint) {
        for (const jointId of constraint._pluginData) {
            this._hknp.HP_Constraint_SetEnabled(jointId, false);
            this._hknp.HP_Constraint_Release(jointId);
        }
        constraint._pluginData.length = 0;
    }
    _populateHitData(hitData, result) {
        const hitBody = this._bodies.get(hitData[0][0]);
        result.body = hitBody?.body;
        result.bodyIndex = hitBody?.index;
        const hitShape = this._shapes.get(hitData[1][0]);
        result.shape = hitShape;
        const hitPos = hitData[3];
        const hitNormal = hitData[4];
        const hitTriangle = hitData[5];
        result.setHitData({ x: hitNormal[0], y: hitNormal[1], z: hitNormal[2] }, { x: hitPos[0], y: hitPos[1], z: hitPos[2] }, hitTriangle);
    }
    /**
     * Performs a raycast from a given start point to a given end point and stores the result in a given PhysicsRaycastResult object.
     *
     * @param from - The start point of the raycast.
     * @param to - The end point of the raycast.
     * @param result - The PhysicsRaycastResult object to store the result of the raycast.
     * @param query - The raycast query options. See [[IRaycastQuery]] for more information.
     *
     * Performs a raycast. It takes in two points, from and to, and a PhysicsRaycastResult object to store the result of the raycast.
     * It then performs the raycast and stores the hit data in the PhysicsRaycastResult object.
     */
    raycast(from, to, result, query) {
        const queryMembership = query?.membership ?? ~0;
        const queryCollideWith = query?.collideWith ?? ~0;
        const shouldHitTriggers = query?.shouldHitTriggers ?? false;
        result.reset(from, to);
        const bodyToIgnore = [BigInt(0)];
        const hkQuery = [this._bVecToV3(from), this._bVecToV3(to), [queryMembership, queryCollideWith], shouldHitTriggers, bodyToIgnore];
        this._hknp.HP_World_CastRayWithCollector(this.world, this._queryCollector, hkQuery);
        if (this._hknp.HP_QueryCollector_GetNumHits(this._queryCollector)[1] > 0) {
            const [, hitData] = this._hknp.HP_QueryCollector_GetCastRayResult(this._queryCollector, 0)[1];
            this._populateHitData(hitData, result);
            result.calculateHitDistance();
        }
    }
    /**
     * Given a point, returns the closest physics
     * body to that point.
     * @param query the query to perform. @see IPhysicsPointProximityQuery
     * @param result contact point on the hit shape, in world space
     */
    pointProximity(query, result) {
        const queryMembership = query?.collisionFilter?.membership ?? ~0;
        const queryCollideWith = query?.collisionFilter?.collideWith ?? ~0;
        result.reset();
        const bodyToIgnore = query.ignoreBody ? [BigInt(query.ignoreBody._pluginData.hpBodyId[0])] : [BigInt(0)];
        const hkQuery = [this._bVecToV3(query.position), query.maxDistance, [queryMembership, queryCollideWith], query.shouldHitTriggers, bodyToIgnore];
        this._hknp.HP_World_PointProximityWithCollector(this.world, this._queryCollector, hkQuery);
        if (this._hknp.HP_QueryCollector_GetNumHits(this._queryCollector)[1] > 0) {
            const [distance, hitData] = this._hknp.HP_QueryCollector_GetPointProximityResult(this._queryCollector, 0)[1];
            this._populateHitData(hitData, result);
            result.setHitDistance(distance);
        }
    }
    /**
     * Given a shape in a specific position and orientation, returns the closest point to that shape.
     * @param query the query to perform. @see IPhysicsShapeProximityCastQuery
     * @param inputShapeResult contact point on input shape, in input shape space
     * @param hitShapeResult contact point on hit shape, in world space
     */
    shapeProximity(query, inputShapeResult, hitShapeResult) {
        inputShapeResult.reset();
        hitShapeResult.reset();
        const shapeId = query.shape._pluginData;
        const bodyToIgnore = query.ignoreBody ? [BigInt(query.ignoreBody._pluginData.hpBodyId[0])] : [BigInt(0)];
        const hkQuery = [shapeId, this._bVecToV3(query.position), this._bQuatToV4(query.rotation), query.maxDistance, query.shouldHitTriggers, bodyToIgnore];
        this._hknp.HP_World_ShapeProximityWithCollector(this.world, this._queryCollector, hkQuery);
        if (this._hknp.HP_QueryCollector_GetNumHits(this._queryCollector)[1] > 0) {
            const [distance, hitInputData, hitShapeData] = this._hknp.HP_QueryCollector_GetShapeProximityResult(this._queryCollector, 0)[1];
            this._populateHitData(hitInputData, inputShapeResult);
            this._populateHitData(hitShapeData, hitShapeResult);
            inputShapeResult.setHitDistance(distance);
            hitShapeResult.setHitDistance(distance);
        }
    }
    /**
     * Given a shape in a specific orientation, cast it from the start to end position specified by the query, and return the first hit.
     * @param query the query to perform. @see IPhysicsShapeCastQuery
     * @param inputShapeResult contact point on input shape, in input shape space
     * @param hitShapeResult contact point on hit shape, in world space
     */
    shapeCast(query, inputShapeResult, hitShapeResult) {
        inputShapeResult.reset();
        hitShapeResult.reset();
        const shapeId = query.shape._pluginData;
        const bodyToIgnore = query.ignoreBody ? [BigInt(query.ignoreBody._pluginData.hpBodyId[0])] : [BigInt(0)];
        const hkQuery = [shapeId, this._bQuatToV4(query.rotation), this._bVecToV3(query.startPosition), this._bVecToV3(query.endPosition), query.shouldHitTriggers, bodyToIgnore];
        this._hknp.HP_World_ShapeCastWithCollector(this.world, this._queryCollector, hkQuery);
        if (this._hknp.HP_QueryCollector_GetNumHits(this._queryCollector)[1] > 0) {
            const [fractionAlongRay, hitInputData, hitShapeData] = this._hknp.HP_QueryCollector_GetShapeCastResult(this._queryCollector, 0)[1];
            this._populateHitData(hitInputData, inputShapeResult);
            this._populateHitData(hitShapeData, hitShapeResult);
            inputShapeResult.setHitFraction(fractionAlongRay);
            hitShapeResult.setHitFraction(fractionAlongRay);
        }
    }
    /**
     * Return the collision observable for a particular physics body.
     * @param body the physics body
     * @returns the collision observable for the body
     */
    getCollisionObservable(body) {
        const bodyId = body._pluginData.hpBodyId[0];
        let observable = this._bodyCollisionObservable.get(bodyId);
        if (!observable) {
            observable = new Observable();
            this._bodyCollisionObservable.set(bodyId, observable);
        }
        return observable;
    }
    /**
     * Return the collision ended observable for a particular physics body.
     * @param body the physics body
     * @returns
     */
    getCollisionEndedObservable(body) {
        const bodyId = body._pluginData.hpBodyId[0];
        let observable = this._bodyCollisionEndedObservable.get(bodyId);
        if (!observable) {
            observable = new Observable();
            this._bodyCollisionEndedObservable.set(bodyId, observable);
        }
        return observable;
    }
    /**
     * Enable collision to be reported for a body when a callback is setup on the world
     * @param body the physics body
     * @param enabled whether to enable or disable collision events
     */
    setCollisionCallbackEnabled(body, enabled) {
        // Register for collide events by default
        const collideEvents = this._hknp.EventType.COLLISION_STARTED.value | this._hknp.EventType.COLLISION_CONTINUED.value | this._hknp.EventType.COLLISION_FINISHED.value;
        if (body._pluginDataInstances && body._pluginDataInstances.length) {
            body._pluginDataInstances.forEach((bodyId) => {
                this._hknp.HP_Body_SetEventMask(bodyId.hpBodyId, enabled ? collideEvents : 0);
            });
        }
        else if (body._pluginData) {
            this._hknp.HP_Body_SetEventMask(body._pluginData.hpBodyId, enabled ? collideEvents : 0);
        }
    }
    /**
     * Enable collision ended to be reported for a body when a callback is setup on the world
     * @param body the physics body
     * @param enabled whether to enable or disable collision ended events
     */
    setCollisionEndedCallbackEnabled(body, enabled) {
        // Register to collide ended events
        const pluginRef = this._getPluginReference(body);
        let currentCollideEvents = this._hknp.HP_Body_GetEventMask(pluginRef.hpBodyId)[1];
        // update with the ended mask
        currentCollideEvents = enabled
            ? currentCollideEvents | this._hknp.EventType.COLLISION_FINISHED.value
            : currentCollideEvents & ~this._hknp.EventType.COLLISION_FINISHED.value;
        if (body._pluginDataInstances && body._pluginDataInstances.length) {
            body._pluginDataInstances.forEach((bodyId) => {
                this._hknp.HP_Body_SetEventMask(bodyId.hpBodyId, currentCollideEvents);
            });
        }
        else if (body._pluginData) {
            this._hknp.HP_Body_SetEventMask(body._pluginData.hpBodyId, currentCollideEvents);
        }
    }
    _notifyTriggers() {
        let eventAddress = this._hknp.HP_World_GetTriggerEvents(this.world)[1];
        const event = new TriggerEvent();
        while (eventAddress) {
            TriggerEvent.readToRef(this._hknp.HEAPU8.buffer, eventAddress, event);
            const bodyInfoA = this._bodies.get(event.bodyIdA);
            const bodyInfoB = this._bodies.get(event.bodyIdB);
            // Bodies may have been disposed between events. Check both still exist.
            if (bodyInfoA && bodyInfoB) {
                const triggerCollisionInfo = {
                    collider: bodyInfoA.body,
                    colliderIndex: bodyInfoA.index,
                    collidedAgainst: bodyInfoB.body,
                    collidedAgainstIndex: bodyInfoB.index,
                    type: this._nativeTriggerCollisionValueToCollisionType(event.type),
                };
                this.onTriggerCollisionObservable.notifyObservers(triggerCollisionInfo);
            }
            eventAddress = this._hknp.HP_World_GetNextTriggerEvent(this.world, eventAddress);
        }
    }
    /**
     * Runs thru all detected collisions and filter by body
     */
    _notifyCollisions() {
        let eventAddress = this._hknp.HP_World_GetCollisionEvents(this.world)[1];
        const event = new CollisionEvent();
        const worldAddr = Number(this.world);
        while (eventAddress) {
            CollisionEvent.readToRef(this._hknp.HEAPU8.buffer, eventAddress, event);
            const bodyInfoA = this._bodies.get(event.contactOnA.bodyId);
            const bodyInfoB = this._bodies.get(event.contactOnB.bodyId);
            // Bodies may have been disposed between events. Check both still exist.
            if (bodyInfoA && bodyInfoB) {
                const collisionInfo = {
                    collider: bodyInfoA.body,
                    colliderIndex: bodyInfoA.index,
                    collidedAgainst: bodyInfoB.body,
                    collidedAgainstIndex: bodyInfoB.index,
                    type: this._nativeCollisionValueToCollisionType(event.type),
                };
                if (collisionInfo.type === "COLLISION_FINISHED" /* PhysicsEventType.COLLISION_FINISHED */) {
                    this.onCollisionEndedObservable.notifyObservers(collisionInfo);
                }
                else {
                    event.contactOnB.position.subtractToRef(event.contactOnA.position, this._tmpVec3[0]);
                    const distance = Vector3.Dot(this._tmpVec3[0], event.contactOnA.normal);
                    collisionInfo.point = event.contactOnA.position;
                    collisionInfo.distance = distance;
                    collisionInfo.impulse = event.impulseApplied;
                    collisionInfo.normal = event.contactOnA.normal;
                    this.onCollisionObservable.notifyObservers(collisionInfo);
                }
                if (this._bodyCollisionObservable.size && collisionInfo.type !== "COLLISION_FINISHED" /* PhysicsEventType.COLLISION_FINISHED */) {
                    const observableA = this._bodyCollisionObservable.get(event.contactOnA.bodyId);
                    const observableB = this._bodyCollisionObservable.get(event.contactOnB.bodyId);
                    event.contactOnA.position.subtractToRef(event.contactOnB.position, this._tmpVec3[0]);
                    const distance = Vector3.Dot(this._tmpVec3[0], event.contactOnB.normal);
                    if (observableA) {
                        observableA.notifyObservers(collisionInfo);
                    }
                    if (observableB) {
                        const collisionInfoB = {
                            collider: bodyInfoB.body,
                            colliderIndex: bodyInfoB.index,
                            collidedAgainst: bodyInfoA.body,
                            collidedAgainstIndex: bodyInfoA.index,
                            point: event.contactOnB.position,
                            distance: distance,
                            impulse: event.impulseApplied,
                            normal: event.contactOnB.normal,
                            type: this._nativeCollisionValueToCollisionType(event.type),
                        };
                        observableB.notifyObservers(collisionInfoB);
                    }
                }
                else if (this._bodyCollisionEndedObservable.size) {
                    const observableA = this._bodyCollisionEndedObservable.get(event.contactOnA.bodyId);
                    const observableB = this._bodyCollisionEndedObservable.get(event.contactOnB.bodyId);
                    event.contactOnA.position.subtractToRef(event.contactOnB.position, this._tmpVec3[0]);
                    const distance = Vector3.Dot(this._tmpVec3[0], event.contactOnB.normal);
                    if (observableA) {
                        observableA.notifyObservers(collisionInfo);
                    }
                    if (observableB) {
                        const collisionInfoB = {
                            collider: bodyInfoB.body,
                            colliderIndex: bodyInfoB.index,
                            collidedAgainst: bodyInfoA.body,
                            collidedAgainstIndex: bodyInfoA.index,
                            point: event.contactOnB.position,
                            distance: distance,
                            impulse: event.impulseApplied,
                            normal: event.contactOnB.normal,
                            type: this._nativeCollisionValueToCollisionType(event.type),
                        };
                        observableB.notifyObservers(collisionInfoB);
                    }
                }
            }
            eventAddress = this._hknp.HP_World_GetNextCollisionEvent(worldAddr, eventAddress);
        }
    }
    /**
     * Gets the number of bodies in the world
     */
    get numBodies() {
        return this._hknp.HP_World_GetNumBodies(this.world)[1];
    }
    /**
     * Dispose the world and free resources
     */
    dispose() {
        if (this._queryCollector) {
            this._hknp.HP_QueryCollector_Release(this._queryCollector);
            this._queryCollector = undefined;
        }
        if (this.world) {
            this._hknp.HP_World_Release(this.world);
            this.world = undefined;
        }
    }
    _v3ToBvecRef(v, vec3) {
        vec3.set(v[0], v[1], v[2]);
    }
    _bVecToV3(v) {
        return [v._x, v._y, v._z];
    }
    _bQuatToV4(q) {
        return [q._x, q._y, q._z, q._w];
    }
    _constraintMotorTypeToNative(motorType) {
        switch (motorType) {
            case 2 /* PhysicsConstraintMotorType.POSITION */:
                return this._hknp.ConstraintMotorType.POSITION;
            case 1 /* PhysicsConstraintMotorType.VELOCITY */:
                return this._hknp.ConstraintMotorType.VELOCITY;
        }
        return this._hknp.ConstraintMotorType.NONE;
    }
    _nativeToMotorType(motorType) {
        switch (motorType) {
            case this._hknp.ConstraintMotorType.POSITION:
                return 2 /* PhysicsConstraintMotorType.POSITION */;
            case this._hknp.ConstraintMotorType.VELOCITY:
                return 1 /* PhysicsConstraintMotorType.VELOCITY */;
        }
        return 0 /* PhysicsConstraintMotorType.NONE */;
    }
    _materialCombineToNative(mat) {
        switch (mat) {
            case 0 /* PhysicsMaterialCombineMode.GEOMETRIC_MEAN */:
                return this._hknp.MaterialCombine.GEOMETRIC_MEAN;
            case 1 /* PhysicsMaterialCombineMode.MINIMUM */:
                return this._hknp.MaterialCombine.MINIMUM;
            case 2 /* PhysicsMaterialCombineMode.MAXIMUM */:
                return this._hknp.MaterialCombine.MAXIMUM;
            case 3 /* PhysicsMaterialCombineMode.ARITHMETIC_MEAN */:
                return this._hknp.MaterialCombine.ARITHMETIC_MEAN;
            case 4 /* PhysicsMaterialCombineMode.MULTIPLY */:
                return this._hknp.MaterialCombine.MULTIPLY;
        }
    }
    _nativeToMaterialCombine(mat) {
        switch (mat) {
            case this._hknp.MaterialCombine.GEOMETRIC_MEAN:
                return 0 /* PhysicsMaterialCombineMode.GEOMETRIC_MEAN */;
            case this._hknp.MaterialCombine.MINIMUM:
                return 1 /* PhysicsMaterialCombineMode.MINIMUM */;
            case this._hknp.MaterialCombine.MAXIMUM:
                return 2 /* PhysicsMaterialCombineMode.MAXIMUM */;
            case this._hknp.MaterialCombine.ARITHMETIC_MEAN:
                return 3 /* PhysicsMaterialCombineMode.ARITHMETIC_MEAN */;
            case this._hknp.MaterialCombine.MULTIPLY:
                return 4 /* PhysicsMaterialCombineMode.MULTIPLY */;
            default:
                return undefined;
        }
    }
    _constraintAxisToNative(axId) {
        switch (axId) {
            case 0 /* PhysicsConstraintAxis.LINEAR_X */:
                return this._hknp.ConstraintAxis.LINEAR_X;
            case 1 /* PhysicsConstraintAxis.LINEAR_Y */:
                return this._hknp.ConstraintAxis.LINEAR_Y;
            case 2 /* PhysicsConstraintAxis.LINEAR_Z */:
                return this._hknp.ConstraintAxis.LINEAR_Z;
            case 3 /* PhysicsConstraintAxis.ANGULAR_X */:
                return this._hknp.ConstraintAxis.ANGULAR_X;
            case 4 /* PhysicsConstraintAxis.ANGULAR_Y */:
                return this._hknp.ConstraintAxis.ANGULAR_Y;
            case 5 /* PhysicsConstraintAxis.ANGULAR_Z */:
                return this._hknp.ConstraintAxis.ANGULAR_Z;
            case 6 /* PhysicsConstraintAxis.LINEAR_DISTANCE */:
                return this._hknp.ConstraintAxis.LINEAR_DISTANCE;
        }
    }
    _nativeToLimitMode(mode) {
        switch (mode) {
            case this._hknp.ConstraintAxisLimitMode.FREE:
                return 0 /* PhysicsConstraintAxisLimitMode.FREE */;
            case this._hknp.ConstraintAxisLimitMode.LIMITED:
                return 1 /* PhysicsConstraintAxisLimitMode.LIMITED */;
            case this._hknp.ConstraintAxisLimitMode.LOCKED:
                return 2 /* PhysicsConstraintAxisLimitMode.LOCKED */;
        }
        return 0 /* PhysicsConstraintAxisLimitMode.FREE */;
    }
    _limitModeToNative(mode) {
        switch (mode) {
            case 0 /* PhysicsConstraintAxisLimitMode.FREE */:
                return this._hknp.ConstraintAxisLimitMode.FREE;
            case 1 /* PhysicsConstraintAxisLimitMode.LIMITED */:
                return this._hknp.ConstraintAxisLimitMode.LIMITED;
            case 2 /* PhysicsConstraintAxisLimitMode.LOCKED */:
                return this._hknp.ConstraintAxisLimitMode.LOCKED;
        }
    }
    _nativeCollisionValueToCollisionType(type) {
        switch (type) {
            case this._hknp.EventType.COLLISION_STARTED.value:
                return "COLLISION_STARTED" /* PhysicsEventType.COLLISION_STARTED */;
            case this._hknp.EventType.COLLISION_FINISHED.value:
                return "COLLISION_FINISHED" /* PhysicsEventType.COLLISION_FINISHED */;
            case this._hknp.EventType.COLLISION_CONTINUED.value:
                return "COLLISION_CONTINUED" /* PhysicsEventType.COLLISION_CONTINUED */;
        }
        return "COLLISION_STARTED" /* PhysicsEventType.COLLISION_STARTED */;
    }
    _nativeTriggerCollisionValueToCollisionType(type) {
        switch (type) {
            case 8:
                return "TRIGGER_ENTERED" /* PhysicsEventType.TRIGGER_ENTERED */;
            case 16:
                return "TRIGGER_EXITED" /* PhysicsEventType.TRIGGER_EXITED */;
        }
        return "TRIGGER_ENTERED" /* PhysicsEventType.TRIGGER_ENTERED */;
    }
}
//# sourceMappingURL=havokPlugin.js.map