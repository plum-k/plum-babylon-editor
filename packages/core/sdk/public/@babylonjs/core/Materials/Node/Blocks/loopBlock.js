import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
import { NodeMaterialConnectionPointCustomObject } from "../nodeMaterialConnectionPointCustomObject.js";
/**
 * Block used to repeat code
 */
export class LoopBlock extends NodeMaterialBlock {
    /**
     * Creates a new LoopBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets number of iterations
         * Will be ignored if the iterations input is connected
         */
        this.iterations = 4;
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("iterations", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("index", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("loopID", NodeMaterialBlockConnectionPointTypes.Object, undefined, new NodeMaterialConnectionPointCustomObject("loopID", this, 1 /* NodeMaterialConnectionPointDirection.Output */, LoopBlock, "LoopBlock"));
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[0]._forPostBuild = true;
        this._outputs[2]._redirectedSource = this._inputs[0];
        this._outputs[1]._preventBubbleUp = true;
        this._outputs[2]._preventBubbleUp = true;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "LoopBlock";
    }
    /**
     * Gets the main input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the iterations input component
     */
    get iterationsInput() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    /**
     * Gets the index component which will be incremented at each iteration
     */
    get index() {
        return this._outputs[1];
    }
    /**
     * Gets the loop ID component
     */
    get loopID() {
        return this._outputs[2];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const index = this._outputs[1];
        const indexName = state._getFreeVariableName("index");
        const decl = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "var" : "int";
        const castFloat = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "f32" : "float";
        const castInt = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "i32" : "int";
        // Declare storage variable and store initial value
        state.compilationString += state._declareOutput(output) + ` = ${this.input.associatedVariableName};\n`;
        // Iterations
        const iterations = this.iterationsInput.isConnected ? `${castInt}(${this.iterationsInput.associatedVariableName})` : this.iterations;
        // Loop
        state.compilationString += `for (${decl} ${indexName} = 0; ${indexName} < ${iterations}; ${indexName}++){\n`;
        state.compilationString += `${state._declareOutput(index)} = ${castFloat}(${indexName});\n`;
        return this;
    }
    _postBuildBlock(state) {
        super._postBuildBlock(state);
        state.compilationString += `}\n`;
        return this;
    }
    _dumpPropertiesCode() {
        return super._dumpPropertiesCode() + `${this._codeVariableName}.iterations = ${this.iterations};\n`;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.iterations = this.iterations;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.iterations = serializationObject.iterations;
    }
}
__decorate([
    editableInPropertyPage("Iterations", 2 /* PropertyTypeForEdition.Int */, undefined, { embedded: true })
], LoopBlock.prototype, "iterations", void 0);
RegisterClass("BABYLON.LoopBlock", LoopBlock);
//# sourceMappingURL=loopBlock.js.map