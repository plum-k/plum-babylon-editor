import { FlowGraphExecutionBlock } from "../../../flowGraphExecutionBlock.js";
import { RichTypeAny } from "../../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that executes a branch based on a selection.
 */
export class FlowGraphSwitchBlock extends FlowGraphExecutionBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.selection = this.registerDataInput("selection", RichTypeAny);
        this.outputFlows = [];
        for (let i = 0; i <= this.config.cases.length; i++) {
            this.outputFlows.push(this._registerSignalOutput(`out${i}`));
        }
    }
    _execute(context, _callingSignal) {
        const selectionValue = this.selection.getValue(context);
        for (let i = 0; i < this.config.cases.length; i++) {
            if (selectionValue === this.config.cases[i]) {
                this.outputFlows[i]._activateSignal(context);
                return;
            }
        }
        // default case
        this.outputFlows[this.outputFlows.length - 1]._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGSwitchBlock";
    }
    /**
     * Serialize the block to a JSON representation.
     * @param serializationObject the object to serialize to.
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.cases = this.config.cases;
    }
}
RegisterClass("FGSwitchBlock", FlowGraphSwitchBlock);
//# sourceMappingURL=flowGraphSwitchBlock.js.map