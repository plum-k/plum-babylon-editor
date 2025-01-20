import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to compute arc tangent of 2 values
 */
export class GeometryArcTan2Block extends NodeGeometryBlock {
    /**
     * Creates a new GeometryArcTan2Block
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("x", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("y", NodeGeometryBlockConnectionPointTypes.AutoDetect);
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
        return "GeometryArcTan2Block";
    }
    /**
     * Gets the x operand input component
     */
    get x() {
        return this._inputs[0];
    }
    /**
     * Gets the y operand input component
     */
    get y() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.x.isConnected || !this.y.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (x, y) => {
            return Math.atan2(x, y);
        };
        this.output._storedFunction = (state) => {
            const x = this.x.getConnectedValue(state);
            const y = this.y.getConnectedValue(state);
            switch (this.x.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func(x, y);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(x.x, y.x), func(x.y, y.y));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(x.x, y.x), func(x.y, y.y), func(x.z, y.z));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func(x.x, y.x), func(x.y, y.y), func(x.z, y.z), func(x.w, y.w));
                }
            }
            return 0;
        };
    }
}
RegisterClass("BABYLON.GeometryArcTan2Block", GeometryArcTan2Block);
//# sourceMappingURL=geometryArcTan2Block.js.map