import { AbstractMesh } from "../Meshes/abstractMesh.js";
import { Mesh } from "../Meshes/mesh.js";
import { Vector3 } from "../Maths/math.vector.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { VertexData } from "../Meshes/mesh.vertexData.js";
import { Lerp } from "../Maths/math.scalar.functions.js";
Mesh._TrailMeshParser = (parsedMesh, scene) => {
    return TrailMesh.Parse(parsedMesh, scene);
};
/**
 * Class used to create a trail following a mesh
 */
export class TrailMesh extends Mesh {
    /** @internal */
    constructor(name, generator, scene, diameterOrOptions, length = 60, autoStart = true) {
        super(name, scene);
        this._sectionPolygonPointsCount = 4;
        this._running = false;
        this._generator = generator;
        if (typeof diameterOrOptions === "object" && diameterOrOptions !== null) {
            this.diameter = diameterOrOptions.diameter || 1;
            this._length = diameterOrOptions.length || 60;
            this._segments = diameterOrOptions.segments ? (diameterOrOptions.segments > this._length ? this._length : diameterOrOptions.segments) : this._length;
            this._sectionPolygonPointsCount = diameterOrOptions.sections || 4;
            this._doNotTaper = diameterOrOptions.doNotTaper || false;
            this._autoStart = diameterOrOptions.autoStart || true;
        }
        else {
            this.diameter = diameterOrOptions || 1;
            this._length = length;
            this._segments = this._length;
            this._doNotTaper = false;
            this._autoStart = autoStart;
        }
        this._sectionVectors = [];
        this._sectionNormalVectors = [];
        for (let i = 0; i <= this._sectionPolygonPointsCount; i++) {
            this._sectionVectors[i] = Vector3.Zero();
            this._sectionNormalVectors[i] = Vector3.Zero();
        }
        this._createMesh();
    }
    /**
     * "TrailMesh"
     * @returns "TrailMesh"
     */
    getClassName() {
        return "TrailMesh";
    }
    _createMesh() {
        const data = new VertexData();
        const positions = [];
        const normals = [];
        const indices = [];
        const uvs = [];
        let meshCenter = Vector3.Zero();
        if (this._generator instanceof AbstractMesh && this._generator.hasBoundingInfo) {
            meshCenter = this._generator.getBoundingInfo().boundingBox.centerWorld;
        }
        else {
            meshCenter = this._generator.absolutePosition;
        }
        const alpha = (2 * Math.PI) / this._sectionPolygonPointsCount;
        for (let i = 0; i <= this._sectionPolygonPointsCount; i++) {
            const angle = i !== this._sectionPolygonPointsCount ? i * alpha : 0;
            positions.push(meshCenter.x + Math.cos(angle) * this.diameter, meshCenter.y + Math.sin(angle) * this.diameter, meshCenter.z);
            uvs.push(i / this._sectionPolygonPointsCount, 0);
        }
        for (let i = 1; i <= this._segments; i++) {
            for (let j = 0; j <= this._sectionPolygonPointsCount; j++) {
                const angle = j !== this._sectionPolygonPointsCount ? j * alpha : 0;
                positions.push(meshCenter.x + Math.cos(angle) * this.diameter, meshCenter.y + Math.sin(angle) * this.diameter, meshCenter.z);
                uvs.push(j / this._sectionPolygonPointsCount, i / this._segments);
            }
            const l = positions.length / 3 - 2 * (this._sectionPolygonPointsCount + 1);
            for (let j = 0; j <= this._sectionPolygonPointsCount; j++) {
                indices.push(l + j, l + j + this._sectionPolygonPointsCount, l + j + this._sectionPolygonPointsCount + 1);
                indices.push(l + j, l + j + this._sectionPolygonPointsCount + 1, l + j + 1);
            }
        }
        VertexData.ComputeNormals(positions, indices, normals);
        data.positions = positions;
        data.normals = normals;
        data.indices = indices;
        data.uvs = uvs;
        data.applyToMesh(this, true);
        if (this._autoStart) {
            this.start();
        }
    }
    _updateSectionVectors() {
        const wm = this._generator.getWorldMatrix();
        const alpha = (2 * Math.PI) / this._sectionPolygonPointsCount;
        for (let i = 0; i <= this._sectionPolygonPointsCount; i++) {
            const angle = i !== this._sectionPolygonPointsCount ? i * alpha : 0;
            this._sectionVectors[i].copyFromFloats(Math.cos(angle) * this.diameter, Math.sin(angle) * this.diameter, 0);
            this._sectionNormalVectors[i].copyFromFloats(Math.cos(angle), Math.sin(angle), 0);
            Vector3.TransformCoordinatesToRef(this._sectionVectors[i], wm, this._sectionVectors[i]);
            Vector3.TransformNormalToRef(this._sectionNormalVectors[i], wm, this._sectionNormalVectors[i]);
        }
    }
    /**
     * Start trailing mesh.
     */
    start() {
        if (!this._running) {
            this._running = true;
            this._beforeRenderObserver = this.getScene().onBeforeRenderObservable.add(() => {
                this.update();
            });
        }
    }
    /**
     * Stop trailing mesh.
     */
    stop() {
        if (this._beforeRenderObserver && this._running) {
            this._running = false;
            this.getScene().onBeforeRenderObservable.remove(this._beforeRenderObserver);
        }
    }
    /**
     * Update trailing mesh geometry.
     */
    update() {
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const normals = this.getVerticesData(VertexBuffer.NormalKind);
        const index = 3 * (this._sectionPolygonPointsCount + 1);
        if (positions && normals) {
            if (this._doNotTaper) {
                for (let i = index; i < positions.length; i++) {
                    positions[i - index] = Lerp(positions[i - index], positions[i], this._segments / this._length);
                }
            }
            else {
                for (let i = index; i < positions.length; i++) {
                    positions[i - index] = Lerp(positions[i - index], positions[i], this._segments / this._length) - (normals[i] / this._length) * this.diameter;
                }
            }
            for (let i = index; i < normals.length; i++) {
                normals[i - index] = Lerp(normals[i - index], normals[i], this._segments / this._length);
            }
            this._updateSectionVectors();
            const l = positions.length - 3 * (this._sectionPolygonPointsCount + 1);
            for (let i = 0; i <= this._sectionPolygonPointsCount; i++) {
                positions[l + 3 * i] = this._sectionVectors[i].x;
                positions[l + 3 * i + 1] = this._sectionVectors[i].y;
                positions[l + 3 * i + 2] = this._sectionVectors[i].z;
                normals[l + 3 * i] = this._sectionNormalVectors[i].x;
                normals[l + 3 * i + 1] = this._sectionNormalVectors[i].y;
                normals[l + 3 * i + 2] = this._sectionNormalVectors[i].z;
            }
            this.updateVerticesData(VertexBuffer.PositionKind, positions, true, false);
            this.updateVerticesData(VertexBuffer.NormalKind, normals, true, false);
        }
    }
    /**
     * Reset trailing mesh geometry.
     */
    reset() {
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const normals = this.getVerticesData(VertexBuffer.NormalKind);
        if (positions && normals) {
            this._updateSectionVectors();
            for (let i = 0; i <= this._segments; i++) {
                const l = 3 * i * (this._sectionPolygonPointsCount + 1);
                for (let j = 0; j <= this._sectionPolygonPointsCount; j++) {
                    positions[l + 3 * j] = this._sectionVectors[j].x;
                    positions[l + 3 * j + 1] = this._sectionVectors[j].y;
                    positions[l + 3 * j + 2] = this._sectionVectors[j].z;
                    normals[l + 3 * j] = this._sectionNormalVectors[j].x;
                    normals[l + 3 * j + 1] = this._sectionNormalVectors[j].y;
                    normals[l + 3 * j + 2] = this._sectionNormalVectors[j].z;
                }
            }
            this.updateVerticesData(VertexBuffer.PositionKind, positions, true, false);
            this.updateVerticesData(VertexBuffer.NormalKind, normals, true, false);
        }
    }
    /**
     * Returns a new TrailMesh object.
     * @param name is a string, the name given to the new mesh
     * @param newGenerator use new generator object for cloned trail mesh
     * @returns a new mesh
     */
    clone(name = "", newGenerator) {
        const options = {
            diameter: this.diameter,
            length: this._length,
            segments: this._segments,
            sections: this._sectionPolygonPointsCount,
            doNotTaper: this._doNotTaper,
            autoStart: this._autoStart,
        };
        return new TrailMesh(name, newGenerator ?? this._generator, this.getScene(), options);
    }
    /**
     * Serializes this trail mesh
     * @param serializationObject object to write serialization to
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.generatorId = this._generator.id;
    }
    /**
     * Parses a serialized trail mesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the trail mesh in
     * @returns the created trail mesh
     */
    static Parse(parsedMesh, scene) {
        const generator = scene.getLastMeshById(parsedMesh.generatorId) ?? scene.getLastTransformNodeById(parsedMesh.generatorId);
        if (!generator) {
            throw new Error("TrailMesh: generator not found with ID " + parsedMesh.generatorId);
        }
        const options = {
            diameter: parsedMesh.diameter ?? parsedMesh._diameter,
            length: parsedMesh._length,
            segments: parsedMesh._segments,
            sections: parsedMesh._sectionPolygonPointsCount,
            doNotTaper: parsedMesh._doNotTaper,
            autoStart: parsedMesh._autoStart,
        };
        return new TrailMesh(parsedMesh.name, generator, scene, options);
    }
}
//# sourceMappingURL=trailMesh.js.map