import { RichTypeFlowGraphInteger } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { FlowGraphInteger } from "../../../flowGraphInteger.js";
/**
 * A block that executes a branch a set number of times.
 * @experimental
 */
export class FlowGraphDoNBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(
    /**
     * [Object] the configuration of the block
     */
    config = { startIndex: new FlowGraphInteger(0) }) {
        super(config);
        this.config = config;
        this.reset = this._registerSignalInput("reset");
        this.n = this.registerDataInput("n", RichTypeFlowGraphInteger);
        this.value = this.registerDataOutput("value", RichTypeFlowGraphInteger);
    }
    _execute(context, callingSignal) {
        if (callingSignal === this.reset) {
            this.value.setValue(this.config.startIndex, context);
        }
        else {
            const currentCountValue = this.value.getValue(context);
            if (currentCountValue.value < this.n.getValue(context).value) {
                this.value.setValue(new FlowGraphInteger(currentCountValue.value + 1), context);
                this.out._activateSignal(context);
            }
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphDoNBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphDoNBlock.ClassName = "FGDoNBlock";
RegisterClass(FlowGraphDoNBlock.ClassName, FlowGraphDoNBlock);
//# sourceMappingURL=flowGraphDoNBlock.js.map