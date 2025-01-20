import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Defines a block used to generate a null geometry data
 */
export class NullBlock extends NodeGeometryBlock {
    /**
     * Create a new NullBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("vector", NodeGeometryBlockConnectionPointTypes.Vector3);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NullBlock";
    }
    /**
     * Gets the geometry output component
     */
    get geometry() {
        return this._outputs[0];
    }
    /**
     * Gets the vector output component
     */
    get vector() {
        return this._outputs[1];
    }
    _buildBlock() {
        this.geometry._storedValue = null;
        this.vector._storedValue = null;
    }
}
RegisterClass("BABYLON.NullBlock", NullBlock);
//# sourceMappingURL=nullBlock.js.map