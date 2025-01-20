
import { FrameGraphTask } from "../../frameGraphTask.js";
import { FrameGraphDepthOfFieldMergeTask } from "./depthOfFieldMergeTask.js";
import { FrameGraphCircleOfConfusionTask } from "./circleOfConfusionTask.js";
import { FrameGraphDepthOfFieldBlurTask } from "./depthOfFieldBlurTask.js";
import { ThinDepthOfFieldEffect } from "../../../PostProcesses/thinDepthOfFieldEffect.js";
/**
 * Task which applies a depth of field effect.
 */
export class FrameGraphDepthOfFieldTask extends FrameGraphTask {
    /**
     * The name of the task.
     */
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
        if (this._circleOfConfusion) {
            this._circleOfConfusion.name = `${name} Circle of Confusion`;
        }
        if (this._blurX) {
            for (let i = 0; i < this._blurX.length; i++) {
                this._blurX[i].name = `${name} Blur X${i}`;
                this._blurY[i].name = `${name} Blur Y${i}`;
            }
        }
        if (this._merge) {
            this._merge.name = `${name} Merge`;
        }
    }
    /**
     * Constructs a depth of field task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param engine The engine to use for the depth of field effect.
     * @param blurLevel The blur level of the depth of field effect (default: ThinDepthOfFieldEffectBlurLevel.Low).
     * @param hdr Whether the depth of field effect is HDR.
     */
    constructor(name, frameGraph, engine, blurLevel = 0 /* ThinDepthOfFieldEffectBlurLevel.Low */, hdr = false) {
        super(name, frameGraph);
        /**
         * The sampling mode to use for the source texture.
         */
        this.sourceSamplingMode = 2;
        /**
         * The sampling mode to use for the depth texture.
         */
        this.depthSamplingMode = 2;
        this._blurX = [];
        this._blurY = [];
        this._engine = engine;
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
        this.depthOfField = new ThinDepthOfFieldEffect(name, engine, blurLevel, true);
        this._circleOfConfusion = new FrameGraphCircleOfConfusionTask(`${name} Circle of Confusion`, this._frameGraph, this.depthOfField._circleOfConfusion);
        const blurCount = this.depthOfField._depthOfFieldBlurX.length;
        for (let i = 0; i < blurCount; i++) {
            this._blurX.push(new FrameGraphDepthOfFieldBlurTask(`${name} Blur X${i}`, this._frameGraph, this.depthOfField._depthOfFieldBlurX[i][0]));
            this._blurY.push(new FrameGraphDepthOfFieldBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.depthOfField._depthOfFieldBlurY[i][0]));
        }
        this._merge = new FrameGraphDepthOfFieldMergeTask(`${name} Merge`, this._frameGraph, this.depthOfField._dofMerge);
        this.onTexturesAllocatedObservable.add((context) => {
            this._circleOfConfusion.onTexturesAllocatedObservable.notifyObservers(context);
            for (let i = 0; i < blurCount; i++) {
                this._blurX[i].onTexturesAllocatedObservable.notifyObservers(context);
                this._blurY[i].onTexturesAllocatedObservable.notifyObservers(context);
            }
            this._merge.onTexturesAllocatedObservable.notifyObservers(context);
        });
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    isReady() {
        return this.depthOfField.isReady();
    }
    record() {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error("FrameGraphDepthOfFieldTask: sourceTexture, depthTexture and camera are required");
        }
        const sourceTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture);
        const textureSize = {
            width: sourceTextureDescription.size.width,
            height: sourceTextureDescription.size.height,
        };
        const circleOfConfusionTextureFormat = this._engine.isWebGPU || this._engine.version > 1 ? 6 : 5;
        const textureCreationOptions = {
            size: textureSize,
            options: {
                createMipMaps: false,
                types: [this._defaultPipelineTextureType],
                formats: [circleOfConfusionTextureFormat],
                samples: 1,
                useSRGBBuffers: [false],
                labels: [""],
            },
            sizeIsPercentage: false,
        };
        const circleOfConfusionTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._circleOfConfusion.name, textureCreationOptions);
        this._circleOfConfusion.sourceTexture = this.sourceTexture; // texture not used by the CoC shader
        this._circleOfConfusion.depthTexture = this.depthTexture;
        this._circleOfConfusion.depthSamplingMode = this.depthSamplingMode;
        this._circleOfConfusion.camera = this.camera;
        this._circleOfConfusion.destinationTexture = circleOfConfusionTextureHandle;
        this._circleOfConfusion.record(true);
        textureCreationOptions.options.formats = [5];
        const blurSteps = [];
        for (let i = 0; i < this._blurX.length; i++) {
            const ratio = this.depthOfField._depthOfFieldBlurX[i][1];
            textureSize.width = Math.floor(sourceTextureDescription.size.width * ratio);
            textureSize.height = Math.floor(sourceTextureDescription.size.height * ratio);
            textureCreationOptions.options.labels[0] = "step " + (i + 1);
            const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);
            this._blurY[i].sourceTexture = i === 0 ? this.sourceTexture : this._blurX[i - 1].outputTexture;
            this._blurY[i].sourceSamplingMode = 2;
            this._blurY[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurY[i].destinationTexture = blurYTextureHandle;
            this._blurY[i].record(true);
            const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);
            this._blurX[i].sourceTexture = this._blurY[i].outputTexture;
            this._blurX[i].sourceSamplingMode = 2;
            this._blurX[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurX[i].destinationTexture = blurXTextureHandle;
            this._blurX[i].record(true);
            blurSteps.push(blurXTextureHandle);
        }
        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this._merge.name, sourceTextureCreationOptions);
        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.circleOfConfusionTexture = circleOfConfusionTextureHandle;
        this._merge.blurSteps = blurSteps;
        this._merge.destinationTexture = this.outputTexture;
        this._merge.record(true);
        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });
    }
    dispose() {
        this._circleOfConfusion.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        this._merge.dispose();
        super.dispose();
    }
}
//# sourceMappingURL=depthOfFieldTask.js.map