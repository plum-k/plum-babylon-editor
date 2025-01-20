import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphGlowLayerTask } from "../../../Tasks/Layers/glowLayerTask.js";
/**
 * Block that implements the glow layer
 */
export class NodeRenderGraphGlowLayerBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphGlowLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param ldrMerge Forces the merge step to be done in ldr (clamp values &gt; 1). Default: false
     */
    constructor(name, frameGraph, scene, ldrMerge = false) {
        super(name, frameGraph, scene);
        this._additionalConstructionParameters = [ldrMerge];
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("layer", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.layer.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.output._typeConnectionSource = this.destination;
        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, this._frameGraph, this._scene, { ldrMerge });
    }
    _createTask(ldrMerge) {
        const blurKernelSize = this.blurKernelSize;
        const intensity = this.intensity;
        this._frameGraphTask?.dispose();
        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, this._frameGraph, this._scene, { ldrMerge });
        this.blurKernelSize = blurKernelSize;
        this.intensity = intensity;
        this._additionalConstructionParameters = [ldrMerge];
    }
    /** Forces the merge step to be done in ldr (clamp values &gt; 1). Default: false */
    get ldrMerge() {
        return this._frameGraphTask.layer.ldrMerge;
    }
    set ldrMerge(value) {
        this._createTask(value);
    }
    /** How big is the kernel of the blur texture */
    get blurKernelSize() {
        return this._frameGraphTask.layer.blurKernelSize;
    }
    set blurKernelSize(value) {
        this._frameGraphTask.layer.blurKernelSize = value;
    }
    /** The intensity of the glow */
    get intensity() {
        return this._frameGraphTask.layer.intensity;
    }
    set intensity(value) {
        this._frameGraphTask.layer.intensity = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphGlowLayerBlock";
    }
    /**
     * Gets the destination texture input component
     */
    get destination() {
        return this._inputs[0];
    }
    /**
     * Gets the depth texture input component
     */
    get layer() {
        return this._inputs[1];
    }
    /**
     * Gets the camera input component
     */
    get camera() {
        return this._inputs[2];
    }
    /**
     * Gets the objects input component
     */
    get objects() {
        return this._inputs[3];
    }
    /**
     * Gets the dependencies input component
     */
    get dependencies() {
        return this._inputs[4];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this.output.value = this._frameGraphTask.outputTexture;
        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value;
        this._frameGraphTask.layerTexture = this.layer.connectedPoint?.value;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.blurKernelSize = ${this.blurKernelSize};`);
        codes.push(`${this._codeVariableName}.intensity = ${this.intensity};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.blurKernelSize = this.blurKernelSize;
        serializationObject.intensity = this.intensity;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.blurKernelSize = serializationObject.blurKernelSize;
        this.intensity = serializationObject.intensity;
    }
}
__decorate([
    editableInPropertyPage("LDR merge", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphGlowLayerBlock.prototype, "ldrMerge", null);
__decorate([
    editableInPropertyPage("Blur kernel size", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES", { min: 1, max: 256 })
], NodeRenderGraphGlowLayerBlock.prototype, "blurKernelSize", null);
__decorate([
    editableInPropertyPage("Intensity", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 5 })
], NodeRenderGraphGlowLayerBlock.prototype, "intensity", null);
RegisterClass("BABYLON.NodeRenderGraphGlowLayerBlock", NodeRenderGraphGlowLayerBlock);
//# sourceMappingURL=glowLayerBlock.js.map