import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { Matrix } from "../../../../Maths/math.vector.js";
/**
 * Block used to get a rotation matrix on Z Axis
 */
export class RotationZBlock extends NodeGeometryBlock {
    /**
     * Create a new RotationZBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "RotationZBlock";
    }
    /**
     * Gets the angle input component
     */
    get angle() {
        return this._inputs[0];
    }
    /**
     * Gets the matrix output component
     */
    get matrix() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this.matrix._storedFunction = (state) => {
            return Matrix.RotationZ(this.angle.getConnectedValue(state));
        };
    }
}
RegisterClass("BABYLON.RotationZBlock", RotationZBlock);
//# sourceMappingURL=rotationZBlock.js.map