import { RegisterClass } from "../../../Misc/typeStore.js";
import { FlowGraphBlock } from "../../flowGraphBlock.js";
import { RichTypeAny } from "../../flowGraphRichTypes.js";
import { FlowGraphPathConverterComponent } from "../../flowGraphPathConverterComponent.js";
/**
 * @experimental
 */
export class FlowGraphGetPropertyBlock extends FlowGraphBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        this.value = this.registerDataOutput("value", RichTypeAny);
        this.templateComponent = new FlowGraphPathConverterComponent(config.path, this);
    }
    _updateOutputs(context) {
        const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
        const value = accessorContainer.info.get(accessorContainer.object);
        this.value.setValue(value, context);
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return FlowGraphGetPropertyBlock.ClassName;
    }
    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject = {}) {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path;
    }
}
/**
 * Class name of the block.
 */
FlowGraphGetPropertyBlock.ClassName = "FGGetPropertyBlock";
RegisterClass(FlowGraphGetPropertyBlock.ClassName, FlowGraphGetPropertyBlock);
//# sourceMappingURL=flowGraphGetPropertyBlock.js.map