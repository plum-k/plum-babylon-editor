import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * @internal
 */
export class NodeRenderGraphBasePostProcessBlock extends NodeRenderGraphBlock {
    /**
     * Create a new NodeRenderGraphBasePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
    }
    _finalizeInputOutputRegistering() {
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };
    }
    /** Sampling mode used to sample from the source texture */
    get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }
    set sourceSamplingMode(value) {
        this._frameGraphTask.sourceSamplingMode = value;
    }
    /**
     * Gets the source input component
     */
    get source() {
        return this._inputs[0];
    }
    /**
     * Gets the destination input component
     */
    get destination() {
        return this._inputs[1];
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
        this._frameGraphTask.sourceTexture = this.source.connectedPoint?.value;
        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.sourceSamplingMode = ${this.sourceSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.sourceSamplingMode = this.sourceSamplingMode;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.sourceSamplingMode = serializationObject.sourceSamplingMode;
    }
}
__decorate([
    editableInPropertyPage("Source sampling mode", 6 /* PropertyTypeForEdition.SamplingMode */, "PROPERTIES")
], NodeRenderGraphBasePostProcessBlock.prototype, "sourceSamplingMode", null);
//# sourceMappingURL=basePostProcessBlock.js.map