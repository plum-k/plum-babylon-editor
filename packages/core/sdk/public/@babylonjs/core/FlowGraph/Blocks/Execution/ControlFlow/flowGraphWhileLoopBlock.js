import { RichTypeBoolean } from "../../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
/**
 * @experimental
 * A block that executes a branch while a condition is true.
 */
export class FlowGraphWhileLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.condition = this.registerDataInput("condition", RichTypeBoolean);
        this.loopBody = this._registerSignalOutput("loopBody");
    }
    _execute(context, _callingSignal) {
        let conditionValue = this.condition.getValue(context);
        if (this.config?.isDo && !conditionValue) {
            this.loopBody._activateSignal(context);
        }
        while (conditionValue) {
            this.loopBody._activateSignal(context);
            conditionValue = this.condition.getValue(context);
        }
        this.out._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphWhileLoopBlock.ClassName;
    }
    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.isDo = this.config?.isDo;
    }
}
/**
 * the class name of the block.
 */
FlowGraphWhileLoopBlock.ClassName = "FGWhileLoopBlock";
RegisterClass(FlowGraphWhileLoopBlock.ClassName, FlowGraphWhileLoopBlock);
//# sourceMappingURL=flowGraphWhileLoopBlock.js.map