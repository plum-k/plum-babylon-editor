import { RichTypeAny } from "../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { FlowGraphPathConverterComponent } from "../../flowGraphPathConverterComponent.js";
/**
 * @experimental
 * Block that sets a property on a target object.
 */
export class FlowGraphSetPropertyBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.a = this.registerDataInput("a", RichTypeAny);
        this.templateComponent = new FlowGraphPathConverterComponent(config.path, this);
    }
    _execute(context) {
        const value = this.a.getValue(context);
        const accessor = this.templateComponent.getAccessor(this.config.pathConverter, context);
        accessor.info.set(value, accessor.object);
        this.out._activateSignal(context);
    }
    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    serialize(serializationObject = {}) {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path;
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphSetPropertyBlock.ClassName;
    }
}
/**
 * Class name of the block.
 */
FlowGraphSetPropertyBlock.ClassName = "FGSetPropertyBlock";
RegisterClass("FGSetPropertyBlock", FlowGraphSetPropertyBlock);
//# sourceMappingURL=flowGraphSetPropertyBlock.js.map