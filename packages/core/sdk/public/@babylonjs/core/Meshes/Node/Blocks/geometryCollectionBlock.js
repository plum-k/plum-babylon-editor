import { __decorate } from "../../../tslib.es6.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Block used to randomly pick a geometry from a collection
 */
export class GeometryCollectionBlock extends NodeGeometryBlock {
    /**
     * Create a new GeometryCollectionBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = true;
        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry2", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry3", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry4", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry5", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry6", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry7", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry8", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("geometry9", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryCollectionBlock";
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
     * Gets the geometry5 input component
     */
    get geometry5() {
        return this._inputs[5];
    }
    /**
     * Gets the geometry6 input component
     */
    get geometry6() {
        return this._inputs[6];
    }
    /**
     * Gets the geometry7 input component
     */
    get geometry7() {
        return this._inputs[7];
    }
    /**
     * Gets the geometry8 input component
     */
    get geometry8() {
        return this._inputs[8];
    }
    /**
     * Gets the geometry9 input component
     */
    get geometry9() {
        return this._inputs[9];
    }
    /**
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _storeGeometry(input, state, index, availables) {
        if (input.isConnected) {
            const vertexData = input.getConnectedValue(state);
            if (!vertexData) {
                return;
            }
            vertexData.metadata = vertexData.metadata || {};
            vertexData.metadata.collectionId = index;
            availables.push(vertexData);
        }
    }
    _buildBlock(state) {
        const func = (state) => {
            const availables = [];
            this._storeGeometry(this.geometry0, state, 0, availables);
            this._storeGeometry(this.geometry1, state, 1, availables);
            this._storeGeometry(this.geometry2, state, 2, availables);
            this._storeGeometry(this.geometry3, state, 3, availables);
            this._storeGeometry(this.geometry4, state, 4, availables);
            this._storeGeometry(this.geometry5, state, 5, availables);
            this._storeGeometry(this.geometry6, state, 6, availables);
            this._storeGeometry(this.geometry7, state, 7, availables);
            this._storeGeometry(this.geometry8, state, 8, availables);
            this._storeGeometry(this.geometry9, state, 9, availables);
            if (!availables.length) {
                return null;
            }
            return availables[Math.round(Math.random() * (availables.length - 1))];
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
], GeometryCollectionBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.GeometryCollectionBlock", GeometryCollectionBlock);
//# sourceMappingURL=geometryCollectionBlock.js.map