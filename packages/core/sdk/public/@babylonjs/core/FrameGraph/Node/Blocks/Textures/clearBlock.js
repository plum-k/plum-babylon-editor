import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { Color4 } from "../../../../Maths/math.color.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphClearTextureTask } from "../../../Tasks/Texture/clearTextureTask.js";
/**
 * Block used to clear a texture
 */
export class NodeRenderGraphClearBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphClearBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment, true);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.depth.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        this.output._typeConnectionSource = this.texture;
        this.outputDepth._typeConnectionSource = this.depth;
        this._frameGraphTask = new FrameGraphClearTextureTask(name, frameGraph);
    }
    /** Gets or sets the clear color */
    get color() {
        return this._frameGraphTask.color;
    }
    set color(value) {
        this._frameGraphTask.color = value;
    }
    /** Gets or sets a boolean indicating whether the color part of the texture should be cleared. */
    get clearColor() {
        return !!this._frameGraphTask.clearColor;
    }
    set clearColor(value) {
        this._frameGraphTask.clearColor = value;
    }
    /** Gets or sets a boolean indicating whether the depth part of the texture should be cleared. */
    get clearDepth() {
        return !!this._frameGraphTask.clearDepth;
    }
    set clearDepth(value) {
        this._frameGraphTask.clearDepth = value;
    }
    /** Gets or sets a boolean indicating whether the stencil part of the texture should be cleared. */
    get clearStencil() {
        return !!this._frameGraphTask.clearStencil;
    }
    set clearStencil(value) {
        this._frameGraphTask.clearStencil = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphClearBlock";
    }
    /**
     * Gets the texture input component
     */
    get texture() {
        return this._inputs[0];
    }
    /**
     * Gets the depth texture input component
     */
    get depth() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    /**
     * Gets the output depth component
     */
    get outputDepth() {
        return this._outputs[1];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this._propagateInputValueToOutput(this.texture, this.output);
        this._propagateInputValueToOutput(this.depth, this.outputDepth);
        this._frameGraphTask.destinationTexture = this.texture.connectedPoint?.value;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.color = new BABYLON.Color4(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a});`);
        codes.push(`${this._codeVariableName}.clearColor = ${this.clearColor};`);
        codes.push(`${this._codeVariableName}.clearDepth = ${this.clearDepth};`);
        codes.push(`${this._codeVariableName}.clearStencil = ${this.clearStencil};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.color = this.color.asArray();
        serializationObject.clearColor = this.clearColor;
        serializationObject.clearDepth = this.clearDepth;
        serializationObject.clearStencil = this.clearStencil;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.color = Color4.FromArray(serializationObject.color);
        this.clearColor = serializationObject.clearColor;
        this.clearDepth = serializationObject.clearDepth;
        this.clearStencil = serializationObject.clearStencil;
    }
}
__decorate([
    editableInPropertyPage("Color", 5 /* PropertyTypeForEdition.Color4 */)
], NodeRenderGraphClearBlock.prototype, "color", null);
__decorate([
    editableInPropertyPage("Clear color", 0 /* PropertyTypeForEdition.Boolean */, undefined, { embedded: true })
], NodeRenderGraphClearBlock.prototype, "clearColor", null);
__decorate([
    editableInPropertyPage("Clear depth", 0 /* PropertyTypeForEdition.Boolean */, undefined, { embedded: true })
], NodeRenderGraphClearBlock.prototype, "clearDepth", null);
__decorate([
    editableInPropertyPage("Clear stencil", 0 /* PropertyTypeForEdition.Boolean */, undefined, { embedded: true })
], NodeRenderGraphClearBlock.prototype, "clearStencil", null);
RegisterClass("BABYLON.NodeRenderGraphClearBlock", NodeRenderGraphClearBlock);
//# sourceMappingURL=clearBlock.js.map