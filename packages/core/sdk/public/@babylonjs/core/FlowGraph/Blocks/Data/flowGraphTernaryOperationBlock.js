import { FlowGraphCachedOperationBlock } from "./flowGraphCachedOperationBlock.js";
/**
 * @experimental
 * The base block for all ternary operation blocks.
 */
export class FlowGraphTernaryOperationBlock extends FlowGraphCachedOperationBlock {
    constructor(t1Type, t2Type, t3Type, resultRichType, _operation, _className, config) {
        super(resultRichType, config);
        this._operation = _operation;
        this._className = _className;
        this.a = this.registerDataInput("a", t1Type);
        this.b = this.registerDataInput("b", t2Type);
        this.c = this.registerDataInput("c", t3Type);
    }
    /**
     * the operation performed by this block
     * @param context the graph context
     * @returns the result of the operation
     */
    _doOperation(context) {
        return this._operation(this.a.getValue(context), this.b.getValue(context), this.c.getValue(context));
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return this._className;
    }
}
//# sourceMappingURL=flowGraphTernaryOperationBlock.js.map