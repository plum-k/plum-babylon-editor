import { RichTypeNumber } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * This block debounces the execution of a input, i.e. ensures that the input is only executed once every X times
 */
export class FlowGraphDebounceBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.count = this.registerDataInput("count", RichTypeNumber);
        this.reset = this._registerSignalInput("reset");
        this.currentCount = this.registerDataOutput("currentCount", RichTypeNumber);
    }
    _execute(context, callingSignal) {
        if (callingSignal === this.reset) {
            context._setExecutionVariable(this, "debounceCount", 0);
            return;
        }
        const count = this.count.getValue(context);
        const currentCount = context._getExecutionVariable(this, "debounceCount", 0);
        const newCount = currentCount + 1;
        this.currentCount.setValue(newCount, context);
        context._setExecutionVariable(this, "debounceCount", newCount);
        if (newCount >= count) {
            this.out._activateSignal(context);
            context._setExecutionVariable(this, "debounceCount", 0);
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGDebounceBlock";
    }
}
RegisterClass("FGDebounceBlock", FlowGraphDebounceBlock);
//# sourceMappingURL=flowGraphDebounceBlock.js.map