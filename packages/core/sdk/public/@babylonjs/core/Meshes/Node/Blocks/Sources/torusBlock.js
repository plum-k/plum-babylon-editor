import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { CreateTorusVertexData } from "../../../Builders/torusBuilder.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Defines a block used to generate torus geometry data
 */
export class TorusBlock extends NodeGeometryBlock {
    /**
     * Create a new TorusBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("thickness", NodeGeometryBlockConnectionPointTypes.Float, true, 0.5);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Int, true, 16);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "TorusBlock";
    }
    /**
     * Gets the diameter input component
     */
    get diameter() {
        return this._inputs[0];
    }
    /**
     * Gets the thickness input component
     */
    get thickness() {
        return this._inputs[1];
    }
    /**
     * Gets the tessellation input component
     */
    get tessellation() {
        return this._inputs[2];
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
            options.thickness = this.thickness.getConnectedValue(state);
            options.diameter = this.diameter.getConnectedValue(state);
            options.tessellation = this.tessellation.getConnectedValue(state);
            // Append vertex data from the plane builder
            return CreateTorusVertexData(options);
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
], TorusBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.TorusBlock", TorusBlock);
//# sourceMappingURL=torusBlock.js.map