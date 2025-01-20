import { FlowGraphBlock } from "../../flowGraphBlock.js";
import { RichTypeAny } from "../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * A block that gets the value of a variable.
 * @experimental
 */
export class FlowGraphGetVariableBlock extends FlowGraphBlock {
    /**
     * Construct a FlowGraphGetVariableBlock.
     * @param config construction parameters
     */
    constructor(config) {
        super(config);
        this.config = config;
        // The output connection has to have the name of the variable.
        this.output = this.registerDataOutput(config.variableName, RichTypeAny);
    }
    /**
     * @internal
     */
    _updateOutputs(context) {
        const variableNameValue = this.config.variableName;
        if (context.hasVariable(variableNameValue)) {
            this.output.setValue(context.getVariable(variableNameValue), context);
        }
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return FlowGraphGetVariableBlock.ClassName;
    }
    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.config.variableName = this.config.variableName;
    }
}
/**
 * Class name of the block.
 */
FlowGraphGetVariableBlock.ClassName = "FGGetVariableBlock";
RegisterClass(FlowGraphGetVariableBlock.ClassName, FlowGraphGetVariableBlock);
//# sourceMappingURL=flowGraphGetVariableBlock.js.map