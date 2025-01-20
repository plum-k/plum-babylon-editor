import { Vector3 } from "../../../Maths/math.vector.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to desaturate a color
 */
export class GeometryDesaturateBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryDesaturateBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("color", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerInput("level", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Vector3);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryDesaturateBlock";
    }
    /**
     * Gets the color operand input component
     */
    get color() {
        return this._inputs[0];
    }
    /**
     * Gets the level operand input component
     */
    get level() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.color.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        this.output._storedFunction = (state) => {
            const color = this.color.getConnectedValue(state);
            const level = this.level.getConnectedValue(state);
            const tempMin = Math.min(color.x, color.y, color.z);
            const tempMax = Math.max(color.x, color.y, color.z);
            const tempMerge = 0.5 * (tempMin + tempMax);
            return new Vector3(color.x * (1 - level) + tempMerge * level, color.y * (1 - level) + tempMerge * level, color.z * (1 - level) + tempMerge * level);
        };
        return this;
    }
}
RegisterClass("BABYLON.GeometryDesaturateBlock", GeometryDesaturateBlock);
//# sourceMappingURL=geometryDesaturateBlock.js.map