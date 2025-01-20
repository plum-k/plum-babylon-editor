import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Defines a block used to move a value from a range to another
 */
export class MapRangeBlock extends NodeGeometryBlock {
    /**
     * Create a new MapRangeBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("fromMin", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("fromMax", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("toMin", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("toMax", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Vector2);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Vector3);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Vector4);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MapRangeBlock";
    }
    /**
     * Gets the value input component
     */
    get value() {
        return this._inputs[0];
    }
    /**
     * Gets the fromMin input component
     */
    get fromMin() {
        return this._inputs[1];
    }
    /**
     * Gets the fromMax input component
     */
    get fromMax() {
        return this._inputs[2];
    }
    /**
     * Gets the toMin input component
     */
    get toMin() {
        return this._inputs[3];
    }
    /**
     * Gets the toMax input component
     */
    get toMax() {
        return this._inputs[4];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        this.output._storedFunction = (state) => {
            const value = this.value.getConnectedValue(state);
            const fromMin = this.fromMin.getConnectedValue(state);
            const fromMax = this.fromMax.getConnectedValue(state);
            const toMin = this.toMin.getConnectedValue(state);
            const toMax = this.toMax.getConnectedValue(state);
            const result = ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
            if (this.output.type === NodeGeometryBlockConnectionPointTypes.Int) {
                return Math.floor(result);
            }
            return result;
        };
    }
}
RegisterClass("BABYLON.MapRangeBlock", MapRangeBlock);
//# sourceMappingURL=mapRangeBlock.js.map