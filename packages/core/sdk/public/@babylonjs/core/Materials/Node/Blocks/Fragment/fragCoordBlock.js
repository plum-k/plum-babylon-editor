import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used to make gl_FragCoord available
 */
export class FragCoordBlock extends NodeMaterialBlock {
    /**
     * Creates a new FragCoordBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("xy", NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("xyzw", NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("z", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("w", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "FragCoordBlock";
    }
    /**
     * Gets the xy component
     */
    get xy() {
        return this._outputs[0];
    }
    /**
     * Gets the xyz component
     */
    get xyz() {
        return this._outputs[1];
    }
    /**
     * Gets the xyzw component
     */
    get xyzw() {
        return this._outputs[2];
    }
    /**
     * Gets the x component
     */
    get x() {
        return this._outputs[3];
    }
    /**
     * Gets the y component
     */
    get y() {
        return this._outputs[4];
    }
    /**
     * Gets the z component
     */
    get z() {
        return this._outputs[5];
    }
    /**
     * Gets the w component
     */
    get output() {
        return this._outputs[6];
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    writeOutputs(state) {
        let code = "";
        const coord = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "fragmentInputs.position" : "gl_FragCoord";
        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                code += `${state._declareOutput(output)} = ${coord}.${output.name};\n`;
            }
        }
        return code;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            // eslint-disable-next-line no-throw-literal
            throw "FragCoordBlock must only be used in a fragment shader";
        }
        state.compilationString += this.writeOutputs(state);
        return this;
    }
}
RegisterClass("BABYLON.FragCoordBlock", FragCoordBlock);
//# sourceMappingURL=fragCoordBlock.js.map