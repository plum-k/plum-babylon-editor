import { Logger } from "../Misc/logger.js";
import { Observable } from "../Misc/observable.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Color3 } from "../Maths/math.color.js";
import { Gizmo } from "./gizmo.js";
import { PlaneRotationGizmo } from "./planeRotationGizmo.js";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer.js";
/**
 * Gizmo that enables rotating a mesh along 3 axis
 */
export class RotationGizmo extends Gizmo {
    get attachedMesh() {
        return this._meshAttached;
    }
    set attachedMesh(mesh) {
        this._meshAttached = mesh;
        this._nodeAttached = mesh;
        this._checkBillboardTransform();
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
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
        this._checkBillboardTransform();
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            if (gizmo.isEnabled) {
                gizmo.attachedNode = node;
            }
            else {
                gizmo.attachedNode = null;
            }
        });
    }
    _checkBillboardTransform() {
        if (this._nodeAttached && this._nodeAttached.billboardMode) {
            Logger.Log("Rotation Gizmo will not work with transforms in billboard mode.");
        }
    }
    /**
     * Sensitivity factor for dragging (Default: 1)
     */
    set sensitivity(value) {
        this._sensitivity = value;
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.sensitivity = value;
            }
        });
    }
    get sensitivity() {
        return this._sensitivity;
    }
    /**
     * True when the mouse pointer is hovering a gizmo mesh
     */
    get isHovered() {
        return this.xGizmo.isHovered || this.yGizmo.isHovered || this.zGizmo.isHovered;
    }
    /**
     * True when the mouse pointer is dragging a gizmo mesh
     */
    get isDragging() {
        return this.xGizmo.dragBehavior.dragging || this.yGizmo.dragBehavior.dragging || this.zGizmo.dragBehavior.dragging;
    }
    get additionalTransformNode() {
        return this._additionalTransformNode;
    }
    set additionalTransformNode(transformNode) {
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            gizmo.additionalTransformNode = transformNode;
        });
    }
    /**
     * Creates a RotationGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param tessellation Amount of tessellation to be used when creating rotation circles
     * @param useEulerRotation Use and update Euler angle instead of quaternion
     * @param thickness display gizmo axis thickness
     * @param gizmoManager Gizmo manager
     * @param options More options
     */
    constructor(gizmoLayer = UtilityLayerRenderer.DefaultUtilityLayer, tessellation = 32, useEulerRotation = false, thickness = 1, gizmoManager, options) {
        super(gizmoLayer);
        /** Fires an event when any of it's sub gizmos are dragged */
        this.onDragStartObservable = new Observable();
        /** Fires an event when any of it's sub gizmos are being dragged */
        this.onDragObservable = new Observable();
        /** Fires an event when any of it's sub gizmos are released from dragging */
        this.onDragEndObservable = new Observable();
        this._observables = [];
        this._sensitivity = 1;
        /** Node Caching for quick lookup */
        this._gizmoAxisCache = new Map();
        const xColor = options && options.xOptions && options.xOptions.color ? options.xOptions.color : Color3.Red().scale(0.5);
        const yColor = options && options.yOptions && options.yOptions.color ? options.yOptions.color : Color3.Green().scale(0.5);
        const zColor = options && options.zOptions && options.zOptions.color ? options.zOptions.color : Color3.Blue().scale(0.5);
        this.xGizmo = new PlaneRotationGizmo(new Vector3(1, 0, 0), xColor, gizmoLayer, tessellation, this, useEulerRotation, thickness);
        this.yGizmo = new PlaneRotationGizmo(new Vector3(0, 1, 0), yColor, gizmoLayer, tessellation, this, useEulerRotation, thickness);
        this.zGizmo = new PlaneRotationGizmo(new Vector3(0, 0, 1), zColor, gizmoLayer, tessellation, this, useEulerRotation, thickness);
        this.additionalTransformNode = options?.additionalTransformNode;
        // Relay drag events and set update scale
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            //must set updateScale on each gizmo, as setting it on root RotationGizmo doesnt prevent individual gizmos from updating
            //currently updateScale is a property with no getter/setter, so no good way to override behavior at runtime, so we will at least set it on startup
            if (options && options.updateScale != undefined) {
                gizmo.updateScale = options.updateScale;
            }
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
     * If set the gizmo's rotation will be updated to match the attached mesh each frame (Default: true)
     * NOTE: This is only possible for meshes with uniform scaling, as otherwise it's not possible to decompose the rotation
     */
    set updateGizmoRotationToMatchAttachedMesh(value) {
        if (this.xGizmo) {
            this.xGizmo.updateGizmoRotationToMatchAttachedMesh = value;
            this.yGizmo.updateGizmoRotationToMatchAttachedMesh = value;
            this.zGizmo.updateGizmoRotationToMatchAttachedMesh = value;
        }
    }
    get updateGizmoRotationToMatchAttachedMesh() {
        return this.xGizmo.updateGizmoRotationToMatchAttachedMesh;
    }
    set updateGizmoPositionToMatchAttachedMesh(value) {
        if (this.xGizmo) {
            this.xGizmo.updateGizmoPositionToMatchAttachedMesh = value;
            this.yGizmo.updateGizmoPositionToMatchAttachedMesh = value;
            this.zGizmo.updateGizmoPositionToMatchAttachedMesh = value;
        }
    }
    get updateGizmoPositionToMatchAttachedMesh() {
        return this.xGizmo.updateGizmoPositionToMatchAttachedMesh;
    }
    set anchorPoint(value) {
        this._anchorPoint = value;
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            gizmo.anchorPoint = value;
        });
    }
    get anchorPoint() {
        return this._anchorPoint;
    }
    /**
     * Set the coordinate system to use. By default it's local.
     * But it's possible for a user to tweak so its local for translation and world for rotation.
     * In that case, setting the coordinate system will change `updateGizmoRotationToMatchAttachedMesh` and `updateGizmoPositionToMatchAttachedMesh`
     */
    set coordinatesMode(coordinatesMode) {
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            gizmo.coordinatesMode = coordinatesMode;
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
     * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
     */
    set snapDistance(value) {
        if (this.xGizmo) {
            this.xGizmo.snapDistance = value;
            this.yGizmo.snapDistance = value;
            this.zGizmo.snapDistance = value;
        }
    }
    get snapDistance() {
        return this.xGizmo.snapDistance;
    }
    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    set scaleRatio(value) {
        if (this.xGizmo) {
            this.xGizmo.scaleRatio = value;
            this.yGizmo.scaleRatio = value;
            this.zGizmo.scaleRatio = value;
        }
    }
    get scaleRatio() {
        return this.xGizmo.scaleRatio;
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
        [this.xGizmo, this.yGizmo, this.zGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.customRotationQuaternion = customRotationQuaternion;
            }
        });
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
     * Force release the drag action by code
     */
    releaseDrag() {
        this.xGizmo.dragBehavior.releaseDrag();
        this.yGizmo.dragBehavior.releaseDrag();
        this.zGizmo.dragBehavior.releaseDrag();
    }
    /**
     * Disposes of the gizmo
     */
    dispose() {
        this.xGizmo.dispose();
        this.yGizmo.dispose();
        this.zGizmo.dispose();
        this.onDragStartObservable.clear();
        this.onDragObservable.clear();
        this.onDragEndObservable.clear();
        this._observables.forEach((obs) => {
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(obs);
        });
        super.dispose();
    }
    /**
     * CustomMeshes are not supported by this gizmo
     */
    setCustomMesh() {
        Logger.Error("Custom meshes are not supported on this gizmo, please set the custom meshes on the gizmos contained within this one (gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo)");
    }
}
//# sourceMappingURL=rotationGizmo.js.map