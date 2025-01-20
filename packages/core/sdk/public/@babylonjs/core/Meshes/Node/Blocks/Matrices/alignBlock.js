import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { Matrix, Vector3 } from "../../../../Maths/math.vector.js";
/**
 * Block used to get a align matrix
 */
export class AlignBlock extends NodeGeometryBlock {
    /**
     * Create a new AlignBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("source", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Up());
        this.registerInput("target", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Left());
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "AlignBlock";
    }
    /**
     * Gets the source input component
     */
    get source() {
        return this._inputs[0];
    }
    /**
     * Gets the target input component
     */
    get target() {
        return this._inputs[1];
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
            const source = this.source.getConnectedValue(state).clone();
            const target = this.target.getConnectedValue(state).clone();
            const result = new Matrix();
            source.normalize();
            target.normalize();
            Matrix.RotationAlignToRef(source, target, result, true);
            return result;
        };
    }
}
RegisterClass("BABYLON.AlignBlock", AlignBlock);
//# sourceMappingURL=alignBlock.js.map