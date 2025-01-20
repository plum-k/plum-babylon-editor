import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphCircleOfConfusionTask } from "../../../Tasks/PostProcesses/circleOfConfusionTask.js";
import { ThinCircleOfConfusionPostProcess } from "../../../../PostProcesses/thinCircleOfConfusionPostProcess.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the circle of confusion post process
 */
export class NodeRenderGraphCircleOfConfusionPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphCircleOfConfusionPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphCircleOfConfusionTask(this.name, frameGraph, new ThinCircleOfConfusionPostProcess(name, scene.getEngine(), { depthNotNormalized: true }));
    }
    /** Sampling mode used to sample from the depth texture */
    get depthSamplingMode() {
        return this._frameGraphTask.depthSamplingMode;
    }
    set depthSamplingMode(value) {
        this._frameGraphTask.depthSamplingMode = value;
    }
    /** Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    get lensSize() {
        return this._frameGraphTask.postProcess.lensSize;
    }
    set lensSize(value) {
        this._frameGraphTask.postProcess.lensSize = value;
    }
    /** F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop */
    get fStop() {
        return this._frameGraphTask.postProcess.fStop;
    }
    set fStop(value) {
        this._frameGraphTask.postProcess.fStop = value;
    }
    /** Distance away from the camera to focus on in scene units/1000 (eg. millimeter) */
    get focusDistance() {
        return this._frameGraphTask.postProcess.focusDistance;
    }
    set focusDistance(value) {
        this._frameGraphTask.postProcess.focusDistance = value;
    }
    /** Focal length of the effect's camera in scene units/1000 (eg. millimeter) */
    get focalLength() {
        return this._frameGraphTask.postProcess.focalLength;
    }
    set focalLength(value) {
        this._frameGraphTask.postProcess.focalLength = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphCircleOfConfusionPostProcessBlock";
    }
    /**
     * Gets the geometry view depth input component
     */
    get geomViewDepth() {
        return this._inputs[2];
    }
    /**
     * Gets the camera input component
     */
    get camera() {
        return this._inputs[3];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this._frameGraphTask.depthTexture = this.geomViewDepth.connectedPoint?.value;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.lensSize = ${this.lensSize};`);
        codes.push(`${this._codeVariableName}.fStop = ${this.fStop};`);
        codes.push(`${this._codeVariableName}.focusDistance = ${this.focusDistance};`);
        codes.push(`${this._codeVariableName}.focalLength = ${this.focalLength};`);
        codes.push(`${this._codeVariableName}.depthSamplingMode = ${this.depthSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.lensSize = this.lensSize;
        serializationObject.fStop = this.fStop;
        serializationObject.focusDistance = this.focusDistance;
        serializationObject.focalLength = this.focalLength;
        serializationObject.depthSamplingMode = this.depthSamplingMode;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.lensSize = serializationObject.lensSize;
        this.fStop = serializationObject.fStop;
        this.focusDistance = serializationObject.focusDistance;
        this.focalLength = serializationObject.focalLength;
        this.depthSamplingMode = serializationObject.depthSamplingMode;
    }
}
__decorate([
    editableInPropertyPage("Depth sampling mode", 6 /* PropertyTypeForEdition.SamplingMode */, "PROPERTIES")
], NodeRenderGraphCircleOfConfusionPostProcessBlock.prototype, "depthSamplingMode", null);
__decorate([
    editableInPropertyPage("Lens size", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphCircleOfConfusionPostProcessBlock.prototype, "lensSize", null);
__decorate([
    editableInPropertyPage("F-Stop", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphCircleOfConfusionPostProcessBlock.prototype, "fStop", null);
__decorate([
    editableInPropertyPage("Focus distance", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphCircleOfConfusionPostProcessBlock.prototype, "focusDistance", null);
__decorate([
    editableInPropertyPage("Focal length", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphCircleOfConfusionPostProcessBlock.prototype, "focalLength", null);
RegisterClass("BABYLON.NodeRenderGraphCircleOfConfusionPostProcessBlock", NodeRenderGraphCircleOfConfusionPostProcessBlock);
//# sourceMappingURL=circleOfConfusionPostProcessBlock.js.map