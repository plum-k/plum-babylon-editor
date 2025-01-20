import { Logger } from "../Misc/logger.js";
import { Observable } from "../Misc/observable.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { Scene } from "../scene.js";
import { PhysicsEngine as PhysicsEngineV1 } from "./v1/physicsEngine.js";
import { PhysicsEngine as PhysicsEngineV2 } from "./v2/physicsEngine.js";
/**
 * Gets the current physics engine
 * @returns a IPhysicsEngine or null if none attached
 */
Scene.prototype.getPhysicsEngine = function () {
    return this._physicsEngine;
};
/**
 * Enables physics to the current scene
 * @param gravity defines the scene's gravity for the physics engine
 * @param plugin defines the physics engine to be used. defaults to CannonJS.
 * @returns a boolean indicating if the physics engine was initialized
 */
Scene.prototype.enablePhysics = function (gravity = null, plugin) {
    if (this._physicsEngine) {
        return true;
    }
    // Register the component to the scene
    let component = this._getComponent(SceneComponentConstants.NAME_PHYSICSENGINE);
    if (!component) {
        component = new PhysicsEngineSceneComponent(this);
        this._addComponent(component);
    }
    try {
        if (!plugin || plugin?.getPluginVersion() === 1) {
            this._physicsEngine = new PhysicsEngineV1(gravity, plugin);
        }
        else if (plugin?.getPluginVersion() === 2) {
            this._physicsEngine = new PhysicsEngineV2(gravity, plugin);
        }
        else {
            throw new Error("Unsupported Physics plugin version.");
        }
        this._physicsTimeAccumulator = 0;
        return true;
    }
    catch (e) {
        Logger.Error(e.message);
        return false;
    }
};
/**
 * Disables and disposes the physics engine associated with the scene
 */
Scene.prototype.disablePhysicsEngine = function () {
    if (!this._physicsEngine) {
        return;
    }
    this._physicsEngine.dispose();
    this._physicsEngine = null;
};
/**
 * Gets a boolean indicating if there is an active physics engine
 * @returns a boolean indicating if there is an active physics engine
 */
Scene.prototype.isPhysicsEnabled = function () {
    return this._physicsEngine !== undefined;
};
/**
 * Deletes a physics compound impostor
 * @param compound defines the compound to delete
 */
Scene.prototype.deleteCompoundImpostor = function (compound) {
    const mesh = compound.parts[0].mesh;
    if (mesh.physicsImpostor) {
        mesh.physicsImpostor.dispose( /*true*/);
        mesh.physicsImpostor = null;
    }
};
/**
 * @internal
 */
Scene.prototype._advancePhysicsEngineStep = function (step) {
    if (this._physicsEngine) {
        const subTime = this._physicsEngine.getSubTimeStep();
        if (subTime > 0) {
            this._physicsTimeAccumulator += step;
            while (this._physicsTimeAccumulator > subTime) {
                this.onBeforePhysicsObservable.notifyObservers(this);
                this._physicsEngine._step(subTime / 1000);
                this.onAfterPhysicsObservable.notifyObservers(this);
                this._physicsTimeAccumulator -= subTime;
            }
        }
        else {
            this.onBeforePhysicsObservable.notifyObservers(this);
            this._physicsEngine._step(step / 1000);
            this.onAfterPhysicsObservable.notifyObservers(this);
        }
    }
};
/**
 * Defines the physics engine scene component responsible to manage a physics engine
 */
export class PhysicsEngineSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_PHYSICSENGINE;
        this.scene = scene;
        this.scene.onBeforePhysicsObservable = new Observable();
        this.scene.onAfterPhysicsObservable = new Observable();
        // Replace the function used to get the deterministic frame time
        this.scene.getDeterministicFrameTime = () => {
            if (this.scene._physicsEngine) {
                return this.scene._physicsEngine.getTimeStep() * 1000;
            }
            return 1000.0 / 60.0;
        };
    }
    /**
     * Registers the component in a given scene
     */
    register() { }
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
        this.scene.onBeforePhysicsObservable.clear();
        this.scene.onAfterPhysicsObservable.clear();
        if (this.scene._physicsEngine) {
            this.scene.disablePhysicsEngine();
        }
    }
}
//# sourceMappingURL=joinedPhysicsEngineComponent.js.map