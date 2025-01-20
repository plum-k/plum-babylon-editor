import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { CreateSegmentedBoxVertexData } from "../../../Builders/boxBuilder.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Defines a block used to generate box geometry data
 */
export class BoxBlock extends NodeGeometryBlock {
    /**
     * Create a new BoxBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = false;
        this.registerInput("size", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("width", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("height", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("depth", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("subdivisions", NodeGeometryBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("subdivisionsX", NodeGeometryBlockConnectionPointTypes.Int, true, 0);
        this.registerInput("subdivisionsY", NodeGeometryBlockConnectionPointTypes.Int, true, 0);
        this.registerInput("subdivisionsZ", NodeGeometryBlockConnectionPointTypes.Int, true, 0);
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "BoxBlock";
    }
    /**
     * Gets the size input component
     */
    get size() {
        return this._inputs[0];
    }
    /**
     * Gets the width input component
     */
    get width() {
        return this._inputs[1];
    }
    /**
     * Gets the height input component
     */
    get height() {
        return this._inputs[2];
    }
    /**
     * Gets the depth input component
     */
    get depth() {
        return this._inputs[3];
    }
    /**
     * Gets the subdivisions input component
     */
    get subdivisions() {
        return this._inputs[4];
    }
    /**
     * Gets the subdivisionsX input component
     */
    get subdivisionsX() {
        return this._inputs[5];
    }
    /**
     * Gets the subdivisionsY input component
     */
    get subdivisionsY() {
        return this._inputs[6];
    }
    /**
     * Gets the subdivisionsZ input component
     */
    get subdivisionsZ() {
        return this._inputs[7];
    }
    /**
     * Gets the geometry output component
     */
    get geometry() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (this.size.isConnected) {
            return;
        }
        if (!this.width.isConnected && !this.height.isConnected && !this.depth.isConnected) {
            const sizeInput = new GeometryInputBlock("Size");
            sizeInput.value = 1;
            sizeInput.output.connectTo(this.size);
            return;
        }
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
        if (!this.depth.isConnected) {
            const depthInput = new GeometryInputBlock("Depth");
            depthInput.value = 1;
            depthInput.output.connectTo(this.depth);
        }
    }
    _buildBlock(state) {
        const options = {};
        const func = (state) => {
            options.size = this.size.getConnectedValue(state);
            options.width = this.width.getConnectedValue(state);
            options.height = this.height.getConnectedValue(state);
            options.depth = this.depth.getConnectedValue(state);
            const subdivisions = this.subdivisions.getConnectedValue(state);
            const subdivisionsX = this.subdivisionsX.getConnectedValue(state);
            const subdivisionsY = this.subdivisionsY.getConnectedValue(state);
            const subdivisionsZ = this.subdivisionsZ.getConnectedValue(state);
            if (subdivisions) {
                options.segments = subdivisions;
            }
            if (subdivisionsX) {
                options.widthSegments = subdivisionsX;
            }
            if (subdivisionsY) {
                options.heightSegments = subdivisionsY;
            }
            if (subdivisionsZ) {
                options.depthSegments = subdivisionsZ;
            }
            // Append vertex data from the plane builder
            return CreateSegmentedBoxVertexData(options);
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
], BoxBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.BoxBlock", BoxBlock);
//# sourceMappingURL=boxBlock.js.map