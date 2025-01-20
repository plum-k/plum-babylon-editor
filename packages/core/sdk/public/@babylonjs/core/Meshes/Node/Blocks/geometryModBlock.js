import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to compute value of one parameter modulo another
 */
export class GeometryModBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryModBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryModBlock";
    }
    /**
     * Gets the left operand input component
     */
    get left() {
        return this._inputs[0];
    }
    /**
     * Gets the right operand input component
     */
    get right() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.left.isConnected || !this.right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (left, right) => {
            return left - Math.floor(left / right) * right;
        };
        this.output._storedFunction = (state) => {
            const left = this.left.getConnectedValue(state);
            const right = this.right.getConnectedValue(state);
            switch (this.left.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func(left, right);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(left.x, right.x), func(left.y, right.y));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(left.x, right.x), func(left.y, right.y), func(left.z, right.z));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func(left.x, right.x), func(left.y, right.y), func(left.z, right.z), func(left.w, right.w));
                }
            }
            return 0;
        };
        return this;
    }
}
RegisterClass("BABYLON.GeometryModBlock", GeometryModBlock);
//# sourceMappingURL=geometryModBlock.js.map