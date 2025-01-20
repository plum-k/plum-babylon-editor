import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { VertexDataMaterialInfo } from "../../../../Meshes/mesh.vertexData.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Block used to affect a material ID to a geometry
 */
export class SetMaterialIDBlock extends NodeGeometryBlock {
    /**
     * Create a new SetMaterialIDBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = true;
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("id", NodeGeometryBlockConnectionPointTypes.Int, true, 0);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.id.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "SetMaterialIDBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the id input component
     */
    get id() {
        return this._inputs[1];
    }
    /**
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        if (!this.geometry.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (state) => {
            const vertexData = this.geometry.getConnectedValue(state);
            if (!vertexData || !vertexData.indices || !vertexData.positions) {
                return vertexData;
            }
            const materialInfo = new VertexDataMaterialInfo();
            materialInfo.materialIndex = this.id.getConnectedValue(state) | 0;
            materialInfo.indexStart = 0;
            materialInfo.indexCount = vertexData.indices.length;
            materialInfo.verticesStart = 0;
            materialInfo.verticesCount = vertexData.positions.length / 3;
            vertexData.materialInfos = [materialInfo];
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
        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], SetMaterialIDBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.SetMaterialIDBlock", SetMaterialIDBlock);
//# sourceMappingURL=setMaterialIDBlock.js.map