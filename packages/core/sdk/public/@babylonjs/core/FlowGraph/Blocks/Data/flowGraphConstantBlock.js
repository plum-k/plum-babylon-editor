import { FlowGraphBlock } from "../../flowGraphBlock.js";
import { getRichTypeFromValue } from "../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { defaultValueSerializationFunction } from "../../serialization.js";
/**
 * @experimental
 * Block that returns a constant value.
 */
export class FlowGraphConstantBlock extends FlowGraphBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.output = this.registerDataOutput("output", getRichTypeFromValue(config.value));
    }
    _updateOutputs(context) {
        this.output.setValue(this.config.value, context);
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return "FGConstantBlock";
    }
    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     * @param valueSerializeFunction the function to use to serialize the value
     */
    serialize(serializationObject = {}, valueSerializeFunction = defaultValueSerializationFunction) {
        super.serialize(serializationObject);
        valueSerializeFunction("value", this.config.value, serializationObject.config);
    }
}
RegisterClass("FGConstantBlock", FlowGraphConstantBlock);
//# sourceMappingURL=flowGraphConstantBlock.js.map