import { Tools } from "../../../Misc/tools.js";
import { SceneComponentConstants } from "../../../sceneComponent.js";
/**
 * Defines the Procedural Texture scene component responsible to manage any Procedural Texture
 * in a given scene.
 */
export class ProceduralTextureSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_PROCEDURALTEXTURE;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._beforeClearStage.registerStep(SceneComponentConstants.STEP_BEFORECLEAR_PROCEDURALTEXTURE, this, this._beforeClear);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        // Nothing to do here.
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        // Nothing to do here.
    }
    _beforeClear() {
        if (this.scene.proceduralTexturesEnabled) {
            Tools.StartPerformanceCounter("Procedural textures", this.scene.proceduralTextures.length > 0);
            for (let proceduralIndex = 0; proceduralIndex < this.scene.proceduralTextures.length; proceduralIndex++) {
                const proceduralTexture = this.scene.proceduralTextures[proceduralIndex];
                if (proceduralTexture._shouldRender()) {
                    proceduralTexture.render();
                }
            }
            Tools.EndPerformanceCounter("Procedural textures", this.scene.proceduralTextures.length > 0);
        }
    }
}
//# sourceMappingURL=proceduralTextureSceneComponent.js.map