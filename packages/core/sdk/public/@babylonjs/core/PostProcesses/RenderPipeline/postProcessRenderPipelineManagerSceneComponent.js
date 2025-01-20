import { SceneComponentConstants } from "../../sceneComponent.js";
import { PostProcessRenderPipelineManager } from "./postProcessRenderPipelineManager.js";
import { Scene } from "../../scene.js";
Object.defineProperty(Scene.prototype, "postProcessRenderPipelineManager", {
    get: function () {
        if (!this._postProcessRenderPipelineManager) {
            // Register the G Buffer component to the scene.
            let component = this._getComponent(SceneComponentConstants.NAME_POSTPROCESSRENDERPIPELINEMANAGER);
            if (!component) {
                component = new PostProcessRenderPipelineManagerSceneComponent(this);
                this._addComponent(component);
            }
            this._postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();
        }
        return this._postProcessRenderPipelineManager;
    },
    enumerable: true,
    configurable: true,
});
/**
 * Defines the Render Pipeline scene component responsible to rendering pipelines
 */
export class PostProcessRenderPipelineManagerSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_POSTPROCESSRENDERPIPELINEMANAGER;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_POSTPROCESSRENDERPIPELINEMANAGER, this, this._gatherRenderTargets);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        if (this.scene._postProcessRenderPipelineManager) {
            this.scene._postProcessRenderPipelineManager._rebuild();
        }
    }
    /**
     * Disposes the component and the associated resources
     */
    dispose() {
        if (this.scene._postProcessRenderPipelineManager) {
            this.scene._postProcessRenderPipelineManager.dispose();
        }
    }
    _gatherRenderTargets() {
        if (this.scene._postProcessRenderPipelineManager) {
            this.scene._postProcessRenderPipelineManager.update();
        }
    }
}
//# sourceMappingURL=postProcessRenderPipelineManagerSceneComponent.js.map