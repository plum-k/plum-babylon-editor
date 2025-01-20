import { VertexData } from "../../mesh.vertexData.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to recompute normals for a geometry
 */
export class ComputeNormalsBlock extends NodeGeometryBlock {
    /**
     * Creates a new ComputeNormalsBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ComputeNormalsBlock";
    }
    /**
     * Gets the geometry component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        this.output._storedFunction = (state) => {
            if (!this.geometry.isConnected) {
                return null;
            }
            const vertexData = this.geometry.getConnectedValue(state);
            if (!vertexData.normals) {
                vertexData.normals = [];
            }
            VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);
            return vertexData;
        };
    }
}
RegisterClass("BABYLON.ComputeNormalsBlock", ComputeNormalsBlock);
//# sourceMappingURL=computeNormalsBlock.js.map