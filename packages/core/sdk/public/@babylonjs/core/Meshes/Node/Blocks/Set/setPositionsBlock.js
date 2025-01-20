import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Block used to set positions for a geometry
 */
export class SetPositionsBlock extends NodeGeometryBlock {
    /**
     * Create a new SetPositionsBlock
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
        this.registerInput("positions", NodeGeometryBlockConnectionPointTypes.Vector3);
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
        return "SetPositionsBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the positions input component
     */
    get positions() {
        return this._inputs[1];
    }
    /**
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _remapVector3Data(source, remap) {
        const newData = [];
        for (let index = 0; index < source.length; index += 3) {
            const remappedIndex = remap[index / 3];
            if (remappedIndex !== undefined) {
                newData.push(source[index], source[index + 1], source[index + 2]);
            }
        }
        return newData;
    }
    _remapVector4Data(source, remap) {
        const newData = [];
        for (let index = 0; index < source.length; index += 4) {
            const remappedIndex = remap[index / 4];
            if (remappedIndex !== undefined) {
                newData.push(source[index], source[index + 1], source[index + 2], source[index + 3]);
            }
        }
        return newData;
    }
    _remapVector2Data(source, remap) {
        const newData = [];
        for (let index = 0; index < source.length; index += 2) {
            const remappedIndex = remap[index / 2];
            if (remappedIndex !== undefined) {
                newData.push(source[index], source[index + 1]);
            }
        }
        return newData;
    }
    _buildBlock(state) {
        const func = (state) => {
            state.pushExecutionContext(this);
            this._vertexData = this.geometry.getConnectedValue(state);
            if (this._vertexData) {
                this._vertexData = this._vertexData.clone(); // Preserve source data
            }
            state.pushGeometryContext(this._vertexData);
            if (!this._vertexData || !this._vertexData.positions || !this.positions.isConnected) {
                state.restoreGeometryContext();
                state.restoreExecutionContext();
                this.output._storedValue = null;
                return;
            }
            // Processing
            const remap = {};
            const vertexCount = this._vertexData.positions.length / 3;
            const newPositions = [];
            let activeIndex = 0;
            let resize = false;
            for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                const tempVector3 = this.positions.getConnectedValue(state);
                if (tempVector3) {
                    tempVector3.toArray(newPositions, activeIndex * 3);
                    remap[this._currentIndex] = activeIndex;
                    activeIndex++;
                }
                else {
                    resize = true;
                }
            }
            if (resize) {
                // Indices remap
                if (this._vertexData.indices) {
                    const newIndices = [];
                    for (let index = 0; index < this._vertexData.indices.length; index += 3) {
                        const a = this._vertexData.indices[index];
                        const b = this._vertexData.indices[index + 1];
                        const c = this._vertexData.indices[index + 2];
                        const remappedA = remap[a];
                        const remappedB = remap[b];
                        const remappedC = remap[c];
                        if (remappedA !== undefined && remappedB !== undefined && remappedC !== undefined) {
                            newIndices.push(remappedA);
                            newIndices.push(remappedB);
                            newIndices.push(remappedC);
                        }
                    }
                    this._vertexData.indices = newIndices;
                }
                // Normals remap
                if (this._vertexData.normals) {
                    this._vertexData.normals = this._remapVector3Data(this._vertexData.normals, remap);
                }
                // Tangents remap
                if (this._vertexData.tangents) {
                    this._vertexData.tangents = this._remapVector4Data(this._vertexData.tangents, remap);
                }
                // Colors remap
                if (this._vertexData.colors) {
                    this._vertexData.colors = this._remapVector4Data(this._vertexData.colors, remap);
                }
                // UVs remap
                if (this._vertexData.uvs) {
                    this._vertexData.uvs = this._remapVector2Data(this._vertexData.uvs, remap);
                }
                if (this._vertexData.uvs2) {
                    this._vertexData.uvs2 = this._remapVector2Data(this._vertexData.uvs2, remap);
                }
                if (this._vertexData.uvs3) {
                    this._vertexData.uvs3 = this._remapVector2Data(this._vertexData.uvs3, remap);
                }
                if (this._vertexData.uvs4) {
                    this._vertexData.uvs4 = this._remapVector2Data(this._vertexData.uvs4, remap);
                }
                if (this._vertexData.uvs5) {
                    this._vertexData.uvs5 = this._remapVector2Data(this._vertexData.uvs5, remap);
                }
                if (this._vertexData.uvs6) {
                    this._vertexData.uvs6 = this._remapVector2Data(this._vertexData.uvs6, remap);
                }
            }
            // Update positions
            this._vertexData.positions = newPositions;
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
], SetPositionsBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.SetPositionsBlock", SetPositionsBlock);
//# sourceMappingURL=setPositionsBlock.js.map