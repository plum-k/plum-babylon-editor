import { RichTypeAny } from "../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Block to set a variable.
 * @experimental
 */
export class FlowGraphSetVariableBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.input = this.registerDataInput(config.variableName, RichTypeAny);
    }
    _execute(context) {
        const variableNameValue = this.config.variableName;
        const inputValue = this.input.getValue(context);
        context.setVariable(variableNameValue, inputValue);
        this.out._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphSetVariableBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphSetVariableBlock.ClassName = "FGSetVariableBlock";
RegisterClass(FlowGraphSetVariableBlock.ClassName, FlowGraphSetVariableBlock);
//# sourceMappingURL=flowGraphSetVariableBlock.js.map