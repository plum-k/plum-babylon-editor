import { Vector3 } from "../Maths/math.vector.js";
import { Color3, Color4 } from "../Maths/math.color.js";
import { Mesh } from "../Meshes/mesh.js";
import { Gizmo } from "./gizmo.js";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer.js";
import { StandardMaterial } from "../Materials/standardMaterial.js";
import { CreateBox } from "../Meshes/Builders/boxBuilder.js";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder.js";
import { Matrix } from "../Maths/math.js";
import { CreateLines } from "../Meshes/Builders/linesBuilder.js";
import { PointerEventTypes } from "../Events/pointerEvents.js";
import { Observable } from "../Misc/observable.js";
/**
 * Gizmo that enables viewing a camera
 */
export class CameraGizmo extends Gizmo {
    /**
     * Creates a CameraGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param gizmoColor Camera mesh color. Default is Gray
     * @param frustumLinesColor Frustum lines color. Default is White
     */
    constructor(gizmoLayer = UtilityLayerRenderer.DefaultUtilityLayer, gizmoColor, frustumLinesColor) {
        super(gizmoLayer);
        this._pointerObserver = null;
        /**
         * Event that fires each time the gizmo is clicked
         */
        this.onClickedObservable = new Observable();
        this._camera = null;
        this._invProjection = new Matrix();
        this._material = new StandardMaterial("cameraGizmoMaterial", this.gizmoLayer.utilityLayerScene);
        this._frustumLinesColor = frustumLinesColor;
        this._material.diffuseColor = gizmoColor ?? new Color3(0.5, 0.5, 0.5);
        this._material.specularColor = new Color3(0.1, 0.1, 0.1);
        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (!this._camera) {
                return;
            }
            this._isHovered = !!(pointerInfo.pickInfo && this._rootMesh.getChildMeshes().indexOf(pointerInfo.pickInfo.pickedMesh) != -1);
            if (this._isHovered && pointerInfo.event.button === 0) {
                this.onClickedObservable.notifyObservers(this._camera);
            }
        }, PointerEventTypes.POINTERDOWN);
    }
    /** Gets or sets a boolean indicating if frustum lines must be rendered (true by default)) */
    get displayFrustum() {
        return this._cameraLinesMesh.isEnabled();
    }
    set displayFrustum(value) {
        this._cameraLinesMesh.setEnabled(value);
    }
    /**
     * The camera that the gizmo is attached to
     */
    set camera(camera) {
        this._camera = camera;
        this.attachedNode = camera;
        if (camera) {
            // Create the mesh for the given camera
            if (!this._customMeshSet) {
                if (this._cameraMesh) {
                    this._cameraMesh.dispose();
                }
                this._cameraMesh = CameraGizmo._CreateCameraMesh(this.gizmoLayer.utilityLayerScene);
                this._cameraMesh.getChildMeshes(false).forEach((m) => {
                    m.material = this._material;
                });
                this._cameraMesh.parent = this._rootMesh;
            }
            if (this._cameraLinesMesh) {
                this._cameraLinesMesh.dispose();
            }
            const linesColor = this._frustumLinesColor?.toColor4(1) ?? new Color4(1, 1, 1, 1);
            this._cameraLinesMesh = CameraGizmo._CreateCameraFrustum(this.gizmoLayer.utilityLayerScene, linesColor);
            this._cameraLinesMesh.parent = this._rootMesh;
            if (this.gizmoLayer.utilityLayerScene.activeCamera && this.gizmoLayer.utilityLayerScene.activeCamera.maxZ < camera.maxZ * 1.5) {
                this.gizmoLayer.utilityLayerScene.activeCamera.maxZ = camera.maxZ * 1.5;
            }
            if (!this.attachedNode.reservedDataStore) {
                this.attachedNode.reservedDataStore = {};
            }
            this.attachedNode.reservedDataStore.cameraGizmo = this;
            // Add lighting to the camera gizmo
            const gizmoLight = this.gizmoLayer._getSharedGizmoLight();
            gizmoLight.includedOnlyMeshes = gizmoLight.includedOnlyMeshes.concat(this._cameraMesh.getChildMeshes(false));
            this._update();
        }
    }
    get camera() {
        return this._camera;
    }
    /**
     * Gets the material used to render the camera gizmo
     */
    get material() {
        return this._material;
    }
    /**
     * @internal
     * Updates the gizmo to match the attached mesh's position/rotation
     */
    _update() {
        super._update();
        if (!this._camera) {
            return;
        }
        // frustum matrix
        this._camera.getProjectionMatrix().invertToRef(this._invProjection);
        this._cameraLinesMesh.setPivotMatrix(this._invProjection, false);
        this._cameraLinesMesh.scaling.x = 1 / this._rootMesh.scaling.x;
        this._cameraLinesMesh.scaling.y = 1 / this._rootMesh.scaling.y;
        this._cameraLinesMesh.scaling.z = 1 / this._rootMesh.scaling.z;
        // take care of coordinate system in camera scene to properly display the mesh with the good Y axis orientation in this scene
        this._cameraMesh.parent = null;
        this._cameraMesh.rotation.y = Math.PI * 0.5 * (this._camera.getScene().useRightHandedSystem ? 1 : -1);
        this._cameraMesh.parent = this._rootMesh;
    }
    /**
     * Disposes and replaces the current camera mesh in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the camera gizmo
     */
    setCustomMesh(mesh) {
        if (mesh.getScene() != this.gizmoLayer.utilityLayerScene) {
            // eslint-disable-next-line no-throw-literal
            throw "When setting a custom mesh on a gizmo, the custom meshes scene must be the same as the gizmos (eg. gizmo.gizmoLayer.utilityLayerScene)";
        }
        if (this._cameraMesh) {
            this._cameraMesh.dispose();
        }
        this._cameraMesh = mesh;
        this._cameraMesh.parent = this._rootMesh;
        this._customMeshSet = true;
    }
    /**
     * Disposes of the camera gizmo
     */
    dispose() {
        this.onClickedObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        if (this._cameraMesh) {
            this._cameraMesh.dispose();
        }
        if (this._cameraLinesMesh) {
            this._cameraLinesMesh.dispose();
        }
        this._material.dispose();
        super.dispose();
    }
    static _CreateCameraMesh(scene) {
        const root = new Mesh("rootCameraGizmo", scene);
        const mesh = new Mesh(root.name, scene);
        mesh.parent = root;
        const box = CreateBox(root.name, { width: 1.0, height: 0.8, depth: 0.5 }, scene);
        box.parent = mesh;
        const cyl1 = CreateCylinder(root.name, { height: 0.5, diameterTop: 0.8, diameterBottom: 0.8 }, scene);
        cyl1.parent = mesh;
        cyl1.position.y = 0.3;
        cyl1.position.x = -0.6;
        cyl1.rotation.x = Math.PI * 0.5;
        const cyl2 = CreateCylinder(root.name, { height: 0.5, diameterTop: 0.6, diameterBottom: 0.6 }, scene);
        cyl2.parent = mesh;
        cyl2.position.y = 0.5;
        cyl2.position.x = 0.4;
        cyl2.rotation.x = Math.PI * 0.5;
        const cyl3 = CreateCylinder(root.name, { height: 0.5, diameterTop: 0.5, diameterBottom: 0.5 }, scene);
        cyl3.parent = mesh;
        cyl3.position.y = 0.0;
        cyl3.position.x = 0.6;
        cyl3.rotation.z = Math.PI * 0.5;
        root.scaling.scaleInPlace(CameraGizmo._Scale);
        mesh.position.x = -0.9;
        return root;
    }
    static _CreateCameraFrustum(scene, linesColor) {
        const root = new Mesh("rootCameraGizmo", scene);
        const mesh = new Mesh(root.name, scene);
        mesh.parent = root;
        for (let y = 0; y < 4; y += 2) {
            for (let x = 0; x < 4; x += 2) {
                let line = CreateLines("lines", { points: [new Vector3(-1 + x, -1 + y, -1), new Vector3(-1 + x, -1 + y, 1)], colors: [linesColor, linesColor] }, scene);
                line.parent = mesh;
                line.alwaysSelectAsActiveMesh = true;
                line.isPickable = false;
                line = CreateLines("lines", { points: [new Vector3(-1, -1 + x, -1 + y), new Vector3(1, -1 + x, -1 + y)], colors: [linesColor, linesColor] }, scene);
                line.parent = mesh;
                line.alwaysSelectAsActiveMesh = true;
                line.isPickable = false;
                line = CreateLines("lines", { points: [new Vector3(-1 + x, -1, -1 + y), new Vector3(-1 + x, 1, -1 + y)], colors: [linesColor, linesColor] }, scene);
                line.parent = mesh;
                line.alwaysSelectAsActiveMesh = true;
                line.isPickable = false;
            }
        }
        return root;
    }
}
// Static helper methods
CameraGizmo._Scale = 0.05;
//# sourceMappingURL=cameraGizmo.js.map