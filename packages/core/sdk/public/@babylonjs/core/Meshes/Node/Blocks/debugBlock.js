import { Vector2ToFixed, Vector3ToFixed, Vector4ToFixed } from "../../../Maths/math.vector.functions.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Defines a block used to debug values going through it
 */
export class DebugBlock extends NodeGeometryBlock {
    /**
     * Create a new DebugBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets the log entries
         */
        this.log = [];
        this._isDebug = true;
        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
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
        return "DebugBlock";
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
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        this.log = [];
        const func = (state) => {
            const input = this.input.getConnectedValue(state);
            if (input === null || input === undefined) {
                this.log.push(["null", ""]);
                return input;
            }
            switch (this.input.type) {
                case NodeGeometryBlockConnectionPointTypes.Vector2:
                    this.log.push([Vector2ToFixed(input, 4), input.toString()]);
                    break;
                case NodeGeometryBlockConnectionPointTypes.Vector3:
                    this.log.push([Vector3ToFixed(input, 4), input.toString()]);
                    break;
                case NodeGeometryBlockConnectionPointTypes.Vector4:
                    this.log.push([Vector4ToFixed(input, 4), input.toString()]);
                    break;
                default:
                    this.log.push([input.toString(), input.toString()]);
                    break;
            }
            return input;
        };
        if (this.output.isConnected) {
            this.output._storedFunction = func;
        }
        else {
            this.output._storedValue = func(state);
        }
    }
}
RegisterClass("BABYLON.DebugBlock", DebugBlock);
//# sourceMappingURL=debugBlock.js.map