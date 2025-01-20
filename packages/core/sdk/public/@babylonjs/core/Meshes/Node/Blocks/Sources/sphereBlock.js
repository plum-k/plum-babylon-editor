import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { CreateSphereVertexData } from "../../../Builders/sphereBuilder.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Defines a block used to generate sphere geometry data
 */
export class SphereBlock extends NodeGeometryBlock {
    /**
     * Create a new SphereBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        this.registerInput("segments", NodeGeometryBlockConnectionPointTypes.Int, true, 32);
        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("diameterX", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("diameterY", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("diameterZ", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("arc", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("slice", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "SphereBlock";
    }
    /**
     * Gets the segments input component
     */
    get segments() {
        return this._inputs[0];
    }
    /**
     * Gets the diameter input component
     */
    get diameter() {
        return this._inputs[1];
    }
    /**
     * Gets the diameterX input component
     */
    get diameterX() {
        return this._inputs[2];
    }
    /**
     * Gets the diameterY input component
     */
    get diameterY() {
        return this._inputs[3];
    }
    /**
     * Gets the diameterZ input component
     */
    get diameterZ() {
        return this._inputs[4];
    }
    /**
     * Gets the arc input component
     */
    get arc() {
        return this._inputs[5];
    }
    /**
     * Gets the slice input component
     */
    get slice() {
        return this._inputs[6];
    }
    /**
     * Gets the geometry output component
     */
    get geometry() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.diameter.isConnected) {
            const diameterInput = new GeometryInputBlock("Diameter");
            diameterInput.value = 1;
            diameterInput.output.connectTo(this.diameter);
        }
    }
    _buildBlock(state) {
        const options = {};
        const func = (state) => {
            options.segments = this.segments.getConnectedValue(state);
            options.diameter = this.diameter.getConnectedValue(state);
            options.diameterX = this.diameterX.getConnectedValue(state);
            options.diameterY = this.diameterY.getConnectedValue(state);
            options.diameterZ = this.diameterZ.getConnectedValue(state);
            options.arc = this.arc.getConnectedValue(state);
            options.slice = this.slice.getConnectedValue(state);
            // Append vertex data from the plane builder
            return CreateSphereVertexData(options);
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
], SphereBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.SphereBlock", SphereBlock);
//# sourceMappingURL=sphereBlock.js.map