import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphBloomTask } from "../../../Tasks/PostProcesses/bloomTask.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the bloom post process
 */
export class NodeRenderGraphBloomPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphBloomPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param hdr If high dynamic range textures should be used (default: false)
     * @param bloomScale The scale of the bloom effect (default: 0.5)
     */
    constructor(name, frameGraph, scene, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [hdr, bloomScale];
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphBloomTask(this.name, frameGraph, scene.getEngine(), 0.75, 64, 0.2, hdr, bloomScale);
    }
    _createTask(bloomScale, hdr) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;
        const threshold = this._frameGraphTask.bloom.threshold;
        const weight = this._frameGraphTask.bloom.weight;
        const kernel = this._frameGraphTask.bloom.kernel;
        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphBloomTask(this.name, this._frameGraph, this._scene.getEngine(), weight, kernel, threshold, hdr, bloomScale);
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;
        this._additionalConstructionParameters = [hdr, bloomScale];
    }
    /** The quality of the blur effect */
    get bloomScale() {
        return this._frameGraphTask.bloom.scale;
    }
    set bloomScale(value) {
        this._createTask(value, this._frameGraphTask.hdr);
    }
    /** If high dynamic range textures should be used */
    get hdr() {
        return this._frameGraphTask.hdr;
    }
    set hdr(value) {
        this._createTask(this._frameGraphTask.bloom.scale, value);
    }
    /** The luminance threshold to find bright areas of the image to bloom. */
    get threshold() {
        return this._frameGraphTask.bloom.threshold;
    }
    set threshold(value) {
        this._frameGraphTask.bloom.threshold = value;
    }
    /** The strength of the bloom. */
    get weight() {
        return this._frameGraphTask.bloom.weight;
    }
    set weight(value) {
        this._frameGraphTask.bloom.weight = value;
    }
    /** Specifies the size of the bloom blur kernel, relative to the final output size */
    get kernel() {
        return this._frameGraphTask.bloom.kernel;
    }
    set kernel(value) {
        this._frameGraphTask.bloom.kernel = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphBloomPostProcessBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.threshold = ${this.threshold};`);
        codes.push(`${this._codeVariableName}.weight = ${this.weight};`);
        codes.push(`${this._codeVariableName}.kernel = ${this.kernel};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.threshold = this.threshold;
        serializationObject.weight = this.weight;
        serializationObject.kernel = this.kernel;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.threshold = serializationObject.threshold;
        this.weight = serializationObject.weight;
        this.kernel = serializationObject.kernel;
    }
}
__decorate([
    editableInPropertyPage("Bloom scale", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES")
], NodeRenderGraphBloomPostProcessBlock.prototype, "bloomScale", null);
__decorate([
    editableInPropertyPage("HDR", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBloomPostProcessBlock.prototype, "hdr", null);
__decorate([
    editableInPropertyPage("Threshold", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 2 })
], NodeRenderGraphBloomPostProcessBlock.prototype, "threshold", null);
__decorate([
    editableInPropertyPage("Weight", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 3 })
], NodeRenderGraphBloomPostProcessBlock.prototype, "weight", null);
__decorate([
    editableInPropertyPage("Kernel", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES", { min: 1, max: 128 })
], NodeRenderGraphBloomPostProcessBlock.prototype, "kernel", null);
RegisterClass("BABYLON.NodeRenderGraphBloomPostProcessBlock", NodeRenderGraphBloomPostProcessBlock);
//# sourceMappingURL=bloomPostProcessBlock.js.map