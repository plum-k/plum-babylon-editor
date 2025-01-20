import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { CreateCapsuleVertexData } from "../../../Builders/capsuleBuilder.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Defines a block used to generate capsule geometry data
 */
export class CapsuleBlock extends NodeGeometryBlock {
    /**
     * Create a new CapsuleBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Float, true, 0.25);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Int, true, 16);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 2);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "CapsuleBlock";
    }
    /**
     * Gets the height input component
     */
    get height() {
        return this._inputs[0];
    }
    /**
     * Gets the radius input component
     */
    get radius() {
        return this._inputs[1];
    }
    /**
     * Gets the tessellation input component
     */
    get tessellation() {
        return this._inputs[2];
    }
    /**
     * Gets the subdivisions input component
     */
    get subdivisions() {
        return this._inputs[3];
    }
    /**
     * Gets the geometry output component
     */
    get geometry() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.height.isConnected) {
            const heightInput = new GeometryInputBlock("Height");
            heightInput.value = 1;
            heightInput.output.connectTo(this.height);
        }
        if (!this.radius.isConnected) {
            const radiusInput = new GeometryInputBlock("Radius");
            radiusInput.value = 0.2;
            radiusInput.output.connectTo(this.radius);
        }
    }
    _buildBlock(state) {
        const options = {};
        const func = (state) => {
            options.height = this.height.getConnectedValue(state);
            options.radius = this.radius.getConnectedValue(state);
            options.tessellation = this.tessellation.getConnectedValue(state);
            options.subdivisions = this.subdivisions.getConnectedValue(state);
            // Append vertex data from the plane builder
            return CreateCapsuleVertexData(options);
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
], CapsuleBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.CapsuleBlock", CapsuleBlock);
//# sourceMappingURL=capsuleBlock.js.map