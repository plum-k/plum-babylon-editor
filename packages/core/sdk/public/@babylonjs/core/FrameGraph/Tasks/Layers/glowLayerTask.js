import { FrameGraphTask } from "../../frameGraphTask.js";
import { ThinGlowLayer } from "../../../Layers/thinGlowLayer.js";
import { FrameGraphObjectRendererTask } from "../Rendering/objectRendererTask.js";
import { FrameGraphClearTextureTask } from "../Texture/clearTextureTask.js";
import { FrameGraphBlurTask } from "../PostProcesses/blurTask.js";

import { FrameGraphTextureManager } from "../../frameGraphTextureManager.js";
import { getDimensionsFromTextureSize } from "../../../Materials/Textures/textureCreationOptions.js";
/**
 * Task which applies a glowing effect to a texture.
 */
export class FrameGraphGlowLayerTask extends FrameGraphTask {
    /**
     * Gets or sets the camera used to render the objects to the glow layer.
     */
    get camera() {
        return this._camera;
    }
    set camera(camera) {
        this._camera = camera;
        this.layer.camera = this.camera;
    }
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
        if (this._clearTask) {
            this._clearTask.name = name + " Clear Layer";
        }
        if (this._objectRendererTask) {
            this._objectRendererTask.name = name + " Render to Layer";
        }
    }
    /**
     * Constructs a new glow layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the glow layer in.
     * @param options Options for the glow layer.
     */
    constructor(name, frameGraph, scene, options) {
        super(name, frameGraph);
        this._blurX = [];
        this._blurY = [];
        this._engine = scene.getEngine();
        this.layer = new ThinGlowLayer(name, scene, options, true);
        for (let i = 0; i < 2; i++) {
            this._blurX.push(new FrameGraphBlurTask(`${name} Blur X${i}`, this._frameGraph, this.layer._postProcesses[i * 2 + 0]));
            this._blurY.push(new FrameGraphBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.layer._postProcesses[i * 2 + 1]));
        }
        this._clearTask = new FrameGraphClearTextureTask(name + " Clear Layer", frameGraph);
        this._clearTask.clearColor = true;
        this._clearTask.clearDepth = true;
        this._objectRendererTask = new FrameGraphObjectRendererTask(name + " Render to Layer", frameGraph, scene, undefined, this.layer.objectRenderer);
        this.layer._renderPassId = this._objectRendererTask.objectRenderer.renderPassId;
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    isReady() {
        return this._objectRendererTask.isReady() && this.layer.isLayerReady();
    }
    record() {
        if (this.destinationTexture === undefined || this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGrapGlowLayerTask "${this.name}": destinationTexture, objectList and camera are required`);
        }
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        // Uses the layerTexture or creates a color texture to render the glow layer to
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
            textureSize = { width: 50, height: 50 };
            textureCreationOptions = {
                size: textureSize,
                options: {
                    createMipMaps: false,
                    types: [0],
                    formats: [5],
                    samples: 1,
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                },
                sizeIsPercentage: true,
            };
            colorLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Color`, textureCreationOptions);
        }
        // Creates a depth texture, used to render objects to the glow layer
        const textureDepthCreationOptions = {
            size: textureSize,
            options: FrameGraphTextureManager.CloneTextureOptions(textureCreationOptions.options),
            sizeIsPercentage: textureCreationOptions.sizeIsPercentage,
        };
        textureDepthCreationOptions.options.formats[0] = 14;
        const depthLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Depth`, textureDepthCreationOptions);
        // Clears the textures
        this._clearTask.destinationTexture = colorLayerOutput;
        this._clearTask.depthTexture = depthLayerOutput;
        this._clearTask.color = this.layer.neutralColor;
        this._clearTask.record();
        // Renders the objects to the layer texture
        this._objectRendererTask.destinationTexture = this._clearTask.outputTexture;
        this._objectRendererTask.depthTexture = this._clearTask.outputDepthTexture;
        this._objectRendererTask.camera = this.camera;
        this._objectRendererTask.objectList = this.objectList;
        this._objectRendererTask.disableShadows = true;
        this._objectRendererTask.record();
        // Blurs the layer color texture
        let blurTextureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            blurTextureType = 2;
        }
        else {
            blurTextureType = 0;
        }
        textureCreationOptions.options.types[0] = blurTextureType;
        for (let i = 0; i < this._blurX.length; i++) {
            const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);
            this._blurX[i].sourceTexture = i === 0 ? this._objectRendererTask.outputTexture : this._blurY[i - 1].outputTexture;
            this._blurX[i].sourceSamplingMode = 2;
            this._blurX[i].destinationTexture = blurXTextureHandle;
            this._blurX[i].record(true);
            const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);
            this._blurY[i].sourceTexture = this._blurX[i].outputTexture;
            this._blurY[i].sourceSamplingMode = 2;
            this._blurY[i].destinationTexture = blurYTextureHandle;
            this._blurY[i].record(true);
            textureSize.width = textureSize.width >> 1;
            textureSize.height = textureSize.height >> 1;
        }
        this._internalDependencies.push(this._blurY[0].outputTexture, this._blurY[1].outputTexture);
        // Composes the glow layer with the destination texture
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            this.layer.bindTexturesForCompose = (effect) => {
                context.bindTextureHandle(effect, "textureSampler", this._blurY[0].outputTexture);
                context.setTextureSamplingMode(this._blurY[1].destinationTexture, 2);
                context.bindTextureHandle(effect, "textureSampler2", this._blurY[1].outputTexture);
            };
            context._applyRenderTarget();
            this.layer.compose();
        });
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => { });
    }
    dispose() {
        this._clearTask.dispose();
        this._objectRendererTask.dispose();
        this.layer.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        super.dispose();
    }
}
//# sourceMappingURL=glowLayerTask.js.map