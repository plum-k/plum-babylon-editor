import { Scene } from "../scene.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { SubSurfaceConfiguration } from "./subSurfaceConfiguration.js";
import { Color3 } from "../Maths/math.color.js";
import { AddParser } from "../Loading/Plugins/babylonFileParser.function.js";
// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_SUBSURFACE, (parsedData, scene) => {
    // Diffusion profiles
    if (parsedData.ssDiffusionProfileColors !== undefined && parsedData.ssDiffusionProfileColors !== null) {
        scene.enableSubSurfaceForPrePass();
        if (scene.subSurfaceConfiguration) {
            for (let index = 0, cache = parsedData.ssDiffusionProfileColors.length; index < cache; index++) {
                const color = parsedData.ssDiffusionProfileColors[index];
                scene.subSurfaceConfiguration.addDiffusionProfile(new Color3(color.r, color.g, color.b));
            }
        }
    }
});
Object.defineProperty(Scene.prototype, "subSurfaceConfiguration", {
    get: function () {
        return this._subSurfaceConfiguration;
    },
    set: function (value) {
        if (value) {
            if (this.enablePrePassRenderer()) {
                this._subSurfaceConfiguration = value;
            }
        }
    },
    enumerable: true,
    configurable: true,
});
Scene.prototype.enableSubSurfaceForPrePass = function () {
    if (this._subSurfaceConfiguration) {
        return this._subSurfaceConfiguration;
    }
    const prePassRenderer = this.enablePrePassRenderer();
    if (prePassRenderer) {
        this._subSurfaceConfiguration = new SubSurfaceConfiguration(this);
        prePassRenderer.addEffectConfiguration(this._subSurfaceConfiguration);
        return this._subSurfaceConfiguration;
    }
    return null;
};
Scene.prototype.disableSubSurfaceForPrePass = function () {
    if (!this._subSurfaceConfiguration) {
        return;
    }
    this._subSurfaceConfiguration.dispose();
    this._subSurfaceConfiguration = null;
};
/**
 * Defines the Geometry Buffer scene component responsible to manage a G-Buffer useful
 * in several rendering techniques.
 */
export class SubSurfaceSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_PREPASSRENDERER;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() { }
    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    serialize(serializationObject) {
        if (!this.scene.subSurfaceConfiguration) {
            return;
        }
        const ssDiffusionProfileColors = this.scene.subSurfaceConfiguration.ssDiffusionProfileColors;
        serializationObject.ssDiffusionProfileColors = [];
        for (let i = 0; i < ssDiffusionProfileColors.length; i++) {
            serializationObject.ssDiffusionProfileColors.push({
                r: ssDiffusionProfileColors[i].r,
                g: ssDiffusionProfileColors[i].g,
                b: ssDiffusionProfileColors[i].b,
            });
        }
    }
    /**
     * Adds all the elements from the container to the scene
     */
    addFromContainer() {
        // Nothing to do
    }
    /**
     * Removes all the elements in the container from the scene
     */
    removeFromContainer() {
        // Make sure nothing will be serialized
        if (!this.scene.prePassRenderer) {
            return;
        }
        if (this.scene.subSurfaceConfiguration) {
            this.scene.subSurfaceConfiguration.clearAllDiffusionProfiles();
        }
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
}
SubSurfaceConfiguration._SceneComponentInitialization = (scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_SUBSURFACE);
    if (!component) {
        component = new SubSurfaceSceneComponent(scene);
        scene._addComponent(component);
    }
};
//# sourceMappingURL=subSurfaceSceneComponent.js.map