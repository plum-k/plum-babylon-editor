import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to get the value of the first parameter raised to the power of the second
 */
export class GeometryPowBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryPowBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("power", NodeGeometryBlockConnectionPointTypes.AutoDetect);
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
        return "GeometryPowBlock";
    }
    /**
     * Gets the value operand input component
     */
    get value() {
        return this._inputs[0];
    }
    /**
     * Gets the power operand input component
     */
    get power() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.value.isConnected || !this.power.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (value, power) => {
            return Math.pow(value, power);
        };
        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const power = this.power.getConnectedValue(state);
            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func(source, power);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(source.x, power), func(source.y, power));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(source.x, power), func(source.y, power), func(source.z, power));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func(source.x, power), func(source.y, power), func(source.z, power), func(source.w, power));
                }
            }
            return 0;
        };
        return this;
    }
}
RegisterClass("BABYLON.GeometryPowBlock", GeometryPowBlock);
//# sourceMappingURL=geometryPowBlock.js.map