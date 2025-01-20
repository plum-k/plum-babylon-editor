import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { InputBlock } from "../Input/inputBlock.js";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject.js";
import { PBRIridescenceConfiguration } from "../../../../Materials/PBR/pbrIridescenceConfiguration.js";
/**
 * Block used to implement the iridescence module of the PBR material
 */
export class IridescenceBlock extends NodeMaterialBlock {
    /**
     * Create a new IridescenceBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Fragment);
        this._isUnique = true;
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("indexOfRefraction", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("thickness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("iridescence", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("iridescence", this, 1 /* NodeMaterialConnectionPointDirection.Output */, IridescenceBlock, "IridescenceBlock"));
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("iridescenceOut");
        state._excludeVariableName("vIridescenceParams");
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "IridescenceBlock";
    }
    /**
     * Gets the intensity input component
     */
    get intensity() {
        return this._inputs[0];
    }
    /**
     * Gets the indexOfRefraction input component
     */
    get indexOfRefraction() {
        return this._inputs[1];
    }
    /**
     * Gets the thickness input component
     */
    get thickness() {
        return this._inputs[2];
    }
    /**
     * Gets the iridescence object output component
     */
    get iridescence() {
        return this._outputs[0];
    }
    autoConfigure() {
        if (!this.intensity.isConnected) {
            const intensityInput = new InputBlock("Iridescence intensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            intensityInput.value = 1;
            intensityInput.output.connectTo(this.intensity);
            const indexOfRefractionInput = new InputBlock("Iridescence ior", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            indexOfRefractionInput.value = 1.3;
            indexOfRefractionInput.output.connectTo(this.indexOfRefraction);
            const thicknessInput = new InputBlock("Iridescence thickness", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            thicknessInput.value = 400;
            thicknessInput.output.connectTo(this.thickness);
        }
    }
    prepareDefines(mesh, nodeMaterial, defines) {
        super.prepareDefines(mesh, nodeMaterial, defines);
        defines.setValue("IRIDESCENCE", true, true);
        defines.setValue("IRIDESCENCE_TEXTURE", false, true);
        defines.setValue("IRIDESCENCE_THICKNESS_TEXTURE", false, true);
    }
    /**
     * Gets the main code of the block (fragment side)
     * @param iridescenceBlock instance of a IridescenceBlock or null if the code must be generated without an active iridescence module
     * @param state defines the build state
     * @returns the shader code
     */
    static GetCode(iridescenceBlock, state) {
        let code = "";
        const intensityName = iridescenceBlock?.intensity.isConnected ? iridescenceBlock.intensity.associatedVariableName : "1.";
        const indexOfRefraction = iridescenceBlock?.indexOfRefraction.isConnected
            ? iridescenceBlock.indexOfRefraction.associatedVariableName
            : PBRIridescenceConfiguration._DefaultIndexOfRefraction;
        const thickness = iridescenceBlock?.thickness.isConnected ? iridescenceBlock.thickness.associatedVariableName : PBRIridescenceConfiguration._DefaultMaximumThickness;
        const isWebGPU = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        code += `${isWebGPU ? "var iridescenceOut: iridescenceOutParams" : "iridescenceOutParams iridescenceOut"};

        #ifdef IRIDESCENCE
            iridescenceOut = iridescenceBlock(
                vec4(${intensityName}, ${indexOfRefraction}, 1., ${thickness})
                , NdotV
                , specularEnvironmentR0
                #ifdef CLEARCOAT
                    , NdotVUnclamped
                #endif                
            );

            float iridescenceIntensity = iridescenceOut.iridescenceIntensity;
            specularEnvironmentR0 = iridescenceOut.specularEnvironmentR0;
        #endif\n`;
        return code;
    }
    _buildBlock(state) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.bindableBlocks.push(this);
            state.sharedData.blocksWithDefines.push(this);
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
    }
}
RegisterClass("BABYLON.IridescenceBlock", IridescenceBlock);
//# sourceMappingURL=iridescenceBlock.js.map