import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { bindClipPlane } from "../../../../Materials/clipPlaneMaterialHelper.js";
/**
 * Block used to implement clip planes
 */
export class ClipPlanesBlock extends NodeMaterialBlock {
    /**
     * Create a new ClipPlanesBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment, true);
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ClipPlanesBlock";
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    initialize(state) {
        state._excludeVariableName("vClipPlane");
        state._excludeVariableName("fClipDistance");
        state._excludeVariableName("vClipPlane2");
        state._excludeVariableName("fClipDistance2");
        state._excludeVariableName("vClipPlane3");
        state._excludeVariableName("fClipDistance3");
        state._excludeVariableName("vClipPlane4");
        state._excludeVariableName("fClipDistance4");
        state._excludeVariableName("vClipPlane5");
        state._excludeVariableName("fClipDistance5");
        state._excludeVariableName("vClipPlane6");
        state._excludeVariableName("fClipDistance6");
        this._initShaderSourceAsync(state.shaderLanguage);
    }
    async _initShaderSourceAsync(shaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneFragment.js"),
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneFragmentDeclaration.js"),
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneVertex.js"),
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneVertexDeclaration.js"),
            ]);
        }
        else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/clipPlaneFragment.js"),
                import("../../../../Shaders/ShadersInclude/clipPlaneFragmentDeclaration.js"),
                import("../../../../Shaders/ShadersInclude/clipPlaneVertex.js"),
                import("../../../../Shaders/ShadersInclude/clipPlaneVertexDeclaration.js"),
            ]);
        }
        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }
    /**
     * Gets the worldPosition input component
     */
    get worldPosition() {
        return this._inputs[0];
    }
    get target() {
        return NodeMaterialBlockTargets.VertexAndFragment;
    }
    set target(value) { }
    prepareDefines(mesh, nodeMaterial, defines) {
        const scene = mesh.getScene();
        const useClipPlane1 = (nodeMaterial.clipPlane ?? scene.clipPlane) ? true : false;
        const useClipPlane2 = (nodeMaterial.clipPlane2 ?? scene.clipPlane2) ? true : false;
        const useClipPlane3 = (nodeMaterial.clipPlane3 ?? scene.clipPlane3) ? true : false;
        const useClipPlane4 = (nodeMaterial.clipPlane4 ?? scene.clipPlane4) ? true : false;
        const useClipPlane5 = (nodeMaterial.clipPlane5 ?? scene.clipPlane5) ? true : false;
        const useClipPlane6 = (nodeMaterial.clipPlane6 ?? scene.clipPlane6) ? true : false;
        defines.setValue("CLIPPLANE", useClipPlane1, true);
        defines.setValue("CLIPPLANE2", useClipPlane2, true);
        defines.setValue("CLIPPLANE3", useClipPlane3, true);
        defines.setValue("CLIPPLANE4", useClipPlane4, true);
        defines.setValue("CLIPPLANE5", useClipPlane5, true);
        defines.setValue("CLIPPLANE6", useClipPlane6, true);
    }
    bind(effect, nodeMaterial, mesh) {
        if (!mesh) {
            return;
        }
        const scene = mesh.getScene();
        bindClipPlane(effect, nodeMaterial, scene);
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const comments = `//${this.name}`;
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            const worldPos = this.worldPosition;
            state._emitFunctionFromInclude("clipPlaneVertexDeclaration", comments, {
                replaceStrings: [{ search: /uniform vec4 vClipPlane\d*;/g, replace: "" }],
            });
            state.compilationString += state._emitCodeFromInclude("clipPlaneVertex", comments, {
                replaceStrings: [{ search: /worldPos/g, replace: worldPos.associatedVariableName }],
            });
            state._emitUniformFromString("vClipPlane", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane2", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane3", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane4", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane5", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane6", NodeMaterialBlockConnectionPointTypes.Vector4);
            return;
        }
        // Fragment
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);
        state._emitFunctionFromInclude("clipPlaneFragmentDeclaration", comments);
        state.compilationString += state._emitCodeFromInclude("clipPlaneFragment", comments);
        return this;
    }
}
RegisterClass("BABYLON.ClipPlanesBlock", ClipPlanesBlock);
//# sourceMappingURL=clipPlanesBlock.js.map