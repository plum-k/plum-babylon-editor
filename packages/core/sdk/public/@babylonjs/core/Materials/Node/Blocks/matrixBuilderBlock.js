import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { InputBlock } from "./Input/inputBlock.js";
import { Vector4 } from "../../../Maths/math.vector.js";
/**
 * Block used to build a matrix from 4 Vector4
 */
export class MatrixBuilderBlock extends NodeMaterialBlock {
    /**
     * Creates a new MatrixBuilder
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("row0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("row1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("row2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("row3", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MatrixBuilder";
    }
    /**
     * Gets the row0 vector
     */
    get row0() {
        return this._inputs[0];
    }
    /**
     * Gets the row1 vector
     */
    get row1() {
        return this._inputs[1];
    }
    /**
     * Gets the row2 vector
     */
    get row2() {
        return this._inputs[2];
    }
    /**
     * Gets the row3 vector
     */
    get row3() {
        return this._inputs[3];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.row0.isConnected) {
            const row0Input = new InputBlock("row0");
            row0Input.value = new Vector4(1, 0, 0, 0);
            row0Input.output.connectTo(this.row0);
        }
        if (!this.row1.isConnected) {
            const row1Input = new InputBlock("row1");
            row1Input.value = new Vector4(0, 1, 0, 0);
            row1Input.output.connectTo(this.row1);
        }
        if (!this.row2.isConnected) {
            const row2Input = new InputBlock("row2");
            row2Input.value = new Vector4(0, 0, 1, 0);
            row2Input.output.connectTo(this.row2);
        }
        if (!this.row3.isConnected) {
            const row3Input = new InputBlock("row3");
            row3Input.value = new Vector4(0, 0, 0, 1);
            row3Input.output.connectTo(this.row3);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const row0 = this.row0;
        const row1 = this.row1;
        const row2 = this.row2;
        const row3 = this.row3;
        const mat4 = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "mat4x4f" : "mat4";
        state.compilationString +=
            state._declareOutput(output) +
                ` = ${mat4}(${row0.associatedVariableName}, ${row1.associatedVariableName}, ${row2.associatedVariableName}, ${row3.associatedVariableName});\n`;
        return this;
    }
}
RegisterClass("BABYLON.MatrixBuilder", MatrixBuilderBlock);
//# sourceMappingURL=matrixBuilderBlock.js.map