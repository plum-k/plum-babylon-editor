import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../frameGraphTypes.js";
import { FrameGraphTask } from "../../frameGraphTask.js";
import { ObjectRenderer } from "../../../Rendering/objectRenderer.js";
import { FrameGraphCascadedShadowGeneratorTask } from "./csmShadowGeneratorTask.js";
/**
 * Task used to render objects to a texture.
 */
export class FrameGraphObjectRendererTask extends FrameGraphTask {
    /**
     * Gets or sets the camera used to render the objects.
     */
    get camera() {
        return this._camera;
    }
    set camera(camera) {
        this._camera = camera;
        this._renderer.activeCamera = this.camera;
    }
    /**
     * The object renderer used to render the objects.
     */
    get objectRenderer() {
        return this._renderer;
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
        if (this._renderer) {
            this._renderer.name = value;
        }
    }
    /**
     * Constructs a new object renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     * @param existingObjectRenderer An existing object renderer to use (optional). If provided, the options parameter will be ignored.
     */
    constructor(name, frameGraph, scene, options, existingObjectRenderer) {
        super(name, frameGraph);
        /**
         * The shadow generators used to render the objects (optional).
         */
        this.shadowGenerators = [];
        /**
         * If depth testing should be enabled (default is true).
         */
        this.depthTest = true;
        /**
         * If depth writing should be enabled (default is true).
         */
        this.depthWrite = true;
        /**
         * If shadows should be disabled (default is false).
         */
        this.disableShadows = false;
        this._onBeforeRenderObservable = null;
        this._onAfterRenderObservable = null;
        this._externalObjectRenderer = false;
        this._scene = scene;
        this._externalObjectRenderer = !!existingObjectRenderer;
        this._renderer = existingObjectRenderer ?? new ObjectRenderer(name, scene, options);
        this.name = name;
        if (!this._externalObjectRenderer) {
            this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
                if (!this._renderer.options.doNotChangeAspectRatio) {
                    scene.updateTransformMatrix(true);
                }
            });
        }
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    isReady() {
        return this._renderer.isReadyForRendering(this._textureWidth, this._textureHeight);
    }
    record(skipCreationOfDisabledPasses = false, additionalExecute) {
        if (this.destinationTexture === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphObjectRendererTask ${this.name}: destinationTexture and objectList are required`);
        }
        // Make sure the renderList / particleSystemList are set when FrameGraphObjectRendererTask.isReady() is called!
        this._renderer.renderList = this.objectList.meshes;
        this._renderer.particleSystemList = this.objectList.particleSystems;
        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.destinationTexture);
        let depthEnabled = false;
        if (this.depthTexture !== undefined) {
            if (this.depthTexture === backbufferDepthStencilTextureHandle && this.destinationTexture !== backbufferColorTextureHandle) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the back buffer color texture is the only color texture allowed when the depth is the back buffer depth/stencil`);
            }
            if (this.depthTexture !== backbufferDepthStencilTextureHandle && this.destinationTexture === backbufferColorTextureHandle) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the destination is the back buffer color`);
            }
            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphObjectRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }
            depthEnabled = true;
        }
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        if (this.depthTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }
        this._textureWidth = outputTextureDescription.size.width;
        this._textureHeight = outputTextureDescription.size.height;
        this._setLightsForShadow();
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this.destinationTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;
            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            context.render(this._renderer, this._textureWidth, this._textureHeight);
            additionalExecute?.(context);
        });
        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
            passDisabled.setRenderTarget(this.destinationTexture);
            passDisabled.setRenderTargetDepth(this.depthTexture);
            passDisabled.setExecuteFunc((_context) => { });
        }
    }
    dispose() {
        this._renderer.onBeforeRenderObservable.remove(this._onBeforeRenderObservable);
        this._renderer.onAfterRenderObservable.remove(this._onAfterRenderObservable);
        if (!this._externalObjectRenderer) {
            this._renderer.dispose();
        }
        super.dispose();
    }
    _setLightsForShadow() {
        const lightsForShadow = new Set();
        const shadowEnabled = new Map();
        if (this.shadowGenerators) {
            for (const shadowGeneratorTask of this.shadowGenerators) {
                const shadowGenerator = shadowGeneratorTask.shadowGenerator;
                const light = shadowGenerator.getLight();
                if (light.isEnabled() && light.shadowEnabled) {
                    lightsForShadow.add(light);
                    if (FrameGraphCascadedShadowGeneratorTask.IsCascadedShadowGenerator(shadowGeneratorTask)) {
                        light._shadowGenerators.set(shadowGeneratorTask.camera, shadowGenerator);
                    }
                    else {
                        light._shadowGenerators.set(null, shadowGenerator);
                    }
                }
            }
        }
        this._renderer.onBeforeRenderObservable.remove(this._onBeforeRenderObservable);
        this._onBeforeRenderObservable = this._renderer.onBeforeRenderObservable.add(() => {
            for (let i = 0; i < this._scene.lights.length; i++) {
                const light = this._scene.lights[i];
                shadowEnabled.set(light, light.shadowEnabled);
                light.shadowEnabled = !this.disableShadows && lightsForShadow.has(light);
            }
        });
        this._renderer.onAfterRenderObservable.remove(this._onAfterRenderObservable);
        this._onAfterRenderObservable = this._renderer.onAfterRenderObservable.add(() => {
            for (let i = 0; i < this._scene.lights.length; i++) {
                const light = this._scene.lights[i];
                light.shadowEnabled = shadowEnabled.get(light);
            }
        });
    }
}
//# sourceMappingURL=objectRendererTask.js.map