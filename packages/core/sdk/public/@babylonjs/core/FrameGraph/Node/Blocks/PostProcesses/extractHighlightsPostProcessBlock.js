import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphExtractHighlightsTask } from "../../../Tasks/PostProcesses/extractHighlightsTask.js";
import { ThinExtractHighlightsPostProcess } from "../../../../PostProcesses/thinExtractHighlightsPostProcess.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the extract highlights post process
 */
export class NodeRenderGraphExtractHighlightsPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new ExtractHighlightsPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphExtractHighlightsTask(this.name, frameGraph, new ThinExtractHighlightsPostProcess(name, scene.getEngine()));
    }
    /** The luminance threshold, pixels below this value will be set to black. */
    get threshold() {
        return this._frameGraphTask.postProcess.threshold;
    }
    set threshold(value) {
        this._frameGraphTask.postProcess.threshold = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphExtractHighlightsPostProcessBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.threshold = ${this.threshold};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.threshold = this.threshold;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.threshold = serializationObject.threshold;
    }
}
__decorate([
    editableInPropertyPage("Threshold", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphExtractHighlightsPostProcessBlock.prototype, "threshold", null);
RegisterClass("BABYLON.NodeRenderGraphExtractHighlightsPostProcessBlock", NodeRenderGraphExtractHighlightsPostProcessBlock);
//# sourceMappingURL=extractHighlightsPostProcessBlock.js.map