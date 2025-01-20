import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RichTypeAny } from "../../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that pauses a running animation
 */
export class FlowGraphPauseAnimationBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.animationToPause = this.registerDataInput("animationToPause", RichTypeAny);
    }
    _execute(context) {
        const animationToPauseValue = this.animationToPause.getValue(context);
        animationToPauseValue.pause();
        this.out._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGPauseAnimationBlock";
    }
}
RegisterClass("FGPauseAnimationBlock", FlowGraphPauseAnimationBlock);
//# sourceMappingURL=flowGraphPauseAnimationBlock.js.map