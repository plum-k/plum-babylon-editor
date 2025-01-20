import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock.js";
/**
 * @experimental
 * Block that outputs a value of type ResultT, resulting of an operation with no inputs.
 */
export class FlowGraphConstantOperationBlock extends FlowGraphCachedOperationBlock {
    constructor(richType, _operation, _className, config) {
        super(richType, config);
        this._operation = _operation;
        this._className = _className;
    }
    /**
     * the operation performed by this block
     * @param _context the graph context
     * @returns the result of the operation
     */
    _doOperation(_context) {
        return this._operation();
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return this._className;
    }
}
//# sourceMappingURL=flowGraphConstantOperationBlock.js.map