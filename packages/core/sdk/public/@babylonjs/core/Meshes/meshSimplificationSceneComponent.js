import { Scene } from "../scene.js";
import { Mesh } from "./mesh.js";
import { SimplificationQueue } from "./meshSimplification.js";
import { SceneComponentConstants } from "../sceneComponent.js";
Object.defineProperty(Scene.prototype, "simplificationQueue", {
    get: function () {
        if (!this._simplificationQueue) {
            this._simplificationQueue = new SimplificationQueue();
            let component = this._getComponent(SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE);
            if (!component) {
                component = new SimplicationQueueSceneComponent(this);
                this._addComponent(component);
            }
        }
        return this._simplificationQueue;
    },
    set: function (value) {
        this._simplificationQueue = value;
    },
    enumerable: true,
    configurable: true,
});
Mesh.prototype.simplify = function (settings, parallelProcessing = true, simplificationType = 0 /* SimplificationType.QUADRATIC */, successCallback) {
    this.getScene().simplificationQueue.addTask({
        settings: settings,
        parallelProcessing: parallelProcessing,
        mesh: this,
        simplificationType: simplificationType,
        successCallback: successCallback,
    });
    return this;
};
/**
 * Defines the simplification queue scene component responsible to help scheduling the various simplification task
 * created in a scene
 */
export class SimplicationQueueSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_SIMPLIFICATIONQUEUE;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._beforeCameraUpdateStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE, this, this._beforeCameraUpdate);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        // Nothing to do for this component
    }
    /**
     * Disposes the component and the associated resources
     */
    dispose() {
        // Nothing to do for this component
    }
    _beforeCameraUpdate() {
        if (this.scene._simplificationQueue && !this.scene._simplificationQueue.running) {
            this.scene._simplificationQueue.executeNext();
        }
    }
}
//# sourceMappingURL=meshSimplificationSceneComponent.js.map