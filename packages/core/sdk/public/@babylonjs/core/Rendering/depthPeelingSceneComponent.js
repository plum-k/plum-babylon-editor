
import { Scene } from "../scene.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { DepthPeelingRenderer } from "./depthPeelingRenderer.js";
Object.defineProperty(Scene.prototype, "depthPeelingRenderer", {
    get: function () {
        if (!this._depthPeelingRenderer) {
            let component = this._getComponent(SceneComponentConstants.NAME_DEPTHPEELINGRENDERER);
            if (!component) {
                component = new DepthPeelingSceneComponent(this);
                this._addComponent(component);
            }
        }
        return this._depthPeelingRenderer;
    },
    set: function (value) {
        this._depthPeelingRenderer = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(Scene.prototype, "useOrderIndependentTransparency", {
    get: function () {
        return this._useOrderIndependentTransparency;
    },
    set: function (value) {
        if (this._useOrderIndependentTransparency === value) {
            return;
        }
        this._useOrderIndependentTransparency = value;
        this.markAllMaterialsAsDirty(63);
        this.prePassRenderer?.markAsDirty();
    },
    enumerable: true,
    configurable: true,
});
/**
 * Scene component to render order independent transparency with depth peeling
 */
export class DepthPeelingSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_DEPTHPEELINGRENDERER;
        this.scene = scene;
        scene.depthPeelingRenderer = new DepthPeelingRenderer(scene);
    }
    /**
     * Registers the component in a given scene
     */
    register() { }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() { }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        this.scene.depthPeelingRenderer?.dispose();
        this.scene.depthPeelingRenderer = null;
    }
}
//# sourceMappingURL=depthPeelingSceneComponent.js.map