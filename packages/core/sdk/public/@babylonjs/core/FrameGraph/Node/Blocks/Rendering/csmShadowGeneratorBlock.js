import { __decorate } from "../../../../tslib.es6.js";
import { NodeRenderGraphBaseShadowGeneratorBlock } from "./baseShadowGeneratorBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphCascadedShadowGeneratorTask } from "../../../Tasks/Rendering/csmShadowGeneratorTask.js";
/**
 * Block that generates shadows through a shadow generator
 */
export class NodeRenderGraphCascadedShadowGeneratorBlock extends NodeRenderGraphBaseShadowGeneratorBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphCascadedShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._frameGraphTask = new FrameGraphCascadedShadowGeneratorTask(this.name, frameGraph, scene);
    }
    /** Sets the number of cascades */
    get numCascades() {
        return this._frameGraphTask.numCascades;
    }
    set numCascades(value) {
        this._frameGraphTask.numCascades = value;
    }
    /** Gets or sets a value indicating whether the shadow generator should display the cascades. */
    get debug() {
        return this._frameGraphTask.debug;
    }
    set debug(value) {
        this._frameGraphTask.debug = value;
    }
    /** Gets or sets a value indicating whether the shadow generator should stabilize the cascades. */
    get stabilizeCascades() {
        return this._frameGraphTask.stabilizeCascades;
    }
    set stabilizeCascades(value) {
        this._frameGraphTask.stabilizeCascades = value;
    }
    /** Gets or sets the lambda parameter of the shadow generator. */
    get lambda() {
        return this._frameGraphTask.lambda;
    }
    set lambda(value) {
        this._frameGraphTask.lambda = value;
    }
    /** Gets or sets the cascade blend percentage. */
    get cascadeBlendPercentage() {
        return this._frameGraphTask.cascadeBlendPercentage;
    }
    set cascadeBlendPercentage(value) {
        this._frameGraphTask.cascadeBlendPercentage = value;
    }
    /** Gets or sets a value indicating whether the shadow generator should use depth clamping. */
    get depthClamp() {
        return this._frameGraphTask.depthClamp;
    }
    set depthClamp(value) {
        this._frameGraphTask.depthClamp = value;
    }
    /** Gets or sets a value indicating whether the shadow generator should automatically calculate the depth bounds. */
    get autoCalcDepthBounds() {
        return this._frameGraphTask.autoCalcDepthBounds;
    }
    set autoCalcDepthBounds(value) {
        this._frameGraphTask.autoCalcDepthBounds = value;
    }
    /** Gets or sets the maximum shadow Z value. */
    get shadowMaxZ() {
        return this._frameGraphTask.shadowMaxZ;
    }
    set shadowMaxZ(value) {
        this._frameGraphTask.shadowMaxZ = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphCascadedShadowGeneratorBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.numCascades = ${this.numCascades};`);
        codes.push(`${this._codeVariableName}.debug = ${this.debug};`);
        codes.push(`${this._codeVariableName}.stabilizeCascades = ${this.stabilizeCascades};`);
        codes.push(`${this._codeVariableName}.lambda = ${this.lambda};`);
        codes.push(`${this._codeVariableName}.cascadeBlendPercentage = ${this.cascadeBlendPercentage};`);
        codes.push(`${this._codeVariableName}.depthClamp = ${this.depthClamp};`);
        codes.push(`${this._codeVariableName}.autoCalcDepthBounds = ${this.autoCalcDepthBounds};`);
        codes.push(`${this._codeVariableName}.shadowMaxZ = ${this.shadowMaxZ};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.numCascades = this.numCascades;
        serializationObject.debug = this.debug;
        serializationObject.stabilizeCascades = this.stabilizeCascades;
        serializationObject.lambda = this.lambda;
        serializationObject.cascadeBlendPercentage = this.cascadeBlendPercentage;
        serializationObject.depthClamp = this.depthClamp;
        serializationObject.autoCalcDepthBounds = this.autoCalcDepthBounds;
        serializationObject.shadowMaxZ = this.shadowMaxZ;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.numCascades = serializationObject.numCascades;
        this.debug = serializationObject.debug;
        this.stabilizeCascades = serializationObject.stabilizeCascades;
        this.lambda = serializationObject.lambda;
        this.cascadeBlendPercentage = serializationObject.cascadeBlendPercentage;
        this.depthClamp = serializationObject.depthClamp;
        this.autoCalcDepthBounds = serializationObject.autoCalcDepthBounds;
        this.shadowMaxZ = serializationObject.shadowMaxZ;
    }
}
__decorate([
    editableInPropertyPage("Number of cascades", 4 /* PropertyTypeForEdition.List */, "CSM PROPERTIES", {
        options: [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
        ],
    })
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "numCascades", null);
__decorate([
    editableInPropertyPage("Debug mode", 0 /* PropertyTypeForEdition.Boolean */, "CSM PROPERTIES")
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "debug", null);
__decorate([
    editableInPropertyPage("Stabilize cascades", 0 /* PropertyTypeForEdition.Boolean */, "CSM PROPERTIES")
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "stabilizeCascades", null);
__decorate([
    editableInPropertyPage("Lambda", 1 /* PropertyTypeForEdition.Float */, "CSM PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "lambda", null);
__decorate([
    editableInPropertyPage("Cascade blend", 1 /* PropertyTypeForEdition.Float */, "CSM PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "cascadeBlendPercentage", null);
__decorate([
    editableInPropertyPage("Depth clamp", 0 /* PropertyTypeForEdition.Boolean */, "CSM PROPERTIES")
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "depthClamp", null);
__decorate([
    editableInPropertyPage("Auto-Calc depth bounds", 0 /* PropertyTypeForEdition.Boolean */, "CSM PROPERTIES")
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "autoCalcDepthBounds", null);
__decorate([
    editableInPropertyPage("Shadow maxZ", 1 /* PropertyTypeForEdition.Float */, "CSM PROPERTIES")
], NodeRenderGraphCascadedShadowGeneratorBlock.prototype, "shadowMaxZ", null);
RegisterClass("BABYLON.NodeRenderGraphCascadedShadowGeneratorBlock", NodeRenderGraphCascadedShadowGeneratorBlock);
//# sourceMappingURL=csmShadowGeneratorBlock.js.map