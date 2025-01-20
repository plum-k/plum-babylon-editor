import { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock.js";
/**
 * @experimental
 * A type of block that listens to an event observable and activates
 * its output signal when the event is triggered.
 */
export class FlowGraphEventBlock extends FlowGraphAsyncExecutionBlock {
    /**
     * @internal
     */
    _execute(context) {
        context._notifyExecuteNode(this);
        this.out._activateSignal(context);
    }
}
//# sourceMappingURL=flowGraphEventBlock.js.map