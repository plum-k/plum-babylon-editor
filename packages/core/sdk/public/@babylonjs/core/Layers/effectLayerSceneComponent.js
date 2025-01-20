import { Camera } from "../Cameras/camera.js";
import { Scene } from "../scene.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { EffectLayer } from "./effectLayer.js";
import { EngineStore } from "../Engines/engineStore.js";
import { AddParser } from "../Loading/Plugins/babylonFileParser.function.js";
// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_EFFECTLAYER, (parsedData, scene, container, rootUrl) => {
    if (parsedData.effectLayers) {
        if (!container.effectLayers) {
            container.effectLayers = [];
        }
        for (let index = 0; index < parsedData.effectLayers.length; index++) {
            const effectLayer = EffectLayer.Parse(parsedData.effectLayers[index], scene, rootUrl);
            container.effectLayers.push(effectLayer);
        }
    }
});
Scene.prototype.removeEffectLayer = function (toRemove) {
    const index = this.effectLayers.indexOf(toRemove);
    if (index !== -1) {
        this.effectLayers.splice(index, 1);
    }
    return index;
};
Scene.prototype.addEffectLayer = function (newEffectLayer) {
    this.effectLayers.push(newEffectLayer);
};
/**
 * Defines the layer scene component responsible to manage any effect layers
 * in a given scene.
 */
export class EffectLayerSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_EFFECTLAYER;
        this._renderEffects = false;
        this._needStencil = false;
        this._previousStencilState = false;
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
        this.scene._isReadyForMeshStage.registerStep(SceneComponentConstants.STEP_ISREADYFORMESH_EFFECTLAYER, this, this._isReadyForMesh);
        this.scene._cameraDrawRenderTargetStage.registerStep(SceneComponentConstants.STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER, this, this._renderMainTexture);
        this.scene._beforeCameraDrawStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERADRAW_EFFECTLAYER, this, this._setStencil);
        this.scene._afterRenderingGroupDrawStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGGROUPDRAW_EFFECTLAYER_DRAW, this, this._drawRenderingGroup);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_EFFECTLAYER, this, this._setStencilBack);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW, this, this._drawCamera);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        const layers = this.scene.effectLayers;
        for (const effectLayer of layers) {
            effectLayer._rebuild();
        }
    }
    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    serialize(serializationObject) {
        // Effect layers
        serializationObject.effectLayers = [];
        const layers = this.scene.effectLayers;
        for (const effectLayer of layers) {
            if (effectLayer.serialize) {
                serializationObject.effectLayers.push(effectLayer.serialize());
            }
        }
    }
    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    addFromContainer(container) {
        if (!container.effectLayers) {
            return;
        }
        container.effectLayers.forEach((o) => {
            this.scene.addEffectLayer(o);
        });
    }
    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    removeFromContainer(container, dispose) {
        if (!container.effectLayers) {
            return;
        }
        container.effectLayers.forEach((o) => {
            this.scene.removeEffectLayer(o);
            if (dispose) {
                o.dispose();
            }
        });
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        const layers = this.scene.effectLayers;
        while (layers.length) {
            layers[0].dispose();
        }
    }
    _isReadyForMesh(mesh, hardwareInstancedRendering) {
        const currentRenderPassId = this._engine.currentRenderPassId;
        const layers = this.scene.effectLayers;
        for (const layer of layers) {
            if (!layer.hasMesh(mesh)) {
                continue;
            }
            const renderTarget = layer._mainTexture;
            this._engine.currentRenderPassId = renderTarget.renderPassId;
            for (const subMesh of mesh.subMeshes) {
                if (!layer.isReady(subMesh, hardwareInstancedRendering)) {
                    this._engine.currentRenderPassId = currentRenderPassId;
                    return false;
                }
            }
        }
        this._engine.currentRenderPassId = currentRenderPassId;
        return true;
    }
    _renderMainTexture(camera) {
        this._renderEffects = false;
        this._needStencil = false;
        let needRebind = false;
        const layers = this.scene.effectLayers;
        if (layers && layers.length > 0) {
            this._previousStencilState = this._engine.getStencilBuffer();
            for (const effectLayer of layers) {
                if (effectLayer.shouldRender() &&
                    (!effectLayer.camera ||
                        (effectLayer.camera.cameraRigMode === Camera.RIG_MODE_NONE && camera === effectLayer.camera) ||
                        (effectLayer.camera.cameraRigMode !== Camera.RIG_MODE_NONE && effectLayer.camera._rigCameras.indexOf(camera) > -1))) {
                    this._renderEffects = true;
                    this._needStencil = this._needStencil || effectLayer.needStencil();
                    const renderTarget = effectLayer._mainTexture;
                    if (renderTarget._shouldRender()) {
                        this.scene.incrementRenderId();
                        renderTarget.render(false, false);
                        needRebind = true;
                    }
                }
            }
            this.scene.incrementRenderId();
        }
        return needRebind;
    }
    _setStencil() {
        // Activate effect Layer stencil
        if (this._needStencil) {
            this._engine.setStencilBuffer(true);
        }
    }
    _setStencilBack() {
        // Restore effect Layer stencil
        if (this._needStencil) {
            this._engine.setStencilBuffer(this._previousStencilState);
        }
    }
    _draw(renderingGroupId) {
        if (this._renderEffects) {
            this._engine.setDepthBuffer(false);
            const layers = this.scene.effectLayers;
            for (let i = 0; i < layers.length; i++) {
                const effectLayer = layers[i];
                if (effectLayer.renderingGroupId === renderingGroupId) {
                    if (effectLayer.shouldRender()) {
                        effectLayer.render();
                    }
                }
            }
            this._engine.setDepthBuffer(true);
        }
    }
    _drawCamera() {
        if (this._renderEffects) {
            this._draw(-1);
        }
    }
    _drawRenderingGroup(index) {
        if (!this.scene._isInIntermediateRendering() && this._renderEffects) {
            this._draw(index);
        }
    }
}
EffectLayer._SceneComponentInitialization = (scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_EFFECTLAYER);
    if (!component) {
        component = new EffectLayerSceneComponent(scene);
        scene._addComponent(component);
    }
};
//# sourceMappingURL=effectLayerSceneComponent.js.map