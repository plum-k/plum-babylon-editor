
import { FrameGraphBloomMergeTask } from "./bloomMergeTask.js";
import { FrameGraphTask } from "../../frameGraphTask.js";
import { ThinBloomEffect } from "../../../PostProcesses/thinBloomEffect.js";
import { FrameGraphExtractHighlightsTask } from "./extractHighlightsTask.js";
import { FrameGraphBlurTask } from "./blurTask.js";
/**
 * Task which applies a bloom render effect.
 */
export class FrameGraphBloomTask extends FrameGraphTask {
    /**
     * The name of the task.
     */
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
        if (this._downscale) {
            this._downscale.name = `${name} Downscale`;
        }
        if (this._blurX) {
            this._blurX.name = `${name} Blur X`;
        }
        if (this._blurY) {
            this._blurY.name = `${name} Blur Y`;
        }
        if (this._merge) {
            this._merge.name = `${name} Merge`;
        }
    }
    /**
     * Constructs a new bloom task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param engine The engine to use for the bloom effect.
     * @param weight Weight of the bloom effect.
     * @param kernel Kernel size of the bloom effect.
     * @param threshold Threshold of the bloom effect.
     * @param hdr Whether the bloom effect is HDR.
     * @param bloomScale The scale of the bloom effect. This value is multiplied by the source texture size to determine the bloom texture size.
     */
    constructor(name, frameGraph, engine, weight, kernel, threshold, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph);
        /**
         * The sampling mode to use for the source texture.
         */
        this.sourceSamplingMode = 2;
        this.hdr = hdr;
        this._defaultPipelineTextureType = 0;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                this._defaultPipelineTextureType = 2;
            }
            else if (caps.textureFloatRender) {
                this._defaultPipelineTextureType = 1;
            }
        }
        this.bloom = new ThinBloomEffect(name, engine, bloomScale);
        this.bloom.threshold = threshold;
        this.bloom.kernel = kernel;
        this.bloom.weight = weight;
        this._downscale = new FrameGraphExtractHighlightsTask(`${name} Downscale`, this._frameGraph, this.bloom._downscale);
        this._blurX = new FrameGraphBlurTask(`${name} Blur X`, this._frameGraph, this.bloom._blurX);
        this._blurY = new FrameGraphBlurTask(`${name} Blur Y`, this._frameGraph, this.bloom._blurY);
        this._merge = new FrameGraphBloomMergeTask(`${name} Merge`, this._frameGraph, this.bloom._merge);
        this.onTexturesAllocatedObservable.add((context) => {
            this._downscale.onTexturesAllocatedObservable.notifyObservers(context);
            this._blurX.onTexturesAllocatedObservable.notifyObservers(context);
            this._blurY.onTexturesAllocatedObservable.notifyObservers(context);
            this._merge.onTexturesAllocatedObservable.notifyObservers(context);
        });
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    isReady() {
        return this.bloom.isReady();
    }
    record() {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphBloomTask: sourceTexture is required");
        }
        this._internalDependencies.push(this.sourceTexture);
        const sourceTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture);
        const textureCreationOptions = {
            size: {
                width: Math.floor(sourceTextureDescription.size.width * this.bloom.scale),
                height: Math.floor(sourceTextureDescription.size.height * this.bloom.scale),
            },
            options: {
                createMipMaps: false,
                types: [this._defaultPipelineTextureType],
                formats: [5],
                samples: 1,
                useSRGBBuffers: [false],
                labels: [""],
            },
            sizeIsPercentage: false,
        };
        const downscaleTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._downscale.name, textureCreationOptions);
        this._downscale.sourceTexture = this.sourceTexture;
        this._downscale.sourceSamplingMode = 2;
        this._downscale.destinationTexture = downscaleTextureHandle;
        this._downscale.record(true);
        const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX.name, textureCreationOptions);
        this._blurX.sourceTexture = downscaleTextureHandle;
        this._blurX.sourceSamplingMode = 2;
        this._blurX.destinationTexture = blurXTextureHandle;
        this._blurX.record(true);
        const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY.name, textureCreationOptions);
        this._blurY.sourceTexture = blurXTextureHandle;
        this._blurY.sourceSamplingMode = 2;
        this._blurY.destinationTexture = blurYTextureHandle;
        this._blurY.record(true);
        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this._merge.name, sourceTextureCreationOptions);
        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.blurTexture = blurYTextureHandle;
        this._merge.destinationTexture = this.outputTexture;
        this._merge.record(true);
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });
    }
    dispose() {
        this._downscale.dispose();
        this._blurX.dispose();
        this._blurY.dispose();
        this._merge.dispose();
        super.dispose();
    }
}
//# sourceMappingURL=bloomTask.js.map