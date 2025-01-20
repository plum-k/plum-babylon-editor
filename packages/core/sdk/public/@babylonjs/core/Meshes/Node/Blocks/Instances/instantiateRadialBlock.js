import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector.js";
import { InstantiateBaseBlock } from "./instantiateBaseBlock.js";
/**
 * Block used to clone geometry in a radial shape
 */
export class InstantiateRadialBlock extends InstantiateBaseBlock {
    /**
     * Create a new InstantiateRadialBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0);
        // Angle start and end
        this.registerInput("angleStart", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("angleEnd", NodeGeometryBlockConnectionPointTypes.Float, true, Math.PI * 2);
        // Transform offset
        this.registerInput("transform", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        // Rotation is magnitude per step
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        // Scale is magnitude per step
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        this.scaling.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "InstantiateRadialBlock";
    }
    /**
     * Gets the direction input component
     */
    get radius() {
        return this._inputs[2];
    }
    /**
     * Gets the direction input component
     */
    get angleStart() {
        return this._inputs[3];
    }
    /**
     * Gets the direction input component
     */
    get angleEnd() {
        return this._inputs[4];
    }
    /**
     * Gets the transform input component
     */
    get transform() {
        return this._inputs[5];
    }
    /**
     * Gets the rotation input component
     */
    get rotation() {
        return this._inputs[6];
    }
    /**
     * Gets the scaling input component
     */
    get scaling() {
        return this._inputs[7];
    }
    _buildBlock(state) {
        const func = (state) => {
            state.pushExecutionContext(this);
            state.pushInstancingContext(this);
            const iterationCount = this.count.getConnectedValue(state);
            const additionalVertexData = [];
            const rotMatrix = Matrix.Identity();
            const radiusMatrix = Matrix.Identity();
            const transformMatrix = Matrix.Identity();
            const transformOffset = Vector3.Zero();
            const rotationOffset = Vector3.Zero();
            const scaleOffset = Vector3.Zero();
            for (this._currentIndex = 0; this._currentIndex < iterationCount; this._currentIndex++) {
                const instanceGeometry = this.instance.getConnectedValue(state);
                if (!instanceGeometry || !instanceGeometry.positions || instanceGeometry.positions.length === 0) {
                    continue;
                }
                // Clone the instance
                const clone = instanceGeometry.clone();
                const radius = this.radius.getConnectedValue(state);
                const angleStart = this.angleStart.getConnectedValue(state);
                const angleEnd = this.angleEnd.getConnectedValue(state);
                const transform = this.transform.getConnectedValue(state);
                const rotation = this.rotation.getConnectedValue(state);
                const scale = state.adaptInput(this.scaling, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);
                // Define arc size
                const pieSlice = angleEnd - angleStart;
                const rStep = pieSlice / iterationCount;
                const angle = angleStart + rStep * this._currentIndex;
                const angleQuat = Quaternion.FromEulerAngles(0, angle, 0);
                // Get local transforms
                transformOffset.copyFrom(transform.clone().scale(this._currentIndex));
                rotationOffset.copyFrom(rotation.clone().scale(this._currentIndex));
                scaleOffset.copyFrom(scale.clone().scale(this._currentIndex));
                scaleOffset.addInPlaceFromFloats(1, 1, 1);
                // Compose (rotMatrix x radius x scale x angle x user transform)
                Matrix.RotationYawPitchRollToRef(rotationOffset.y, rotationOffset.x, rotationOffset.z, rotMatrix);
                radiusMatrix.setTranslationFromFloats(0, 0, radius);
                Matrix.ComposeToRef(scaleOffset, angleQuat, transformOffset, transformMatrix);
                rotMatrix.multiplyToRef(radiusMatrix, radiusMatrix);
                radiusMatrix.multiplyToRef(transformMatrix, transformMatrix);
                state._instantiateWithMatrix(clone, transformMatrix, additionalVertexData);
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
            // Storage
            state.restoreExecutionContext();
            state.restoreInstancingContext();
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
}
RegisterClass("BABYLON.InstantiateRadialBlock", InstantiateRadialBlock);
//# sourceMappingURL=instantiateRadialBlock.js.map