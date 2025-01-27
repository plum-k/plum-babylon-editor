import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphHighlightLayerTask } from "../../../Tasks/Layers/highlightLayerTask.js";

import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject.js";
import { NodeRenderGraphBaseObjectRendererBlock } from "../Rendering/baseObjectRendererBlock.js";
/**
 * Block that implements the highlight layer
 */
export class NodeRenderGraphHighlightLayerBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphHighlightLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param layerTextureRatio multiplication factor applied to the main texture size to compute the size of the layer render target texture (default: 0.5)
     * @param layerTextureFixedSize defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided (default: undefined)
     * @param blurTextureSizeRatio defines the factor to apply to the layer texture size to create the blur textures (default: 0.5)
     * @param isStroke should we display highlight as a solid stroke? (default: false)
     * @param layerTextureType defines the type of the layer texture (default: 0)
     */
    constructor(name, frameGraph, scene, layerTextureRatio = 0.5, layerTextureFixedSize, blurTextureSizeRatio = 0.5, isStroke = false, layerTextureType = 0) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [layerTextureRatio, layerTextureFixedSize, blurTextureSizeRatio, isStroke, layerTextureType];
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("layer", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("objectRenderer", NodeRenderGraphBlockConnectionPointTypes.Object, true, new NodeRenderGraphConnectionPointCustomObject("objectRenderer", this, 0 /* NodeRenderGraphConnectionPointDirection.Input */, NodeRenderGraphBaseObjectRendererBlock, "NodeRenderGraphBaseObjectRendererBlock"));
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.layer.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.output._typeConnectionSource = this.destination;
        this._frameGraphTask = new FrameGraphHighlightLayerTask(this.name, this._frameGraph, this._scene, {
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            blurTextureSizeRatio,
            isStroke,
            mainTextureType: layerTextureType,
        });
    }
    _createTask(layerTextureRatio, layerTextureFixedSize, blurTextureSizeRatio, isStroke, layerTextureType) {
        const blurHorizontalSize = this.blurHorizontalSize;
        const blurVerticalSize = this.blurVerticalSize;
        this._frameGraphTask?.dispose();
        this._frameGraphTask = new FrameGraphHighlightLayerTask(this.name, this._frameGraph, this._scene, {
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            blurTextureSizeRatio,
            isStroke,
            mainTextureType: layerTextureType,
        });
        this.blurHorizontalSize = blurHorizontalSize;
        this.blurVerticalSize = blurVerticalSize;
        this._additionalConstructionParameters = [layerTextureRatio, layerTextureFixedSize, blurTextureSizeRatio, isStroke, layerTextureType];
    }
    /** Multiplication factor applied to the main texture size to compute the size of the layer render target texture */
    get layerTextureRatio() {
        return this._frameGraphTask.layer._options.mainTextureRatio;
    }
    set layerTextureRatio(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(value, options.mainTextureFixedSize, options.blurTextureSizeRatio, options.isStroke, options.mainTextureType);
    }
    /** Defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided */
    get layerTextureFixedSize() {
        return this._frameGraphTask.layer._options.mainTextureFixedSize;
    }
    set layerTextureFixedSize(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.mainTextureRatio, value, options.blurTextureSizeRatio, options.isStroke, options.mainTextureType);
    }
    /** Defines the factor to apply to the layer texture size to create the blur textures */
    get blurTextureSizeRatio() {
        return this._frameGraphTask.layer._options.blurTextureSizeRatio;
    }
    set blurTextureSizeRatio(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, value, options.isStroke, options.mainTextureType);
    }
    /** Should we display highlight as a solid stroke? */
    get isStroke() {
        return this._frameGraphTask.layer._options.isStroke;
    }
    set isStroke(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, options.blurTextureSizeRatio, value, options.mainTextureType);
    }
    /** Defines the type of the layer texture */
    get layerTextureType() {
        return this._frameGraphTask.layer._options.mainTextureType;
    }
    set layerTextureType(value) {
        const options = this._frameGraphTask.layer._options;
        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, options.blurTextureSizeRatio, options.isStroke, value);
    }
    /** How big is the horizontal kernel of the blur texture */
    get blurHorizontalSize() {
        return this._frameGraphTask.layer.blurHorizontalSize;
    }
    set blurHorizontalSize(value) {
        this._frameGraphTask.layer.blurHorizontalSize = value;
    }
    /** How big is the vertical kernel of the blur texture */
    get blurVerticalSize() {
        return this._frameGraphTask.layer.blurVerticalSize;
    }
    set blurVerticalSize(value) {
        this._frameGraphTask.layer.blurVerticalSize = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphHighlightLayerBlock";
    }
    /**
     * Gets the destination texture input component
     */
    get destination() {
        return this._inputs[0];
    }
    /**
     * Gets the layer input component
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
        codes.push(`${this._codeVariableName}.blurHorizontalSize = ${this.blurHorizontalSize};`);
        codes.push(`${this._codeVariableName}.blurVerticalSize = ${this.blurVerticalSize};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.blurHorizontalSize = this.blurHorizontalSize;
        serializationObject.blurVerticalSize = this.blurVerticalSize;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.blurHorizontalSize = serializationObject.blurHorizontalSize;
        this.blurVerticalSize = serializationObject.blurVerticalSize;
    }
}
__decorate([
    editableInPropertyPage("Layer texture ratio", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphHighlightLayerBlock.prototype, "layerTextureRatio", null);
__decorate([
    editableInPropertyPage("Layer texture fixed size", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphHighlightLayerBlock.prototype, "layerTextureFixedSize", null);
__decorate([
    editableInPropertyPage("Blur texture size ratio", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphHighlightLayerBlock.prototype, "blurTextureSizeRatio", null);
__decorate([
    editableInPropertyPage("Is stroke", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphHighlightLayerBlock.prototype, "isStroke", null);
__decorate([
    editableInPropertyPage("Layer texture type", 8 /* PropertyTypeForEdition.TextureType */, "PROPERTIES")
], NodeRenderGraphHighlightLayerBlock.prototype, "layerTextureType", null);
__decorate([
    editableInPropertyPage("Blur horizontal size", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 4 })
], NodeRenderGraphHighlightLayerBlock.prototype, "blurHorizontalSize", null);
__decorate([
    editableInPropertyPage("Blur vertical size", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 4 })
], NodeRenderGraphHighlightLayerBlock.prototype, "blurVerticalSize", null);
RegisterClass("BABYLON.NodeRenderGraphHighlightLayerBlock", NodeRenderGraphHighlightLayerBlock);
//# sourceMappingURL=highlightLayerBlock.js.map