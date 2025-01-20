import { Scene } from "../scene.js";
import { DepthRenderer } from "./depthRenderer.js";

import { SceneComponentConstants } from "../sceneComponent.js";
Scene.prototype.enableDepthRenderer = function (camera, storeNonLinearDepth = false, force32bitsFloat = false, samplingMode = 3, storeCameraSpaceZ = false) {
    camera = camera || this.activeCamera;
    if (!camera) {
        // eslint-disable-next-line no-throw-literal
        throw "No camera available to enable depth renderer";
    }
    if (!this._depthRenderer) {
        this._depthRenderer = {};
    }
    if (!this._depthRenderer[camera.id]) {
        const supportFullfloat = !!this.getEngine().getCaps().textureFloatRender;
        let textureType = 0;
        if (this.getEngine().getCaps().textureHalfFloatRender && (!force32bitsFloat || !supportFullfloat)) {
            textureType = 2;
        }
        else if (supportFullfloat) {
            textureType = 1;
        }
        else {
            textureType = 0;
        }
        this._depthRenderer[camera.id] = new DepthRenderer(this, textureType, camera, storeNonLinearDepth, samplingMode, storeCameraSpaceZ);
    }
    return this._depthRenderer[camera.id];
};
Scene.prototype.disableDepthRenderer = function (camera) {
    camera = camera || this.activeCamera;
    if (!camera || !this._depthRenderer || !this._depthRenderer[camera.id]) {
        return;
    }
    this._depthRenderer[camera.id].dispose();
};
/**
 * Defines the Depth Renderer scene component responsible to manage a depth buffer useful
 * in several rendering techniques.
 */
export class DepthRendererSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_DEPTHRENDERER;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_DEPTHRENDERER, this, this._gatherRenderTargets);
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_DEPTHRENDERER, this, this._gatherActiveCameraRenderTargets);
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
        for (const key in this.scene._depthRenderer) {
            this.scene._depthRenderer[key].dispose();
        }
    }
    _gatherRenderTargets(renderTargets) {
        if (this.scene._depthRenderer) {
            for (const key in this.scene._depthRenderer) {
                const depthRenderer = this.scene._depthRenderer[key];
                if (depthRenderer.enabled && !depthRenderer.useOnlyInActiveCamera) {
                    renderTargets.push(depthRenderer.getDepthMap());
                }
            }
        }
    }
    _gatherActiveCameraRenderTargets(renderTargets) {
        if (this.scene._depthRenderer) {
            for (const key in this.scene._depthRenderer) {
                const depthRenderer = this.scene._depthRenderer[key];
                if (depthRenderer.enabled && depthRenderer.useOnlyInActiveCamera && this.scene.activeCamera.id === key) {
                    renderTargets.push(depthRenderer.getDepthMap());
                }
            }
        }
    }
}
DepthRenderer._SceneComponentInitialization = (scene) => {
    // Register the G Buffer component to the scene.
    let component = scene._getComponent(SceneComponentConstants.NAME_DEPTHRENDERER);
    if (!component) {
        component = new DepthRendererSceneComponent(scene);
        scene._addComponent(component);
    }
};
//# sourceMappingURL=depthRendererSceneComponent.js.map