import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphBlackAndWhiteTask } from "../../../Tasks/PostProcesses/blackAndWhiteTask.js";
import { ThinBlackAndWhitePostProcess } from "../../../../PostProcesses/thinBlackAndWhitePostProcess.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the black and white post process
 */
export class NodeRenderGraphBlackAndWhitePostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new BlackAndWhitePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphBlackAndWhiteTask(this.name, frameGraph, new ThinBlackAndWhitePostProcess(name, scene.getEngine()));
    }
    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    get degree() {
        return this._frameGraphTask.postProcess.degree;
    }
    set degree(value) {
        this._frameGraphTask.postProcess.degree = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphBlackAndWhitePostProcessBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.degree = ${this.degree};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.degree = this.degree;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.degree = serializationObject.degree;
    }
}
__decorate([
    editableInPropertyPage("Degree", 1 /* PropertyTypeForEdition.Float */, "PROPERTIES", { min: 0, max: 1 })
], NodeRenderGraphBlackAndWhitePostProcessBlock.prototype, "degree", null);
RegisterClass("BABYLON.NodeRenderGraphBlackAndWhitePostProcessBlock", NodeRenderGraphBlackAndWhitePostProcessBlock);
//# sourceMappingURL=blackAndWhitePostProcessBlock.js.map