import { RichTypeNumber } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that throttles the execution of its output flow.
 */
export class FlowGraphThrottleBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.reset = this._registerSignalInput("reset");
        this.duration = this.registerDataInput("duration", RichTypeNumber);
        this.timeRemaining = this.registerDataOutput("timeRemaining", RichTypeNumber);
    }
    _execute(context, callingSignal) {
        const lastExecutedTime = context._getExecutionVariable(this, "lastExecutedTime");
        const durationValue = this.duration.getValue(context);
        const currentTime = Date.now();
        if (callingSignal === this.reset || lastExecutedTime === undefined || currentTime - lastExecutedTime > durationValue) {
            //activate the output flow
            this.timeRemaining.setValue(0, context);
            this.out._activateSignal(context);
            context._setExecutionVariable(this, "lastExecutedTime", currentTime);
        }
        else {
            //activate the output flow after the remaining time
            const remaining = durationValue - (currentTime - lastExecutedTime);
            this.timeRemaining.setValue(remaining, context);
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGThrottleBlock";
    }
}
RegisterClass("FGThrottleBlock", FlowGraphThrottleBlock);
//# sourceMappingURL=flowGraphThrottleBlock.js.map