import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { Matrix, Vector3 } from "../../../../Maths/math.vector.js";
/**
 * Block used to get a scaling matrix
 */
export class ScalingBlock extends NodeGeometryBlock {
    /**
     * Create a new ScalingBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("scale", NodeGeometryBlockConnectionPointTypes.Vector3, false, Vector3.One());
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ScalingBlock";
    }
    /**
     * Gets the scale input component
     */
    get scale() {
        return this._inputs[0];
    }
    /**
     * Gets the matrix output component
     */
    get matrix() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.scale.isConnected) {
            const scaleInput = new GeometryInputBlock("Scale");
            scaleInput.value = new Vector3(1, 1, 1);
            scaleInput.output.connectTo(this.scale);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this.matrix._storedFunction = (state) => {
            const value = this.scale.getConnectedValue(state);
            return Matrix.Scaling(value.x, value.y, value.z);
        };
    }
}
RegisterClass("BABYLON.ScalingBlock", ScalingBlock);
//# sourceMappingURL=scalingBlock.js.map