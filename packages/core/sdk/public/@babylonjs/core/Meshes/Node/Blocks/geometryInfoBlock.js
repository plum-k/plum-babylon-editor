import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
/**
 * Block used to get information about a geometry
 */
export class GeometryInfoBlock extends NodeGeometryBlock {
    /**
     * Create a new GeometryInfoBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("id", NodeGeometryBlockConnectionPointTypes.Int);
        this.registerOutput("collectionId", NodeGeometryBlockConnectionPointTypes.Int);
        this.registerOutput("verticesCount", NodeGeometryBlockConnectionPointTypes.Int);
        this.registerOutput("facesCount", NodeGeometryBlockConnectionPointTypes.Int);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryInfoBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    /**
     * Gets the id output component
     */
    get id() {
        return this._outputs[1];
    }
    /**
     * Gets the collectionId output component
     */
    get collectionId() {
        return this._outputs[2];
    }
    /**
     * Gets the verticesCount output component
     */
    get verticesCount() {
        return this._outputs[3];
    }
    /**
     * Gets the facesCount output component
     */
    get facesCount() {
        return this._outputs[4];
    }
    _buildBlock() {
        if (!this.geometry.isConnected) {
            this.id._storedValue = 0;
            this.collectionId._storedValue = 0;
            this.verticesCount._storedValue = 0;
            this.facesCount._storedValue = 0;
            this.output._storedValue = 0;
            this.id._storedFunction = null;
            this.collectionId._storedFunction = null;
            this.verticesCount._storedFunction = null;
            this.facesCount._storedFunction = null;
            this.output._storedFunction = null;
            return;
        }
        this.output._storedFunction = (state) => {
            this._currentVertexData = this.geometry.getConnectedValue(state);
            return this._currentVertexData;
        };
        this.id._storedFunction = (state) => {
            this._currentVertexData = this._currentVertexData || this.geometry.getConnectedValue(state);
            return this._currentVertexData.uniqueId;
        };
        this.collectionId._storedFunction = (state) => {
            this._currentVertexData = this._currentVertexData || this.geometry.getConnectedValue(state);
            return this._currentVertexData.metadata ? this._currentVertexData.metadata.collectionId : 0;
        };
        this.verticesCount._storedFunction = (state) => {
            this._currentVertexData = this._currentVertexData || this.geometry.getConnectedValue(state);
            return this._currentVertexData.positions ? this._currentVertexData.positions.length / 3 : 0;
        };
        this.facesCount._storedFunction = (state) => {
            this._currentVertexData = this._currentVertexData || this.geometry.getConnectedValue(state);
            return this._currentVertexData.indices ? this._currentVertexData.indices.length / 3 : 0;
        };
    }
}
RegisterClass("BABYLON.GeometryInfoBlock", GeometryInfoBlock);
//# sourceMappingURL=geometryInfoBlock.js.map