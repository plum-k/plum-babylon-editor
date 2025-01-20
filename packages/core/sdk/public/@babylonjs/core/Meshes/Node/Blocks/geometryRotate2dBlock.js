import { Vector2 } from "../../../Maths/math.vector.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to rotate a 2d vector by a given angle
 */
export class GeometryRotate2dBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryRotate2dBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Vector2);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryRotate2dBlock";
    }
    /**
     * Gets the input vector
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the input angle
     */
    get angle() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        this.output._storedFunction = (state) => {
            const input = this.input.getConnectedValue(state);
            const angle = this.angle.getConnectedValue(state);
            return new Vector2(Math.cos(angle) * input.x - Math.sin(angle) * input.y, Math.sin(angle) * input.x + Math.cos(angle) * input.y);
        };
        return this;
    }
}
RegisterClass("BABYLON.GeometryRotate2dBlock", GeometryRotate2dBlock);
//# sourceMappingURL=geometryRotate2dBlock.js.map