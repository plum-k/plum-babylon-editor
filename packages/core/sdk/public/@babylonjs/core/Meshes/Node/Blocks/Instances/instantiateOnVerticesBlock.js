import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { Vector3 } from "../../../../Maths/math.vector.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { Epsilon } from "../../../../Maths/math.constants.js";
/**
 * Block used to instance geometry on every vertex of a geometry
 */
export class InstantiateOnVerticesBlock extends NodeGeometryBlock {
    /**
     * Create a new InstantiateOnVerticesBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this._indexTranslation = null;
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = true;
        /**
         * Gets or sets a boolean indicating if the block should remove duplicated positions
         */
        this.removeDuplicatedPositions = true;
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("instance", NodeGeometryBlockConnectionPointTypes.Geometry, true);
        this.registerInput("density", NodeGeometryBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix, true);
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());
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
        return this._indexTranslation ? this._indexTranslation[this._currentIndex] : this._currentIndex;
    }
    /**
     * Gets the current loop index in the current flow
     * @returns the current loop index
     */
    getExecutionLoopIndex() {
        return this._currentLoopIndex;
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
        return "InstantiateOnVerticesBlock";
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
     * Gets the density input component
     */
    get density() {
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
     * Gets the geometry output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        const func = (state) => {
            state.pushExecutionContext(this);
            state.pushInstancingContext(this);
            this._vertexData = this.geometry.getConnectedValue(state);
            state.pushGeometryContext(this._vertexData);
            if (!this._vertexData || !this._vertexData.positions || !this.instance.isConnected) {
                state.restoreExecutionContext();
                state.restoreInstancingContext();
                state.restoreGeometryContext();
                this.output._storedValue = null;
                return;
            }
            // Processing
            let vertexCount = this._vertexData.positions.length / 3;
            const additionalVertexData = [];
            const currentPosition = new Vector3();
            const alreadyDone = [];
            let vertices = this._vertexData.positions;
            this._currentLoopIndex = 0;
            if (this.removeDuplicatedPositions) {
                this._indexTranslation = {};
                for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                    const x = vertices[this._currentIndex * 3];
                    const y = vertices[this._currentIndex * 3 + 1];
                    const z = vertices[this._currentIndex * 3 + 2];
                    let found = false;
                    for (let index = 0; index < alreadyDone.length; index += 3) {
                        if (Math.abs(alreadyDone[index] - x) < Epsilon && Math.abs(alreadyDone[index + 1] - y) < Epsilon && Math.abs(alreadyDone[index + 2] - z) < Epsilon) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        continue;
                    }
                    this._indexTranslation[alreadyDone.length / 3] = this._currentIndex;
                    alreadyDone.push(x, y, z);
                }
                vertices = alreadyDone;
                vertexCount = vertices.length / 3;
            }
            else {
                this._indexTranslation = null;
            }
            for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
                const instanceGeometry = this.instance.getConnectedValue(state);
                if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                    continue;
                }
                const density = this.density.getConnectedValue(state);
                if (density < 1) {
                    if (Math.random() > density) {
                        continue;
                    }
                }
                currentPosition.fromArray(vertices, this._currentIndex * 3);
                // Clone the instance
                const clone = instanceGeometry.clone();
                // Transform
                if (this.matrix.isConnected) {
                    const transform = this.matrix.getConnectedValue(state);
                    state._instantiateWithPositionAndMatrix(clone, currentPosition, transform, additionalVertexData);
                }
                else {
                    const scaling = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
                    const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                    state._instantiate(clone, currentPosition, rotation, scaling, additionalVertexData);
                }
                this._currentLoopIndex++;
            }
            // Restore
            state.restoreGeometryContext();
            state.restoreExecutionContext();
            state.restoreInstancingContext();
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
            else {
                return null;
            }
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
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.removeDuplicatedPositions = ${this.removeDuplicatedPositions ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.removeDuplicatedPositions = this.removeDuplicatedPositions;
        serializationObject.evaluateContext = this.evaluateContext;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.removeDuplicatedPositions = serializationObject.removeDuplicatedPositions;
        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}
__decorate([
    editableInPropertyPage("Evaluate context", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { notifiers: { rebuild: true } })
], InstantiateOnVerticesBlock.prototype, "evaluateContext", void 0);
__decorate([
    editableInPropertyPage("Remove duplicated positions", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { notifiers: { update: true } })
], InstantiateOnVerticesBlock.prototype, "removeDuplicatedPositions", void 0);
RegisterClass("BABYLON.InstantiateOnVerticesBlock", InstantiateOnVerticesBlock);
//# sourceMappingURL=instantiateOnVerticesBlock.js.map