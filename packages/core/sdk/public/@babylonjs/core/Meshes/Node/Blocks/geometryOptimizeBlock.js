import { __decorate } from "../../../tslib.es6.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
import { VertexData } from "../../../Meshes/mesh.vertexData.js";
import { WithinEpsilon } from "../../../Maths/math.scalar.functions.js";
import { Epsilon } from "../../../Maths/math.constants.js";
/**
 * Block used to extract unique positions from a geometry
 */
export class GeometryOptimizeBlock extends NodeGeometryBlock {
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
     * Creates a new GeometryOptimizeBlock
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
         * Define the epsilon used to compare similar positions
         */
        this.epsilon = Epsilon;
        /**
         * Optimize faces (by removing duplicates)
         */
        this.optimizeFaces = false;
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("selector", NodeGeometryBlockConnectionPointTypes.Int, true);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryOptimizeBlock";
    }
    /**
     * Gets the geometry component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the selector component
     */
    get selector() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        const func = (state) => {
            if (!this.geometry.isConnected) {
                return null;
            }
            const vertexData = this.geometry.getConnectedValue(state);
            const newPositions = [];
            const newIndicesMap = {};
            state.pushExecutionContext(this);
            state.pushGeometryContext(vertexData);
            // Optimize positions
            for (let index = 0; index < vertexData.positions.length; index += 3) {
                this._currentIndex = index / 3;
                if (this.selector.isConnected) {
                    const selector = this.selector.getConnectedValue(state);
                    if (!selector) {
                        continue;
                    }
                }
                const x = vertexData.positions[index];
                const y = vertexData.positions[index + 1];
                const z = vertexData.positions[index + 2];
                // check if we already have it
                let found = false;
                for (let checkIndex = 0; checkIndex < newPositions.length; checkIndex += 3) {
                    if (WithinEpsilon(x, newPositions[checkIndex], this.epsilon) &&
                        WithinEpsilon(y, newPositions[checkIndex + 1], this.epsilon) &&
                        WithinEpsilon(z, newPositions[checkIndex + 2], this.epsilon)) {
                        newIndicesMap[index / 3] = checkIndex / 3;
                        found = true;
                        continue;
                    }
                }
                if (!found) {
                    newIndicesMap[index / 3] = newPositions.length / 3;
                    newPositions.push(x, y, z);
                }
            }
            const newVertexData = new VertexData();
            newVertexData.positions = newPositions;
            const indices = vertexData.indices.map((index) => newIndicesMap[index]);
            const newIndices = [];
            if (this.optimizeFaces) {
                // Optimize indices
                for (let index = 0; index < indices.length; index += 3) {
                    const a = indices[index];
                    const b = indices[index + 1];
                    const c = indices[index + 2];
                    if (a === b || b == c || c === a) {
                        continue;
                    }
                    // check if we already have it
                    let found = false;
                    for (let checkIndex = 0; checkIndex < newIndices.length; checkIndex += 3) {
                        if (a === newIndices[checkIndex] && b === newIndices[checkIndex + 1] && c === newIndices[checkIndex + 2]) {
                            found = true;
                            continue;
                        }
                        if (a === newIndices[checkIndex + 1] && b === newIndices[checkIndex + 2] && c === newIndices[checkIndex]) {
                            found = true;
                            continue;
                        }
                        if (a === newIndices[checkIndex + 2] && b === newIndices[checkIndex] && c === newIndices[checkIndex + 1]) {
                            found = true;
                            continue;
                        }
                    }
                    if (!found) {
                        newIndices.push(a, b, c);
                    }
                }
                newVertexData.indices = newIndices;
            }
            else {
                newVertexData.indices = indices;
            }
            return newVertexData;
        };
        state.restoreGeometryContext();
        state.restoreExecutionContext();
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
        codeString += `${this._codeVariableName}.epsilon = ${this.epsilon};\n`;
        codeString += `${this._codeVariableName}.optimizeFaces = ${this.optimizeFaces ? "true" : "false"};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.epsilon = this.epsilon;
        serializationObject.optimizeFaces = this.optimizeFaces;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.evaluateContext = serializationObject.evaluateContext;
        this.epsilon = serializationObject.epsilon;
        this.optimizeFaces = serializationObject.optimizeFaces;
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], GeometryOptimizeBlock.prototype, "evaluateContext", void 0);
__decorate([
    editableInPropertyPage("Epsilon", 1 /* PropertyTypeForEdition.Float */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], GeometryOptimizeBlock.prototype, "epsilon", void 0);
__decorate([
    editableInPropertyPage("Optimize faces", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], GeometryOptimizeBlock.prototype, "optimizeFaces", void 0);
RegisterClass("BABYLON.GeometryOptimizeBlock", GeometryOptimizeBlock);
//# sourceMappingURL=geometryOptimizeBlock.js.map