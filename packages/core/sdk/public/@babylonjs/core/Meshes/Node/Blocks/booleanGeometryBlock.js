import { __decorate } from "../../../tslib.es6.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
import { CSG2, InitializeCSG2Async, IsCSG2Ready } from "../../csg2.js";
import { CSG } from "../../csg.js";
/**
 * Operations supported by the boolean block
 */
export var BooleanGeometryOperations;
(function (BooleanGeometryOperations) {
    /** Intersect */
    BooleanGeometryOperations[BooleanGeometryOperations["Intersect"] = 0] = "Intersect";
    /** Subtract */
    BooleanGeometryOperations[BooleanGeometryOperations["Subtract"] = 1] = "Subtract";
    /** Union */
    BooleanGeometryOperations[BooleanGeometryOperations["Union"] = 2] = "Union";
})(BooleanGeometryOperations || (BooleanGeometryOperations = {}));
/**
 * Block used to apply a boolean operation between 2 geometries
 */
export class BooleanGeometryBlock extends NodeGeometryBlock {
    /**
     * @internal
     */
    get _isReadyState() {
        if (IsCSG2Ready()) {
            return null;
        }
        if (!this._csg2LoadingPromise) {
            this._csg2LoadingPromise = InitializeCSG2Async();
        }
        return this._csg2LoadingPromise;
    }
    /**
     * Create a new BooleanGeometryBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        /**
         * Gets or sets the operation applied by the block
         */
        this.operation = BooleanGeometryOperations.Intersect;
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.useOldCSGEngine = false;
        this.registerInput("geometry0", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("geometry1", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "BooleanGeometryBlock";
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
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        const func = (state) => {
            const vertexData0 = this.geometry0.getConnectedValue(state);
            const vertexData1 = this.geometry1.getConnectedValue(state);
            if (!vertexData0 || !vertexData1) {
                return null;
            }
            const vertexCount = vertexData0.positions.length / 3;
            // Ensure that all the fields are filled to avoid problems later on in the graph
            if (!vertexData0.normals && vertexData1.normals) {
                vertexData0.normals = new Array(vertexData0.positions.length);
            }
            if (!vertexData1.normals && vertexData0.normals) {
                vertexData1.normals = new Array(vertexData1.positions.length);
            }
            if (!vertexData0.uvs && vertexData1.uvs) {
                vertexData0.uvs = new Array(vertexCount * 2);
            }
            if (!vertexData1.uvs && vertexData0.uvs) {
                vertexData1.uvs = new Array(vertexCount * 2);
            }
            if (!vertexData0.colors && vertexData1.colors) {
                vertexData0.colors = new Array(vertexCount * 4);
            }
            if (!vertexData1.colors && vertexData0.colors) {
                vertexData1.colors = new Array(vertexCount * 4);
            }
            let boolCSG;
            if (this.useOldCSGEngine) {
                const CSG0 = CSG.FromVertexData(vertexData0);
                const CSG1 = CSG.FromVertexData(vertexData1);
                switch (this.operation) {
                    case BooleanGeometryOperations.Intersect:
                        boolCSG = CSG0.intersect(CSG1);
                        break;
                    case BooleanGeometryOperations.Subtract:
                        boolCSG = CSG0.subtract(CSG1);
                        break;
                    case BooleanGeometryOperations.Union:
                        boolCSG = CSG0.union(CSG1);
                        break;
                }
            }
            else {
                const CSG0 = CSG2.FromVertexData(vertexData0);
                const CSG1 = CSG2.FromVertexData(vertexData1);
                switch (this.operation) {
                    case BooleanGeometryOperations.Intersect:
                        boolCSG = CSG0.intersect(CSG1);
                        break;
                    case BooleanGeometryOperations.Subtract:
                        boolCSG = CSG0.subtract(CSG1);
                        break;
                    case BooleanGeometryOperations.Union:
                        boolCSG = CSG0.add(CSG1);
                        break;
                }
            }
            return boolCSG.toVertexData();
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
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.operation = BABYLON.BooleanGeometryOperations.${BooleanGeometryOperations[this.operation]};\n`;
        codeString += `${this._codeVariableName}.useOldCSGEngine = ${this.useOldCSGEngine ? "true" : "false"};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.operation = this.operation;
        serializationObject.useOldCSGEngine = this.useOldCSGEngine;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.evaluateContext = serializationObject.evaluateContext;
        if (serializationObject.operation) {
            this.operation = serializationObject.operation;
        }
        this.useOldCSGEngine = !!serializationObject.useOldCSGEngine;
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], BooleanGeometryBlock.prototype, "evaluateContext", void 0);
__decorate([
    editableInPropertyPage("Operation", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Intersect", value: BooleanGeometryOperations.Intersect },
            { label: "Subtract", value: BooleanGeometryOperations.Subtract },
            { label: "Union", value: BooleanGeometryOperations.Union },
        ],
    })
], BooleanGeometryBlock.prototype, "operation", void 0);
__decorate([
    editableInPropertyPage("Use old CSG engine", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], BooleanGeometryBlock.prototype, "useOldCSGEngine", void 0);
RegisterClass("BABYLON.BooleanGeometryBlock", BooleanGeometryBlock);
//# sourceMappingURL=booleanGeometryBlock.js.map