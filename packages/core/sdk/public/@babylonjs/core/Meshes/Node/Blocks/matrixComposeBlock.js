import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
/**
 * Block used to compose two matrices
 */
export class MatrixComposeBlock extends NodeGeometryBlock {
    /**
     * Create a new MatrixComposeBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("matrix0", NodeGeometryBlockConnectionPointTypes.Matrix);
        this.registerInput("matrix1", NodeGeometryBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MatrixComposeBlock";
    }
    /**
     * Gets the matrix0 input component
     */
    get matrix0() {
        return this._inputs[0];
    }
    /**
     * Gets the matrix1 input component
     */
    get matrix1() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        this.output._storedFunction = (state) => {
            if (!this.matrix0.isConnected || !this.matrix1.isConnected) {
                return null;
            }
            const matrix0 = this.matrix0.getConnectedValue(state);
            const matrix1 = this.matrix1.getConnectedValue(state);
            if (!matrix0 || !matrix1) {
                return null;
            }
            return matrix0.multiply(matrix1);
        };
    }
}
RegisterClass("BABYLON.MatrixComposeBlock", MatrixComposeBlock);
//# sourceMappingURL=matrixComposeBlock.js.map