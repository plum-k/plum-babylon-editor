import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { CreateGroundVertexData } from "../../../Builders/groundBuilder.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Defines a block used to generate grid geometry data
 */
export class GridBlock extends NodeGeometryBlock {
    /**
     * Create a new GridBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("subdivisionsX", NodeGeometryBlockConnectionPointTypes.Int, true, 0);
        this.registerInput("subdivisionsY", NodeGeometryBlockConnectionPointTypes.Int, true, 0);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GridBlock";
    }
    /**
     * Gets the width input component
     */
    get width() {
        return this._inputs[0];
    }
    /**
     * Gets the height input component
     */
    get height() {
        return this._inputs[1];
    }
    /**
     * Gets the subdivisions input component
     */
    get subdivisions() {
        return this._inputs[2];
    }
    /**
     * Gets the subdivisionsX input component
     */
    get subdivisionsX() {
        return this._inputs[3];
    }
    /**
     * Gets the subdivisionsY input component
     */
    get subdivisionsY() {
        return this._inputs[4];
    }
    /**
     * Gets the geometry output component
     */
    get geometry() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.width.isConnected) {
            const widthInput = new GeometryInputBlock("Width");
            widthInput.value = 1;
            widthInput.output.connectTo(this.width);
        }
        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
    }
    _buildBlock(state) {
        const options = {};
        const func = (state) => {
            options.width = this.width.getConnectedValue(state);
            options.height = this.height.getConnectedValue(state);
            options.subdivisions = this.subdivisions.getConnectedValue(state);
            options.subdivisionsX = this.subdivisionsX.getConnectedValue(state);
            options.subdivisionsY = this.subdivisionsY.getConnectedValue(state);
            // Append vertex data from the plane builder
            return CreateGroundVertexData(options);
        };
        if (this.evaluateContext) {
            this.geometry._storedFunction = func;
        }
        else {
            const value = func(state);
            this.geometry._storedFunction = () => {
                this.geometry._executionCount = 1;
                return value.clone();
            };
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
], GridBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.GridBlock", GridBlock);
//# sourceMappingURL=gridBlock.js.map