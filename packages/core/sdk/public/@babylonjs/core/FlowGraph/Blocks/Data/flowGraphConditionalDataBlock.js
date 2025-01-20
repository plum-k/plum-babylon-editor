import { FlowGraphBlock } from "../../flowGraphBlock.js";
import { RichTypeBoolean, RichTypeAny } from "../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that returns a value based on a condition.
 */
export class FlowGraphConditionalDataBlock extends FlowGraphBlock {
    constructor(config) {
        super(config);
        this.condition = this.registerDataInput("condition", RichTypeBoolean);
        this.trueValue = this.registerDataInput("trueValue", RichTypeAny);
        this.falseValue = this.registerDataInput("falseValue", RichTypeAny);
        this.output = this.registerDataOutput("output", RichTypeAny);
    }
    /**
     * @internal
     */
    _updateOutputs(context) {
        this.output.setValue(this.condition.getValue(context) ? this.trueValue.getValue(context) : this.falseValue.getValue(context), context);
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return "FGConditionalDataBlock";
    }
}
RegisterClass("FGConditionalDataBlock", FlowGraphConditionalDataBlock);
//# sourceMappingURL=flowGraphConditionalDataBlock.js.map