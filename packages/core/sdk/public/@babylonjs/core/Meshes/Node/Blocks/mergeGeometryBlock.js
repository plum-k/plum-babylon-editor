import { __decorate } from "../../../tslib.es6.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Block used to merge several geometries
 */
export class MergeGeometryBlock extends NodeGeometryBlock {
    /**
     * Create a new MergeGeometryBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry2", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry3", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry4", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MergeGeometryBlock";
    }
    /**
     * Gets the geometry0 input component
     */
    get geometry0() {
        return this._inputs[0];
    }
    /**
     * Gets the geometry1 input component
     */
    get geometry1() {
        return this._inputs[1];
    }
    /**
     * Gets the geometry2 input component
     */
    get geometry2() {
        return this._inputs[2];
    }
    /**
     * Gets the geometry3 input component
     */
    get geometry3() {
        return this._inputs[3];
    }
    /**
     * Gets the geometry4 input component
     */
    get geometry4() {
        return this._inputs[4];
    }
    /**
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        const func = (state) => {
            const vertexDataSource = [];
            if (this.geometry0.isConnected) {
                const data = this.geometry0.getConnectedValue(state);
                if (data) {
                    vertexDataSource.push(data);
                }
            }
            if (this.geometry1.isConnected) {
                const data = this.geometry1.getConnectedValue(state);
                if (data) {
                    vertexDataSource.push(data);
                }
            }
            if (this.geometry2.isConnected) {
                const data = this.geometry2.getConnectedValue(state);
                if (data) {
                    vertexDataSource.push(data);
                }
            }
            if (this.geometry3.isConnected) {
                const data = this.geometry3.getConnectedValue(state);
                if (data) {
                    vertexDataSource.push(data);
                }
            }
            if (this.geometry4.isConnected) {
                const data = this.geometry4.getConnectedValue(state);
                if (data) {
                    vertexDataSource.push(data);
                }
            }
            if (vertexDataSource.length === 0) {
                return null;
            }
            let vertexData = vertexDataSource[0].clone(); // Preserve source data
            const additionalVertexData = vertexDataSource.slice(1);
            if (additionalVertexData.length && vertexData) {
                vertexData = vertexData.merge(additionalVertexData, true, false, true, true);
            }
            return vertexData;
        };
        if (this.evaluateContext) {
            this.output._storedFunction = func;
        }
        else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.evaluateContext = this.evaluateContext;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.evaluateContext = serializationObject.evaluateContext;
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], MergeGeometryBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.MergeGeometryBlock", MergeGeometryBlock);
//# sourceMappingURL=mergeGeometryBlock.js.map