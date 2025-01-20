import { VertexBuffer } from "../Buffers/buffer.js";
import { IntersectionInfo } from "../Collisions/intersectionInfo.js";
import { BoundingInfo } from "../Culling/boundingInfo.js";

import { extractMinAndMaxIndexed } from "../Maths/math.functions.js";
import { DrawWrapper } from "../Materials/drawWrapper.js";
/**
 * Defines a subdivision inside a mesh
 */
export class SubMesh {
    /**
     * Gets material defines used by the effect associated to the sub mesh
     */
    get materialDefines() {
        return this._mainDrawWrapperOverride ? this._mainDrawWrapperOverride.defines : this._getDrawWrapper()?.defines;
    }
    /**
     * Sets material defines used by the effect associated to the sub mesh
     */
    set materialDefines(defines) {
        const drawWrapper = this._mainDrawWrapperOverride ?? this._getDrawWrapper(undefined, true);
        drawWrapper.defines = defines;
    }
    /**
     * @internal
     */
    _getDrawWrapper(passId, createIfNotExisting = false) {
        passId = passId ?? this._engine.currentRenderPassId;
        let drawWrapper = this._drawWrappers[passId];
        if (!drawWrapper && createIfNotExisting) {
            this._drawWrappers[passId] = drawWrapper = new DrawWrapper(this._mesh.getScene().getEngine());
        }
        return drawWrapper;
    }
    /**
     * @internal
     */
    _removeDrawWrapper(passId, disposeWrapper = true, immediate = false) {
        if (disposeWrapper) {
            this._drawWrappers[passId]?.dispose(immediate);
        }
        this._drawWrappers[passId] = undefined;
    }
    /**
     * Gets associated (main) effect (possibly the effect override if defined)
     */
    get effect() {
        return this._mainDrawWrapperOverride ? this._mainDrawWrapperOverride.effect : (this._getDrawWrapper()?.effect ?? null);
    }
    /** @internal */
    get _drawWrapper() {
        return this._mainDrawWrapperOverride ?? this._getDrawWrapper(undefined, true);
    }
    /** @internal */
    get _drawWrapperOverride() {
        return this._mainDrawWrapperOverride;
    }
    /**
     * @internal
     */
    _setMainDrawWrapperOverride(wrapper) {
        this._mainDrawWrapperOverride = wrapper;
    }
    /**
     * Sets associated effect (effect used to render this submesh)
     * @param effect defines the effect to associate with
     * @param defines defines the set of defines used to compile this effect
     * @param materialContext material context associated to the effect
     * @param resetContext true to reset the draw context
     */
    setEffect(effect, defines = null, materialContext, resetContext = true) {
        const drawWrapper = this._drawWrapper;
        drawWrapper.setEffect(effect, defines, resetContext);
        if (materialContext !== undefined) {
            drawWrapper.materialContext = materialContext;
        }
        if (!effect) {
            drawWrapper.defines = null;
            drawWrapper.materialContext = undefined;
        }
    }
    /**
     * Resets the draw wrappers cache
     * @param passId If provided, releases only the draw wrapper corresponding to this render pass id
     * @param immediate If true, the draw wrapper will dispose the effect immediately (false by default)
     */
    resetDrawCache(passId, immediate = false) {
        if (this._drawWrappers) {
            if (passId !== undefined) {
                this._removeDrawWrapper(passId, true, immediate);
                return;
            }
            else {
                for (const drawWrapper of this._drawWrappers) {
                    drawWrapper?.dispose(immediate);
                }
            }
        }
        this._drawWrappers = [];
    }
    /**
     * Add a new submesh to a mesh
     * @param materialIndex defines the material index to use
     * @param verticesStart defines vertex index start
     * @param verticesCount defines vertices count
     * @param indexStart defines index start
     * @param indexCount defines indices count
     * @param mesh defines the parent mesh
     * @param renderingMesh defines an optional rendering mesh
     * @param createBoundingBox defines if bounding box should be created for this submesh
     * @returns the new submesh
     */
    static AddToMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh, renderingMesh, createBoundingBox = true) {
        return new SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh, renderingMesh, createBoundingBox);
    }
    /**
     * Creates a new submesh
     * @param materialIndex defines the material index to use
     * @param verticesStart defines vertex index start
     * @param verticesCount defines vertices count
     * @param indexStart defines index start
     * @param indexCount defines indices count
     * @param mesh defines the parent mesh
     * @param renderingMesh defines an optional rendering mesh
     * @param createBoundingBox defines if bounding box should be created for this submesh
     * @param addToMesh defines a boolean indicating that the submesh must be added to the mesh.subMeshes array (true by default)
     */
    constructor(
    /** the material index to use */
    materialIndex, 
    /** vertex index start */
    verticesStart, 
    /** vertices count */
    verticesCount, 
    /** index start */
    indexStart, 
    /** indices count */
    indexCount, mesh, renderingMesh, createBoundingBox = true, addToMesh = true) {
        this.materialIndex = materialIndex;
        this.verticesStart = verticesStart;
        this.verticesCount = verticesCount;
        this.indexStart = indexStart;
        this.indexCount = indexCount;
        this._mainDrawWrapperOverride = null;
        /** @internal */
        this._linesIndexCount = 0;
        this._linesIndexBuffer = null;
        /** @internal */
        this._lastColliderWorldVertices = null;
        /** @internal */
        this._lastColliderTransformMatrix = null;
        /** @internal */
        this._wasDispatched = false;
        /** @internal */
        this._renderId = 0;
        /** @internal */
        this._alphaIndex = 0;
        /** @internal */
        this._distanceToCamera = 0;
        this._currentMaterial = null;
        this._mesh = mesh;
        this._renderingMesh = renderingMesh || mesh;
        if (addToMesh) {
            mesh.subMeshes.push(this);
        }
        this._engine = this._mesh.getScene().getEngine();
        this.resetDrawCache();
        this._trianglePlanes = [];
        this._id = mesh.subMeshes.length - 1;
        if (createBoundingBox) {
            this.refreshBoundingInfo();
            mesh.computeWorldMatrix(true);
        }
    }
    /**
     * Returns true if this submesh covers the entire parent mesh
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    get IsGlobal() {
        return this.verticesStart === 0 && this.verticesCount === this._mesh.getTotalVertices() && this.indexStart === 0 && this.indexCount === this._mesh.getTotalIndices();
    }
    /**
     * Returns the submesh BoundingInfo object
     * @returns current bounding info (or mesh's one if the submesh is global)
     */
    getBoundingInfo() {
        if (this.IsGlobal || this._mesh.hasThinInstances) {
            return this._mesh.getBoundingInfo();
        }
        return this._boundingInfo;
    }
    /**
     * Sets the submesh BoundingInfo
     * @param boundingInfo defines the new bounding info to use
     * @returns the SubMesh
     */
    setBoundingInfo(boundingInfo) {
        this._boundingInfo = boundingInfo;
        return this;
    }
    /**
     * Returns the mesh of the current submesh
     * @returns the parent mesh
     */
    getMesh() {
        return this._mesh;
    }
    /**
     * Returns the rendering mesh of the submesh
     * @returns the rendering mesh (could be different from parent mesh)
     */
    getRenderingMesh() {
        return this._renderingMesh;
    }
    /**
     * Returns the replacement mesh of the submesh
     * @returns the replacement mesh (could be different from parent mesh)
     */
    getReplacementMesh() {
        return this._mesh._internalAbstractMeshDataInfo._actAsRegularMesh ? this._mesh : null;
    }
    /**
     * Returns the effective mesh of the submesh
     * @returns the effective mesh (could be different from parent mesh)
     */
    getEffectiveMesh() {
        const replacementMesh = this._mesh._internalAbstractMeshDataInfo._actAsRegularMesh ? this._mesh : null;
        return replacementMesh ? replacementMesh : this._renderingMesh;
    }
    /**
     * Returns the submesh material
     * @param getDefaultMaterial Defines whether or not to get the default material if nothing has been defined.
     * @returns null or the current material
     */
    getMaterial(getDefaultMaterial = true) {
        const rootMaterial = this._renderingMesh.getMaterialForRenderPass(this._engine.currentRenderPassId) ?? this._renderingMesh.material;
        if (!rootMaterial) {
            return getDefaultMaterial ? this._mesh.getScene().defaultMaterial : null;
        }
        else if (this._isMultiMaterial(rootMaterial)) {
            const effectiveMaterial = rootMaterial.getSubMaterial(this.materialIndex);
            if (this._currentMaterial !== effectiveMaterial) {
                this._currentMaterial = effectiveMaterial;
                this.resetDrawCache();
            }
            return effectiveMaterial;
        }
        return rootMaterial;
    }
    _isMultiMaterial(material) {
        return material.getSubMaterial !== undefined;
    }
    // Methods
    /**
     * Sets a new updated BoundingInfo object to the submesh
     * @param data defines an optional position array to use to determine the bounding info
     * @returns the SubMesh
     */
    refreshBoundingInfo(data = null) {
        this._lastColliderWorldVertices = null;
        if (this.IsGlobal || !this._renderingMesh || !this._renderingMesh.geometry) {
            return this;
        }
        if (!data) {
            data = this._renderingMesh.getVerticesData(VertexBuffer.PositionKind);
        }
        if (!data) {
            this._boundingInfo = this._mesh.getBoundingInfo();
            return this;
        }
        const indices = this._renderingMesh.getIndices();
        let extend;
        //is this the only submesh?
        if (this.indexStart === 0 && this.indexCount === indices.length) {
            const boundingInfo = this._renderingMesh.getBoundingInfo();
            //the rendering mesh's bounding info can be used, it is the standard submesh for all indices.
            extend = { minimum: boundingInfo.minimum.clone(), maximum: boundingInfo.maximum.clone() };
        }
        else {
            extend = extractMinAndMaxIndexed(data, indices, this.indexStart, this.indexCount, this._renderingMesh.geometry.boundingBias);
        }
        if (this._boundingInfo) {
            this._boundingInfo.reConstruct(extend.minimum, extend.maximum);
        }
        else {
            this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
        }
        return this;
    }
    /**
     * @internal
     */
    _checkCollision(collider) {
        const boundingInfo = this.getBoundingInfo();
        return boundingInfo._checkCollision(collider);
    }
    /**
     * Updates the submesh BoundingInfo
     * @param world defines the world matrix to use to update the bounding info
     * @returns the submesh
     */
    updateBoundingInfo(world) {
        let boundingInfo = this.getBoundingInfo();
        if (!boundingInfo) {
            this.refreshBoundingInfo();
            boundingInfo = this.getBoundingInfo();
        }
        if (boundingInfo) {
            boundingInfo.update(world);
        }
        return this;
    }
    /**
     * True is the submesh bounding box intersects the frustum defined by the passed array of planes.
     * @param frustumPlanes defines the frustum planes
     * @returns true if the submesh is intersecting with the frustum
     */
    isInFrustum(frustumPlanes) {
        const boundingInfo = this.getBoundingInfo();
        if (!boundingInfo) {
            return false;
        }
        return boundingInfo.isInFrustum(frustumPlanes, this._mesh.cullingStrategy);
    }
    /**
     * True is the submesh bounding box is completely inside the frustum defined by the passed array of planes
     * @param frustumPlanes defines the frustum planes
     * @returns true if the submesh is inside the frustum
     */
    isCompletelyInFrustum(frustumPlanes) {
        const boundingInfo = this.getBoundingInfo();
        if (!boundingInfo) {
            return false;
        }
        return boundingInfo.isCompletelyInFrustum(frustumPlanes);
    }
    /**
     * Renders the submesh
     * @param enableAlphaMode defines if alpha needs to be used
     * @returns the submesh
     */
    render(enableAlphaMode) {
        this._renderingMesh.render(this, enableAlphaMode, this._mesh._internalAbstractMeshDataInfo._actAsRegularMesh ? this._mesh : undefined);
        return this;
    }
    /**
     * @internal
     */
    _getLinesIndexBuffer(indices, engine) {
        if (!this._linesIndexBuffer) {
            const adjustedIndexCount = Math.floor(this.indexCount / 3) * 6;
            const shouldUseUint32 = this.verticesStart + this.verticesCount > 65535;
            const linesIndices = shouldUseUint32 ? new Uint32Array(adjustedIndexCount) : new Uint16Array(adjustedIndexCount);
            let offset = 0;
            if (indices.length === 0) {
                // Unindexed mesh
                for (let index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                    linesIndices[offset++] = index;
                    linesIndices[offset++] = index + 1;
                    linesIndices[offset++] = index + 1;
                    linesIndices[offset++] = index + 2;
                    linesIndices[offset++] = index + 2;
                    linesIndices[offset++] = index;
                }
            }
            else {
                for (let index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                    linesIndices[offset++] = indices[index];
                    linesIndices[offset++] = indices[index + 1];
                    linesIndices[offset++] = indices[index + 1];
                    linesIndices[offset++] = indices[index + 2];
                    linesIndices[offset++] = indices[index + 2];
                    linesIndices[offset++] = indices[index];
                }
            }
            this._linesIndexBuffer = engine.createIndexBuffer(linesIndices);
            this._linesIndexCount = linesIndices.length;
        }
        return this._linesIndexBuffer;
    }
    /**
     * Checks if the submesh intersects with a ray
     * @param ray defines the ray to test
     * @returns true is the passed ray intersects the submesh bounding box
     */
    canIntersects(ray) {
        const boundingInfo = this.getBoundingInfo();
        if (!boundingInfo) {
            return false;
        }
        return ray.intersectsBox(boundingInfo.boundingBox);
    }
    /**
     * Intersects current submesh with a ray
     * @param ray defines the ray to test
     * @param positions defines mesh's positions array
     * @param indices defines mesh's indices array
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @returns intersection info or null if no intersection
     */
    intersects(ray, positions, indices, fastCheck, trianglePredicate) {
        const material = this.getMaterial();
        if (!material) {
            return null;
        }
        let step = 3;
        let checkStopper = false;
        switch (material.fillMode) {
            case 3:
            case 5:
            case 6:
            case 8:
                return null;
            case 7:
                step = 1;
                checkStopper = true;
                break;
            default:
                break;
        }
        // LineMesh first as it's also a Mesh...
        if (material.fillMode === 4) {
            // Check if mesh is unindexed
            if (!indices.length) {
                return this._intersectUnIndexedLines(ray, positions, indices, this._mesh.intersectionThreshold, fastCheck);
            }
            return this._intersectLines(ray, positions, indices, this._mesh.intersectionThreshold, fastCheck);
        }
        else {
            // Check if mesh is unindexed
            if (!indices.length && this._mesh._unIndexed) {
                return this._intersectUnIndexedTriangles(ray, positions, indices, fastCheck, trianglePredicate);
            }
            return this._intersectTriangles(ray, positions, indices, step, checkStopper, fastCheck, trianglePredicate);
        }
    }
    /**
     * @internal
     */
    _intersectLines(ray, positions, indices, intersectionThreshold, fastCheck) {
        let intersectInfo = null;
        // Line test
        for (let index = this.indexStart; index < this.indexStart + this.indexCount; index += 2) {
            const p0 = positions[indices[index]];
            const p1 = positions[indices[index + 1]];
            const length = ray.intersectionSegment(p0, p1, intersectionThreshold);
            if (length < 0) {
                continue;
            }
            if (fastCheck || !intersectInfo || length < intersectInfo.distance) {
                intersectInfo = new IntersectionInfo(null, null, length);
                intersectInfo.faceId = index / 2;
                if (fastCheck) {
                    break;
                }
            }
        }
        return intersectInfo;
    }
    /**
     * @internal
     */
    _intersectUnIndexedLines(ray, positions, indices, intersectionThreshold, fastCheck) {
        let intersectInfo = null;
        // Line test
        for (let index = this.verticesStart; index < this.verticesStart + this.verticesCount; index += 2) {
            const p0 = positions[index];
            const p1 = positions[index + 1];
            const length = ray.intersectionSegment(p0, p1, intersectionThreshold);
            if (length < 0) {
                continue;
            }
            if (fastCheck || !intersectInfo || length < intersectInfo.distance) {
                intersectInfo = new IntersectionInfo(null, null, length);
                intersectInfo.faceId = index / 2;
                if (fastCheck) {
                    break;
                }
            }
        }
        return intersectInfo;
    }
    /**
     * @internal
     */
    _intersectTriangles(ray, positions, indices, step, checkStopper, fastCheck, trianglePredicate) {
        let intersectInfo = null;
        // Triangles test
        let faceId = -1;
        for (let index = this.indexStart; index < this.indexStart + this.indexCount - (3 - step); index += step) {
            faceId++;
            const indexA = indices[index];
            const indexB = indices[index + 1];
            const indexC = indices[index + 2];
            if (checkStopper && indexC === 0xffffffff) {
                index += 2;
                continue;
            }
            const p0 = positions[indexA];
            const p1 = positions[indexB];
            const p2 = positions[indexC];
            // stay defensive and don't check against undefined positions.
            if (!p0 || !p1 || !p2) {
                continue;
            }
            if (trianglePredicate && !trianglePredicate(p0, p1, p2, ray, indexA, indexB, indexC)) {
                continue;
            }
            const currentIntersectInfo = ray.intersectsTriangle(p0, p1, p2);
            if (currentIntersectInfo) {
                if (currentIntersectInfo.distance < 0) {
                    continue;
                }
                if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
                    intersectInfo = currentIntersectInfo;
                    intersectInfo.faceId = faceId;
                    if (fastCheck) {
                        break;
                    }
                }
            }
        }
        return intersectInfo;
    }
    /**
     * @internal
     */
    _intersectUnIndexedTriangles(ray, positions, indices, fastCheck, trianglePredicate) {
        let intersectInfo = null;
        // Triangles test
        for (let index = this.verticesStart; index < this.verticesStart + this.verticesCount; index += 3) {
            const p0 = positions[index];
            const p1 = positions[index + 1];
            const p2 = positions[index + 2];
            if (trianglePredicate && !trianglePredicate(p0, p1, p2, ray, -1, -1, -1)) {
                continue;
            }
            const currentIntersectInfo = ray.intersectsTriangle(p0, p1, p2);
            if (currentIntersectInfo) {
                if (currentIntersectInfo.distance < 0) {
                    continue;
                }
                if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
                    intersectInfo = currentIntersectInfo;
                    intersectInfo.faceId = index / 3;
                    if (fastCheck) {
                        break;
                    }
                }
            }
        }
        return intersectInfo;
    }
    /** @internal */
    _rebuild() {
        if (this._linesIndexBuffer) {
            this._linesIndexBuffer = null;
        }
    }
    // Clone
    /**
     * Creates a new submesh from the passed mesh
     * @param newMesh defines the new hosting mesh
     * @param newRenderingMesh defines an optional rendering mesh
     * @returns the new submesh
     */
    clone(newMesh, newRenderingMesh) {
        const result = new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh, newRenderingMesh, false);
        if (!this.IsGlobal) {
            const boundingInfo = this.getBoundingInfo();
            if (!boundingInfo) {
                return result;
            }
            result._boundingInfo = new BoundingInfo(boundingInfo.minimum, boundingInfo.maximum);
        }
        return result;
    }
    // Dispose
    /**
     * Release associated resources
     * @param immediate If true, the effect will be disposed immediately (false by default)
     */
    dispose(immediate = false) {
        if (this._linesIndexBuffer) {
            this._mesh.getScene().getEngine()._releaseBuffer(this._linesIndexBuffer);
            this._linesIndexBuffer = null;
        }
        // Remove from mesh
        const index = this._mesh.subMeshes.indexOf(this);
        this._mesh.subMeshes.splice(index, 1);
        this.resetDrawCache(undefined, immediate);
    }
    /**
     * Gets the class name
     * @returns the string "SubMesh".
     */
    getClassName() {
        return "SubMesh";
    }
    // Statics
    /**
     * Creates a new submesh from indices data
     * @param materialIndex the index of the main mesh material
     * @param startIndex the index where to start the copy in the mesh indices array
     * @param indexCount the number of indices to copy then from the startIndex
     * @param mesh the main mesh to create the submesh from
     * @param renderingMesh the optional rendering mesh
     * @param createBoundingBox defines if bounding box should be created for this submesh
     * @returns a new submesh
     */
    static CreateFromIndices(materialIndex, startIndex, indexCount, mesh, renderingMesh, createBoundingBox = true) {
        let minVertexIndex = Number.MAX_VALUE;
        let maxVertexIndex = -Number.MAX_VALUE;
        const whatWillRender = renderingMesh || mesh;
        const indices = whatWillRender.getIndices();
        for (let index = startIndex; index < startIndex + indexCount; index++) {
            const vertexIndex = indices[index];
            if (vertexIndex < minVertexIndex) {
                minVertexIndex = vertexIndex;
            }
            if (vertexIndex > maxVertexIndex) {
                maxVertexIndex = vertexIndex;
            }
        }
        return new SubMesh(materialIndex, minVertexIndex, maxVertexIndex - minVertexIndex + 1, startIndex, indexCount, mesh, renderingMesh, createBoundingBox);
    }
}
//# sourceMappingURL=subMesh.js.map