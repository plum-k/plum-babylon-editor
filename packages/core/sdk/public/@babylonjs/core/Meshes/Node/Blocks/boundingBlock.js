import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { extractMinAndMax } from "../../../Maths/math.functions.js";
/**
 * Block used to get the bounding info of a geometry
 */
export class BoundingBlock extends NodeGeometryBlock {
    /**
     * Create a new BoundingBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("min", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerOutput("max", NodeGeometryBlockConnectionPointTypes.Vector3);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "BoundingBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the min output component
     */
    get min() {
        return this._outputs[0];
    }
    /**
     * Gets the max output component
     */
    get max() {
        return this._outputs[1];
    }
    _buildBlock() {
        this.min._storedFunction = (state) => {
            const geometry = this.geometry.getConnectedValue(state);
            if (!geometry) {
                return null;
            }
            const boundingInfo = extractMinAndMax(geometry.positions, 0, geometry.positions.length / 3);
            return boundingInfo.minimum;
        };
        this.max._storedFunction = (state) => {
            const geometry = this.geometry.getConnectedValue(state);
            if (!geometry) {
                return null;
            }
            const boundingInfo = extractMinAndMax(geometry.positions, 0, geometry.positions.length / 3);
            return boundingInfo.maximum;
        };
    }
}
RegisterClass("BABYLON.BoundingBlock", BoundingBlock);
//# sourceMappingURL=boundingBlock.js.map