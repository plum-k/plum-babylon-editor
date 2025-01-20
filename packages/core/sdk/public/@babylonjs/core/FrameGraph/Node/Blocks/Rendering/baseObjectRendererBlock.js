import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint.js";
/**
 * @internal
 */
export class NodeRenderGraphBaseObjectRendererBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphBaseObjectRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();
        this.registerInput("shadowGenerators", NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator, true);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.depth.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        this.shadowGenerators.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.ResourceContainer);
        this.output._typeConnectionSource = this.destination;
        this.outputDepth._typeConnectionSource = this.depth;
    }
    /** Indicates if depth testing must be enabled or disabled */
    get depthTest() {
        return this._frameGraphTask.depthTest;
    }
    set depthTest(value) {
        this._frameGraphTask.depthTest = value;
    }
    /** Indicates if depth writing must be enabled or disabled */
    get depthWrite() {
        return this._frameGraphTask.depthWrite;
    }
    set depthWrite(value) {
        this._frameGraphTask.depthWrite = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphBaseObjectRendererBlock";
    }
    /**
     * Gets the destination texture input component
     */
    get destination() {
        return this._inputs[0];
    }
    /**
     * Gets the depth texture input component
     */
    get depth() {
        return this._inputs[1];
    }
    /**
     * Gets the camera input component
     */
    get camera() {
        return this._inputs[2];
    }
    /**
     * Gets the objects input component
     */
    get objects() {
        return this._inputs[3];
    }
    /**
     * Gets the dependencies input component
     */
    get dependencies() {
        return this._inputs[4];
    }
    /**
     * Gets the shadowGenerators input component
     */
    get shadowGenerators() {
        return this._inputs[5];
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
        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task
        this.outputDepth.value = this._frameGraphTask.outputDepthTexture; // the value of the outputDepth connection point is the "outputDepth" texture of the task
        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value;
        this._frameGraphTask.shadowGenerators = [];
        const shadowGeneratorsConnectedPoint = this.shadowGenerators.connectedPoint;
        if (shadowGeneratorsConnectedPoint) {
            if (shadowGeneratorsConnectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.ResourceContainer) {
                const container = shadowGeneratorsConnectedPoint.ownerBlock;
                container.inputs.forEach((input) => {
                    if (input.connectedPoint && input.connectedPoint.value !== undefined && NodeRenderGraphConnectionPoint.IsShadowGenerator(input.connectedPoint.value)) {
                        this._frameGraphTask.shadowGenerators.push(input.connectedPoint.value);
                    }
                });
            }
            else if (NodeRenderGraphConnectionPoint.IsShadowGenerator(shadowGeneratorsConnectedPoint.value)) {
                this._frameGraphTask.shadowGenerators[0] = shadowGeneratorsConnectedPoint.value;
            }
        }
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
    }
}
__decorate([
    editableInPropertyPage("Depth test", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseObjectRendererBlock.prototype, "depthTest", null);
__decorate([
    editableInPropertyPage("Depth write", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseObjectRendererBlock.prototype, "depthWrite", null);
//# sourceMappingURL=baseObjectRendererBlock.js.map