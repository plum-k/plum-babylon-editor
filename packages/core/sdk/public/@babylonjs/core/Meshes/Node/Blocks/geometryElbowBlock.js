import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used as a pass through
 */
export class GeometryElbowBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryElbowBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the time spent to build this block (in ms)
     */
    get buildExecutionTime() {
        return -1;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryElbowBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const input = this._inputs[0];
        output._storedFunction = (state) => {
            return input.getConnectedValue(state);
        };
    }
}
RegisterClass("BABYLON.GeometryElbowBlock", GeometryElbowBlock);
//# sourceMappingURL=geometryElbowBlock.js.map