import { Vector3 } from "../Maths/math.vector.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { SubMesh } from "../Meshes/subMesh.js";
import { Mesh } from "../Meshes/mesh.js";
import { AsyncLoop } from "../Misc/tools.js";
import { Epsilon } from "../Maths/math.constants.js";
/**
 * Class used to specify simplification options
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export class SimplificationSettings {
    /**
     * Creates a SimplificationSettings
     * @param quality expected quality
     * @param distance distance when this optimized version should be used
     * @param optimizeMesh already optimized mesh
     */
    constructor(
    /** expected quality */
    quality, 
    /** distance when this optimized version should be used */
    distance, 
    /** already optimized mesh  */
    optimizeMesh) {
        this.quality = quality;
        this.distance = distance;
        this.optimizeMesh = optimizeMesh;
    }
}
/**
 * Queue used to order the simplification tasks
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export class SimplificationQueue {
    /**
     * Creates a new queue
     */
    constructor() {
        this.running = false;
        this._simplificationArray = [];
    }
    /**
     * Adds a new simplification task
     * @param task defines a task to add
     */
    addTask(task) {
        this._simplificationArray.push(task);
    }
    /**
     * Execute next task
     */
    executeNext() {
        const task = this._simplificationArray.pop();
        if (task) {
            this.running = true;
            this.runSimplification(task);
        }
        else {
            this.running = false;
        }
    }
    /**
     * Execute a simplification task
     * @param task defines the task to run
     */
    runSimplification(task) {
        if (task.parallelProcessing) {
            //parallel simplifier
            task.settings.forEach((setting) => {
                const simplifier = this._getSimplifier(task);
                simplifier.simplify(setting, (newMesh) => {
                    if (setting.distance !== undefined) {
                        task.mesh.addLODLevel(setting.distance, newMesh);
                    }
                    newMesh.isVisible = true;
                    //check if it is the last
                    if (setting.quality === task.settings[task.settings.length - 1].quality && task.successCallback) {
                        //all done, run the success callback.
                        task.successCallback();
                    }
                    this.executeNext();
                });
            });
        }
        else {
            //single simplifier.
            const simplifier = this._getSimplifier(task);
            const runDecimation = (setting, callback) => {
                simplifier.simplify(setting, (newMesh) => {
                    if (setting.distance !== undefined) {
                        task.mesh.addLODLevel(setting.distance, newMesh);
                    }
                    newMesh.isVisible = true;
                    //run the next quality level
                    callback();
                });
            };
            AsyncLoop.Run(task.settings.length, (loop) => {
                runDecimation(task.settings[loop.index], () => {
                    loop.executeNext();
                });
            }, () => {
                //execution ended, run the success callback.
                if (task.successCallback) {
                    task.successCallback();
                }
                this.executeNext();
            });
        }
    }
    _getSimplifier(task) {
        switch (task.simplificationType) {
            case 0 /* SimplificationType.QUADRATIC */:
            default:
                return new QuadraticErrorSimplification(task.mesh);
        }
    }
}
/**
 * The implemented types of simplification
 * At the moment only Quadratic Error Decimation is implemented
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export var SimplificationType;
(function (SimplificationType) {
    /** Quadratic error decimation */
    SimplificationType[SimplificationType["QUADRATIC"] = 0] = "QUADRATIC";
})(SimplificationType || (SimplificationType = {}));
class DecimationTriangle {
    constructor(_vertices) {
        this._vertices = _vertices;
        this.error = new Array(4);
        this.deleted = false;
        this.isDirty = false;
        this.deletePending = false;
        this.borderFactor = 0;
    }
}
class DecimationVertex {
    constructor(position, id) {
        this.position = position;
        this.id = id;
        this.isBorder = true;
        this.q = new QuadraticMatrix();
        this.triangleCount = 0;
        this.triangleStart = 0;
        this.originalOffsets = [];
    }
    updatePosition(newPosition) {
        this.position.copyFrom(newPosition);
    }
}
class QuadraticMatrix {
    constructor(data) {
        this.data = new Array(10);
        for (let i = 0; i < 10; ++i) {
            if (data && data[i]) {
                this.data[i] = data[i];
            }
            else {
                this.data[i] = 0;
            }
        }
    }
    det(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
        const det = this.data[a11] * this.data[a22] * this.data[a33] +
            this.data[a13] * this.data[a21] * this.data[a32] +
            this.data[a12] * this.data[a23] * this.data[a31] -
            this.data[a13] * this.data[a22] * this.data[a31] -
            this.data[a11] * this.data[a23] * this.data[a32] -
            this.data[a12] * this.data[a21] * this.data[a33];
        return det;
    }
    addInPlace(matrix) {
        for (let i = 0; i < 10; ++i) {
            this.data[i] += matrix.data[i];
        }
    }
    addArrayInPlace(data) {
        for (let i = 0; i < 10; ++i) {
            this.data[i] += data[i];
        }
    }
    add(matrix) {
        const m = new QuadraticMatrix();
        for (let i = 0; i < 10; ++i) {
            m.data[i] = this.data[i] + matrix.data[i];
        }
        return m;
    }
    static FromData(a, b, c, d) {
        return new QuadraticMatrix(QuadraticMatrix.DataFromNumbers(a, b, c, d));
    }
    //returning an array to avoid garbage collection
    static DataFromNumbers(a, b, c, d) {
        return [a * a, a * b, a * c, a * d, b * b, b * c, b * d, c * c, c * d, d * d];
    }
}
class Reference {
    constructor(vertexId, triangleId) {
        this.vertexId = vertexId;
        this.triangleId = triangleId;
    }
}
/**
 * An implementation of the Quadratic Error simplification algorithm.
 * Original paper : http://www1.cs.columbia.edu/~cs4162/html05s/garland97.pdf
 * Ported mostly from QSlim and http://voxels.blogspot.de/2014/05/quadric-mesh-simplification-with-source.html to babylon JS
 * @author RaananW
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/simplifyingMeshes
 */
export class QuadraticErrorSimplification {
    /**
     * Creates a new QuadraticErrorSimplification
     * @param _mesh defines the target mesh
     */
    constructor(_mesh) {
        this._mesh = _mesh;
        /** Gets or sets the number pf sync iterations */
        this.syncIterations = 5000;
        this.aggressiveness = 7;
        this.decimationIterations = 100;
        this.boundingBoxEpsilon = Epsilon;
    }
    /**
     * Simplification of a given mesh according to the given settings.
     * Since this requires computation, it is assumed that the function runs async.
     * @param settings The settings of the simplification, including quality and distance
     * @param successCallback A callback that will be called after the mesh was simplified.
     */
    simplify(settings, successCallback) {
        this._initDecimatedMesh();
        //iterating through the submeshes array, one after the other.
        AsyncLoop.Run(this._mesh.subMeshes.length, (loop) => {
            this._initWithMesh(loop.index, () => {
                this._runDecimation(settings, loop.index, () => {
                    loop.executeNext();
                });
            }, settings.optimizeMesh);
        }, () => {
            setTimeout(() => {
                successCallback(this._reconstructedMesh);
            }, 0);
        });
    }
    _runDecimation(settings, submeshIndex, successCallback) {
        const targetCount = ~~(this._triangles.length * settings.quality);
        let deletedTriangles = 0;
        const triangleCount = this._triangles.length;
        const iterationFunction = (iteration, callback) => {
            setTimeout(() => {
                if (iteration % 5 === 0) {
                    this._updateMesh(iteration === 0);
                }
                for (let i = 0; i < this._triangles.length; ++i) {
                    this._triangles[i].isDirty = false;
                }
                const threshold = 0.000000001 * Math.pow(iteration + 3, this.aggressiveness);
                const trianglesIterator = (i) => {
                    const tIdx = ~~((this._triangles.length / 2 + i) % this._triangles.length);
                    const t = this._triangles[tIdx];
                    if (!t) {
                        return;
                    }
                    if (t.error[3] > threshold || t.deleted || t.isDirty) {
                        return;
                    }
                    for (let j = 0; j < 3; ++j) {
                        if (t.error[j] < threshold) {
                            const deleted0 = [];
                            const deleted1 = [];
                            const v0 = t._vertices[j];
                            const v1 = t._vertices[(j + 1) % 3];
                            if (v0.isBorder || v1.isBorder) {
                                continue;
                            }
                            const p = Vector3.Zero();
                            // var n = Vector3.Zero();
                            // var uv = Vector2.Zero();
                            // var color = new Color4(0, 0, 0, 1);
                            this._calculateError(v0, v1, p);
                            const delTr = [];
                            if (this._isFlipped(v0, v1, p, deleted0, delTr)) {
                                continue;
                            }
                            if (this._isFlipped(v1, v0, p, deleted1, delTr)) {
                                continue;
                            }
                            if (deleted0.indexOf(true) < 0 || deleted1.indexOf(true) < 0) {
                                continue;
                            }
                            const uniqueArray = [];
                            delTr.forEach((deletedT) => {
                                if (uniqueArray.indexOf(deletedT) === -1) {
                                    deletedT.deletePending = true;
                                    uniqueArray.push(deletedT);
                                }
                            });
                            if (uniqueArray.length % 2 !== 0) {
                                continue;
                            }
                            v0.q = v1.q.add(v0.q);
                            v0.updatePosition(p);
                            const tStart = this._references.length;
                            deletedTriangles = this._updateTriangles(v0, v0, deleted0, deletedTriangles);
                            deletedTriangles = this._updateTriangles(v0, v1, deleted1, deletedTriangles);
                            const tCount = this._references.length - tStart;
                            if (tCount <= v0.triangleCount) {
                                if (tCount) {
                                    for (let c = 0; c < tCount; c++) {
                                        this._references[v0.triangleStart + c] = this._references[tStart + c];
                                    }
                                }
                            }
                            else {
                                v0.triangleStart = tStart;
                            }
                            v0.triangleCount = tCount;
                            break;
                        }
                    }
                };
                AsyncLoop.SyncAsyncForLoop(this._triangles.length, this.syncIterations, trianglesIterator, callback, () => {
                    return triangleCount - deletedTriangles <= targetCount;
                });
            }, 0);
        };
        AsyncLoop.Run(this.decimationIterations, (loop) => {
            if (triangleCount - deletedTriangles <= targetCount) {
                loop.breakLoop();
            }
            else {
                iterationFunction(loop.index, () => {
                    loop.executeNext();
                });
            }
        }, () => {
            setTimeout(() => {
                //reconstruct this part of the mesh
                this._reconstructMesh(submeshIndex);
                successCallback();
            }, 0);
        });
    }
    _initWithMesh(submeshIndex, callback, optimizeMesh) {
        this._vertices = [];
        this._triangles = [];
        const positionData = this._mesh.getVerticesData(VertexBuffer.PositionKind);
        const indices = this._mesh.getIndices();
        const submesh = this._mesh.subMeshes[submeshIndex];
        const findInVertices = (positionToSearch) => {
            if (optimizeMesh) {
                for (let ii = 0; ii < this._vertices.length; ++ii) {
                    if (this._vertices[ii].position.equalsWithEpsilon(positionToSearch, 0.0001)) {
                        return this._vertices[ii];
                    }
                }
            }
            return null;
        };
        const vertexReferences = [];
        const vertexInit = (i) => {
            if (!positionData) {
                return;
            }
            const offset = i + submesh.verticesStart;
            const position = Vector3.FromArray(positionData, offset * 3);
            const vertex = findInVertices(position) || new DecimationVertex(position, this._vertices.length);
            vertex.originalOffsets.push(offset);
            if (vertex.id === this._vertices.length) {
                this._vertices.push(vertex);
            }
            vertexReferences.push(vertex.id);
        };
        //var totalVertices = mesh.getTotalVertices();
        const totalVertices = submesh.verticesCount;
        AsyncLoop.SyncAsyncForLoop(totalVertices, (this.syncIterations / 4) >> 0, vertexInit, () => {
            const indicesInit = (i) => {
                if (!indices) {
                    return;
                }
                const offset = submesh.indexStart / 3 + i;
                const pos = offset * 3;
                const i0 = indices[pos + 0];
                const i1 = indices[pos + 1];
                const i2 = indices[pos + 2];
                const v0 = this._vertices[vertexReferences[i0 - submesh.verticesStart]];
                const v1 = this._vertices[vertexReferences[i1 - submesh.verticesStart]];
                const v2 = this._vertices[vertexReferences[i2 - submesh.verticesStart]];
                const triangle = new DecimationTriangle([v0, v1, v2]);
                triangle.originalOffset = pos;
                this._triangles.push(triangle);
            };
            AsyncLoop.SyncAsyncForLoop(submesh.indexCount / 3, this.syncIterations, indicesInit, () => {
                this._init(callback);
            });
        });
    }
    _init(callback) {
        const triangleInit1 = (i) => {
            const t = this._triangles[i];
            t.normal = Vector3.Cross(t._vertices[1].position.subtract(t._vertices[0].position), t._vertices[2].position.subtract(t._vertices[0].position)).normalize();
            for (let j = 0; j < 3; j++) {
                t._vertices[j].q.addArrayInPlace(QuadraticMatrix.DataFromNumbers(t.normal.x, t.normal.y, t.normal.z, -Vector3.Dot(t.normal, t._vertices[0].position)));
            }
        };
        AsyncLoop.SyncAsyncForLoop(this._triangles.length, this.syncIterations, triangleInit1, () => {
            const triangleInit2 = (i) => {
                const t = this._triangles[i];
                for (let j = 0; j < 3; ++j) {
                    t.error[j] = this._calculateError(t._vertices[j], t._vertices[(j + 1) % 3]);
                }
                t.error[3] = Math.min(t.error[0], t.error[1], t.error[2]);
            };
            AsyncLoop.SyncAsyncForLoop(this._triangles.length, this.syncIterations, triangleInit2, () => {
                callback();
            });
        });
    }
    _reconstructMesh(submeshIndex) {
        const newTriangles = [];
        let i;
        for (i = 0; i < this._vertices.length; ++i) {
            this._vertices[i].triangleCount = 0;
        }
        let t;
        let j;
        for (i = 0; i < this._triangles.length; ++i) {
            if (!this._triangles[i].deleted) {
                t = this._triangles[i];
                for (j = 0; j < 3; ++j) {
                    t._vertices[j].triangleCount = 1;
                }
                newTriangles.push(t);
            }
        }
        const newPositionData = (this._reconstructedMesh.getVerticesData(VertexBuffer.PositionKind) || []);
        const newNormalData = (this._reconstructedMesh.getVerticesData(VertexBuffer.NormalKind) || []);
        const newUVsData = (this._reconstructedMesh.getVerticesData(VertexBuffer.UVKind) || []);
        const newColorsData = (this._reconstructedMesh.getVerticesData(VertexBuffer.ColorKind) || []);
        const normalData = this._mesh.getVerticesData(VertexBuffer.NormalKind);
        const uvs = this._mesh.getVerticesData(VertexBuffer.UVKind);
        const colorsData = this._mesh.getVerticesData(VertexBuffer.ColorKind);
        let vertexCount = 0;
        for (i = 0; i < this._vertices.length; ++i) {
            const vertex = this._vertices[i];
            vertex.id = vertexCount;
            if (vertex.triangleCount) {
                vertex.originalOffsets.forEach((originalOffset) => {
                    newPositionData.push(vertex.position.x);
                    newPositionData.push(vertex.position.y);
                    newPositionData.push(vertex.position.z);
                    if (normalData && normalData.length) {
                        newNormalData.push(normalData[originalOffset * 3]);
                        newNormalData.push(normalData[originalOffset * 3 + 1]);
                        newNormalData.push(normalData[originalOffset * 3 + 2]);
                    }
                    if (uvs && uvs.length) {
                        newUVsData.push(uvs[originalOffset * 2]);
                        newUVsData.push(uvs[originalOffset * 2 + 1]);
                    }
                    if (colorsData && colorsData.length) {
                        newColorsData.push(colorsData[originalOffset * 4]);
                        newColorsData.push(colorsData[originalOffset * 4 + 1]);
                        newColorsData.push(colorsData[originalOffset * 4 + 2]);
                        newColorsData.push(colorsData[originalOffset * 4 + 3]);
                    }
                    ++vertexCount;
                });
            }
        }
        const startingIndex = this._reconstructedMesh.getTotalIndices();
        const startingVertex = this._reconstructedMesh.getTotalVertices();
        const submeshesArray = this._reconstructedMesh.subMeshes;
        this._reconstructedMesh.subMeshes = [];
        const newIndicesArray = this._reconstructedMesh.getIndices(); //[];
        const originalIndices = this._mesh.getIndices();
        for (i = 0; i < newTriangles.length; ++i) {
            t = newTriangles[i]; //now get the new referencing point for each vertex
            [0, 1, 2].forEach((idx) => {
                const id = originalIndices[t.originalOffset + idx];
                let offset = t._vertices[idx].originalOffsets.indexOf(id);
                if (offset < 0) {
                    offset = 0;
                }
                newIndicesArray.push(t._vertices[idx].id + offset + startingVertex);
            });
        }
        //overwriting the old vertex buffers and indices.
        this._reconstructedMesh.setIndices(newIndicesArray);
        this._reconstructedMesh.setVerticesData(VertexBuffer.PositionKind, newPositionData);
        if (newNormalData.length > 0) {
            this._reconstructedMesh.setVerticesData(VertexBuffer.NormalKind, newNormalData);
        }
        if (newUVsData.length > 0) {
            this._reconstructedMesh.setVerticesData(VertexBuffer.UVKind, newUVsData);
        }
        if (newColorsData.length > 0) {
            this._reconstructedMesh.setVerticesData(VertexBuffer.ColorKind, newColorsData);
        }
        //create submesh
        const originalSubmesh = this._mesh.subMeshes[submeshIndex];
        if (submeshIndex > 0) {
            this._reconstructedMesh.subMeshes = [];
            submeshesArray.forEach((submesh) => {
                SubMesh.AddToMesh(submesh.materialIndex, submesh.verticesStart, submesh.verticesCount, 
                /* 0, newPositionData.length/3, */ submesh.indexStart, submesh.indexCount, submesh.getMesh());
            });
            SubMesh.AddToMesh(originalSubmesh.materialIndex, startingVertex, vertexCount, 
            /* 0, newPositionData.length / 3, */ startingIndex, newTriangles.length * 3, this._reconstructedMesh);
        }
    }
    _initDecimatedMesh() {
        this._reconstructedMesh = new Mesh(this._mesh.name + "Decimated", this._mesh.getScene());
        this._reconstructedMesh.material = this._mesh.material;
        this._reconstructedMesh.parent = this._mesh.parent;
        this._reconstructedMesh.isVisible = false;
        this._reconstructedMesh.renderingGroupId = this._mesh.renderingGroupId;
    }
    _isFlipped(vertex1, vertex2, point, deletedArray, delTr) {
        for (let i = 0; i < vertex1.triangleCount; ++i) {
            const t = this._triangles[this._references[vertex1.triangleStart + i].triangleId];
            if (t.deleted) {
                continue;
            }
            const s = this._references[vertex1.triangleStart + i].vertexId;
            const v1 = t._vertices[(s + 1) % 3];
            const v2 = t._vertices[(s + 2) % 3];
            if (v1 === vertex2 || v2 === vertex2) {
                deletedArray[i] = true;
                delTr.push(t);
                continue;
            }
            let d1 = v1.position.subtract(point);
            d1 = d1.normalize();
            let d2 = v2.position.subtract(point);
            d2 = d2.normalize();
            if (Math.abs(Vector3.Dot(d1, d2)) > 0.999) {
                return true;
            }
            const normal = Vector3.Cross(d1, d2).normalize();
            deletedArray[i] = false;
            if (Vector3.Dot(normal, t.normal) < 0.2) {
                return true;
            }
        }
        return false;
    }
    _updateTriangles(origVertex, vertex, deletedArray, deletedTriangles) {
        let newDeleted = deletedTriangles;
        for (let i = 0; i < vertex.triangleCount; ++i) {
            const ref = this._references[vertex.triangleStart + i];
            const t = this._triangles[ref.triangleId];
            if (t.deleted) {
                continue;
            }
            if (deletedArray[i] && t.deletePending) {
                t.deleted = true;
                newDeleted++;
                continue;
            }
            t._vertices[ref.vertexId] = origVertex;
            t.isDirty = true;
            t.error[0] = this._calculateError(t._vertices[0], t._vertices[1]) + t.borderFactor / 2;
            t.error[1] = this._calculateError(t._vertices[1], t._vertices[2]) + t.borderFactor / 2;
            t.error[2] = this._calculateError(t._vertices[2], t._vertices[0]) + t.borderFactor / 2;
            t.error[3] = Math.min(t.error[0], t.error[1], t.error[2]);
            this._references.push(ref);
        }
        return newDeleted;
    }
    _identifyBorder() {
        for (let i = 0; i < this._vertices.length; ++i) {
            const vCount = [];
            const vId = [];
            const v = this._vertices[i];
            let j;
            for (j = 0; j < v.triangleCount; ++j) {
                const triangle = this._triangles[this._references[v.triangleStart + j].triangleId];
                for (let ii = 0; ii < 3; ii++) {
                    let ofs = 0;
                    const vv = triangle._vertices[ii];
                    while (ofs < vCount.length) {
                        if (vId[ofs] === vv.id) {
                            break;
                        }
                        ++ofs;
                    }
                    if (ofs === vCount.length) {
                        vCount.push(1);
                        vId.push(vv.id);
                    }
                    else {
                        vCount[ofs]++;
                    }
                }
            }
            for (j = 0; j < vCount.length; ++j) {
                if (vCount[j] === 1) {
                    this._vertices[vId[j]].isBorder = true;
                }
                else {
                    this._vertices[vId[j]].isBorder = false;
                }
            }
        }
    }
    _updateMesh(identifyBorders = false) {
        let i;
        if (!identifyBorders) {
            const newTrianglesVector = [];
            for (i = 0; i < this._triangles.length; ++i) {
                if (!this._triangles[i].deleted) {
                    newTrianglesVector.push(this._triangles[i]);
                }
            }
            this._triangles = newTrianglesVector;
        }
        for (i = 0; i < this._vertices.length; ++i) {
            this._vertices[i].triangleCount = 0;
            this._vertices[i].triangleStart = 0;
        }
        let t;
        let j;
        let v;
        for (i = 0; i < this._triangles.length; ++i) {
            t = this._triangles[i];
            for (j = 0; j < 3; ++j) {
                v = t._vertices[j];
                v.triangleCount++;
            }
        }
        let tStart = 0;
        for (i = 0; i < this._vertices.length; ++i) {
            this._vertices[i].triangleStart = tStart;
            tStart += this._vertices[i].triangleCount;
            this._vertices[i].triangleCount = 0;
        }
        const newReferences = new Array(this._triangles.length * 3);
        for (i = 0; i < this._triangles.length; ++i) {
            t = this._triangles[i];
            for (j = 0; j < 3; ++j) {
                v = t._vertices[j];
                newReferences[v.triangleStart + v.triangleCount] = new Reference(j, i);
                v.triangleCount++;
            }
        }
        this._references = newReferences;
        if (identifyBorders) {
            this._identifyBorder();
        }
    }
    _vertexError(q, point) {
        const x = point.x;
        const y = point.y;
        const z = point.z;
        return (q.data[0] * x * x +
            2 * q.data[1] * x * y +
            2 * q.data[2] * x * z +
            2 * q.data[3] * x +
            q.data[4] * y * y +
            2 * q.data[5] * y * z +
            2 * q.data[6] * y +
            q.data[7] * z * z +
            2 * q.data[8] * z +
            q.data[9]);
    }
    _calculateError(vertex1, vertex2, pointResult) {
        const q = vertex1.q.add(vertex2.q);
        const border = vertex1.isBorder && vertex2.isBorder;
        let error = 0;
        const qDet = q.det(0, 1, 2, 1, 4, 5, 2, 5, 7);
        if (qDet !== 0 && !border) {
            if (!pointResult) {
                pointResult = Vector3.Zero();
            }
            pointResult.x = (-1 / qDet) * q.det(1, 2, 3, 4, 5, 6, 5, 7, 8);
            pointResult.y = (1 / qDet) * q.det(0, 2, 3, 1, 5, 6, 2, 7, 8);
            pointResult.z = (-1 / qDet) * q.det(0, 1, 3, 1, 4, 6, 2, 5, 8);
            error = this._vertexError(q, pointResult);
        }
        else {
            const p3 = vertex1.position.add(vertex2.position).divide(new Vector3(2, 2, 2));
            //var norm3 = (vertex1.normal.add(vertex2.normal)).divide(new Vector3(2, 2, 2)).normalize();
            const error1 = this._vertexError(q, vertex1.position);
            const error2 = this._vertexError(q, vertex2.position);
            const error3 = this._vertexError(q, p3);
            error = Math.min(error1, error2, error3);
            if (error === error1) {
                if (pointResult) {
                    pointResult.copyFrom(vertex1.position);
                }
            }
            else if (error === error2) {
                if (pointResult) {
                    pointResult.copyFrom(vertex2.position);
                }
            }
            else {
                if (pointResult) {
                    pointResult.copyFrom(p3);
                }
            }
        }
        return error;
    }
}
//# sourceMappingURL=meshSimplification.js.map