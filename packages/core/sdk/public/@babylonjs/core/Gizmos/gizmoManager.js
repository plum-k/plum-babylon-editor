import { Observable } from "../Misc/observable.js";
import { PointerEventTypes } from "../Events/pointerEvents.js";
import { AbstractMesh } from "../Meshes/abstractMesh.js";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer.js";
import { Color3 } from "../Maths/math.color.js";
import { SixDofDragBehavior } from "../Behaviors/Meshes/sixDofDragBehavior.js";
import { Gizmo } from "./gizmo.js";
import { RotationGizmo } from "./rotationGizmo.js";
import { PositionGizmo } from "./positionGizmo.js";
import { ScaleGizmo } from "./scaleGizmo.js";
import { BoundingBoxGizmo } from "./boundingBoxGizmo.js";
/**
 * Helps setup gizmo's in the scene to rotate/scale/position nodes
 */
export class GizmoManager {
    /**
     * Utility layer that the bounding box gizmo belongs to
     */
    get keepDepthUtilityLayer() {
        return this._defaultKeepDepthUtilityLayer;
    }
    /**
     * Utility layer that all gizmos besides bounding box belong to
     */
    get utilityLayer() {
        return this._defaultUtilityLayer;
    }
    /**
     * True when the mouse pointer is hovering a gizmo mesh
     */
    get isHovered() {
        let hovered = false;
        for (const key in this.gizmos) {
            const gizmo = this.gizmos[key];
            if (gizmo && gizmo.isHovered) {
                hovered = true;
                break;
            }
        }
        return hovered;
    }
    /**
     * True when the mouse pointer is dragging a gizmo mesh
     */
    get isDragging() {
        let dragging = false;
        [this.gizmos.positionGizmo, this.gizmos.rotationGizmo, this.gizmos.scaleGizmo, this.gizmos.boundingBoxGizmo].forEach((gizmo) => {
            if (gizmo && gizmo.isDragging) {
                dragging = true;
            }
        });
        return dragging;
    }
    /**
     * Ratio for the scale of the gizmo (Default: 1)
     */
    set scaleRatio(value) {
        this._scaleRatio = value;
        [this.gizmos.positionGizmo, this.gizmos.rotationGizmo, this.gizmos.scaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.scaleRatio = value;
            }
        });
    }
    get scaleRatio() {
        return this._scaleRatio;
    }
    /**
     * Set the coordinate system to use. By default it's local.
     * But it's possible for a user to tweak so its local for translation and world for rotation.
     * In that case, setting the coordinate system will change `updateGizmoRotationToMatchAttachedMesh` and `updateGizmoPositionToMatchAttachedMesh`
     */
    set coordinatesMode(coordinatesMode) {
        this._coordinatesMode = coordinatesMode;
        [this.gizmos.positionGizmo, this.gizmos.rotationGizmo, this.gizmos.scaleGizmo].forEach((gizmo) => {
            if (gizmo) {
                gizmo.coordinatesMode = coordinatesMode;
            }
        });
    }
    get coordinatesMode() {
        return this._coordinatesMode;
    }
    /**
     * The mesh the gizmo's is attached to
     */
    get attachedMesh() {
        return this._attachedMesh;
    }
    /**
     * The node the gizmo's is attached to
     */
    get attachedNode() {
        return this._attachedNode;
    }
    /**
     * Additional transform node that will be used to transform all the gizmos
     */
    get additionalTransformNode() {
        return this._additionalTransformNode;
    }
    /**
     * Instantiates a gizmo manager
     * @param _scene the scene to overlay the gizmos on top of
     * @param thickness display gizmo axis thickness
     * @param utilityLayer the layer where gizmos are rendered
     * @param keepDepthUtilityLayer the layer where occluded gizmos are rendered
     */
    constructor(_scene, thickness = 1, utilityLayer = UtilityLayerRenderer.DefaultUtilityLayer, keepDepthUtilityLayer = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer) {
        this._scene = _scene;
        /** When true, the gizmo will be detached from the current object when a pointer down occurs with an empty picked mesh */
        this.clearGizmoOnEmptyPointerEvent = false;
        /** When true (default), picking to attach a new mesh is enabled. This works in sync with inspector autopicking. */
        this.enableAutoPicking = true;
        /** Fires an event when the manager is attached to a mesh */
        this.onAttachedToMeshObservable = new Observable();
        /** Fires an event when the manager is attached to a node */
        this.onAttachedToNodeObservable = new Observable();
        this._gizmosEnabled = { positionGizmo: false, rotationGizmo: false, scaleGizmo: false, boundingBoxGizmo: false };
        this._pointerObservers = [];
        this._attachedMesh = null;
        this._attachedNode = null;
        this._boundingBoxColor = Color3.FromHexString("#0984e3");
        this._thickness = 1;
        this._scaleRatio = 1;
        this._coordinatesMode = 1 /* GizmoCoordinatesMode.Local */;
        /** Node Caching for quick lookup */
        this._gizmoAxisCache = new Map();
        /**
         * When bounding box gizmo is enabled, this can be used to track drag/end events
         */
        this.boundingBoxDragBehavior = new SixDofDragBehavior();
        /**
         * Array of meshes which will have the gizmo attached when a pointer selected them. If null, all meshes are attachable. (Default: null)
         */
        this.attachableMeshes = null;
        /**
         * Array of nodes which will have the gizmo attached when a pointer selected them. If null, all nodes are attachable. (Default: null)
         */
        this.attachableNodes = null;
        /**
         * If pointer events should perform attaching/detaching a gizmo, if false this can be done manually via attachToMesh/attachToNode. (Default: true)
         */
        this.usePointerToAttachGizmos = true;
        this._defaultUtilityLayer = utilityLayer;
        this._defaultKeepDepthUtilityLayer = keepDepthUtilityLayer;
        this._defaultKeepDepthUtilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        this._thickness = thickness;
        this.gizmos = { positionGizmo: null, rotationGizmo: null, scaleGizmo: null, boundingBoxGizmo: null };
        const attachToMeshPointerObserver = this._attachToMeshPointerObserver(_scene);
        const gizmoAxisPointerObserver = Gizmo.GizmoAxisPointerObserver(this._defaultUtilityLayer, this._gizmoAxisCache);
        this._pointerObservers = [attachToMeshPointerObserver, gizmoAxisPointerObserver];
    }
    /**
     * @internal
     * Subscribes to pointer down events, for attaching and detaching mesh
     * @param scene The scene layer the observer will be added to
     * @returns the pointer observer
     */
    _attachToMeshPointerObserver(scene) {
        // Instantiate/dispose gizmos based on pointer actions
        const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
            if (!this.usePointerToAttachGizmos) {
                return;
            }
            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh) {
                    if (this.enableAutoPicking) {
                        let node = pointerInfo.pickInfo.pickedMesh;
                        if (this.attachableMeshes == null) {
                            // Attach to the most parent node
                            while (node && node.parent != null) {
                                node = node.parent;
                            }
                        }
                        else {
                            // Attach to the parent node that is an attachableMesh
                            let found = false;
                            this.attachableMeshes.forEach((mesh) => {
                                if (node && (node == mesh || node.isDescendantOf(mesh))) {
                                    node = mesh;
                                    found = true;
                                }
                            });
                            if (!found) {
                                node = null;
                            }
                        }
                        if (node instanceof AbstractMesh) {
                            if (this._attachedMesh != node) {
                                this.attachToMesh(node);
                            }
                        }
                        else {
                            if (this.clearGizmoOnEmptyPointerEvent) {
                                this.attachToMesh(null);
                            }
                        }
                    }
                }
                else {
                    if (this.clearGizmoOnEmptyPointerEvent) {
                        this.attachToMesh(null);
                    }
                }
            }
        });
        return pointerObserver;
    }
    /**
     * Attaches a set of gizmos to the specified mesh
     * @param mesh The mesh the gizmo's should be attached to
     */
    attachToMesh(mesh) {
        if (this._attachedMesh) {
            this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
        }
        if (this._attachedNode) {
            this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
        }
        this._attachedMesh = mesh;
        this._attachedNode = null;
        for (const key in this.gizmos) {
            const gizmo = this.gizmos[key];
            if (gizmo && this._gizmosEnabled[key]) {
                gizmo.attachedMesh = mesh;
            }
        }
        if (this.boundingBoxGizmoEnabled && this._attachedMesh) {
            this._attachedMesh.addBehavior(this.boundingBoxDragBehavior);
        }
        this.onAttachedToMeshObservable.notifyObservers(mesh);
    }
    /**
     * Attaches a set of gizmos to the specified node
     * @param node The node the gizmo's should be attached to
     */
    attachToNode(node) {
        if (this._attachedMesh) {
            this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
        }
        if (this._attachedNode) {
            this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
        }
        this._attachedMesh = null;
        this._attachedNode = node;
        for (const key in this.gizmos) {
            const gizmo = this.gizmos[key];
            if (gizmo && this._gizmosEnabled[key]) {
                gizmo.attachedNode = node;
            }
        }
        if (this.boundingBoxGizmoEnabled && this._attachedNode) {
            this._attachedNode.addBehavior(this.boundingBoxDragBehavior);
        }
        this.onAttachedToNodeObservable.notifyObservers(node);
    }
    /**
     * If the position gizmo is enabled
     */
    set positionGizmoEnabled(value) {
        if (value) {
            if (!this.gizmos.positionGizmo) {
                this.gizmos.positionGizmo = new PositionGizmo(this._defaultUtilityLayer, this._thickness, this);
            }
            if (this._attachedNode) {
                this.gizmos.positionGizmo.attachedNode = this._attachedNode;
            }
            else {
                this.gizmos.positionGizmo.attachedMesh = this._attachedMesh;
            }
        }
        else if (this.gizmos.positionGizmo) {
            this.gizmos.positionGizmo.attachedNode = null;
        }
        this._gizmosEnabled.positionGizmo = value;
        this._setAdditionalTransformNode();
    }
    get positionGizmoEnabled() {
        return this._gizmosEnabled.positionGizmo;
    }
    /**
     * If the rotation gizmo is enabled
     */
    set rotationGizmoEnabled(value) {
        if (value) {
            if (!this.gizmos.rotationGizmo) {
                this.gizmos.rotationGizmo = new RotationGizmo(this._defaultUtilityLayer, 32, false, this._thickness, this);
            }
            if (this._attachedNode) {
                this.gizmos.rotationGizmo.attachedNode = this._attachedNode;
            }
            else {
                this.gizmos.rotationGizmo.attachedMesh = this._attachedMesh;
            }
        }
        else if (this.gizmos.rotationGizmo) {
            this.gizmos.rotationGizmo.attachedNode = null;
        }
        this._gizmosEnabled.rotationGizmo = value;
        this._setAdditionalTransformNode();
    }
    get rotationGizmoEnabled() {
        return this._gizmosEnabled.rotationGizmo;
    }
    /**
     * If the scale gizmo is enabled
     */
    set scaleGizmoEnabled(value) {
        if (value) {
            this.gizmos.scaleGizmo = this.gizmos.scaleGizmo || new ScaleGizmo(this._defaultUtilityLayer, this._thickness, this);
            if (this._attachedNode) {
                this.gizmos.scaleGizmo.attachedNode = this._attachedNode;
            }
            else {
                this.gizmos.scaleGizmo.attachedMesh = this._attachedMesh;
            }
        }
        else if (this.gizmos.scaleGizmo) {
            this.gizmos.scaleGizmo.attachedNode = null;
        }
        this._gizmosEnabled.scaleGizmo = value;
        this._setAdditionalTransformNode();
    }
    get scaleGizmoEnabled() {
        return this._gizmosEnabled.scaleGizmo;
    }
    /**
     * If the boundingBox gizmo is enabled
     */
    set boundingBoxGizmoEnabled(value) {
        if (value) {
            this.gizmos.boundingBoxGizmo = this.gizmos.boundingBoxGizmo || new BoundingBoxGizmo(this._boundingBoxColor, this._defaultKeepDepthUtilityLayer);
            if (this._attachedMesh) {
                this.gizmos.boundingBoxGizmo.attachedMesh = this._attachedMesh;
            }
            else {
                this.gizmos.boundingBoxGizmo.attachedNode = this._attachedNode;
            }
            if (this._attachedMesh) {
                this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
                this._attachedMesh.addBehavior(this.boundingBoxDragBehavior);
            }
            else if (this._attachedNode) {
                this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
                this._attachedNode.addBehavior(this.boundingBoxDragBehavior);
            }
        }
        else if (this.gizmos.boundingBoxGizmo) {
            if (this._attachedMesh) {
                this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
            }
            else if (this._attachedNode) {
                this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
            }
            this.gizmos.boundingBoxGizmo.attachedNode = null;
        }
        this._gizmosEnabled.boundingBoxGizmo = value;
        this._setAdditionalTransformNode();
    }
    get boundingBoxGizmoEnabled() {
        return this._gizmosEnabled.boundingBoxGizmo;
    }
    /**
     * Sets the additional transform applied to all the gizmos.
     * @See Gizmo.additionalTransformNode for more detail
     */
    set additionalTransformNode(node) {
        this._additionalTransformNode = node;
        this._setAdditionalTransformNode();
    }
    _setAdditionalTransformNode() {
        for (const key in this.gizmos) {
            const gizmo = this.gizmos[key];
            if (gizmo && this._gizmosEnabled[key]) {
                gizmo.additionalTransformNode = this._additionalTransformNode;
            }
        }
    }
    /**
     * Builds Gizmo Axis Cache to enable features such as hover state preservation and graying out other axis during manipulation
     * @param gizmoAxisCache Gizmo axis definition used for reactive gizmo UI
     */
    addToAxisCache(gizmoAxisCache) {
        if (gizmoAxisCache.size > 0) {
            gizmoAxisCache.forEach((v, k) => {
                this._gizmoAxisCache.set(k, v);
            });
        }
    }
    /**
     * Force release the drag action by code
     */
    releaseDrag() {
        [this.gizmos.positionGizmo, this.gizmos.rotationGizmo, this.gizmos.scaleGizmo, this.gizmos.boundingBoxGizmo].forEach((gizmo) => {
            gizmo?.releaseDrag();
        });
    }
    /**
     * Disposes of the gizmo manager
     */
    dispose() {
        this._pointerObservers.forEach((observer) => {
            this._scene.onPointerObservable.remove(observer);
        });
        for (const key in this.gizmos) {
            const gizmo = this.gizmos[key];
            if (gizmo) {
                gizmo.dispose();
            }
        }
        if (this._defaultKeepDepthUtilityLayer !== UtilityLayerRenderer._DefaultKeepDepthUtilityLayer) {
            this._defaultKeepDepthUtilityLayer?.dispose();
        }
        if (this._defaultUtilityLayer !== UtilityLayerRenderer._DefaultUtilityLayer) {
            this._defaultUtilityLayer?.dispose();
        }
        this.boundingBoxDragBehavior.detach();
        this.onAttachedToMeshObservable.clear();
    }
}
//# sourceMappingURL=gizmoManager.js.map