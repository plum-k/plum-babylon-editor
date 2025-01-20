import { Logger } from "../../Misc/logger.js";
/**
 * Class used to store shared data between 2 NodeMaterialBuildState
 */
export class NodeMaterialBuildStateSharedData {
    /** Creates a new shared data */
    constructor() {
        /**
         * Gets the list of emitted varyings
         */
        this.temps = [];
        /**
         * Gets the list of emitted varyings
         */
        this.varyings = [];
        /**
         * Gets the varying declaration string
         */
        this.varyingDeclaration = "";
        /**
         * Input blocks
         */
        this.inputBlocks = [];
        /**
         * Input blocks
         */
        this.textureBlocks = [];
        /**
         * Bindable blocks (Blocks that need to set data to the effect)
         */
        this.bindableBlocks = [];
        /**
         * Bindable blocks (Blocks that need to set data to the effect) that will always be called (by bindForSubMesh), contrary to bindableBlocks that won't be called if _mustRebind() returns false
         */
        this.forcedBindableBlocks = [];
        /**
         * List of blocks that can provide a compilation fallback
         */
        this.blocksWithFallbacks = [];
        /**
         * List of blocks that can provide a define update
         */
        this.blocksWithDefines = [];
        /**
         * List of blocks that can provide a repeatable content
         */
        this.repeatableContentBlocks = [];
        /**
         * List of blocks that can provide a dynamic list of uniforms
         */
        this.dynamicUniformBlocks = [];
        /**
         * List of blocks that can block the isReady function for the material
         */
        this.blockingBlocks = [];
        /**
         * Gets the list of animated inputs
         */
        this.animatedInputs = [];
        /** List of emitted variables */
        this.variableNames = {};
        /** List of emitted defines */
        this.defineNames = {};
        /**
         * Gets the compilation hints emitted at compilation time
         */
        this.hints = {
            needWorldViewMatrix: false,
            needWorldViewProjectionMatrix: false,
            needAlphaBlending: false,
            needAlphaTesting: false,
        };
        /**
         * List of compilation checks
         */
        this.checks = {
            emitVertex: false,
            emitFragment: false,
            notConnectedNonOptionalInputs: new Array(),
        };
        /**
         * Is vertex program allowed to be empty?
         */
        this.allowEmptyVertexProgram = false;
        // Exclude usual attributes from free variable names
        this.variableNames["position"] = 0;
        this.variableNames["normal"] = 0;
        this.variableNames["tangent"] = 0;
        this.variableNames["uv"] = 0;
        this.variableNames["uv2"] = 0;
        this.variableNames["uv3"] = 0;
        this.variableNames["uv4"] = 0;
        this.variableNames["uv5"] = 0;
        this.variableNames["uv6"] = 0;
        this.variableNames["color"] = 0;
        this.variableNames["matricesIndices"] = 0;
        this.variableNames["matricesWeights"] = 0;
        this.variableNames["matricesIndicesExtra"] = 0;
        this.variableNames["matricesWeightsExtra"] = 0;
        this.variableNames["diffuseBase"] = 0;
        this.variableNames["specularBase"] = 0;
        this.variableNames["worldPos"] = 0;
        this.variableNames["shadow"] = 0;
        this.variableNames["view"] = 0;
        // Exclude known varyings
        this.variableNames["vTBN"] = 0;
        // Exclude defines
        this.defineNames["MAINUV0"] = 0;
        this.defineNames["MAINUV1"] = 0;
        this.defineNames["MAINUV2"] = 0;
        this.defineNames["MAINUV3"] = 0;
        this.defineNames["MAINUV4"] = 0;
        this.defineNames["MAINUV5"] = 0;
        this.defineNames["MAINUV6"] = 0;
        this.defineNames["MAINUV7"] = 0;
    }
    /**
     * Emits console errors and exceptions if there is a failing check
     * @param errorObservable defines an Observable to send the error message
     * @returns true if all checks pass
     */
    emitErrors(errorObservable = null) {
        let errorMessage = "";
        if (!this.checks.emitVertex && !this.allowEmptyVertexProgram) {
            errorMessage += "NodeMaterial does not have a vertex output. You need to at least add a block that generates a position value.\n";
        }
        if (!this.checks.emitFragment) {
            errorMessage += "NodeMaterial does not have a fragment output. You need to at least add a block that generates a color value.\n";
        }
        for (const notConnectedInput of this.checks.notConnectedNonOptionalInputs) {
            errorMessage += `input ${notConnectedInput.name} from block ${notConnectedInput.ownerBlock.name}[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            if (errorObservable) {
                errorObservable.notifyObservers(errorMessage);
            }
            Logger.Error("Build of NodeMaterial failed:\n" + errorMessage);
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=nodeMaterialBuildStateSharedData.js.map