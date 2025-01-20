import { SceneComponentConstants } from "../sceneComponent.js";
import { EngineStore } from "../Engines/engineStore.js";
/**
 * Defines the layer scene component responsible to manage any layers
 * in a given scene.
 */
export class LayerSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_LAYER;
        this.scene = scene || EngineStore.LastCreatedScene;
        if (!this.scene) {
            return;
        }
        this._engine = this.scene.getEngine();
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_LAYER, this, this._drawCameraBackground);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LAYER, this, this._drawCameraForegroundWithPostProcessing);
        this.scene._afterCameraPostProcessStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERAPOSTPROCESS_LAYER, this, this._drawCameraForegroundWithoutPostProcessing);
        this.scene._beforeRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERTARGETDRAW_LAYER, this, this._drawRenderTargetBackground);
        this.scene._afterRenderTargetDrawStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERTARGETDRAW_LAYER, this, this._drawRenderTargetForegroundWithPostProcessing);
        this.scene._afterRenderTargetPostProcessStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER, this, this._drawRenderTargetForegroundWithoutPostProcessing);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        const layers = this.scene.layers;
        for (const layer of layers) {
            layer._rebuild();
        }
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        const layers = this.scene.layers;
        while (layers.length) {
            layers[0].dispose();
        }
    }
    _draw(predicate) {
        const layers = this.scene.layers;
        if (layers.length) {
            this._engine.setDepthBuffer(false);
            for (const layer of layers) {
                if (predicate(layer)) {
                    layer.render();
                }
            }
            this._engine.setDepthBuffer(true);
        }
    }
    _drawCameraPredicate(layer, isBackground, applyPostProcess, cameraLayerMask) {
        return (!layer.renderOnlyInRenderTargetTextures &&
            layer.isBackground === isBackground &&
            layer.applyPostProcess === applyPostProcess &&
            (layer.layerMask & cameraLayerMask) !== 0);
    }
    _drawCameraBackground(camera) {
        this._draw((layer) => {
            return this._drawCameraPredicate(layer, true, true, camera.layerMask);
        });
    }
    _drawCameraForegroundWithPostProcessing(camera) {
        this._draw((layer) => {
            return this._drawCameraPredicate(layer, false, true, camera.layerMask);
        });
    }
    _drawCameraForegroundWithoutPostProcessing(camera) {
        this._draw((layer) => {
            return this._drawCameraPredicate(layer, false, false, camera.layerMask);
        });
    }
    _drawRenderTargetPredicate(layer, isBackground, applyPostProcess, cameraLayerMask, renderTargetTexture) {
        return (layer.renderTargetTextures.length > 0 &&
            layer.isBackground === isBackground &&
            layer.applyPostProcess === applyPostProcess &&
            layer.renderTargetTextures.indexOf(renderTargetTexture) > -1 &&
            (layer.layerMask & cameraLayerMask) !== 0);
    }
    _drawRenderTargetBackground(renderTarget) {
        this._draw((layer) => {
            return this._drawRenderTargetPredicate(layer, true, true, this.scene.activeCamera.layerMask, renderTarget);
        });
    }
    _drawRenderTargetForegroundWithPostProcessing(renderTarget) {
        this._draw((layer) => {
            return this._drawRenderTargetPredicate(layer, false, true, this.scene.activeCamera.layerMask, renderTarget);
        });
    }
    _drawRenderTargetForegroundWithoutPostProcessing(renderTarget) {
        this._draw((layer) => {
            return this._drawRenderTargetPredicate(layer, false, false, this.scene.activeCamera.layerMask, renderTarget);
        });
    }
    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    addFromContainer(container) {
        if (!container.layers) {
            return;
        }
        container.layers.forEach((layer) => {
            this.scene.layers.push(layer);
        });
    }
    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    removeFromContainer(container, dispose = false) {
        if (!container.layers) {
            return;
        }
        container.layers.forEach((layer) => {
            const index = this.scene.layers.indexOf(layer);
            if (index !== -1) {
                this.scene.layers.splice(index, 1);
            }
            if (dispose) {
                layer.dispose();
            }
        });
    }
}
//# sourceMappingURL=layerSceneComponent.js.map