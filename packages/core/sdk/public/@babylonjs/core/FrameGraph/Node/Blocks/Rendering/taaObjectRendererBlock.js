import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphTAAObjectRendererTask } from "../../../Tasks/Rendering/taaObjectRendererTask.js";
import { NodeRenderGraphBaseObjectRendererBlock } from "./baseObjectRendererBlock.js";
/**
 * Block that render objects with temporal anti-aliasing to a render target
 */
export class NodeRenderGraphTAAObjectRendererBlock extends NodeRenderGraphBaseObjectRendererBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphTAAObjectRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     */
    constructor(name, frameGraph, scene, doNotChangeAspectRatio = true) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [doNotChangeAspectRatio];
        this._frameGraphTask = new FrameGraphTAAObjectRendererTask(this.name, frameGraph, scene, { doNotChangeAspectRatio });
    }
    /** True (default) to not change the aspect ratio of the scene in the RTT */
    get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }
    set doNotChangeAspectRatio(value) {
        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphTAAObjectRendererTask(this.name, this._frameGraph, this._scene, { doNotChangeAspectRatio: value });
        this._additionalConstructionParameters = [value];
    }
    /** Number of accumulated samples */
    get samples() {
        return this._frameGraphTask.postProcess.samples;
    }
    set samples(value) {
        this._frameGraphTask.postProcess.samples = value;
    }
    /** The factor used to blend the history frame with current frame */
    get factor() {
        return this._frameGraphTask.postProcess.factor;
    }
    set factor(value) {
        this._frameGraphTask.postProcess.factor = value;
    }
    /** Indicates if depth testing must be enabled or disabled */
    get disableOnCameraMove() {
        return this._frameGraphTask.postProcess.disableOnCameraMove;
    }
    set disableOnCameraMove(value) {
        this._frameGraphTask.postProcess.disableOnCameraMove = value;
    }
    /** Indicates if TAA must be enabled or disabled */
    get disableTAA() {
        return this._frameGraphTask.postProcess.disabled;
    }
    set disableTAA(value) {
        this._frameGraphTask.postProcess.disabled = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphTAAObjectRendererBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.factor = ${this.factor};`);
        codes.push(`${this._codeVariableName}.disableOnCameraMove = ${this.disableOnCameraMove};`);
        codes.push(`${this._codeVariableName}.disableTAA = ${this.disableTAA};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.samples = this.samples;
        serializationObject.factor = this.factor;
        serializationObject.disableOnCameraMove = this.disableOnCameraMove;
        serializationObject.disableTAA = this.disableTAA;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.samples = serializationObject.samples;
        this.factor = serializationObject.factor;
        this.disableOnCameraMove = serializationObject.disableOnCameraMove;
        this.disableTAA = serializationObject.disableTAA;
    }
}
__decorate([
    editableInPropertyPage("Do not change aspect ratio", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphTAAObjectRendererBlock.prototype, "doNotChangeAspectRatio", null);
__decorate([
    editableInPropertyPage("Samples", 2 /* PropertyTypeForEdition.Int */, "TEMPORAL ANTI-ALIASING")
], NodeRenderGraphTAAObjectRendererBlock.prototype, "samples", null);
__decorate([
    editableInPropertyPage("Factor", 1 /* PropertyTypeForEdition.Float */, "TEMPORAL ANTI-ALIASING")
], NodeRenderGraphTAAObjectRendererBlock.prototype, "factor", null);
__decorate([
    editableInPropertyPage("Disable on camera move", 0 /* PropertyTypeForEdition.Boolean */, "TEMPORAL ANTI-ALIASING")
], NodeRenderGraphTAAObjectRendererBlock.prototype, "disableOnCameraMove", null);
__decorate([
    editableInPropertyPage("Disable TAA", 0 /* PropertyTypeForEdition.Boolean */, "TEMPORAL ANTI-ALIASING")
], NodeRenderGraphTAAObjectRendererBlock.prototype, "disableTAA", null);
RegisterClass("BABYLON.NodeRenderGraphTAAObjectRendererBlock", NodeRenderGraphTAAObjectRendererBlock);
//# sourceMappingURL=taaObjectRendererBlock.js.map