import { RichTypeNumber } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that counts the number of times it has been called.
 */
export class FlowGraphCounterBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.count = this.registerDataOutput("count", RichTypeNumber);
        this.reset = this._registerSignalInput("reset");
    }
    _execute(context, callingSignal) {
        if (callingSignal === this.reset) {
            context._setExecutionVariable(this, "count", 0);
            this.count.setValue(0, context);
            return;
        }
        const countValue = (context._getExecutionVariable(this, "count") ?? 0) + 1;
        context._setExecutionVariable(this, "count", countValue);
        this.count.setValue(countValue, context);
        this.out._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGCounterBlock";
    }
}
RegisterClass("FGCounterBlock", FlowGraphCounterBlock);
//# sourceMappingURL=flowGraphCounterBlock.js.map