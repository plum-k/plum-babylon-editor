import { RichTypeBoolean } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that evaluates a condition and executes one of two branches.
 */
export class FlowGraphBranchBlock extends FlowGraphExecutionBlock {
    constructor(config) {
        super(config);
        this.condition = this.registerDataInput("condition", RichTypeBoolean);
        this.onTrue = this._registerSignalOutput("onTrue");
        this.onFalse = this._registerSignalOutput("onFalse");
    }
    _execute(context) {
        if (this.condition.getValue(context)) {
            this.onTrue._activateSignal(context);
        }
        else {
            this.onFalse._activateSignal(context);
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGBranchBlock";
    }
}
RegisterClass("FGBranchBlock", FlowGraphBranchBlock);
//# sourceMappingURL=flowGraphBranchBlock.js.map