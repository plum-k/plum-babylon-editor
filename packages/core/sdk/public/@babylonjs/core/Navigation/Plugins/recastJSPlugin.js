import { Logger } from "../../Misc/logger.js";
import { VertexData } from "../../Meshes/mesh.vertexData.js";
import { Mesh } from "../../Meshes/mesh.js";
import { Epsilon, Vector3, Matrix } from "../../Maths/math.js";
import { Observable } from "../../Misc/observable.js";
import { VertexBuffer } from "../../Buffers/buffer.js";
/**
 * RecastJS navigation plugin
 */
export class RecastJSPlugin {
    /**
     * Initializes the recastJS plugin
     * @param recastInjection can be used to inject your own recast reference
     */
    constructor(recastInjection = Recast) {
        /**
         * Reference to the Recast library
         */
        this.bjsRECAST = {};
        /**
         * plugin name
         */
        this.name = "RecastJSPlugin";
        this._maximumSubStepCount = 10;
        this._timeStep = 1 / 60;
        this._timeFactor = 1;
        this._worker = null;
        if (typeof recastInjection === "function") {
            Logger.Error("RecastJS is not ready. Please make sure you await Recast() before using the plugin.");
        }
        else {
            this.bjsRECAST = recastInjection;
        }
        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
        this.setTimeStep();
        this._tempVec1 = new this.bjsRECAST.Vec3();
        this._tempVec2 = new this.bjsRECAST.Vec3();
    }
    /**
     * Set worker URL to be used when generating a new navmesh
     * @param workerURL url string
     * @returns boolean indicating if worker is created
     */
    setWorkerURL(workerURL) {
        if (window && window.Worker) {
            this._worker = new Worker(workerURL);
            return true;
        }
        return false;
    }
    /**
     * Set the time step of the navigation tick update.
     * Default is 1/60.
     * A value of 0 will disable fixed time update
     * @param newTimeStep the new timestep to apply to this world.
     */
    setTimeStep(newTimeStep = 1 / 60) {
        this._timeStep = newTimeStep;
    }
    /**
     * Get the time step of the navigation tick update.
     * @returns the current time step
     */
    getTimeStep() {
        return this._timeStep;
    }
    /**
     * If delta time in navigation tick update is greater than the time step
     * a number of sub iterations are done. If more iterations are need to reach deltatime
     * they will be discarded.
     * A value of 0 will set to no maximum and update will use as many substeps as needed
     * @param newStepCount the maximum number of iterations
     */
    setMaximumSubStepCount(newStepCount = 10) {
        this._maximumSubStepCount = newStepCount;
    }
    /**
     * Get the maximum number of iterations per navigation tick update
     * @returns the maximum number of iterations
     */
    getMaximumSubStepCount() {
        return this._maximumSubStepCount;
    }
    /**
     * Time factor applied when updating crowd agents (default 1). A value of 0 will pause crowd updates.
     * @param value the time factor applied at update
     */
    set timeFactor(value) {
        this._timeFactor = Math.max(value, 0);
    }
    /**
     * Get the time factor used for crowd agent update
     * @returns the time factor
     */
    get timeFactor() {
        return this._timeFactor;
    }
    /**
     * Creates a navigation mesh
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @param completion callback when data is available from the worker. Not used without a worker
     */
    createNavMesh(meshes, parameters, completion) {
        if (this._worker && !completion) {
            Logger.Warn("A worker is avaible but no completion callback. Defaulting to blocking navmesh creation");
        }
        else if (!this._worker && completion) {
            Logger.Warn("A completion callback is avaible but no worker. Defaulting to blocking navmesh creation");
        }
        this.navMesh = new this.bjsRECAST.NavMesh();
        let index;
        let tri;
        let pt;
        const indices = [];
        const positions = [];
        let offset = 0;
        for (index = 0; index < meshes.length; index++) {
            if (meshes[index]) {
                const mesh = meshes[index];
                const meshIndices = mesh.getIndices();
                if (!meshIndices) {
                    continue;
                }
                const meshPositions = mesh.getVerticesData(VertexBuffer.PositionKind, false, false);
                if (!meshPositions) {
                    continue;
                }
                const worldMatrices = [];
                const worldMatrix = mesh.computeWorldMatrix(true);
                if (mesh.hasThinInstances) {
                    const thinMatrices = mesh.thinInstanceGetWorldMatrices();
                    for (let instanceIndex = 0; instanceIndex < thinMatrices.length; instanceIndex++) {
                        const tmpMatrix = new Matrix();
                        const thinMatrix = thinMatrices[instanceIndex];
                        thinMatrix.multiplyToRef(worldMatrix, tmpMatrix);
                        worldMatrices.push(tmpMatrix);
                    }
                }
                else {
                    worldMatrices.push(worldMatrix);
                }
                for (let matrixIndex = 0; matrixIndex < worldMatrices.length; matrixIndex++) {
                    const wm = worldMatrices[matrixIndex];
                    for (tri = 0; tri < meshIndices.length; tri++) {
                        indices.push(meshIndices[tri] + offset);
                    }
                    const transformed = Vector3.Zero();
                    const position = Vector3.Zero();
                    for (pt = 0; pt < meshPositions.length; pt += 3) {
                        Vector3.FromArrayToRef(meshPositions, pt, position);
                        Vector3.TransformCoordinatesToRef(position, wm, transformed);
                        positions.push(transformed.x, transformed.y, transformed.z);
                    }
                    offset += meshPositions.length / 3;
                }
            }
        }
        if (this._worker && completion) {
            // spawn worker and send message
            this._worker.postMessage([positions, offset, indices, indices.length, parameters]);
            this._worker.onmessage = function (e) {
                completion(e.data);
            };
        }
        else {
            // blocking calls
            const rc = new this.bjsRECAST.rcConfig();
            rc.cs = parameters.cs;
            rc.ch = parameters.ch;
            rc.borderSize = parameters.borderSize ? parameters.borderSize : 0;
            rc.tileSize = parameters.tileSize ? parameters.tileSize : 0;
            rc.walkableSlopeAngle = parameters.walkableSlopeAngle;
            rc.walkableHeight = parameters.walkableHeight;
            rc.walkableClimb = parameters.walkableClimb;
            rc.walkableRadius = parameters.walkableRadius;
            rc.maxEdgeLen = parameters.maxEdgeLen;
            rc.maxSimplificationError = parameters.maxSimplificationError;
            rc.minRegionArea = parameters.minRegionArea;
            rc.mergeRegionArea = parameters.mergeRegionArea;
            rc.maxVertsPerPoly = parameters.maxVertsPerPoly;
            rc.detailSampleDist = parameters.detailSampleDist;
            rc.detailSampleMaxError = parameters.detailSampleMaxError;
            this.navMesh.build(positions, offset, indices, indices.length, rc);
        }
    }
    /**
     * Create a navigation mesh debug mesh
     * @param scene is where the mesh will be added
     * @returns debug display mesh
     */
    createDebugNavMesh(scene) {
        let tri;
        let pt;
        const debugNavMesh = this.navMesh.getDebugNavMesh();
        const triangleCount = debugNavMesh.getTriangleCount();
        const indices = [];
        const positions = [];
        for (tri = 0; tri < triangleCount * 3; tri++) {
            indices.push(tri);
        }
        for (tri = 0; tri < triangleCount; tri++) {
            for (pt = 0; pt < 3; pt++) {
                const point = debugNavMesh.getTriangle(tri).getPoint(pt);
                positions.push(point.x, point.y, point.z);
            }
        }
        const mesh = new Mesh("NavMeshDebug", scene);
        const vertexData = new VertexData();
        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.applyToMesh(mesh, false);
        return mesh;
    }
    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getClosestPoint(position) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        const ret = this.navMesh.getClosestPoint(this._tempVec1);
        const pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }
    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getClosestPointToRef(position, result) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        const ret = this.navMesh.getClosestPoint(this._tempVec1);
        result.set(ret.x, ret.y, ret.z);
    }
    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getRandomPointAround(position, maxRadius) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        const ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
        const pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }
    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getRandomPointAroundToRef(position, maxRadius, result) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        const ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
        result.set(ret.x, ret.y, ret.z);
    }
    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @returns the resulting point along the navmesh
     */
    moveAlong(position, destination) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        this._tempVec2.x = destination.x;
        this._tempVec2.y = destination.y;
        this._tempVec2.z = destination.z;
        const ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
        const pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }
    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @param result output the resulting point along the navmesh
     */
    moveAlongToRef(position, destination, result) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        this._tempVec2.x = destination.x;
        this._tempVec2.y = destination.y;
        this._tempVec2.z = destination.z;
        const ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
        result.set(ret.x, ret.y, ret.z);
    }
    _convertNavPathPoints(navPath) {
        let pt;
        const pointCount = navPath.getPointCount();
        const positions = [];
        for (pt = 0; pt < pointCount; pt++) {
            const p = navPath.getPoint(pt);
            positions.push(new Vector3(p.x, p.y, p.z));
        }
        return positions;
    }
    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed
     * Path is straight.
     * @param start world position
     * @param end world position
     * @returns array containing world position composing the path
     */
    computePath(start, end) {
        this._tempVec1.x = start.x;
        this._tempVec1.y = start.y;
        this._tempVec1.z = start.z;
        this._tempVec2.x = end.x;
        this._tempVec2.y = end.y;
        this._tempVec2.z = end.z;
        const navPath = this.navMesh.computePath(this._tempVec1, this._tempVec2);
        return this._convertNavPathPoints(navPath);
    }
    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed.
     * Path follows navigation mesh geometry.
     * @param start world position
     * @param end world position
     * @returns array containing world position composing the path
     */
    computePathSmooth(start, end) {
        this._tempVec1.x = start.x;
        this._tempVec1.y = start.y;
        this._tempVec1.z = start.z;
        this._tempVec2.x = end.x;
        this._tempVec2.y = end.y;
        this._tempVec2.z = end.z;
        const navPath = this.navMesh.computePathSmooth(this._tempVec1, this._tempVec2);
        return this._convertNavPathPoints(navPath);
    }
    /**
     * Create a new Crowd so you can add agents
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    createCrowd(maxAgents, maxAgentRadius, scene) {
        const crowd = new RecastJSCrowd(this, maxAgents, maxAgentRadius, scene);
        return crowd;
    }
    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent) {
        this._tempVec1.x = extent.x;
        this._tempVec1.y = extent.y;
        this._tempVec1.z = extent.z;
        this.navMesh.setDefaultQueryExtent(this._tempVec1);
    }
    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent() {
        const p = this.navMesh.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }
    /**
     * build the navmesh from a previously saved state using getNavmeshData
     * @param data the Uint8Array returned by getNavmeshData
     */
    buildFromNavmeshData(data) {
        const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
        const dataPtr = this.bjsRECAST._malloc(nDataBytes);
        const dataHeap = new Uint8Array(this.bjsRECAST.HEAPU8.buffer, dataPtr, nDataBytes);
        dataHeap.set(data);
        const buf = new this.bjsRECAST.NavmeshData();
        buf.dataPointer = dataHeap.byteOffset;
        buf.size = data.length;
        this.navMesh = new this.bjsRECAST.NavMesh();
        this.navMesh.buildFromNavmeshData(buf);
        // Free memory
        this.bjsRECAST._free(dataHeap.byteOffset);
    }
    /**
     * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
     * @returns data the Uint8Array that can be saved and reused
     */
    getNavmeshData() {
        const navmeshData = this.navMesh.getNavmeshData();
        const arrView = new Uint8Array(this.bjsRECAST.HEAPU8.buffer, navmeshData.dataPointer, navmeshData.size);
        const ret = new Uint8Array(navmeshData.size);
        ret.set(arrView);
        this.navMesh.freeNavmeshData(navmeshData);
        return ret;
    }
    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result) {
        const p = this.navMesh.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }
    /**
     * Disposes
     */
    dispose() { }
    /**
     * Creates a cylinder obstacle and add it to the navigation
     * @param position world position
     * @param radius cylinder radius
     * @param height cylinder height
     * @returns the obstacle freshly created
     */
    addCylinderObstacle(position, radius, height) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        return this.navMesh.addCylinderObstacle(this._tempVec1, radius, height);
    }
    /**
     * Creates an oriented box obstacle and add it to the navigation
     * @param position world position
     * @param extent box size
     * @param angle angle in radians of the box orientation on Y axis
     * @returns the obstacle freshly created
     */
    addBoxObstacle(position, extent, angle) {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        this._tempVec2.x = extent.x;
        this._tempVec2.y = extent.y;
        this._tempVec2.z = extent.z;
        return this.navMesh.addBoxObstacle(this._tempVec1, this._tempVec2, angle);
    }
    /**
     * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
     * @param obstacle obstacle to remove from the navigation
     */
    removeObstacle(obstacle) {
        this.navMesh.removeObstacle(obstacle);
    }
    /**
     * If this plugin is supported
     * @returns true if plugin is supported
     */
    isSupported() {
        return this.bjsRECAST !== undefined;
    }
    /**
     * Returns the seed used for randomized functions like `getRandomPointAround`
     * @returns seed number
     */
    getRandomSeed() {
        return this.bjsRECAST._getRandomSeed();
    }
    /**
     * Set the seed used for randomized functions like `getRandomPointAround`
     * @param seed number used as seed for random functions
     */
    setRandomSeed(seed) {
        this.bjsRECAST._setRandomSeed(seed);
    }
}
/**
 * Recast detour crowd implementation
 */
export class RecastJSCrowd {
    /**
     * Constructor
     * @param plugin recastJS plugin
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    constructor(plugin, maxAgents, maxAgentRadius, scene) {
        /**
         * Link to the detour crowd
         */
        this.recastCrowd = {};
        /**
         * One transform per agent
         */
        this.transforms = new Array();
        /**
         * All agents created
         */
        this.agents = new Array();
        /**
         * agents reach radius
         */
        this.reachRadii = new Array();
        /**
         * true when a destination is active for an agent and notifier hasn't been notified of reach
         */
        this._agentDestinationArmed = new Array();
        /**
         * agent current target
         */
        this._agentDestination = new Array();
        /**
         * Observer for crowd updates
         */
        this._onBeforeAnimationsObserver = null;
        /**
         * Fires each time an agent is in reach radius of its destination
         */
        this.onReachTargetObservable = new Observable();
        this.bjsRECASTPlugin = plugin;
        this.recastCrowd = new this.bjsRECASTPlugin.bjsRECAST.Crowd(maxAgents, maxAgentRadius, this.bjsRECASTPlugin.navMesh.getNavMesh());
        this._scene = scene;
        this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            this.update(scene.getEngine().getDeltaTime() * 0.001 * plugin.timeFactor);
        });
    }
    /**
     * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
     * You can attach anything to that node. The node position is updated in the scene update tick.
     * @param pos world position that will be constrained by the navigation mesh
     * @param parameters agent parameters
     * @param transform hooked to the agent that will be update by the scene
     * @returns agent index
     */
    addAgent(pos, parameters, transform) {
        const agentParams = new this.bjsRECASTPlugin.bjsRECAST.dtCrowdAgentParams();
        agentParams.radius = parameters.radius;
        agentParams.height = parameters.height;
        agentParams.maxAcceleration = parameters.maxAcceleration;
        agentParams.maxSpeed = parameters.maxSpeed;
        agentParams.collisionQueryRange = parameters.collisionQueryRange;
        agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
        agentParams.separationWeight = parameters.separationWeight;
        agentParams.updateFlags = 7;
        agentParams.obstacleAvoidanceType = 0;
        agentParams.queryFilterType = 0;
        agentParams.userData = 0;
        const agentIndex = this.recastCrowd.addAgent(new this.bjsRECASTPlugin.bjsRECAST.Vec3(pos.x, pos.y, pos.z), agentParams);
        this.transforms.push(transform);
        this.agents.push(agentIndex);
        this.reachRadii.push(parameters.reachRadius ? parameters.reachRadius : parameters.radius);
        this._agentDestinationArmed.push(false);
        this._agentDestination.push(new Vector3(0, 0, 0));
        return agentIndex;
    }
    /**
     * Returns the agent position in world space
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentPosition(index) {
        const agentPos = this.recastCrowd.getAgentPosition(index);
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }
    /**
     * Returns the agent position result in world space
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentPositionToRef(index, result) {
        const agentPos = this.recastCrowd.getAgentPosition(index);
        result.set(agentPos.x, agentPos.y, agentPos.z);
    }
    /**
     * Returns the agent velocity in world space
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    getAgentVelocity(index) {
        const agentVel = this.recastCrowd.getAgentVelocity(index);
        return new Vector3(agentVel.x, agentVel.y, agentVel.z);
    }
    /**
     * Returns the agent velocity result in world space
     * @param index agent index returned by addAgent
     * @param result output world space velocity
     */
    getAgentVelocityToRef(index, result) {
        const agentVel = this.recastCrowd.getAgentVelocity(index);
        result.set(agentVel.x, agentVel.y, agentVel.z);
    }
    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentNextTargetPath(index) {
        const pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
        return new Vector3(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }
    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentNextTargetPathToRef(index, result) {
        const pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
        result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }
    /**
     * Gets the agent state
     * @param index agent index returned by addAgent
     * @returns agent state
     */
    getAgentState(index) {
        return this.recastCrowd.getAgentState(index);
    }
    /**
     * returns true if the agent in over an off mesh link connection
     * @param index agent index returned by addAgent
     * @returns true if over an off mesh link connection
     */
    overOffmeshConnection(index) {
        return this.recastCrowd.overOffmeshConnection(index);
    }
    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentGoto(index, destination) {
        this.recastCrowd.agentGoto(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
        // arm observer
        const item = this.agents.indexOf(index);
        if (item > -1) {
            this._agentDestinationArmed[item] = true;
            this._agentDestination[item].set(destination.x, destination.y, destination.z);
        }
    }
    /**
     * Teleport the agent to a new position
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentTeleport(index, destination) {
        this.recastCrowd.agentTeleport(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
    }
    /**
     * Update agent parameters
     * @param index agent index returned by addAgent
     * @param parameters agent parameters
     */
    updateAgentParameters(index, parameters) {
        const agentParams = this.recastCrowd.getAgentParameters(index);
        if (parameters.radius !== undefined) {
            agentParams.radius = parameters.radius;
        }
        if (parameters.height !== undefined) {
            agentParams.height = parameters.height;
        }
        if (parameters.maxAcceleration !== undefined) {
            agentParams.maxAcceleration = parameters.maxAcceleration;
        }
        if (parameters.maxSpeed !== undefined) {
            agentParams.maxSpeed = parameters.maxSpeed;
        }
        if (parameters.collisionQueryRange !== undefined) {
            agentParams.collisionQueryRange = parameters.collisionQueryRange;
        }
        if (parameters.pathOptimizationRange !== undefined) {
            agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
        }
        if (parameters.separationWeight !== undefined) {
            agentParams.separationWeight = parameters.separationWeight;
        }
        this.recastCrowd.setAgentParameters(index, agentParams);
    }
    /**
     * remove a particular agent previously created
     * @param index agent index returned by addAgent
     */
    removeAgent(index) {
        this.recastCrowd.removeAgent(index);
        const item = this.agents.indexOf(index);
        if (item > -1) {
            this.agents.splice(item, 1);
            this.transforms.splice(item, 1);
            this.reachRadii.splice(item, 1);
            this._agentDestinationArmed.splice(item, 1);
            this._agentDestination.splice(item, 1);
        }
    }
    /**
     * get the list of all agents attached to this crowd
     * @returns list of agent indices
     */
    getAgents() {
        return this.agents;
    }
    /**
     * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
     * @param deltaTime in seconds
     */
    update(deltaTime) {
        // update obstacles
        this.bjsRECASTPlugin.navMesh.update();
        if (deltaTime <= Epsilon) {
            return;
        }
        // update crowd
        const timeStep = this.bjsRECASTPlugin.getTimeStep();
        const maxStepCount = this.bjsRECASTPlugin.getMaximumSubStepCount();
        if (timeStep <= Epsilon) {
            this.recastCrowd.update(deltaTime);
        }
        else {
            let iterationCount = Math.floor(deltaTime / timeStep);
            if (maxStepCount && iterationCount > maxStepCount) {
                iterationCount = maxStepCount;
            }
            if (iterationCount < 1) {
                iterationCount = 1;
            }
            const step = deltaTime / iterationCount;
            for (let i = 0; i < iterationCount; i++) {
                this.recastCrowd.update(step);
            }
        }
        // update transforms
        for (let index = 0; index < this.agents.length; index++) {
            // update transform position
            const agentIndex = this.agents[index];
            const agentPosition = this.getAgentPosition(agentIndex);
            this.transforms[index].position = agentPosition;
            // check agent reach destination
            if (this._agentDestinationArmed[index]) {
                const dx = agentPosition.x - this._agentDestination[index].x;
                const dz = agentPosition.z - this._agentDestination[index].z;
                const radius = this.reachRadii[index];
                const groundY = this._agentDestination[index].y - this.reachRadii[index];
                const ceilingY = this._agentDestination[index].y + this.reachRadii[index];
                const distanceXZSquared = dx * dx + dz * dz;
                if (agentPosition.y > groundY && agentPosition.y < ceilingY && distanceXZSquared < radius * radius) {
                    this._agentDestinationArmed[index] = false;
                    this.onReachTargetObservable.notifyObservers({ agentIndex: agentIndex, destination: this._agentDestination[index] });
                }
            }
        }
    }
    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent) {
        const ext = new this.bjsRECASTPlugin.bjsRECAST.Vec3(extent.x, extent.y, extent.z);
        this.recastCrowd.setDefaultQueryExtent(ext);
    }
    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent() {
        const p = this.recastCrowd.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }
    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result) {
        const p = this.recastCrowd.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }
    /**
     * Get the next corner points composing the path (max 4 points)
     * @param index agent index returned by addAgent
     * @returns array containing world position composing the path
     */
    getCorners(index) {
        let pt;
        const navPath = this.recastCrowd.getCorners(index);
        const pointCount = navPath.getPointCount();
        const positions = [];
        for (pt = 0; pt < pointCount; pt++) {
            const p = navPath.getPoint(pt);
            positions.push(new Vector3(p.x, p.y, p.z));
        }
        return positions;
    }
    /**
     * Release all resources
     */
    dispose() {
        this.recastCrowd.destroy();
        this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
        this._onBeforeAnimationsObserver = null;
        this.onReachTargetObservable.clear();
    }
}
//# sourceMappingURL=recastJSPlugin.js.map