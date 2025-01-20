import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { GeometryInputBlock } from "../geometryInputBlock.js";
import { Matrix, Vector3 } from "../../../../Maths/math.vector.js";
/**
 * Block used to get a translation matrix
 */
export class TranslationBlock extends NodeGeometryBlock {
    /**
     * Create a new TranslationBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this.registerInput("translation", NodeGeometryBlockConnectionPointTypes.Vector3, false, Vector3.Zero());
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "TranslationBlock";
    }
    /**
     * Gets the translation input component
     */
    get translation() {
        return this._inputs[0];
    }
    /**
     * Gets the matrix output component
     */
    get matrix() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.translation.isConnected) {
            const translationInput = new GeometryInputBlock("Translation");
            translationInput.value = new Vector3(0, 0, 0);
            translationInput.output.connectTo(this.translation);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this.matrix._storedFunction = (state) => {
            const value = this.translation.getConnectedValue(state);
            return Matrix.Translation(value.x, value.y, value.z);
        };
    }
}
RegisterClass("BABYLON.TranslationBlock", TranslationBlock);
//# sourceMappingURL=translationBlock.js.map