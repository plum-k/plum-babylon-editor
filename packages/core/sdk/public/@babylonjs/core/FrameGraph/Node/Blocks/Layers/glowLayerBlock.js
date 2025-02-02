import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphGlowLayerTask } from "../../../Tasks/Layers/glowLayerTask.js";

import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject.js";
import { NodeRenderGraphBaseObjectRendererBlock } from "../Rendering/baseObjectRendererBlock.js";
/**
 * Block that implements the glow layer
 */
export class NodeRenderGraphGlowLayerBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphGlowLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param ldrMerge Forces the merge step to be done in ldr (clamp values &gt; 1). Default: false
     * @param layerTextureRatio multiplication factor applied to the main texture size to compute the size of the layer render target texture (default: 0.5)
     * @param layerTextureFixedSize defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided (default: undefined)
     * @param layerTextureType defines the type of the layer texture (default: 0)
     */
    constructor(name, frameGraph, scene, ldrMerge = false, layerTextureRatio = 0.5, layerTextureFixedSize, layerTextureType = 0) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [ldrMerge, layerTextureRatio, layerTextureFixedSize, layerTextureType];
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("layer", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("objectRenderer", NodeRenderGraphBlockConnectionPointTypes.Object, true, new NodeRenderGraphConnectionPointCustomObject("objectRenderer", this, 0 /* NodeRenderGraphConnectionPointDirection.Input */, NodeRenderGraphBaseObjectRendererBlock, "NodeRenderGraphBaseObjectRendererBlock"));
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.layer.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.output._typeConnectionSource = this.destination;
        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, this._frameGraph, this._scene, {
            ldrMerge,
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            mainTextureType: layerTextureType,
        });
    }
    _createTask(ldrMerge, layerTextureRatio, layerTextureFixedSize, layerTextureType) {
        const blurKernelSize = this.blurKernelSize;
        const intensity = this.intensity;
        this._frameGraphTask?.dispose();
        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, this._frameGraph, this._scene, {
            ldrMerge,
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            mainTextureType: layerTextureType,
        });
        this.blurKernelSize = blurKernelSize;
        this.intensity = intensity;
        this._additionalConstructionParameters = [ldrMerge, layerTextureRatio, layerTextureFixedSize, layerTextureType];
    }
    /** Forces the merge step to be done in ldr (clamp values &gt; 1). Default: false */
    get ldrMerge() {
        return this._frameGraphTask.layer.ldrMerge;
    }
    set ldrMerge(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(value, options.mainTextureRatio, options.mainTextureFixedSize, options.mainTextureType);
    }
    /** Multiplication factor applied to the main texture size to compute the size of the layer render target texture */
    get layerTextureRatio() {
        return this._frameGraphTask.layer._options.mainTextureRatio;
    }
    set layerTextureRatio(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.ldrMerge, value, options.mainTextureFixedSize, options.mainTextureType);
    }
    /** Defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided */
    get layerTextureFixedSize() {
        return this._frameGraphTask.layer._options.mainTextureFixedSize;
    }
    set layerTextureFixedSize(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.ldrMerge, options.mainTextureRatio, value, options.mainTextureType);
    }
    /** Defines the type of the layer texture */
    get layerTextureType() {
        return this._frameGraphTask.layer._options.mainTextureType;
    }
    set layerTextureType(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.ldrMerge, options.mainTextureRatio, options.mainTextureFixedSize, value);
    }
    /** How big is the kernel of the blur texture */
    get blurKernelSize() {
        return this._frameGraphTask.layer.blurKernelSize;
    }
    set blurKernelSize(value) {
        this._frameGraphTask.layer.blurKernelSize = value;
    }
    /** The intensity of the glow */
    get intensity() {
        return this._frameGraphTask.layer.intensity;
    }
    set intensity(value) {
        this._frameGraphTask.layer.intensity = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphGlowLayerBlock";
    }
    /**
     * Gets the destination texture input component
     */
    get destination() {
        return this._inputs[0];
    }
    /**
     * Gets the layer texture input component
     */
    get layer() {
        return this._inputs[1];
    }
    /**
     * Gets the objectRenderer input component
     */
    get objectRenderer() {
        return this._inputs[2];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this.output.value = this._frameGraphTask.outputTexture;
        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value;
        this._frameGraphTask.layerTexture = this.layer.connectedPoint?.value;
        this._frameGraphTask.objectRendererTask = this.objectRenderer.connectedPoint?.value;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.blurKernelSize = ${this.blurKernelSize};`);
        codes.push(`${this._codeVariableName}.intensity = ${this.intensity};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.blurKernelSize = this.blurKernelSize;
        serializationObject.intensity = this.intensity;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.blurKernelSize = serializationObject.blurKernelSize;
        this.intensity = serializationObject.intensity;
    }
}
__decorate([
    editableInPropertyPage("LDR merge", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphGlowLayerBlock.prototype, "ldrMerge", null);
__decorate([
    editableInPropertyPage("Layer texture ratio", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphGlowLayerBlock.prototype, "layerTextureRatio", null);
__decorate([
    editableInPropertyPage("Layer texture fixed size", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphGlowLayerBlock.prototype, "layerTextureFixedSize", null);
__decorate([
    editableInPropertyPage("Layer texture type", 8 /* PropertyTypeForEdition.TextureType */, "PROPERTIES")
], NodeRenderGraphGlowLayerBlock.prototype, "layerTextureType", null);
__decorate([
    editableInPropertyPage("Blur kernel size", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES", { min: 1, max: 256 })
], NodeRenderGraphGlowLayerBlock.prototype, "blurKernelSize", null);
__decorate([
    editableInPropertyPage("Intensity", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 5 })
], NodeRenderGraphGlowLayerBlock.prototype, "intensity", null);
RegisterClass("BABYLON.NodeRenderGraphGlowLayerBlock", NodeRenderGraphGlowLayerBlock);
//# sourceMappingURL=glowLayerBlock.js.map