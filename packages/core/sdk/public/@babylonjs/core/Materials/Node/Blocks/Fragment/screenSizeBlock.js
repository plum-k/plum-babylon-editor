import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block used to get the screen sizes
 */
export class ScreenSizeBlock extends NodeMaterialBlock {
    /**
     * Creates a new ScreenSizeBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("xy", NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ScreenSizeBlock";
    }
    /**
     * Gets the xy component
     */
    get xy() {
        return this._outputs[0];
    }
    /**
     * Gets the x component
     */
    get x() {
        return this._outputs[1];
    }
    /**
     * Gets the y component
     */
    get y() {
        return this._outputs[2];
    }
    bind(effect) {
        const engine = this._scene.getEngine();
        effect.setFloat2(this._varName, engine.getRenderWidth(), engine.getRenderHeight());
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    writeOutputs(state, varName) {
        let code = "";
        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                code += `${state._declareOutput(output)} = ${varName}.${output.name};\n`;
            }
        }
        return code;
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this._scene = state.sharedData.scene;
        if (state.target === NodeMaterialBlockTargets.Vertex) {
            // eslint-disable-next-line no-throw-literal
            throw "ScreenSizeBlock must only be used in a fragment shader";
        }
        state.sharedData.bindableBlocks.push(this);
        this._varName = state._getFreeVariableName("screenSize");
        state._emitUniformFromString(this._varName, NodeMaterialBlockConnectionPointTypes.Vector2);
        const prefix = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "uniforms." : "";
        state.compilationString += this.writeOutputs(state, prefix + this._varName);
        return this;
    }
}
RegisterClass("BABYLON.ScreenSizeBlock", ScreenSizeBlock);
//# sourceMappingURL=screenSizeBlock.js.map