import { __decorate } from "../../../tslib.es6.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Block used to apply a transform to a vector / geometry
 */
export class GeometryTransformBlock extends NodeGeometryBlock {
    /**
     * Create a new GeometryTransformBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this._rotationMatrix = new Matrix();
        this._scalingMatrix = new Matrix();
        this._translationMatrix = new Matrix();
        this._scalingRotationMatrix = new Matrix();
        this._pivotMatrix = new Matrix();
        this._backPivotMatrix = new Matrix();
        this._transformMatrix = new Matrix();
        /**
         * Gets or sets a boolean indicating that this block can evaluate context
         * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
         */
        this.evaluateContext = true;
        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix, true);
        this.registerInput("translation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());
        this.registerInput("pivot", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryTransformBlock";
    }
    /**
     * Gets the value input component
     */
    get value() {
        return this._inputs[0];
    }
    /**
     * Gets the matrix input component
     */
    get matrix() {
        return this._inputs[1];
    }
    /**
     * Gets the translation input component
     */
    get translation() {
        return this._inputs[2];
    }
    /**
     * Gets the rotation input component
     */
    get rotation() {
        return this._inputs[3];
    }
    /**
     * Gets the scaling input component
     */
    get scaling() {
        return this._inputs[4];
    }
    /**
     * Gets the pivot input component
     */
    get pivot() {
        return this._inputs[5];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (state) => {
            const value = this.value.getConnectedValue(state);
            if (!value) {
                return null;
            }
            let matrix;
            if (this.matrix.isConnected) {
                matrix = this.matrix.getConnectedValue(state);
            }
            else {
                const scaling = this.scaling.getConnectedValue(state) || Vector3.OneReadOnly;
                const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                const translation = this.translation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                const pivot = this.pivot.getConnectedValue(state) || Vector3.ZeroReadOnly;
                // Transform
                Matrix.TranslationToRef(-pivot.x, -pivot.y, -pivot.z, this._pivotMatrix);
                Matrix.ScalingToRef(scaling.x, scaling.y, scaling.z, this._scalingMatrix);
                Matrix.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, this._rotationMatrix);
                Matrix.TranslationToRef(translation.x + pivot.x, translation.y + pivot.y, translation.z + pivot.z, this._translationMatrix);
                this._pivotMatrix.multiplyToRef(this._scalingMatrix, this._backPivotMatrix);
                this._backPivotMatrix.multiplyToRef(this._rotationMatrix, this._scalingRotationMatrix);
                this._scalingRotationMatrix.multiplyToRef(this._translationMatrix, this._transformMatrix);
                matrix = this._transformMatrix;
            }
            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Geometry: {
                    const geometry = value.clone();
                    geometry.transform(matrix);
                    return geometry;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2:
                    return Vector2.Transform(value, matrix);
                case NodeGeometryBlockConnectionPointTypes.Vector3:
                    return Vector3.TransformCoordinates(value, matrix);
                case NodeGeometryBlockConnectionPointTypes.Vector4:
                    return Vector4.TransformCoordinates(value, matrix);
            }
            return null;
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
], GeometryTransformBlock.prototype, "evaluateContext", void 0);
RegisterClass("BABYLON.GeometryTransformBlock", GeometryTransformBlock);
//# sourceMappingURL=geometryTransformBlock.js.map