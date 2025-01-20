import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RichTypeAny } from "../../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that stops a running animation
 */
export class FlowGraphStopAnimationBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.animationToStop = this.registerDataInput("animationToStop", RichTypeAny);
    }
    _execute(context) {
        const animationToStopValue = this.animationToStop.getValue(context);
        animationToStopValue.stop();
        this.out._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGStopAnimationBlock";
    }
}
RegisterClass("FGStopAnimationBlock", FlowGraphStopAnimationBlock);
//# sourceMappingURL=flowGraphStopAnimationBlock.js.map