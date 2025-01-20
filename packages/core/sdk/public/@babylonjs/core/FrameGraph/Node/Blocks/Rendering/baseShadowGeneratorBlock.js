import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { ShadowGenerator } from "../../../../Lights/Shadows/shadowGenerator.js";
/**
 * @internal
 */
export class NodeRenderGraphBaseShadowGeneratorBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphBaseShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("light", NodeRenderGraphBlockConnectionPointTypes.ShadowLight);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this._addDependenciesInput();
        this.registerOutput("generator", NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.Texture);
    }
    /** Sets the size of the shadow texture */
    get mapSize() {
        return this._frameGraphTask.mapSize;
    }
    set mapSize(value) {
        this._frameGraphTask.mapSize = value;
    }
    /** Sets the texture type to float (by default, half float is used if supported) */
    get useFloat32TextureType() {
        return this._frameGraphTask.useFloat32TextureType;
    }
    set useFloat32TextureType(value) {
        this._frameGraphTask.useFloat32TextureType = value;
    }
    /** Sets the texture type to Red */
    get useRedTextureFormat() {
        return this._frameGraphTask.useRedTextureFormat;
    }
    set useRedTextureFormat(value) {
        this._frameGraphTask.useRedTextureFormat = value;
    }
    /** Sets the bias */
    get bias() {
        return this._frameGraphTask.bias;
    }
    set bias(value) {
        this._frameGraphTask.bias = value;
    }
    /** Sets the normal bias */
    get normalBias() {
        return this._frameGraphTask.normalBias;
    }
    set normalBias(value) {
        this._frameGraphTask.normalBias = value;
    }
    /** Sets the darkness of the shadows */
    get darkness() {
        return this._frameGraphTask.darkness;
    }
    set darkness(value) {
        this._frameGraphTask.darkness = value;
    }
    /** Sets the filter method */
    get filter() {
        return this._frameGraphTask.filter;
    }
    set filter(value) {
        this._frameGraphTask.filter = value;
    }
    /** Sets the filter quality (for PCF and PCSS) */
    get filteringQuality() {
        return this._frameGraphTask.filteringQuality;
    }
    set filteringQuality(value) {
        this._frameGraphTask.filteringQuality = value;
    }
    /** Gets or sets the ability to have transparent shadow */
    get transparencyShadow() {
        return this._frameGraphTask.transparencyShadow;
    }
    set transparencyShadow(value) {
        this._frameGraphTask.transparencyShadow = value;
    }
    /** Enables or disables shadows with varying strength based on the transparency */
    get enableSoftTransparentShadow() {
        return this._frameGraphTask.enableSoftTransparentShadow;
    }
    set enableSoftTransparentShadow(value) {
        this._frameGraphTask.enableSoftTransparentShadow = value;
    }
    /** If this is true, use the opacity texture's alpha channel for transparent shadows instead of the diffuse one */
    get useOpacityTextureForTransparentShadow() {
        return this._frameGraphTask.useOpacityTextureForTransparentShadow;
    }
    set useOpacityTextureForTransparentShadow(value) {
        this._frameGraphTask.useOpacityTextureForTransparentShadow = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphBaseShadowGeneratorBlock";
    }
    /**
     * Gets the light input component
     */
    get light() {
        return this._inputs[0];
    }
    /**
     * Gets the objects input component
     */
    get objects() {
        return this._inputs[1];
    }
    /**
     * Gets the camera input component
     */
    get camera() {
        return this._inputs[2];
    }
    /**
     * Gets the shadow generator component
     */
    get generator() {
        return this._outputs[0];
    }
    /**
     * Gets the output texture component
     */
    get output() {
        return this._outputs[1];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this._frameGraphTask.light = this.light.connectedPoint?.value;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value;
        // Important: the shadow generator object is created by the task when we set the light, that's why we must set generator.value after setting the light!
        this.generator.value = this._frameGraphTask;
        this.output.value = this._frameGraphTask.outputTexture;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.mapSize = ${this.mapSize};`);
        codes.push(`${this._codeVariableName}.useFloat32TextureType = ${this.useFloat32TextureType};`);
        codes.push(`${this._codeVariableName}.useRedTextureFormat = ${this.useRedTextureFormat};`);
        codes.push(`${this._codeVariableName}.bias = ${this.bias};`);
        codes.push(`${this._codeVariableName}.normalBias = ${this.normalBias};`);
        codes.push(`${this._codeVariableName}.darkness = ${this.darkness};`);
        codes.push(`${this._codeVariableName}.filter = ${this.filter};`);
        codes.push(`${this._codeVariableName}.filteringQuality = ${this.filteringQuality};`);
        codes.push(`${this._codeVariableName}.transparencyShadow = ${this.transparencyShadow};`);
        codes.push(`${this._codeVariableName}.enableSoftTransparentShadow = ${this.enableSoftTransparentShadow};`);
        codes.push(`${this._codeVariableName}.useOpacityTextureForTransparentShadow = ${this.useOpacityTextureForTransparentShadow};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.mapSize = this.mapSize;
        serializationObject.useFloat32TextureType = this.useFloat32TextureType;
        serializationObject.useRedTextureFormat = this.useRedTextureFormat;
        serializationObject.bias = this.bias;
        serializationObject.normalBias = this.normalBias;
        serializationObject.darkness = this.darkness;
        serializationObject.filter = this.filter;
        serializationObject.filteringQuality = this.filteringQuality;
        serializationObject.transparencyShadow = this.transparencyShadow;
        serializationObject.enableSoftTransparentShadow = this.enableSoftTransparentShadow;
        serializationObject.useOpacityTextureForTransparentShadow = this.useOpacityTextureForTransparentShadow;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.mapSize = serializationObject.mapSize;
        this.useFloat32TextureType = serializationObject.useFloat32TextureType;
        this.useRedTextureFormat = serializationObject.useRedTextureFormat;
        this.bias = serializationObject.bias;
        this.normalBias = serializationObject.normalBias;
        this.darkness = serializationObject.darkness;
        this.filter = serializationObject.filter;
        this.filteringQuality = serializationObject.filteringQuality;
        this.transparencyShadow = serializationObject.transparencyShadow;
        this.enableSoftTransparentShadow = serializationObject.enableSoftTransparentShadow;
        this.useOpacityTextureForTransparentShadow = serializationObject.useOpacityTextureForTransparentShadow;
    }
}
__decorate([
    editableInPropertyPage("Map size", 4 /* PropertyTypeForEdition.List */, "PROPERTIES", {
        options: [
            { label: "128", value: 128 },
            { label: "256", value: 256 },
            { label: "512", value: 512 },
            { label: "1024", value: 1024 },
            { label: "2048", value: 2048 },
            { label: "4096", value: 4096 },
            { label: "8192", value: 8192 },
        ],
    })
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "mapSize", null);
__decorate([
    editableInPropertyPage("Use 32 bits float texture type", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "useFloat32TextureType", null);
__decorate([
    editableInPropertyPage("Use red texture format", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "useRedTextureFormat", null);
__decorate([
    editableInPropertyPage("Bias", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "bias", null);
__decorate([
    editableInPropertyPage("Normal bias", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "normalBias", null);
__decorate([
    editableInPropertyPage("Darkness", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "darkness", null);
__decorate([
    editableInPropertyPage("Filter", 4 /* PropertyTypeForEdition.List */, "PROPERTIES", {
        options: [
            { label: "None", value: ShadowGenerator.FILTER_NONE },
            { label: "Exponential", value: ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP },
            { label: "Poisson Sampling", value: ShadowGenerator.FILTER_POISSONSAMPLING },
            { label: "Blur exponential", value: ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP },
            { label: "Close exponential", value: ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP },
            { label: "Blur close exponential", value: ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP },
            { label: "PCF", value: ShadowGenerator.FILTER_PCF },
            { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
        ],
    })
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "filter", null);
__decorate([
    editableInPropertyPage("Filter quality", 4 /* PropertyTypeForEdition.List */, "PROPERTIES", {
        options: [
            { label: "Low", value: ShadowGenerator.QUALITY_LOW },
            { label: "Medium", value: ShadowGenerator.QUALITY_MEDIUM },
            { label: "High", value: ShadowGenerator.QUALITY_HIGH },
        ],
    })
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "filteringQuality", null);
__decorate([
    editableInPropertyPage("Transparency shadow", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "transparencyShadow", null);
__decorate([
    editableInPropertyPage("Enable soft transparent shadows", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "enableSoftTransparentShadow", null);
__decorate([
    editableInPropertyPage("Use opacity texture for transparent shadows", 0 /* PropertyTypeForEdition.Boolean */, "PROPERTIES")
], NodeRenderGraphBaseShadowGeneratorBlock.prototype, "useOpacityTextureForTransparentShadow", null);
//# sourceMappingURL=baseShadowGeneratorBlock.js.map