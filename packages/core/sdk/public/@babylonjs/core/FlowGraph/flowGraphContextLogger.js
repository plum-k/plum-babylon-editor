import { Tools } from "../Misc/tools.js";
/**
 * @experimental
 * This class is a decorator for the context which logs the nodes that were executed.
 */
export class FlowGraphContextLogger {
    constructor(_context) {
        this._context = _context;
        this._context.onNodeExecutedObservable.add((node) => {
            Tools.Log(`Node executed: ${node.getClassName()}`);
        });
    }
}
//# sourceMappingURL=flowGraphContextLogger.js.map