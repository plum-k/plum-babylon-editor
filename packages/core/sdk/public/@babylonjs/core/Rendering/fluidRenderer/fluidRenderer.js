import { Scene } from "../../scene.js";
import { SceneComponentConstants } from "../../sceneComponent.js";

import { FluidRenderingObjectParticleSystem } from "./fluidRenderingObjectParticleSystem.js";
import { FluidRenderingTargetRenderer } from "./fluidRenderingTargetRenderer.js";
import { FluidRenderingObjectCustomParticles } from "./fluidRenderingObjectCustomParticles.js";
import { FluidRenderingDepthTextureCopy } from "./fluidRenderingDepthTextureCopy.js";
Object.defineProperty(Scene.prototype, "fluidRenderer", {
    get: function () {
        return this._fluidRenderer;
    },
    set: function (value) {
        this._fluidRenderer = value;
    },
    enumerable: true,
    configurable: true,
});
Scene.prototype.enableFluidRenderer = function () {
    if (this._fluidRenderer) {
        return this._fluidRenderer;
    }
    this._fluidRenderer = new FluidRenderer(this);
    return this._fluidRenderer;
};
Scene.prototype.disableFluidRenderer = function () {
    this._fluidRenderer?.dispose();
    this._fluidRenderer = null;
};
function IsParticleSystemObject(obj) {
    return !!obj.particleSystem;
}
function IsCustomParticlesObject(obj) {
    return !!obj.addBuffers;
}
/**
 * Defines the fluid renderer scene component responsible to render objects as fluids
 */
export class FluidRendererSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name helpful to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_FLUIDRENDERER;
        this.scene = scene;
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene._gatherActiveCameraRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERACTIVECAMERARENDERTARGETS_FLUIDRENDERER, this, this._gatherActiveCameraRenderTargets);
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_FLUIDRENDERER, this, this._afterCameraDraw);
    }
    _gatherActiveCameraRenderTargets(_renderTargets) {
        this.scene.fluidRenderer?._prepareRendering();
    }
    _afterCameraDraw(camera) {
        this.scene.fluidRenderer?._render(camera);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        const fluidRenderer = this.scene.fluidRenderer;
        if (!fluidRenderer) {
            return;
        }
        const buffers = new Set();
        for (let i = 0; i < fluidRenderer.renderObjects.length; ++i) {
            const obj = fluidRenderer.renderObjects[i].object;
            if (IsCustomParticlesObject(obj)) {
                const vbuffers = obj.vertexBuffers;
                for (const name in vbuffers) {
                    buffers.add(vbuffers[name].getWrapperBuffer());
                }
            }
        }
        buffers.forEach((buffer) => {
            buffer._rebuild();
        });
    }
    /**
     * Disposes the component and the associated resources
     */
    dispose() {
        this.scene.disableFluidRenderer();
    }
}
/**
 * Class responsible for fluid rendering.
 * It is implementing the method described in https://developer.download.nvidia.com/presentations/2010/gdc/Direct3D_Effects.pdf
 */
export class FluidRenderer {
    /** @internal */
    static _SceneComponentInitialization(scene) {
        let component = scene._getComponent(SceneComponentConstants.NAME_FLUIDRENDERER);
        if (!component) {
            component = new FluidRendererSceneComponent(scene);
            scene._addComponent(component);
        }
    }
    /**
     * Gets the shader language used in this renderer
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Initializes the class
     * @param scene Scene in which the objects are part of
     */
    constructor(scene) {
        /** Shader language used by the renderer */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._scene = scene;
        this._engine = scene.getEngine();
        this._onEngineResizeObserver = null;
        this.renderObjects = [];
        this.targetRenderers = [];
        this._cameras = new Map();
        FluidRenderer._SceneComponentInitialization(this._scene);
        this._onEngineResizeObserver = this._engine.onResizeObservable.add(() => {
            this._initialize();
        });
        const engine = this._engine;
        if (engine.isWebGPU) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
    }
    /**
     * Reinitializes the class
     * Can be used if you change the object priority (FluidRenderingObject.priority), to make sure the objects are rendered in the right order
     */
    recreate() {
        this._sortRenderingObjects();
        this._initialize();
    }
    /**
     * Gets the render object corresponding to a particle system (null if the particle system is not rendered as a fluid)
     * @param ps The particle system
     * @returns the render object corresponding to this particle system if any, otherwise null
     */
    getRenderObjectFromParticleSystem(ps) {
        const index = this._getParticleSystemIndex(ps);
        return index !== -1 ? this.renderObjects[index] : null;
    }
    /**
     * Adds a particle system to the fluid renderer.
     * @param ps particle system
     * @param generateDiffuseTexture True if you want to generate a diffuse texture from the particle system and use it as part of the fluid rendering (default: false)
     * @param targetRenderer The target renderer used to display the particle system as a fluid. If not provided, the method will create a new one
     * @param camera The camera used by the target renderer (if the target renderer is created by the method)
     * @returns the render object corresponding to the particle system
     */
    addParticleSystem(ps, generateDiffuseTexture, targetRenderer, camera) {
        const object = new FluidRenderingObjectParticleSystem(this._scene, ps, this._shaderLanguage);
        object.onParticleSizeChanged.add(() => this._setParticleSizeForRenderTargets());
        if (!targetRenderer) {
            targetRenderer = new FluidRenderingTargetRenderer(this._scene, camera, this._shaderLanguage);
            this.targetRenderers.push(targetRenderer);
        }
        if (!targetRenderer._onUseVelocityChanged.hasObservers()) {
            targetRenderer._onUseVelocityChanged.add(() => this._setUseVelocityForRenderObject());
        }
        if (generateDiffuseTexture !== undefined) {
            targetRenderer.generateDiffuseTexture = generateDiffuseTexture;
        }
        const renderObject = { object, targetRenderer };
        this.renderObjects.push(renderObject);
        this._sortRenderingObjects();
        this._setParticleSizeForRenderTargets();
        return renderObject;
    }
    /**
     * Adds a custom particle set to the fluid renderer.
     * @param buffers The list of buffers (should contain at least a "position" buffer!)
     * @param numParticles Number of particles in each buffer
     * @param generateDiffuseTexture True if you want to generate a diffuse texture from buffers and use it as part of the fluid rendering (default: false). For the texture to be generated correctly, you need a "color" buffer in the set!
     * @param targetRenderer The target renderer used to display the particle system as a fluid. If not provided, the method will create a new one
     * @param camera The camera used by the target renderer (if the target renderer is created by the method)
     * @returns the render object corresponding to the custom particle set
     */
    addCustomParticles(buffers, numParticles, generateDiffuseTexture, targetRenderer, camera) {
        const object = new FluidRenderingObjectCustomParticles(this._scene, buffers, numParticles, this._shaderLanguage);
        object.onParticleSizeChanged.add(() => this._setParticleSizeForRenderTargets());
        if (!targetRenderer) {
            targetRenderer = new FluidRenderingTargetRenderer(this._scene, camera, this._shaderLanguage);
            this.targetRenderers.push(targetRenderer);
        }
        if (!targetRenderer._onUseVelocityChanged.hasObservers()) {
            targetRenderer._onUseVelocityChanged.add(() => this._setUseVelocityForRenderObject());
        }
        if (generateDiffuseTexture !== undefined) {
            targetRenderer.generateDiffuseTexture = generateDiffuseTexture;
        }
        const renderObject = { object, targetRenderer };
        this.renderObjects.push(renderObject);
        this._sortRenderingObjects();
        this._setParticleSizeForRenderTargets();
        return renderObject;
    }
    /**
     * Removes a render object from the fluid renderer
     * @param renderObject the render object to remove
     * @param removeUnusedTargetRenderer True to remove/dispose of the target renderer if it's not used anymore (default: true)
     * @returns True if the render object has been found and released, else false
     */
    removeRenderObject(renderObject, removeUnusedTargetRenderer = true) {
        const index = this.renderObjects.indexOf(renderObject);
        if (index === -1) {
            return false;
        }
        renderObject.object.dispose();
        this.renderObjects.splice(index, 1);
        if (removeUnusedTargetRenderer && this._removeUnusedTargetRenderers()) {
            this._initialize();
        }
        else {
            this._setParticleSizeForRenderTargets();
        }
        return true;
    }
    _sortRenderingObjects() {
        this.renderObjects.sort((a, b) => {
            return a.object.priority < b.object.priority ? -1 : a.object.priority > b.object.priority ? 1 : 0;
        });
    }
    _removeUnusedTargetRenderers() {
        const indexes = {};
        for (let i = 0; i < this.renderObjects.length; ++i) {
            const targetRenderer = this.renderObjects[i].targetRenderer;
            indexes[this.targetRenderers.indexOf(targetRenderer)] = true;
        }
        let removed = false;
        const newList = [];
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            if (!indexes[i]) {
                this.targetRenderers[i].dispose();
                removed = true;
            }
            else {
                newList.push(this.targetRenderers[i]);
            }
        }
        if (removed) {
            this.targetRenderers.length = 0;
            this.targetRenderers.push(...newList);
        }
        return removed;
    }
    _getParticleSystemIndex(ps) {
        for (let i = 0; i < this.renderObjects.length; ++i) {
            const obj = this.renderObjects[i].object;
            if (IsParticleSystemObject(obj) && obj.particleSystem === ps) {
                return i;
            }
        }
        return -1;
    }
    _initialize() {
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            this.targetRenderers[i].dispose();
        }
        const cameras = new Map();
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            const targetRenderer = this.targetRenderers[i];
            targetRenderer._initialize();
            if (targetRenderer.camera && targetRenderer._renderPostProcess) {
                let list = cameras.get(targetRenderer.camera);
                if (!list) {
                    list = [[], {}];
                    cameras.set(targetRenderer.camera, list);
                }
                list[0].push(targetRenderer);
                targetRenderer.camera.attachPostProcess(targetRenderer._renderPostProcess, i);
            }
        }
        let iterator = cameras.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const camera = key.value;
            const list = cameras.get(camera);
            const firstPostProcess = camera._getFirstPostProcess();
            if (!firstPostProcess) {
                continue;
            }
            const [targetRenderers, copyDepthTextures] = list;
            firstPostProcess.onSizeChangedObservable.add(() => {
                if (!firstPostProcess.inputTexture.depthStencilTexture) {
                    firstPostProcess.inputTexture.createDepthStencilTexture(0, true, this._engine.isStencilEnable, targetRenderers[0].samples, this._engine.isStencilEnable ? 13 : 14, `PostProcessRTTDepthStencil-${firstPostProcess.name}`);
                }
                for (const targetRenderer of targetRenderers) {
                    const thicknessRT = targetRenderer._thicknessRenderTarget?.renderTarget;
                    const thicknessTexture = thicknessRT?.texture;
                    if (thicknessRT && thicknessTexture) {
                        const key = thicknessTexture.width + "_" + thicknessTexture.height;
                        let copyDepthTexture = copyDepthTextures[key];
                        if (!copyDepthTexture) {
                            copyDepthTexture = copyDepthTextures[key] = new FluidRenderingDepthTextureCopy(this._engine, thicknessTexture.width, thicknessTexture.height);
                        }
                        copyDepthTexture.depthRTWrapper.shareDepth(thicknessRT);
                    }
                }
            });
        }
        // Dispose the CopyDepthTexture instances that we don't need anymore
        iterator = this._cameras.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const camera = key.value;
            const list = this._cameras.get(camera);
            const copyDepthTextures = list[1];
            const list2 = cameras.get(camera);
            if (!list2) {
                for (const key in copyDepthTextures) {
                    copyDepthTextures[key].dispose();
                }
            }
            else {
                for (const key in copyDepthTextures) {
                    if (!list2[1][key]) {
                        copyDepthTextures[key].dispose();
                    }
                }
            }
        }
        this._cameras.clear();
        this._cameras = cameras;
        this._setParticleSizeForRenderTargets();
    }
    _setParticleSizeForRenderTargets() {
        const particleSizes = new Map();
        for (let i = 0; i < this.renderObjects.length; ++i) {
            const renderingObject = this.renderObjects[i];
            let curSize = particleSizes.get(renderingObject.targetRenderer);
            if (curSize === undefined) {
                curSize = 0;
            }
            particleSizes.set(renderingObject.targetRenderer, Math.max(curSize, renderingObject.object.particleSize));
        }
        particleSizes.forEach((particleSize, targetRenderer) => {
            if (targetRenderer._depthRenderTarget) {
                targetRenderer._depthRenderTarget.particleSize = particleSize;
            }
        });
    }
    _setUseVelocityForRenderObject() {
        for (const renderingObject of this.renderObjects) {
            renderingObject.object.useVelocity = renderingObject.targetRenderer.useVelocity;
        }
    }
    /** @internal */
    _prepareRendering() {
        for (const renderer of this.targetRenderers) {
            if (renderer.needInitialization) {
                this._initialize();
                return;
            }
        }
    }
    /** @internal */
    _render(forCamera) {
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            if (!forCamera || this.targetRenderers[i].camera === forCamera) {
                this.targetRenderers[i]._clearTargets();
            }
        }
        const iterator = this._cameras.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const camera = key.value;
            const list = this._cameras.get(camera);
            if (forCamera && camera !== forCamera) {
                continue;
            }
            const firstPostProcess = camera._getFirstPostProcess();
            if (!firstPostProcess) {
                continue;
            }
            const sourceCopyDepth = firstPostProcess.inputTexture?.depthStencilTexture;
            if (sourceCopyDepth) {
                const [targetRenderers, copyDepthTextures] = list;
                for (const targetRenderer of targetRenderers) {
                    targetRenderer._bgDepthTexture = sourceCopyDepth;
                }
                for (const key in copyDepthTextures) {
                    copyDepthTextures[key].copy(sourceCopyDepth);
                }
            }
        }
        for (let i = 0; i < this.renderObjects.length; ++i) {
            const renderingObject = this.renderObjects[i];
            if (!forCamera || renderingObject.targetRenderer.camera === forCamera) {
                renderingObject.targetRenderer._render(renderingObject.object);
            }
        }
    }
    /**
     * Disposes of all the ressources used by the class
     */
    dispose() {
        this._engine.onResizeObservable.remove(this._onEngineResizeObserver);
        this._onEngineResizeObserver = null;
        for (let i = 0; i < this.renderObjects.length; ++i) {
            this.renderObjects[i].object.dispose();
        }
        for (let i = 0; i < this.targetRenderers.length; ++i) {
            this.targetRenderers[i].dispose();
        }
        this._cameras.forEach((list) => {
            const copyDepthTextures = list[1];
            for (const key in copyDepthTextures) {
                copyDepthTextures[key].dispose();
            }
        });
        this.renderObjects = [];
        this.targetRenderers = [];
        this._cameras.clear();
    }
}
//# sourceMappingURL=fluidRenderer.js.map