import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock.js";
/**
 * An async execution block can start tasks that will be executed asynchronously.
 * It should also be responsible for clearing it in _cancelPendingTasks.
 * @experimental
 */
export class FlowGraphAsyncExecutionBlock extends FlowGraphExecutionBlock {
    constructor(config) {
        super(config);
        this.out = this._registerSignalOutput("out");
        this.done = this._registerSignalOutput("done");
    }
    /**
     * @internal
     * @param context
     */
    _startPendingTasks(context) {
        this._preparePendingTasks(context);
        context._addPendingBlock(this);
    }
}
//# sourceMappingURL=flowGraphAsyncExecutionBlock.js.map