import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { Vector3 } from "../../../../Maths/math.vector.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { Ray } from "../../../../Culling/ray.js";
import { extractMinAndMax } from "../../../../Maths/math.functions.js";
/**
 * Block used to instance geometry inside a geometry
 */
export class InstantiateOnVolumeBlock extends NodeGeometryBlock {
    /**
     * Create a new InstantiateOnVolumeBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this._currentPosition = new Vector3();
        this._vertex0 = new Vector3();
        this._vertex1 = new Vector3();
        this._vertex2 = new Vector3();
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = true;
        /**
         * Gets or sets a boolean indicating that a grid pattern should be used
         */
        this.gridMode = false;
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("instance", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 256);
        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix, true);
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());
        this.registerInput("gridSize", NodeGeometryBlockConnectionPointTypes.Int, true, 10);
        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current instance index in the current flow
     * @returns the current index
     */
    getInstanceIndex() {
        return this._currentLoopIndex;
    }
    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    getExecutionIndex() {
        return 0;
    }
    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    getExecutionFaceIndex() {
        return 0;
    }
    /**
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    getExecutionLoopIndex() {
        return this._currentLoopIndex;
    }
    /**
     * Gets the value associated with a contextual positions
     * @returns the value associated with the source
     */
    getOverridePositionsContextualValue() {
        return this._currentPosition;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "InstantiateOnVolumeBlock";
    }
    /**
     * Gets the geometry input component
     */
    get geometry() {
        return this._inputs[0];
    }
    /**
     * Gets the instance input component
     */
    get instance() {
        return this._inputs[1];
    }
    /**
     * Gets the count input component
     */
    get count() {
        return this._inputs[2];
    }
    /**
     * Gets the matrix input component
     */
    get matrix() {
        return this._inputs[3];
    }
    /**
     * Gets the rotation input component
     */
    get rotation() {
        return this._inputs[4];
    }
    /**
     * Gets the scaling input component
     */
    get scaling() {
        return this._inputs[5];
    }
    /**
     * Gets the grid size input component
     */
    get gridSize() {
        return this._inputs[6];
    }
    /**
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _getValueOnGrid(step, size, min, max) {
        const cellSize = (max - min) / size;
        return min + cellSize / 2 + step * cellSize;
    }
    _getIndexinGrid(x, y, z, size) {
        return x + y * size + z * size * size;
    }
    _buildBlock(state) {
        const func = (state) => {
            state.pushExecutionContext(this);
            state.pushInstancingContext(this);
            this._vertexData = this.geometry.getConnectedValue(state);
            state.pushGeometryContext(this._vertexData);
            if (!this._vertexData || !this._vertexData.positions || !this._vertexData.indices || !this.instance.isConnected) {
                state.restoreExecutionContext();
                state.restoreInstancingContext();
                state.restoreGeometryContext();
                this.output._storedValue = null;
                return;
            }
            // Processing
            let instanceGeometry = null;
            const instanceCount = this.count.getConnectedValue(state);
            const additionalVertexData = [];
            const boundingInfo = extractMinAndMax(this._vertexData.positions, 0, this._vertexData.positions.length / 3);
            const min = boundingInfo.minimum;
            const max = boundingInfo.maximum;
            const direction = new Vector3(0.5, 0.8, 0.2);
            const faceCount = this._vertexData.indices.length / 3;
            const gridSize = this.gridSize.getConnectedValue(state);
            this._currentLoopIndex = 0;
            let candidatesCells;
            if (this.gridMode) {
                candidatesCells = [];
                // Generates the list of candidates cells
                for (let index = 0; index < gridSize * gridSize * gridSize; index++) {
                    candidatesCells[index] = false;
                }
            }
            for (let index = 0; index < instanceCount; index++) {
                if (this.gridMode) {
                    // Get a random cell
                    let cellX = Math.floor(Math.random() * gridSize);
                    let cellY = Math.floor(Math.random() * gridSize);
                    let cellZ = Math.floor(Math.random() * gridSize);
                    let cellIndex = this._getIndexinGrid(cellX, cellY, cellZ, gridSize);
                    if (candidatesCells[cellIndex]) {
                        // Find the first one that is free
                        let found = false;
                        for (let candidateIndex = 0; candidateIndex < gridSize * gridSize * gridSize; candidateIndex++) {
                            if (!candidatesCells[candidateIndex]) {
                                cellZ = Math.floor(candidateIndex / (gridSize * gridSize));
                                cellY = Math.floor((candidateIndex - cellZ * gridSize * gridSize) / gridSize);
                                cellX = candidateIndex - cellZ * gridSize * gridSize - cellY * gridSize;
                                cellIndex = this._getIndexinGrid(cellX, cellY, cellZ, gridSize);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            // No more free cells
                            break;
                        }
                    }
                    if (!candidatesCells[cellIndex]) {
                        // Cell is free
                        const x = this._getValueOnGrid(cellX, gridSize, min.x, max.x);
                        const y = this._getValueOnGrid(cellY, gridSize, min.y, max.y);
                        const z = this._getValueOnGrid(cellZ, gridSize, min.z, max.z);
                        this._currentPosition.set(x, y, z);
                        candidatesCells[cellIndex] = true;
                    }
                }
                else {
                    this._currentPosition.set(Math.random() * (max.x - min.x) + min.x, Math.random() * (max.y - min.y) + min.y, Math.random() * (max.z - min.z) + min.z);
                }
                // Cast a ray from the random point in an arbitrary direction
                const ray = new Ray(this._currentPosition, direction);
                let intersectionCount = 0;
                for (let currentFaceIndex = 0; currentFaceIndex < faceCount; currentFaceIndex++) {
                    // Extract face vertices
                    this._vertex0.fromArray(this._vertexData.positions, this._vertexData.indices[currentFaceIndex * 3] * 3);
                    this._vertex1.fromArray(this._vertexData.positions, this._vertexData.indices[currentFaceIndex * 3 + 1] * 3);
                    this._vertex2.fromArray(this._vertexData.positions, this._vertexData.indices[currentFaceIndex * 3 + 2] * 3);
                    const currentIntersectInfo = ray.intersectsTriangle(this._vertex0, this._vertex1, this._vertex2);
                    if (currentIntersectInfo && currentIntersectInfo.distance > 0) {
                        intersectionCount++;
                    }
                }
                if (intersectionCount % 2 === 0) {
                    // We are outside, try again
                    index--;
                    continue;
                }
                // Clone the instance
                instanceGeometry = this.instance.getConnectedValue(state);
                if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                    continue;
                }
                const clone = instanceGeometry.clone();
                if (this.matrix.isConnected) {
                    const transform = this.matrix.getConnectedValue(state);
                    state._instantiateWithPositionAndMatrix(clone, this._currentPosition, transform, additionalVertexData);
                }
                else {
                    const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
                    const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                    state._instantiate(clone, this._currentPosition, rotation, scaling, additionalVertexData);
                }
                this._currentLoopIndex++;
            }
            // Merge
            if (additionalVertexData.length) {
                if (additionalVertexData.length === 1) {
                    this._vertexData = additionalVertexData[0];
                }
                else {
                    // We do not merge the main one as user can use a merge node if wanted
                    const main = additionalVertexData.splice(0, 1)[0];
                    this._vertexData = main.merge(additionalVertexData, true, false, true, true);
                }
            }
            state.restoreGeometryContext();
            state.restoreExecutionContext();
            state.restoreInstancingContext();
            return this._vertexData;
        };
        // Storage
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
        codeString += `${this._codeVariableName}.gridMode = ${this.gridMode ? "true" : "false"};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.gridMode = this.gridMode;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
        if (serializationObject.gridMode !== undefined) {
            this.gridMode = serializationObject.gridMode;
        }
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { notifiers: { rebuild: true } })
], InstantiateOnVolumeBlock.prototype, "evaluateContext", void 0);
__decorate([
    editableInPropertyPage("Grid mode", 0 /* PropertyTypeForEdition.Boolean */, "MODES", { notifiers: { rebuild: true } })
], InstantiateOnVolumeBlock.prototype, "gridMode", void 0);
RegisterClass("BABYLON.InstantiateOnVolumeBlock", InstantiateOnVolumeBlock);
//# sourceMappingURL=instantiateOnVolumeBlock.js.map