import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock.js";
/**
 * @experimental
 * An execution block that has an out signal. This signal is triggered when the synchronous execution of this block is done.
 * Most execution blocks will inherit from this, except for the ones that have multiple signals to be triggered.
 * (such as if blocks)
 */
export class FlowGraphExecutionBlockWithOutSignal extends FlowGraphExecutionBlock {
    constructor(config) {
        super(config);
        this.out = this._registerSignalOutput("out");
    }
}
//# sourceMappingURL=flowGraphExecutionBlockWithOutSignal.js.map