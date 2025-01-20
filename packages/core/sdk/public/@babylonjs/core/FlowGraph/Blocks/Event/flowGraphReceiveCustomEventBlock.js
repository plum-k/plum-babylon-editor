import { FlowGraphEventBlock } from "../../flowGraphEventBlock.js";
import { Tools } from "../../../Misc/tools.js";
import { RichTypeAny } from "../../flowGraphRichTypes.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that receives a custom event. It saves the data sent in the eventData output.
 */
export class FlowGraphReceiveCustomEventBlock extends FlowGraphEventBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        for (let i = 0; i < this.config.eventData.length; i++) {
            const dataName = this.config.eventData[i];
            this.registerDataOutput(dataName, RichTypeAny);
        }
    }
    _preparePendingTasks(context) {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        this._eventObserver = observable.add((eventDatas) => {
            for (let i = 0; i < eventDatas.length; i++) {
                this.dataOutputs[i].setValue(eventDatas[i], context);
            }
            this._execute(context);
        });
    }
    _cancelPendingTasks(context) {
        const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
        if (observable) {
            observable.remove(this._eventObserver);
        }
        else {
            Tools.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphReceiveCustomEventBlock.ClassName;
    }
    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.eventId = this.config.eventId;
        serializationObject.eventData = this.config.eventData;
    }
}
/**
 * the class name of the block.
 */
FlowGraphReceiveCustomEventBlock.ClassName = "FGReceiveCustomEventBlock";
RegisterClass(FlowGraphReceiveCustomEventBlock.ClassName, FlowGraphReceiveCustomEventBlock);
//# sourceMappingURL=flowGraphReceiveCustomEventBlock.js.map