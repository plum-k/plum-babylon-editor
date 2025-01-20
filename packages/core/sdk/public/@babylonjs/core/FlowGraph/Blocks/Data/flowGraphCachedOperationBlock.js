import { FlowGraphBlock } from "../../flowGraphBlock.js";
const cacheName = "cachedOperationValue";
const cacheExecIdName = "cachedExecutionId";
/**
 * @experimental
 */
export class FlowGraphCachedOperationBlock extends FlowGraphBlock {
    constructor(outputRichType, config) {
        super(config);
        this.value = this.registerDataOutput("value", outputRichType);
    }
    _updateOutputs(context) {
        const cachedExecutionId = context._getExecutionVariable(this, cacheExecIdName);
        const cachedValue = context._getExecutionVariable(this, cacheName);
        if (cachedValue !== undefined && cachedExecutionId === context.executionId) {
            this.value.setValue(cachedValue, context);
        }
        else {
            const calculatedValue = this._doOperation(context);
            context._setExecutionVariable(this, cacheName, calculatedValue);
            context._setExecutionVariable(this, cacheExecIdName, context.executionId);
            this.value.setValue(calculatedValue, context);
        }
    }
}
//# sourceMappingURL=flowGraphCachedOperationBlock.js.map