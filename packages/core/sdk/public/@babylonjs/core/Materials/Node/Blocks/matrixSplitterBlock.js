import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block used to split a matrix into Vector4
 */
export class MatrixSplitterBlock extends NodeMaterialBlock {
    /**
     * Creates a new MatrixSplitterBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("row0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("row1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("row2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("row3", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col3", NodeMaterialBlockConnectionPointTypes.Vector4);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MatrixSplitterBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the row0 output vector
     */
    get row0() {
        return this._outputs[0];
    }
    /**
     * Gets the row1 output vector
     */
    get row1() {
        return this._outputs[1];
    }
    /**
     * Gets the row2 output vector
     */
    get row2() {
        return this._outputs[2];
    }
    /**
     * Gets the row3 output vector
     */
    get row3() {
        return this._outputs[3];
    }
    /**
     * Gets the col0 output vector
     */
    get col0() {
        return this._outputs[4];
    }
    /**
     * Gets the col1 output vector
     */
    get col1() {
        return this._outputs[5];
    }
    /**
     * Gets the col2 output vector
     */
    get col2() {
        return this._outputs[6];
    }
    /**
     * Gets the col3 output vector
     */
    get col3() {
        return this._outputs[7];
    }
    _exportColumn(state, col, input, columnIndex) {
        const vec4 = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "vec4f" : "vec4";
        state.compilationString +=
            state._declareOutput(col) + ` = ${vec4}(${input}[0][${columnIndex}], ${input}[1][${columnIndex}], ${input}[2][${columnIndex}], ${input}[3][${columnIndex}]);\n`;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const input = this._inputs[0].associatedVariableName;
        const row0 = this.row0;
        const row1 = this.row1;
        const row2 = this.row2;
        const row3 = this.row3;
        const col0 = this.col0;
        const col1 = this.col1;
        const col2 = this.col2;
        const col3 = this.col3;
        if (row0.hasEndpoints) {
            state.compilationString += state._declareOutput(row0) + ` = ${input}[0];\n`;
        }
        if (row1.hasEndpoints) {
            state.compilationString += state._declareOutput(row1) + ` = ${input}[1];\n`;
        }
        if (row2.hasEndpoints) {
            state.compilationString += state._declareOutput(row2) + ` = ${input}[2];\n`;
        }
        if (row3.hasEndpoints) {
            state.compilationString += state._declareOutput(row3) + ` = ${input}[3];\n`;
        }
        if (col0.hasEndpoints) {
            this._exportColumn(state, col0, input, 0);
        }
        if (col1.hasEndpoints) {
            this._exportColumn(state, col1, input, 1);
        }
        if (col2.hasEndpoints) {
            this._exportColumn(state, col2, input, 2);
        }
        if (col3.hasEndpoints) {
            this._exportColumn(state, col3, input, 3);
        }
        return this;
    }
}
RegisterClass("BABYLON.MatrixSplitterBlock", MatrixSplitterBlock);
//# sourceMappingURL=matrixSplitterBlock.js.map