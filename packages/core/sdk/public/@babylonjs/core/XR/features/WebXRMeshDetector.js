import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Matrix, Quaternion } from "../../Maths/math.js";
import { Observable } from "../../Misc/observable.js";
import { Mesh } from "../../Meshes/mesh.js";
import { VertexBuffer } from "../../Buffers/buffer.js";
import { Logger } from "../../Misc/logger.js";
let meshIdProvider = 0;
/**
 * The mesh detector is used to detect meshes in the real world when in AR
 */
export class WebXRMeshDetector extends WebXRAbstractFeature {
    constructor(_xrSessionManager, _options = {}) {
        super(_xrSessionManager);
        this._options = _options;
        this._detectedMeshes = new Map();
        /**
         * Observers registered here will be executed when a new mesh was added to the session
         */
        this.onMeshAddedObservable = new Observable();
        /**
         * Observers registered here will be executed when a mesh is no longer detected in the session
         */
        this.onMeshRemovedObservable = new Observable();
        /**
         * Observers registered here will be executed when an existing mesh updates
         */
        this.onMeshUpdatedObservable = new Observable();
        this.xrNativeFeatureName = "mesh-detection";
        if (this._options.generateMeshes) {
            this._options.convertCoordinateSystems = true;
        }
        if (this._xrSessionManager.session) {
            this._init();
        }
        else {
            this._xrSessionManager.onXRSessionInit.addOnce(() => {
                this._init();
            });
        }
    }
    detach() {
        if (!super.detach()) {
            return false;
        }
        // Only supported by BabylonNative
        if (!!this._xrSessionManager.isNative && !!this._xrSessionManager.session.trySetMeshDetectorEnabled) {
            this._xrSessionManager.session.trySetMeshDetectorEnabled(false);
        }
        if (!this._options.doNotRemoveMeshesOnSessionEnded) {
            this._detectedMeshes.forEach((mesh) => {
                this.onMeshRemovedObservable.notifyObservers(mesh);
            });
            this._detectedMeshes.clear();
        }
        return true;
    }
    dispose() {
        super.dispose();
        this.onMeshAddedObservable.clear();
        this.onMeshRemovedObservable.clear();
        this.onMeshUpdatedObservable.clear();
    }
    _onXRFrame(frame) {
        // TODO remove try catch
        try {
            if (!this.attached || !frame) {
                return;
            }
            // babylon native XR and webxr support
            const detectedMeshes = frame.detectedMeshes || frame.worldInformation?.detectedMeshes;
            if (detectedMeshes) {
                const toRemove = new Set();
                this._detectedMeshes.forEach((vertexData, xrMesh) => {
                    if (!detectedMeshes.has(xrMesh)) {
                        toRemove.add(xrMesh);
                    }
                });
                toRemove.forEach((xrMesh) => {
                    const vertexData = this._detectedMeshes.get(xrMesh);
                    if (vertexData) {
                        this.onMeshRemovedObservable.notifyObservers(vertexData);
                        this._detectedMeshes.delete(xrMesh);
                    }
                });
                // now check for new ones
                detectedMeshes.forEach((xrMesh) => {
                    if (!this._detectedMeshes.has(xrMesh)) {
                        const partialVertexData = {
                            id: meshIdProvider++,
                            xrMesh: xrMesh,
                        };
                        const vertexData = this._updateVertexDataWithXRMesh(xrMesh, partialVertexData, frame);
                        this._detectedMeshes.set(xrMesh, vertexData);
                        this.onMeshAddedObservable.notifyObservers(vertexData);
                    }
                    else {
                        // updated?
                        if (xrMesh.lastChangedTime === this._xrSessionManager.currentTimestamp) {
                            const vertexData = this._detectedMeshes.get(xrMesh);
                            if (vertexData) {
                                this._updateVertexDataWithXRMesh(xrMesh, vertexData, frame);
                                this.onMeshUpdatedObservable.notifyObservers(vertexData);
                            }
                        }
                    }
                });
            }
        }
        catch (error) {
            Logger.Log(error.stack);
        }
    }
    _init() {
        // Only supported by BabylonNative
        if (this._xrSessionManager.isNative) {
            if (this._xrSessionManager.session.trySetMeshDetectorEnabled) {
                this._xrSessionManager.session.trySetMeshDetectorEnabled(true);
            }
            if (!!this._options.preferredDetectorOptions && !!this._xrSessionManager.session.trySetPreferredMeshDetectorOptions) {
                this._xrSessionManager.session.trySetPreferredMeshDetectorOptions(this._options.preferredDetectorOptions);
            }
        }
    }
    _updateVertexDataWithXRMesh(xrMesh, mesh, xrFrame) {
        mesh.xrMesh = xrMesh;
        mesh.worldParentNode = this._options.worldParentNode;
        const positions = xrMesh.vertices || xrMesh.positions;
        if (this._options.convertCoordinateSystems) {
            if (!this._xrSessionManager.scene.useRightHandedSystem) {
                mesh.positions = new Float32Array(positions.length);
                for (let i = 0; i < positions.length; i += 3) {
                    mesh.positions[i] = positions[i];
                    mesh.positions[i + 1] = positions[i + 1];
                    mesh.positions[i + 2] = -1 * positions[i + 2];
                }
                if (xrMesh.normals) {
                    mesh.normals = new Float32Array(xrMesh.normals.length);
                    for (let i = 0; i < xrMesh.normals.length; i += 3) {
                        mesh.normals[i] = xrMesh.normals[i];
                        mesh.normals[i + 1] = xrMesh.normals[i + 1];
                        mesh.normals[i + 2] = -1 * xrMesh.normals[i + 2];
                    }
                }
            }
            else {
                mesh.positions = positions;
                mesh.normals = xrMesh.normals;
            }
            // WebXR should provide indices in a counterclockwise winding order regardless of coordinate system handedness
            mesh.indices = xrMesh.indices;
            // matrix
            const pose = xrFrame.getPose(xrMesh.meshSpace, this._xrSessionManager.referenceSpace);
            if (pose) {
                const mat = mesh.transformationMatrix || new Matrix();
                Matrix.FromArrayToRef(pose.transform.matrix, 0, mat);
                if (!this._xrSessionManager.scene.useRightHandedSystem) {
                    mat.toggleModelMatrixHandInPlace();
                }
                mesh.transformationMatrix = mat;
                if (this._options.worldParentNode) {
                    mat.multiplyToRef(this._options.worldParentNode.getWorldMatrix(), mat);
                }
            }
            if (this._options.generateMeshes) {
                if (!mesh.mesh) {
                    const generatedMesh = new Mesh("xr mesh " + mesh.id, this._xrSessionManager.scene);
                    generatedMesh.rotationQuaternion = new Quaternion();
                    generatedMesh.setVerticesData(VertexBuffer.PositionKind, mesh.positions);
                    if (mesh.normals) {
                        generatedMesh.setVerticesData(VertexBuffer.NormalKind, mesh.normals);
                    }
                    else {
                        generatedMesh.createNormals(true);
                    }
                    generatedMesh.setIndices(mesh.indices, undefined, true);
                    mesh.mesh = generatedMesh;
                }
                else {
                    const generatedMesh = mesh.mesh;
                    generatedMesh.updateVerticesData(VertexBuffer.PositionKind, mesh.positions);
                    if (mesh.normals) {
                        generatedMesh.updateVerticesData(VertexBuffer.NormalKind, mesh.normals);
                    }
                    else {
                        generatedMesh.createNormals(true);
                    }
                    generatedMesh.updateIndices(mesh.indices);
                }
                mesh.transformationMatrix?.decompose(mesh.mesh.scaling, mesh.mesh.rotationQuaternion, mesh.mesh.position);
            }
        }
        return mesh;
    }
}
/**
 * The module's name
 */
WebXRMeshDetector.Name = WebXRFeatureName.MESH_DETECTION;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRMeshDetector.Version = 1;
WebXRFeaturesManager.AddWebXRFeature(WebXRMeshDetector.Name, (xrSessionManager, options) => {
    return () => new WebXRMeshDetector(xrSessionManager, options);
}, WebXRMeshDetector.Version, false);
//# sourceMappingURL=WebXRMeshDetector.js.map