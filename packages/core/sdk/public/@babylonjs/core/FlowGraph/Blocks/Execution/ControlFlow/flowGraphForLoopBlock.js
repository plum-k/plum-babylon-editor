import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RichTypeNumber } from "../../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * Block that executes an action in a loop.
 */
export class FlowGraphForLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.startIndex = this.registerDataInput("startIndex", RichTypeNumber);
        this.endIndex = this.registerDataInput("endIndex", RichTypeNumber);
        this.step = this.registerDataInput("step", RichTypeNumber);
        this.index = this.registerDataOutput("index", RichTypeNumber);
        this.onLoop = this._registerSignalOutput("onLoop");
    }
    _executeLoop(context) {
        let index = context._getExecutionVariable(this, "index");
        const endIndex = context._getExecutionVariable(this, "endIndex");
        if (index < endIndex) {
            this.index.setValue(index, context);
            this.onLoop._activateSignal(context);
            const step = context._getExecutionVariable(this, "step", 1);
            index += step;
            context._setExecutionVariable(this, "index", index);
            this._executeLoop(context);
        }
        else {
            this.out._activateSignal(context);
        }
    }
    /**
     * @internal
     */
    _execute(context) {
        const index = this.startIndex.getValue(context);
        const endIndex = this.endIndex.getValue(context);
        const step = this.step.getValue(context);
        context._setExecutionVariable(this, "index", index);
        context._setExecutionVariable(this, "endIndex", endIndex);
        context._setExecutionVariable(this, "step", step);
        this._executeLoop(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGForLoopBlock";
    }
}
RegisterClass("FGForLoopBlock", FlowGraphForLoopBlock);
//# sourceMappingURL=flowGraphForLoopBlock.js.map