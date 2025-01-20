import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Defines a block used to convert from int to float
 */
export class IntFloatConverterBlock extends NodeGeometryBlock {
    /**
     * Create a new IntFloatConverterBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("float ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("int ", NodeGeometryBlockConnectionPointTypes.Int, true);
        this.registerOutput("float", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("int", NodeGeometryBlockConnectionPointTypes.Int);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "IntFloatConverterBlock";
    }
    /**
     * Gets the float input component
     */
    get floatIn() {
        return this._inputs[0];
    }
    /**
     * Gets the int input component
     */
    get intIn() {
        return this._inputs[1];
    }
    /**
     * Gets the float output component
     */
    get floatOut() {
        return this._outputs[0];
    }
    /**
     * Gets the int output component
     */
    get intOut() {
        return this._outputs[1];
    }
    _inputRename(name) {
        if (name === "float ") {
            return "floatIn";
        }
        if (name === "int ") {
            return "intIn";
        }
        return name;
    }
    _buildBlock() {
        this.floatOut._storedFunction = (state) => {
            if (this.floatIn.isConnected) {
                return this.floatIn.getConnectedValue(state);
            }
            if (this.intIn.isConnected) {
                return this.intIn.getConnectedValue(state);
            }
            return 0;
        };
        this.intOut._storedFunction = (state) => {
            if (this.floatIn.isConnected) {
                return Math.floor(this.floatIn.getConnectedValue(state));
            }
            if (this.intIn.isConnected) {
                return Math.floor(this.intIn.getConnectedValue(state));
            }
            return 0;
        };
    }
}
RegisterClass("BABYLON.IntFloatConverterBlock", IntFloatConverterBlock);
//# sourceMappingURL=intFloatConverterBlock.js.map