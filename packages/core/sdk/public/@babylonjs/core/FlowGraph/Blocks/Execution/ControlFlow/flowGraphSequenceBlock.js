import { RegisterClass } from "../../../../Misc/typeStore.js";
import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock.js";
/**
 * @experimental
 * A block that executes its output flows in sequence.
 */
export class FlowGraphSequenceBlock extends FlowGraphExecutionBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.outFlows = [];
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows.push(this._registerSignalOutput(`${i}`));
        }
    }
    _execute(context) {
        for (let i = 0; i < this.config.numberOutputFlows; i++) {
            this.outFlows[i]._activateSignal(context);
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphSequenceBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphSequenceBlock.ClassName = "FGSequenceBlock";
RegisterClass(FlowGraphSequenceBlock.ClassName, FlowGraphSequenceBlock);
//# sourceMappingURL=flowGraphSequenceBlock.js.map