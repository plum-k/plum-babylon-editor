import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Block used to set texture coordinates for a geometry
 */
export class SetUVsBlock extends NodeGeometryBlock {
    /**
     * Create a new SetUVsBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = true;
        /**
         * Gets or sets a value indicating which UV to set
         */
        this.textureCoordinateIndex = 0;
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("uvs", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    getExecutionIndex() {
        return this._currentIndex;
    }
    /**
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    getExecutionLoopIndex() {
        return this._currentIndex;
    }
    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    getExecutionFaceIndex() {
        return 0;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "SetUVsBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the uvs input component
     */
    get uvs() {
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
            state.pushExecutionContext(this);
            this._vertexData = this.geometry.getConnectedValue(state);
            if (this._vertexData) {
                this._vertexData = this._vertexData.clone(); // Preserve source data
            }
            state.pushGeometryContext(this._vertexData);
            if (!this._vertexData || !this._vertexData.positions) {
                state.restoreGeometryContext();
                state.restoreExecutionContext();
                this.output._storedValue = null;
                return;
            }
            if (!this.uvs.isConnected) {
                state.restoreGeometryContext();
                state.restoreExecutionContext();
                this.output._storedValue = this._vertexData;
                return;
            }
            const uvs = [];
            // Processing
            const vertexCount = this._vertexData.positions.length / 3;
            for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                const tempVector2 = this.uvs.getConnectedValue(state);
                if (tempVector2) {
                    tempVector2.toArray(uvs, this._currentIndex * 2);
                }
            }
            switch (this.textureCoordinateIndex) {
                case 0:
                    this._vertexData.uvs = uvs;
                    break;
                case 1:
                    this._vertexData.uvs2 = uvs;
                    break;
                case 2:
                    this._vertexData.uvs3 = uvs;
                    break;
                case 3:
                    this._vertexData.uvs4 = uvs;
                    break;
                case 4:
                    this._vertexData.uvs5 = uvs;
                    break;
                case 5:
                    this._vertexData.uvs6 = uvs;
                    break;
            }
            // Storage
            state.restoreGeometryContext();
            state.restoreExecutionContext();
            return this._vertexData;
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
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.textureCoordinateIndex};\n`;
        codeString += `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.textureCoordinateIndex = this.textureCoordinateIndex;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.textureCoordinateIndex = serializationObject.textureCoordinateIndex;
        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], SetUVsBlock.prototype, "evaluateContext", void 0);
__decorate([
    editableInPropertyPage("Texture coordinates index", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { update: true },
        embedded: true,
        options: [
            { label: "UV1", value: 0 },
            { label: "UV2", value: 1 },
            { label: "UV3", value: 2 },
            { label: "UV4", value: 3 },
            { label: "UV5", value: 4 },
            { label: "UV6", value: 5 },
        ],
    })
], SetUVsBlock.prototype, "textureCoordinateIndex", void 0);
RegisterClass("BABYLON.SetUVsBlock", SetUVsBlock);
//# sourceMappingURL=setUVsBlock.js.map