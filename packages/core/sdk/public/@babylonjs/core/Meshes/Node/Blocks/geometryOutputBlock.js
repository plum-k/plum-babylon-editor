import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
/**
 * Block used to generate the final geometry
 */
export class GeometryOutputBlock extends NodeGeometryBlock {
    /**
     * Gets the current vertex data if the graph was successfully built
     */
    get currentVertexData() {
        return this._vertexData;
    }
    /**
     * Create a new GeometryOutputBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this._vertexData = null;
        this._isUnique = true;
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryOutputBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    _buildBlock(state) {
        state.vertexData = this.geometry.getConnectedValue(state);
        this._vertexData = state.vertexData;
    }
}
RegisterClass("BABYLON.GeometryOutputBlock", GeometryOutputBlock);
//# sourceMappingURL=geometryOutputBlock.js.map