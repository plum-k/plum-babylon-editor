import { FlowGraphConnection } from "./flowGraphConnection.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * @experimental
 * Represents a connection point for a signal.
 * When an output point is activated, it will activate the connected input point.
 * When an input point is activated, it will execute the block it belongs to.
 */
export class FlowGraphSignalConnection extends FlowGraphConnection {
    /**
     * @internal
     * A signal input can be connected to more than one signal output,
     * but a signal output can only connect to one signal input
     * @returns true if the connection is singular
     */
    _isSingularConnection() {
        return this.connectionType === 1 /* FlowGraphConnectionType.Output */;
    }
    /**
     * @internal
     */
    _activateSignal(context) {
        if (this.connectionType === 0 /* FlowGraphConnectionType.Input */) {
            context._notifyExecuteNode(this._ownerBlock);
            this._ownerBlock._execute(context, this);
            context._increaseExecutionId();
        }
        else {
            this._connectedPoint[0]?._activateSignal(context);
        }
    }
}
RegisterClass("FlowGraphSignalConnection", FlowGraphSignalConnection);
//# sourceMappingURL=flowGraphSignalConnection.js.map