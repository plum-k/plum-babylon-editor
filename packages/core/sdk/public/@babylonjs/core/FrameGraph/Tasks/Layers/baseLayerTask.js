import { FrameGraphTask } from "../../frameGraphTask.js";
import { FrameGraphObjectRendererTask } from "../Rendering/objectRendererTask.js";
import { FrameGraphClearTextureTask } from "../Texture/clearTextureTask.js";
import { FrameGraphBlurTask } from "../PostProcesses/blurTask.js";

import { FrameGraphTextureManager } from "../../frameGraphTextureManager.js";
import { getDimensionsFromTextureSize } from "../../../Materials/Textures/textureCreationOptions.js";
import { FrameGraphPostProcessTask } from "../PostProcesses/postProcessTask.js";
import { Vector2 } from "../../../Maths/math.vector.js";
import { ThinGlowBlurPostProcess } from "../../../Layers/thinEffectLayer.js";
import { FrameGraphExecuteTask } from "../Misc/executeTask.js";
class FrameGraphGlowBlurTask extends FrameGraphPostProcessTask {
    /**
     * Constructs a new glow blur task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the glow blur effect. If not provided, a new one will be created.
     */
    constructor(name, frameGraph, thinPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinGlowBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 1));
    }
    record(skipCreationOfDisabledPasses = false, additionalExecute, additionalBindings) {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);
        this.postProcess.textureWidth = this._outputWidth;
        this.postProcess.textureHeight = this._outputHeight;
        return pass;
    }
}
/**
 * @internal
 */
export class FrameGraphBaseLayerTask extends FrameGraphTask {
    /**
     * The name of the task.
     */
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
        if (this._blurX) {
            for (let i = 0; i < this._blurX.length; i++) {
                this._blurX[i].name = `${name} Blur X${i}`;
                this._blurY[i].name = `${name} Blur Y${i}`;
            }
        }
        if (this._clearLayerTextures) {
            this._clearLayerTextures.name = name + " Clear Layer";
        }
        if (this._objectRendererForLayer) {
            this._objectRendererForLayer.name = name + " Render to Layer";
        }
    }
    /**
     * Constructs a new layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the layer in.
     * @param layer The layer.
     * @param numBlurPasses The number of blur passes applied by the layer.
     * @param useCustomBlur If true, the layer will use a custom blur post process instead of the default one.
     * @param _setRenderTargetDepth If true, the task will set the render target depth.
     * @param _notifyBlurObservable If true, the task will notify before and after blurring occurs.
     */
    constructor(name, frameGraph, scene, layer, numBlurPasses, useCustomBlur = false, _setRenderTargetDepth = false, _notifyBlurObservable = false) {
        super(name, frameGraph);
        this._setRenderTargetDepth = _setRenderTargetDepth;
        this._notifyBlurObservable = _notifyBlurObservable;
        this._blurX = [];
        this._blurY = [];
        this._onBeforeBlurTask = null;
        this._onAfterBlurTask = null;
        this._onBeforeObservableObserver = null;
        this._onAfterObservableObserver = null;
        this._onAfterRenderingGroupObserver = null;
        this._scene = scene;
        this._engine = scene.getEngine();
        this.layer = layer;
        for (let i = 0; i < numBlurPasses; i++) {
            if (useCustomBlur) {
                this._blurX.push(new FrameGraphGlowBlurTask(`${name} Blur X${i}`, this._frameGraph, this.layer._postProcesses[1 + i * 2 + 0]));
                this._blurY.push(new FrameGraphGlowBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.layer._postProcesses[1 + i * 2 + 1]));
            }
            else {
                this._blurX.push(new FrameGraphBlurTask(`${name} Blur X${i}`, this._frameGraph, this.layer._postProcesses[i * 2 + 0]));
                this._blurY.push(new FrameGraphBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.layer._postProcesses[i * 2 + 1]));
            }
        }
        this._clearLayerTextures = new FrameGraphClearTextureTask(name + " Clear Layer", frameGraph);
        this._clearLayerTextures.clearColor = true;
        this._clearLayerTextures.clearDepth = true;
        this._objectRendererForLayer = new FrameGraphObjectRendererTask(name + " Render to Layer", frameGraph, scene, undefined, this.layer.objectRenderer);
        if (this._notifyBlurObservable) {
            this._onBeforeBlurTask = new FrameGraphExecuteTask(name + " On Before Blur", frameGraph);
            this._onAfterBlurTask = new FrameGraphExecuteTask(name + " On After Blur", frameGraph);
            this._onBeforeBlurTask.func = () => {
                if (this.layer.onBeforeBlurObservable.hasObservers()) {
                    this.layer.onBeforeBlurObservable.notifyObservers(this.layer);
                }
            };
            this._onAfterBlurTask.func = () => {
                if (this.layer.onAfterBlurObservable.hasObservers()) {
                    this.layer.onAfterBlurObservable.notifyObservers(this.layer);
                }
            };
        }
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.onTexturesAllocatedObservable.add((context) => {
            for (let i = 0; i < this._blurX.length; i++) {
                this._blurX[i].onTexturesAllocatedObservable.notifyObservers(context);
                this._blurY[i].onTexturesAllocatedObservable.notifyObservers(context);
            }
            context.setTextureSamplingMode(this._blurY[this._blurY.length - 1].destinationTexture, 2);
        });
    }
    isReady() {
        return this._objectRendererForLayer.isReady() && this.layer.isLayerReady();
    }
    record() {
        if (this.destinationTexture === undefined || this.objectRendererTask === undefined) {
            throw new Error(`${this.constructor.name} "${this.name}": destinationTexture and objectRendererTask are required`);
        }
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        // Uses the layerTexture or creates a color texture to render the layer to
        let textureSize;
        let textureCreationOptions;
        let colorLayerOutput;
        if (this.layerTexture) {
            colorLayerOutput = this.layerTexture;
            textureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.layerTexture);
            textureSize = getDimensionsFromTextureSize(textureCreationOptions.size);
            textureCreationOptions.size = textureSize;
        }
        else {
            const destinationTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.destinationTexture);
            const fixedTextureSize = this.layer._options.mainTextureFixedSize ? Math.max(2, this.layer._options.mainTextureFixedSize) : 0;
            textureSize = getDimensionsFromTextureSize(destinationTextureCreationOptions.size);
            textureSize.width = fixedTextureSize || Math.floor(textureSize.width * (this.layer._options.mainTextureRatio || 0.1));
            textureSize.height = fixedTextureSize || Math.floor(textureSize.height * (this.layer._options.mainTextureRatio || 0.1));
            textureCreationOptions = {
                size: textureSize,
                options: {
                    createMipMaps: false,
                    types: [this.layer._options.mainTextureType],
                    formats: [5],
                    samples: 1,
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                },
                sizeIsPercentage: this.layer._options.mainTextureFixedSize ? false : destinationTextureCreationOptions.sizeIsPercentage,
            };
            colorLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Color`, textureCreationOptions);
        }
        // Creates a depth texture, used to render objects to the layer
        // We don't reuse the depth texture of the objectRendererTask, as the size of the layer texture will generally be different (smaller).
        const textureDepthCreationOptions = {
            size: textureSize,
            options: FrameGraphTextureManager.CloneTextureOptions(textureCreationOptions.options),
            sizeIsPercentage: textureCreationOptions.sizeIsPercentage,
        };
        textureDepthCreationOptions.options.formats[0] = 14;
        const depthLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Depth`, textureDepthCreationOptions);
        this._addInternalDependencies([colorLayerOutput, depthLayerOutput]);
        // Clears the textures
        this._clearLayerTextures.destinationTexture = colorLayerOutput;
        this._clearLayerTextures.depthTexture = depthLayerOutput;
        this._clearLayerTextures.color = this.layer.neutralColor;
        this._clearLayerTextures.clearDepth = true;
        const clearTaskPass = this._clearLayerTextures.record();
        // Renders the objects to the layer texture
        this._objectRendererForLayer.destinationTexture = this._clearLayerTextures.outputTexture;
        this._objectRendererForLayer.depthTexture = this._clearLayerTextures.outputDepthTexture;
        this._objectRendererForLayer.camera = this.objectRendererTask.camera;
        this._objectRendererForLayer.objectList = this.objectRendererTask.objectList;
        this._objectRendererForLayer.disableShadows = true;
        const objectRendererForLayerTaskPass = this._objectRendererForLayer.record();
        // Blurs the layer color texture
        let blurTextureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            blurTextureType = 2;
        }
        else {
            blurTextureType = 0;
        }
        textureCreationOptions.options.types[0] = blurTextureType;
        const blurTextureSizeRatio = this.layer._options.blurTextureSizeRatio !== undefined ? this.layer._options.blurTextureSizeRatio || 0.1 : undefined;
        if (blurTextureSizeRatio !== undefined) {
            textureSize.width = Math.floor(textureSize.width * blurTextureSizeRatio);
            textureSize.height = Math.floor(textureSize.height * blurTextureSizeRatio);
        }
        const onBeforeBlurPass = this._onBeforeBlurTask?.record();
        const blurPasses = [];
        for (let i = 0; i < this._blurX.length; i++) {
            const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);
            this._blurX[i].sourceTexture = i === 0 ? this._objectRendererForLayer.outputTexture : this._blurY[i - 1].outputTexture;
            this._blurX[i].sourceSamplingMode = 2;
            this._blurX[i].destinationTexture = blurXTextureHandle;
            blurPasses.push(this._blurX[i].record(true));
            const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);
            this._blurY[i].sourceTexture = this._blurX[i].outputTexture;
            this._blurY[i].sourceSamplingMode = 2;
            this._blurY[i].destinationTexture = blurYTextureHandle;
            blurPasses.push(this._blurY[i].record(true));
            this._addInternalDependencies([blurXTextureHandle, blurYTextureHandle]);
            textureSize.width = textureSize.width >> 1;
            textureSize.height = textureSize.height >> 1;
        }
        const onAfterBlurPass = this._onAfterBlurTask?.record();
        // Enables stencil (if stencil is needed) when rendering objects to the main texture
        // We also disable the internal passes if the layer should not render
        this.objectRendererTask.objectRenderer.onBeforeRenderObservable.remove(this._onBeforeObservableObserver);
        this._onBeforeObservableObserver = this.objectRendererTask.objectRenderer.onBeforeRenderObservable.add(() => {
            const shouldRender = this.layer.shouldRender();
            clearTaskPass.disabled = !shouldRender;
            objectRendererForLayerTaskPass.disabled = !shouldRender;
            if (onBeforeBlurPass) {
                onBeforeBlurPass.disabled = !shouldRender;
            }
            for (let i = 0; i < blurPasses.length; i++) {
                blurPasses[i].disabled = !shouldRender;
            }
            if (onAfterBlurPass) {
                onAfterBlurPass.disabled = !shouldRender;
            }
            if (shouldRender && this.layer.needStencil()) {
                this._engine.setStencilBuffer(true);
                this._engine.setStencilFunctionReference(1);
            }
        });
        this.objectRendererTask.objectRenderer.onAfterRenderObservable.remove(this._onAfterObservableObserver);
        this._onAfterObservableObserver = this.objectRendererTask.objectRenderer.onAfterRenderObservable.add(() => {
            if (this.layer.shouldRender() && this.layer.needStencil()) {
                this._engine.setStencilBuffer(false);
            }
        });
        // Composes the layer with the destination texture
        this.layer.bindTexturesForCompose = undefined;
        this._clearAfterRenderingGroupObserver();
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this.outputTexture);
        if (this._setRenderTargetDepth) {
            pass.setRenderTargetDepth(this.objectRendererTask.depthTexture);
        }
        pass.setExecuteFunc((context) => {
            if (!this.layer.bindTexturesForCompose) {
                this.layer.bindTexturesForCompose = (effect) => {
                    for (let i = 0; i < this._blurY.length; i++) {
                        context.bindTextureHandle(effect, `textureSampler${i > 0 ? i + 1 : ""}`, this._blurY[i].outputTexture);
                    }
                };
            }
            if (this.layer._options.renderingGroupId !== -1) {
                if (!this._onAfterRenderingGroupObserver) {
                    this._onAfterRenderingGroupObserver = this._scene.onAfterRenderingGroupObservable.add((info) => {
                        if (!this.layer.shouldRender() ||
                            info.renderingGroupId !== this.layer._options.renderingGroupId ||
                            info.renderingManager !== this.objectRendererTask.objectRenderer._renderingManager) {
                            return;
                        }
                        this._objectRendererForLayer.objectList = this.objectRendererTask.objectList;
                        context.saveDepthStates();
                        context.setDepthStates(false, false);
                        context._applyRenderTarget();
                        this.layer.compose();
                        context.restoreDepthStates();
                    });
                }
            }
            else {
                this._clearAfterRenderingGroupObserver();
                if (this.layer.shouldRender()) {
                    this._objectRendererForLayer.objectList = this.objectRendererTask.objectList; // in case the object list has changed in objectRendererTask
                    context.setDepthStates(false, false);
                    context._applyRenderTarget();
                    this.layer.compose();
                }
            }
        });
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        if (this._setRenderTargetDepth) {
            passDisabled.setRenderTargetDepth(this.objectRendererTask.depthTexture);
        }
        passDisabled.setExecuteFunc((_context) => { });
    }
    _clearAfterRenderingGroupObserver() {
        this._scene.onAfterRenderingGroupObservable.remove(this._onAfterRenderingGroupObserver);
        this._onAfterRenderingGroupObserver = null;
    }
    dispose() {
        this._clearAfterRenderingGroupObserver();
        this._clearLayerTextures.dispose();
        this._objectRendererForLayer.dispose();
        this._onBeforeBlurTask?.dispose();
        this._onAfterBlurTask?.dispose();
        this.layer.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        super.dispose();
    }
}
//# sourceMappingURL=baseLayerTask.js.map