import { __decorate } from "../../../../tslib.es6.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphBlurTask } from "../../../Tasks/PostProcesses/blurTask.js";
import { ThinBlurPostProcess } from "../../../../PostProcesses/thinBlurPostProcess.js";
import { Vector2 } from "../../../../Maths/math.vector.js";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock.js";
/**
 * Block that implements the blur post process
 */
export class NodeRenderGraphBlurPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphBlurPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphBlurTask(this.name, frameGraph, new ThinBlurPostProcess(name, scene.getEngine(), new Vector2(1, 0), 32));
    }
    /** The direction in which to blur the image */
    get direction() {
        return this._frameGraphTask.postProcess.direction;
    }
    set direction(value) {
        this._frameGraphTask.postProcess.direction = value;
    }
    /** Length in pixels of the blur sample region */
    get kernel() {
        return this._frameGraphTask.postProcess.kernel;
    }
    set kernel(value) {
        this._frameGraphTask.postProcess.kernel = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphBlurPostProcessBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.direction = new BABYLON.Vector2(${this.direction.x}, ${this.direction.y});`);
        codes.push(`${this._codeVariableName}.kernel = ${this.kernel};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.direction = this.direction.asArray();
        serializationObject.kernel = this.kernel;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.direction.fromArray(serializationObject.direction);
        this.kernel = serializationObject.kernel;
    }
}
__decorate([
    editableInPropertyPage("Direction", 3 /* PropertyTypeForEdition.Vector2 */, "PROPERTIES")
], NodeRenderGraphBlurPostProcessBlock.prototype, "direction", null);
__decorate([
    editableInPropertyPage("Kernel", 2 /* PropertyTypeForEdition.Int */, "PROPERTIES", { min: 1, max: 256 })
], NodeRenderGraphBlurPostProcessBlock.prototype, "kernel", null);
RegisterClass("BABYLON.NodeRenderGraphBlurPostProcessBlock", NodeRenderGraphBlurPostProcessBlock);
//# sourceMappingURL=blurPostProcessBlock.js.map