import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
/**
 * Block used to replace a color by another one
 */
export class GeometryReplaceColorBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryReplaceColorBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("reference", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("distance", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("replacement", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
        this._linkConnectionTypes(0, 3);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[3].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[3].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryReplaceColorBlock";
    }
    /**
     * Gets the value input component
     */
    get value() {
        return this._inputs[0];
    }
    /**
     * Gets the reference input component
     */
    get reference() {
        return this._inputs[1];
    }
    /**
     * Gets the distance input component
     */
    get distance() {
        return this._inputs[2];
    }
    /**
     * Gets the replacement input component
     */
    get replacement() {
        return this._inputs[3];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.value.isConnected || !this.reference.isConnected || !this.replacement.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        this.output._storedFunction = (state) => {
            const value = this.value.getConnectedValue(state);
            const reference = this.reference.getConnectedValue(state);
            const distance = this.distance.getConnectedValue(state);
            const replacement = this.replacement.getConnectedValue(state);
            if (value.subtract(reference).length() < distance) {
                return replacement;
            }
            else {
                return value;
            }
        };
        return this;
    }
}
RegisterClass("BABYLON.GeometryReplaceColorBlock", GeometryReplaceColorBlock);
//# sourceMappingURL=geometryReplaceColorBlock.js.map