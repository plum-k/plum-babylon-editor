import { RichTypeAny } from "../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * @experimental
 */
export class FlowGraphSendCustomEventBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        for (let i = 0; i < this.config.eventData.length; i++) {
            const dataName = this.config.eventData[i];
            this.registerDataInput(dataName, RichTypeAny);
        }
    }
    _execute(context) {
        const eventId = this.config.eventId;
        const eventDatas = this.dataInputs.map((port) => port.getValue(context));
        context.configuration.coordinator.notifyCustomEvent(eventId, eventDatas);
        this.out._activateSignal(context);
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphSendCustomEventBlock.ClassName;
    }
}
/**
 * the class name of the block.
 */
FlowGraphSendCustomEventBlock.ClassName = "FGSendCustomEventBlock";
RegisterClass("FGSendCustomEventBlock", FlowGraphSendCustomEventBlock);
//# sourceMappingURL=flowGraphSendCustomEventBlock.js.map