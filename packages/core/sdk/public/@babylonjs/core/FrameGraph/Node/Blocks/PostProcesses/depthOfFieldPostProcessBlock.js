import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphDepthOfFieldTask } from "../../../Tasks/PostProcesses/depthOfFieldTask.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the depth of field post process
 */
export class NodeRenderGraphDepthOfFieldPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphDepthOfFieldPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param blurLevel The quality of the depth of field effect (default: ThinDepthOfFieldEffectBlurLevel.Low)
     * @param hdr If high dynamic range textures should be used (default: false)
     */
    constructor(name, frameGraph, scene, blurLevel = 0 /* ThinDepthOfFieldEffectBlurLevel.Low */, hdr = false) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [blurLevel, hdr];
        this.registerInput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphDepthOfFieldTask(this.name, frameGraph, scene.getEngine(), blurLevel, hdr);
    }
    _createTask(blurLevel, hdr) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;
        const depthSamplingMode = this._frameGraphTask.depthSamplingMode;
        const focalLength = this._frameGraphTask.depthOfField.focalLength;
        const fStop = this._frameGraphTask.depthOfField.fStop;
        const focusDistance = this._frameGraphTask.depthOfField.focusDistance;
        const lensSize = this._frameGraphTask.depthOfField.lensSize;
        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphDepthOfFieldTask(this.name, this._frameGraph, this._scene.getEngine(), blurLevel, hdr);
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;
        this._frameGraphTask.depthSamplingMode = depthSamplingMode;
        this._frameGraphTask.depthOfField.focalLength = focalLength;
        this._frameGraphTask.depthOfField.fStop = fStop;
        this._frameGraphTask.depthOfField.focusDistance = focusDistance;
        this._frameGraphTask.depthOfField.lensSize = lensSize;
        this._additionalConstructionParameters = [blurLevel, hdr];
    }
    /** The quality of the blur effect */
    get blurLevel() {
        return this._frameGraphTask.depthOfField.blurLevel;
    }
    set blurLevel(value) {
        this._createTask(value, this._frameGraphTask.hdr);
    }
    /** If high dynamic range textures should be used */
    get hdr() {
        return this._frameGraphTask.hdr;
    }
    set hdr(value) {
        this._createTask(this._frameGraphTask.depthOfField.blurLevel, value);
    }
    /** Sampling mode used to sample from the depth texture */
    get depthSamplingMode() {
        return this._frameGraphTask.depthSamplingMode;
    }
    set depthSamplingMode(value) {
        this._frameGraphTask.depthSamplingMode = value;
    }
    /** The focal the length of the camera used in the effect in scene units/1000 (eg. millimeter). */
    get focalLength() {
        return this._frameGraphTask.depthOfField.focalLength;
    }
    set focalLength(value) {
        this._frameGraphTask.depthOfField.focalLength = value;
    }
    /** F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    get fStop() {
        return this._frameGraphTask.depthOfField.fStop;
    }
    set fStop(value) {
        this._frameGraphTask.depthOfField.fStop = value;
    }
    /** Distance away from the camera to focus on in scene units/1000 (eg. millimeter). */
    get focusDistance() {
        return this._frameGraphTask.depthOfField.focusDistance;
    }
    set focusDistance(value) {
        this._frameGraphTask.depthOfField.focusDistance = value;
    }
    /** Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    get lensSize() {
        return this._frameGraphTask.depthOfField.lensSize;
    }
    set lensSize(value) {
        this._frameGraphTask.depthOfField.lensSize = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphDepthOfFieldPostProcessBlock";
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
        this.output.value = this._frameGraphTask.outputTexture;
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
    editableInPropertyPage("Blur level", 4 /* PropertyTypeForEdition.List */, "PROPERTIES", {
        options: [
            { label: "Low", value: 0 /* ThinDepthOfFieldEffectBlurLevel.Low */ },
            { label: "Medium", value: 1 /* ThinDepthOfFieldEffectBlurLevel.Medium */ },
            { label: "High", value: 2 /* ThinDepthOfFieldEffectBlurLevel.High */ },
        ],
    })
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "blurLevel", null);
__decorate([
    editableInPropertyPage("HDR", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "hdr", null);
__decorate([
    editableInPropertyPage("Depth sampling mode", 6 /* PropertyTypeForEdition.SamplingMode */, "PROPERTIES")
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "depthSamplingMode", null);
__decorate([
    editableInPropertyPage("Focal length", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "focalLength", null);
__decorate([
    editableInPropertyPage("F-Stop", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "fStop", null);
__decorate([
    editableInPropertyPage("Focus distance", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "focusDistance", null);
__decorate([
    editableInPropertyPage("Lens size", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphDepthOfFieldPostProcessBlock.prototype, "lensSize", null);
RegisterClass("BABYLON.NodeRenderGraphDepthOfFieldPostProcessBlock", NodeRenderGraphDepthOfFieldPostProcessBlock);
//# sourceMappingURL=depthOfFieldPostProcessBlock.js.map