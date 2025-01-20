import { WebXRControllerComponent } from "./webXRControllerComponent.js";
import { Observable } from "../../Misc/observable.js";
import { Logger } from "../../Misc/logger.js";
import { SceneLoader } from "../../Loading/sceneLoader.js";
import { Quaternion, Vector3 } from "../../Maths/math.vector.js";
import { Mesh } from "../../Meshes/mesh.js";
/**
 * An Abstract Motion controller
 * This class receives an xrInput and a profile layout and uses those to initialize the components
 * Each component has an observable to check for changes in value and state
 */
export class WebXRAbstractMotionController {
    /**
     * constructs a new abstract motion controller
     * @param scene the scene to which the model of the controller will be added
     * @param layout The profile layout to load
     * @param gamepadObject The gamepad object correlating to this controller
     * @param handedness handedness (left/right/none) of this controller
     * @param _doNotLoadControllerMesh set this flag to ignore the mesh loading
     * @param _controllerCache a cache holding controller models already loaded in this session
     */
    constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    scene, 
    // eslint-disable-next-line @typescript-eslint/naming-convention
    layout, 
    /**
     * The gamepad object correlating to this controller
     */
    gamepadObject, 
    /**
     * handedness (left/right/none) of this controller
     */
    handedness, 
    /**
     * @internal
     * [false]
     */
    _doNotLoadControllerMesh = false, _controllerCache) {
        this.scene = scene;
        this.layout = layout;
        this.gamepadObject = gamepadObject;
        this.handedness = handedness;
        this._doNotLoadControllerMesh = _doNotLoadControllerMesh;
        this._controllerCache = _controllerCache;
        this._initComponent = (id) => {
            if (!id) {
                return;
            }
            const componentDef = this.layout.components[id];
            const type = componentDef.type;
            const buttonIndex = componentDef.gamepadIndices.button;
            // search for axes
            const axes = [];
            if (componentDef.gamepadIndices.xAxis !== undefined && componentDef.gamepadIndices.yAxis !== undefined) {
                axes.push(componentDef.gamepadIndices.xAxis, componentDef.gamepadIndices.yAxis);
            }
            this.components[id] = new WebXRControllerComponent(id, type, buttonIndex, axes);
        };
        this._modelReady = false;
        /**
         * A map of components (WebXRControllerComponent) in this motion controller
         * Components have a ComponentType and can also have both button and axis definitions
         */
        this.components = {};
        /**
         * Disable the model's animation. Can be set at any time.
         */
        this.disableAnimation = false;
        /**
         * Observers registered here will be triggered when the model of this controller is done loading
         */
        this.onModelLoadedObservable = new Observable();
        // initialize the components
        if (layout.components) {
            Object.keys(layout.components).forEach(this._initComponent);
        }
        // Model is loaded in WebXRInput
    }
    /**
     * Dispose this controller, the model mesh and all its components
     */
    dispose() {
        this.getComponentIds().forEach((id) => this.getComponent(id).dispose());
        if (this.rootMesh) {
            this.rootMesh.getChildren(undefined, true).forEach((node) => {
                node.setEnabled(false);
            });
            this.rootMesh.dispose(!!this._controllerCache, !this._controllerCache);
        }
        this.onModelLoadedObservable.clear();
    }
    /**
     * Returns all components of specific type
     * @param type the type to search for
     * @returns an array of components with this type
     */
    getAllComponentsOfType(type) {
        return this.getComponentIds()
            .map((id) => this.components[id])
            .filter((component) => component.type === type);
    }
    /**
     * get a component based an its component id as defined in layout.components
     * @param id the id of the component
     * @returns the component correlates to the id or undefined if not found
     */
    getComponent(id) {
        return this.components[id];
    }
    /**
     * Get the list of components available in this motion controller
     * @returns an array of strings correlating to available components
     */
    getComponentIds() {
        return Object.keys(this.components);
    }
    /**
     * Get the first component of specific type
     * @param type type of component to find
     * @returns a controller component or null if not found
     */
    getComponentOfType(type) {
        return this.getAllComponentsOfType(type)[0] || null;
    }
    /**
     * Get the main (Select) component of this controller as defined in the layout
     * @returns the main component of this controller
     */
    getMainComponent() {
        return this.getComponent(this.layout.selectComponentId);
    }
    /**
     * Loads the model correlating to this controller
     * When the mesh is loaded, the onModelLoadedObservable will be triggered
     * @returns A promise fulfilled with the result of the model loading
     */
    async loadModel() {
        const useGeneric = !this._getModelLoadingConstraints();
        let loadingParams = this._getGenericFilenameAndPath();
        // Checking if GLB loader is present
        if (useGeneric) {
            Logger.Warn("Falling back to generic models");
        }
        else {
            loadingParams = this._getFilenameAndPath();
        }
        return new Promise((resolve, reject) => {
            const meshesLoaded = (meshes) => {
                if (useGeneric) {
                    this._getGenericParentMesh(meshes);
                }
                else {
                    this._setRootMesh(meshes);
                }
                this._processLoadedModel(meshes);
                this._modelReady = true;
                this.onModelLoadedObservable.notifyObservers(this);
                resolve(true);
            };
            if (this._controllerCache) {
                // look for it in the cache
                const found = this._controllerCache.filter((c) => {
                    return c.filename === loadingParams.filename && c.path === loadingParams.path;
                });
                if (found[0]) {
                    found[0].meshes.forEach((mesh) => mesh.setEnabled(true));
                    meshesLoaded(found[0].meshes);
                    return;
                    // found, don't continue to load
                }
            }
            SceneLoader.ImportMesh("", loadingParams.path, loadingParams.filename, this.scene, (meshes) => {
                if (this._controllerCache) {
                    this._controllerCache.push({
                        ...loadingParams,
                        meshes,
                    });
                }
                meshesLoaded(meshes);
            }, null, (_scene, message) => {
                Logger.Log(message);
                Logger.Warn(`Failed to retrieve controller model of type ${this.profileId} from the remote server: ${loadingParams.path}${loadingParams.filename}`);
                reject(message);
            });
        });
    }
    /**
     * Update this model using the current XRFrame
     * @param xrFrame the current xr frame to use and update the model
     */
    updateFromXRFrame(xrFrame) {
        this.getComponentIds().forEach((id) => this.getComponent(id).update(this.gamepadObject));
        this.updateModel(xrFrame);
    }
    /**
     * Backwards compatibility due to a deeply-integrated typo
     */
    get handness() {
        return this.handedness;
    }
    /**
     * Pulse (vibrate) this controller
     * If the controller does not support pulses, this function will fail silently and return Promise<false> directly after called
     * Consecutive calls to this function will cancel the last pulse call
     *
     * @param value the strength of the pulse in 0.0...1.0 range
     * @param duration Duration of the pulse in milliseconds
     * @param hapticActuatorIndex optional index of actuator (will usually be 0)
     * @returns a promise that will send true when the pulse has ended and false if the device doesn't support pulse or an error accrued
     */
    pulse(value, duration, hapticActuatorIndex = 0) {
        if (this.gamepadObject.hapticActuators && this.gamepadObject.hapticActuators[hapticActuatorIndex]) {
            return this.gamepadObject.hapticActuators[hapticActuatorIndex].pulse(value, duration);
        }
        else {
            return Promise.resolve(false);
        }
    }
    // Look through all children recursively. This will return null if no mesh exists with the given name.
    _getChildByName(node, name) {
        return node.getChildren((n) => n.name === name, false)[0];
    }
    // Look through only immediate children. This will return null if no mesh exists with the given name.
    _getImmediateChildByName(node, name) {
        return node.getChildren((n) => n.name == name, true)[0];
    }
    /**
     * Moves the axis on the controller mesh based on its current state
     * @param axisMap
     * @param axisValue the value of the axis which determines the meshes new position
     * @internal
     */
    _lerpTransform(axisMap, axisValue, fixValueCoordinates) {
        if (!axisMap.minMesh || !axisMap.maxMesh || !axisMap.valueMesh) {
            return;
        }
        if (!axisMap.minMesh.rotationQuaternion || !axisMap.maxMesh.rotationQuaternion || !axisMap.valueMesh.rotationQuaternion) {
            return;
        }
        // Convert from gamepad value range (-1 to +1) to lerp range (0 to 1)
        const lerpValue = fixValueCoordinates ? axisValue * 0.5 + 0.5 : axisValue;
        Quaternion.SlerpToRef(axisMap.minMesh.rotationQuaternion, axisMap.maxMesh.rotationQuaternion, lerpValue, axisMap.valueMesh.rotationQuaternion);
        Vector3.LerpToRef(axisMap.minMesh.position, axisMap.maxMesh.position, lerpValue, axisMap.valueMesh.position);
    }
    /**
     * Update the model itself with the current frame data
     * @param xrFrame the frame to use for updating the model mesh
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    updateModel(xrFrame) {
        if (!this._modelReady) {
            return;
        }
        this._updateModel(xrFrame);
    }
    _getGenericFilenameAndPath() {
        return {
            filename: "generic.babylon",
            path: "https://controllers.babylonjs.com/generic/",
        };
    }
    _getGenericParentMesh(meshes) {
        this.rootMesh = new Mesh(this.profileId + " " + this.handedness, this.scene);
        meshes.forEach((mesh) => {
            if (!mesh.parent) {
                mesh.isPickable = false;
                mesh.setParent(this.rootMesh);
            }
        });
        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }
}
//# sourceMappingURL=webXRAbstractMotionController.js.map