import { PointerDragBehavior } from "./pointerDragBehavior.js";
import { Vector3 } from "../../Maths/math.vector.js";
/**
 * A behavior that when attached to a mesh will allow the mesh to be scaled
 */
export class MultiPointerScaleBehavior {
    /**
     * Instantiate a new behavior that when attached to a mesh will allow the mesh to be scaled
     */
    constructor() {
        this._startDistance = 0;
        this._initialScale = new Vector3(0, 0, 0);
        this._targetScale = new Vector3(0, 0, 0);
        this._sceneRenderObserver = null;
        this._dragBehaviorA = new PointerDragBehavior({});
        this._dragBehaviorA.moveAttached = false;
        this._dragBehaviorB = new PointerDragBehavior({});
        this._dragBehaviorB.moveAttached = false;
    }
    /**
     *  The name of the behavior
     */
    get name() {
        return "MultiPointerScale";
    }
    /**
     *  Initializes the behavior
     */
    init() { }
    _getCurrentDistance() {
        return this._dragBehaviorA.lastDragPosition.subtract(this._dragBehaviorB.lastDragPosition).length();
    }
    /**
     * Attaches the scale behavior the passed in mesh
     * @param ownerNode The mesh that will be scaled around once attached
     */
    attach(ownerNode) {
        this._ownerNode = ownerNode;
        // Create 2 drag behaviors such that each will only be triggered by a separate pointer
        this._dragBehaviorA.onDragStartObservable.add(() => {
            if (this._dragBehaviorA.dragging && this._dragBehaviorB.dragging) {
                if (this._dragBehaviorA.currentDraggingPointerId == this._dragBehaviorB.currentDraggingPointerId) {
                    this._dragBehaviorA.releaseDrag();
                }
                else {
                    this._initialScale.copyFrom(ownerNode.scaling);
                    this._startDistance = this._getCurrentDistance();
                }
            }
        });
        this._dragBehaviorB.onDragStartObservable.add(() => {
            if (this._dragBehaviorA.dragging && this._dragBehaviorB.dragging) {
                if (this._dragBehaviorA.currentDraggingPointerId == this._dragBehaviorB.currentDraggingPointerId) {
                    this._dragBehaviorB.releaseDrag();
                }
                else {
                    this._initialScale.copyFrom(ownerNode.scaling);
                    this._startDistance = this._getCurrentDistance();
                }
            }
        });
        // Once both drag behaviors are active scale based on the distance between the two pointers
        [this._dragBehaviorA, this._dragBehaviorB].forEach((behavior) => {
            behavior.onDragObservable.add(() => {
                if (this._dragBehaviorA.dragging && this._dragBehaviorB.dragging) {
                    const ratio = this._getCurrentDistance() / this._startDistance;
                    this._initialScale.scaleToRef(ratio, this._targetScale);
                }
            });
        });
        ownerNode.addBehavior(this._dragBehaviorA);
        ownerNode.addBehavior(this._dragBehaviorB);
        // On every frame move towards target scaling to avoid jitter caused by vr controllers
        this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
            if (this._dragBehaviorA.dragging && this._dragBehaviorB.dragging) {
                const change = this._targetScale.subtract(ownerNode.scaling).scaleInPlace(0.1);
                if (change.length() > 0.01) {
                    ownerNode.scaling.addInPlace(change);
                }
            }
        });
    }
    /**
     *  Detaches the behavior from the mesh
     */
    detach() {
        this._ownerNode.getScene().onBeforeRenderObservable.remove(this._sceneRenderObserver);
        [this._dragBehaviorA, this._dragBehaviorB].forEach((behavior) => {
            behavior.onDragStartObservable.clear();
            behavior.onDragObservable.clear();
            this._ownerNode.removeBehavior(behavior);
        });
    }
}
//# sourceMappingURL=multiPointerScaleBehavior.js.map