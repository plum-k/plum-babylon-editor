import { Logger } from "../Misc/logger.js";
import { Observable } from "../Misc/observable.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Color3 } from "../Maths/math.color.js";
import { CreatePolyhedron } from "../Meshes/Builders/polyhedronBuilder.js";
import { Gizmo } from "./gizmo.js";
import { AxisScaleGizmo } from "./axisScaleGizmo.js";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer.js";
import { StandardMaterial } from "../Materials/standardMaterial.js";
/**
 * Gizmo that enables scaling a mesh along 3 axis
 */
export class ScaleGizmo extends Gizmo {
    /** Default material used to render when gizmo is not disabled or hovered */
    get coloredMaterial() {
        return this._coloredMaterial;
    }
    /** Material used to render when gizmo is hovered with mouse*/
    get hoverMaterial() {
        return this._hoverMaterial;
    }
    /** Material used to render when gizmo is disabled. typically grey.*/
    get disableMaterial() {
        return this._disableMaterial;
    }
    get attachedMesh() {
        return this._meshAttached;
    }
    set attachedMesh(mesh) {
        this._meshAttached = mesh;
        this._nodeAttached = mesh;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedMesh = mesh;
            }
            else {
                gizmo.attachedMesh = null;
            }
        });
    }
    get attachedNode() {
        return this._nodeAttached;
    }
    set attachedNode(node) {
        this._meshAttached = null;
        this._nodeAttached = node;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedNode = node;
            }
            else {
                gizmo.attachedNode = null;
            }
        });
    }
    set updateScale(value) {
        if (this.xGizmo) {
            this.xGizmo.updateScale = value;
            this.yGizmo.updateScale = value;
            this.zGizmo.updateScale = value;
        }
    }
    get updateScale() {
        return this.xGizmo.updateScale;
    }
    /**
     * True when the mouse pointer is hovering a gizmo mesh
     */
    get isHovered() {
        return this.xGizmo.isHovered || this.yGizmo.isHovered || this.zGizmo.isHovered || this.uniformScaleGizmo.isHovered;
    }
    /**
     * True when the mouse pointer is dragging a gizmo mesh
     */
    get isDragging() {
        return this.xGizmo.dragBehavior.dragging || this.yGizmo.dragBehavior.dragging || this.zGizmo.dragBehavior.dragging || this.uniformScaleGizmo.dragBehavior.dragging;
    }
    get additionalTransformNode() {
        return this._additionalTransformNode;
    }
    set additionalTransformNode(transformNode) {
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            gizmo.additionalTransformNode = transformNode;
        });
    }
    /**
     * Creates a ScaleGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param thickness display gizmo axis thickness
     * @param gizmoManager
     * @param options More options
     */
    constructor(gizmoLayer = UtilityLayerRenderer.DefaultUtilityLayer, thickness = 1, gizmoManager, options) {
        super(gizmoLayer);
        this._meshAttached = null;
        this._nodeAttached = null;
        this._incrementalSnap = false;
        this._sensitivity = 1;
        this._observables = [];
        /** Node Caching for quick lookup */
        this._gizmoAxisCache = new Map();
        /** Fires an event when any of it's sub gizmos are dragged */
        this.onDragStartObservable = new Observable();
        /** Fires an event when any of it's sub gizmos are being dragged */
        this.onDragObservable = new Observable();
        /** Fires an event when any of it's sub gizmos are released from dragging */
        this.onDragEndObservable = new Observable();
        this.uniformScaleGizmo = this._createUniformScaleMesh();
        this.xGizmo = new AxisScaleGizmo(new Vector3(1, 0, 0), Color3.Red().scale(0.5), gizmoLayer, this, thickness);
        this.yGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), Color3.Green().scale(0.5), gizmoLayer, this, thickness);
        this.zGizmo = new AxisScaleGizmo(new Vector3(0, 0, 1), Color3.Blue().scale(0.5), gizmoLayer, this, thickness);
        this.additionalTransformNode = options?.additionalTransformNode;
        // Relay drag events
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            gizmo.dragBehavior.onDragStartObservable.add(() => {
                this.onDragStartObservable.notifyObservers({});
            });
            gizmo.dragBehavior.onDragObservable.add(() => {
                this.onDragObservable.notifyObservers({});
            });
            gizmo.dragBehavior.onDragEndObservable.add(() => {
                this.onDragEndObservable.notifyObservers({});
            });
        });
        this.attachedMesh = null;
        this.attachedNode = null;
        if (gizmoManager) {
            gizmoManager.addToAxisCache(this._gizmoAxisCache);
        }
        else {
            // Only subscribe to pointer event if gizmoManager isnt
            Gizmo.GizmoAxisPointerObserver(gizmoLayer, this._gizmoAxisCache);
        }
    }
    /**
     * @internal
     * Create Geometry for Gizmo
     */
    _createUniformScaleMesh() {
        this._coloredMaterial = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        this._coloredMaterial.diffuseColor = Color3.Gray();
        this._hoverMaterial = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        this._hoverMaterial.diffuseColor = Color3.Yellow();
        this._disableMaterial = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        this._disableMaterial.diffuseColor = Color3.Gray();
        this._disableMaterial.alpha = 0.4;
        const uniformScaleGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), Color3.Gray().scale(0.5), this.gizmoLayer, this);
        uniformScaleGizmo.updateGizmoRotationToMatchAttachedMesh = false;
        uniformScaleGizmo.uniformScaling = true;
        this._uniformScalingMesh = CreatePolyhedron("uniform", { type: 1 }, uniformScaleGizmo.gizmoLayer.utilityLayerScene);
        this._uniformScalingMesh.scaling.scaleInPlace(0.01);
        this._uniformScalingMesh.visibility = 0;
        this._octahedron = CreatePolyhedron("", { type: 1 }, uniformScaleGizmo.gizmoLayer.utilityLayerScene);
        this._octahedron.scaling.scaleInPlace(0.007);
        this._uniformScalingMesh.addChild(this._octahedron);
        uniformScaleGizmo.setCustomMesh(this._uniformScalingMesh, true);
        const light = this.gizmoLayer._getSharedGizmoLight();
        light.includedOnlyMeshes = light.includedOnlyMeshes.concat(this._octahedron);
        const cache = {
            gizmoMeshes: [this._octahedron, this._uniformScalingMesh],
            colliderMeshes: [this._octahedron, this._uniformScalingMesh],
            material: this._coloredMaterial,
            hoverMaterial: this._hoverMaterial,
            disableMaterial: this._disableMaterial,
            active: false,
            dragBehavior: uniformScaleGizmo.dragBehavior,
        };
        this.addToAxisCache(uniformScaleGizmo._rootMesh, cache);
        return uniformScaleGizmo;
    }
    set updateGizmoRotationToMatchAttachedMesh(value) {
        if (!value) {
            Logger.Warn("Setting updateGizmoRotationToMatchAttachedMesh = false on scaling gizmo is not supported.");
        }
        else {
            this._updateGizmoRotationToMatchAttachedMesh = value;
            [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
                if (gizmo) {
                    gizmo.updateGizmoRotationToMatchAttachedMesh = value;
                }
            });
        }
    }
    get updateGizmoRotationToMatchAttachedMesh() {
        return this._updateGizmoRotationToMatchAttachedMesh;
    }
    set anchorPoint(value) {
        this._anchorPoint = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.anchorPoint = value;
            }
        });
    }
    get anchorPoint() {
        return this._anchorPoint;
    }
    /**
     * posture that the gizmo will be display
     * When set null, default value will be used (Quaternion(0, 0, 0, 1))
     */
    get customRotationQuaternion() {
        return this._customRotationQuaternion;
    }
    set customRotationQuaternion(customRotationQuaternion) {
        this._customRotationQuaternion = customRotationQuaternion;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.customRotationQuaternion = customRotationQuaternion;
            }
        });
    }
    /**
     * Set the coordinate system to use. By default it's local.
     * But it's possible for a user to tweak so its local for translation and world for rotation.
     * In that case, setting the coordinate system will change `updateGizmoRotationToMatchAttachedMesh` and `updateGizmoPositionToMatchAttachedMesh`
     */
    set coordinatesMode(coordinatesMode) {
        if (coordinatesMode == 0 /* GizmoCoordinatesMode.World */) {
            Logger.Warn("Setting coordinates Mode to world on scaling gizmo is not supported.");
        }
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            gizmo.coordinatesMode = 1 /* GizmoCoordinatesMode.Local */;
        });
    }
    /**
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    set snapDistance(value) {
        this._snapDistance = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.snapDistance = value;
            }
        });
    }
    get snapDistance() {
        return this._snapDistance;
    }
    /**
     * Incremental snap scaling (default is false). When true, with a snapDistance of 0.1, scaling will be 1.1,1.2,1.3 instead of, when false: 1.1,1.21,1.33,...
     */
    set incrementalSnap(value) {
        this._incrementalSnap = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.incrementalSnap = value;
            }
        });
    }
    get incrementalSnap() {
        return this._incrementalSnap;
    }
    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    set scaleRatio(value) {
        this._scaleRatio = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.scaleRatio = value;
            }
        });
    }
    get scaleRatio() {
        return this._scaleRatio;
    }
    /**
     * Sensitivity factor for dragging (Default: 1)
     */
    set sensitivity(value) {
        this._sensitivity = value;
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.sensitivity = value;
            }
        });
    }
    get sensitivity() {
        return this._sensitivity;
    }
    /**
     * Builds Gizmo Axis Cache to enable features such as hover state preservation and graying out other axis during manipulation
     * @param mesh Axis gizmo mesh
     * @param cache Gizmo axis definition used for reactive gizmo UI
     */
    addToAxisCache(mesh, cache) {
        this._gizmoAxisCache.set(mesh, cache);
    }
    /**
     * Get the cache set with addToAxisCache for a specific mesh
     * @param mesh Axis gizmo mesh
     * @returns Gizmo axis definition used for reactive gizmo UI
     */
    getAxisCache(mesh) {
        return this._gizmoAxisCache.get(mesh);
    }
    /**
     * Force release the drag action by code
     */
    releaseDrag() {
        this.xGizmo.dragBehavior.releaseDrag();
        this.yGizmo.dragBehavior.releaseDrag();
        this.zGizmo.dragBehavior.releaseDrag();
        this.uniformScaleGizmo.dragBehavior.releaseDrag();
    }
    /**
     * Disposes of the gizmo
     */
    dispose() {
        [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.dispose();
            }
        });
        this._observables.forEach((obs) => {
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(obs);
        });
        this.onDragStartObservable.clear();
        this.onDragObservable.clear();
        this.onDragEndObservable.clear();
        [this._uniformScalingMesh, this._octahedron].forEach((msh) => {
            if (msh) {
                msh.dispose();
            }
        });
        [this._coloredMaterial, this._hoverMaterial, this._disableMaterial].forEach((matl) => {
            if (matl) {
                matl.dispose();
            }
        });
    }
}
//# sourceMappingURL=scaleGizmo.js.map