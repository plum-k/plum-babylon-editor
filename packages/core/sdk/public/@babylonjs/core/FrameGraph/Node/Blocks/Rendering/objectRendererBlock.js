import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphObjectRendererTask } from "../../../Tasks/Rendering/objectRendererTask.js";
import { NodeRenderGraphBaseObjectRendererBlock } from "./baseObjectRendererBlock.js";
/**
 * Block that render objects to a render target
 */
export class NodeRenderGraphObjectRendererBlock extends NodeRenderGraphBaseObjectRendererBlock {
    /**
     * Create a new NodeRenderGraphObjectRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     */
    constructor(name, frameGraph, scene, doNotChangeAspectRatio = true) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [doNotChangeAspectRatio];
        this._frameGraphTask = new FrameGraphObjectRendererTask(this.name, frameGraph, scene, { doNotChangeAspectRatio });
    }
    /** True (default) to not change the aspect ratio of the scene in the RTT */
    get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }
    set doNotChangeAspectRatio(value) {
        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphObjectRendererTask(this.name, this._frameGraph, this._scene, { doNotChangeAspectRatio: value });
        this._additionalConstructionParameters = [value];
    }
    /** Indicates if shadows must be enabled or disabled */
    get disableShadows() {
        return this._frameGraphTask.disableShadows;
    }
    set disableShadows(value) {
        this._frameGraphTask.disableShadows = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphObjectRendererBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.doNotChangeAspectRatio = ${this.doNotChangeAspectRatio};`);
        codes.push(`${this._codeVariableName}.disableShadows = ${this.disableShadows};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.doNotChangeAspectRatio = this.doNotChangeAspectRatio;
        serializationObject.disableShadows = this.disableShadows;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.doNotChangeAspectRatio = serializationObject.doNotChangeAspectRatio;
        this.disableShadows = serializationObject.disableShadows;
    }
}
__decorate([
    editableInPropertyPage("Do not change aspect ratio", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphObjectRendererBlock.prototype, "doNotChangeAspectRatio", null);
__decorate([
    editableInPropertyPage("Disable shadows", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphObjectRendererBlock.prototype, "disableShadows", null);
RegisterClass("BABYLON.NodeRenderGraphObjectRendererBlock", NodeRenderGraphObjectRendererBlock);
//# sourceMappingURL=objectRendererBlock.js.map