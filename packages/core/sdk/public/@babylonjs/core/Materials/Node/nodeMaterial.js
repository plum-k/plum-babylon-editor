import { __decorate } from "../../tslib.es6.js";
import { PushMaterial } from "../pushMaterial.js";
import { Matrix, Vector2 } from "../../Maths/math.vector.js";
import { Color3, Color4 } from "../../Maths/math.color.js";
import { Mesh } from "../../Meshes/mesh.js";
import { NodeMaterialBuildState } from "./nodeMaterialBuildState.js";
import { Effect } from "../effect.js";
import { Observable } from "../../Misc/observable.js";
import { NodeMaterialBlockTargets } from "./Enums/nodeMaterialBlockTargets.js";
import { NodeMaterialBuildStateSharedData } from "./nodeMaterialBuildStateSharedData.js";
import { MaterialDefines } from "../../Materials/materialDefines.js";
import { VertexBuffer } from "../../Buffers/buffer.js";
import { Tools } from "../../Misc/tools.js";
import { TransformBlock } from "./Blocks/transformBlock.js";
import { VertexOutputBlock } from "./Blocks/Vertex/vertexOutputBlock.js";
import { FragmentOutputBlock } from "./Blocks/Fragment/fragmentOutputBlock.js";
import { InputBlock } from "./Blocks/Input/inputBlock.js";
import { GetClass, RegisterClass } from "../../Misc/typeStore.js";
import { serialize } from "../../Misc/decorators.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";
import { CurrentScreenBlock } from "./Blocks/Dual/currentScreenBlock.js";
import { ParticleTextureBlock } from "./Blocks/Particle/particleTextureBlock.js";
import { ParticleRampGradientBlock } from "./Blocks/Particle/particleRampGradientBlock.js";
import { ParticleBlendMultiplyBlock } from "./Blocks/Particle/particleBlendMultiplyBlock.js";
import { EffectFallbacks } from "../effectFallbacks.js";
import { WebRequest } from "../../Misc/webRequest.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";

import { VectorMergerBlock } from "./Blocks/vectorMergerBlock.js";
import { RemapBlock } from "./Blocks/remapBlock.js";
import { MultiplyBlock } from "./Blocks/multiplyBlock.js";
import { NodeMaterialModes } from "./Enums/nodeMaterialModes.js";
import { Texture } from "../Textures/texture.js";
import { BaseParticleSystem } from "../../Particles/baseParticleSystem.js";
import { ColorSplitterBlock } from "./Blocks/colorSplitterBlock.js";
import { TimingTools } from "../../Misc/timingTools.js";
import { ProceduralTexture } from "../Textures/Procedurals/proceduralTexture.js";
import { AnimatedInputBlockTypes } from "./Blocks/Input/animatedInputBlockTypes.js";
import { TrigonometryBlock, TrigonometryBlockOperations } from "./Blocks/trigonometryBlock.js";
import { NodeMaterialSystemValues } from "./Enums/nodeMaterialSystemValues.js";
import { EngineStore } from "../../Engines/engineStore.js";
import { Logger } from "../../Misc/logger.js";
import { PrepareDefinesForCamera, PrepareDefinesForPrePass } from "../materialHelper.functions.js";
import { AbstractEngine } from "../../Engines/abstractEngine.js";
import { MaterialHelperGeometryRendering } from "../materialHelper.geometryrendering.js";
const onCreatedEffectParameters = { effect: null, subMesh: null };
/** @internal */
export class NodeMaterialDefines extends MaterialDefines {
    /**
     * Creates a new NodeMaterialDefines
     */
    constructor() {
        super();
        /** Normal */
        this.NORMAL = false;
        /** Tangent */
        this.TANGENT = false;
        /** Vertex color */
        this.VERTEXCOLOR_NME = false;
        /**  Uv1 **/
        this.UV1 = false;
        /** Uv2 **/
        this.UV2 = false;
        /** Uv3 **/
        this.UV3 = false;
        /** Uv4 **/
        this.UV4 = false;
        /** Uv5 **/
        this.UV5 = false;
        /** Uv6 **/
        this.UV6 = false;
        /** Prepass **/
        this.PREPASS = false;
        /** Prepass normal */
        this.PREPASS_NORMAL = false;
        /** Prepass normal index */
        this.PREPASS_NORMAL_INDEX = -1;
        /** Prepass world normal */
        this.PREPASS_WORLD_NORMAL = false;
        /** Prepass world normal index */
        this.PREPASS_WORLD_NORMAL_INDEX = -1;
        /** Prepass position */
        this.PREPASS_POSITION = false;
        /** Prepass position index */
        this.PREPASS_POSITION_INDEX = -1;
        /** Prepass local position */
        this.PREPASS_LOCAL_POSITION = false;
        /** Prepass local position index */
        this.PREPASS_LOCAL_POSITION_INDEX = -1;
        /** Prepass depth */
        this.PREPASS_DEPTH = false;
        /** Prepass depth index */
        this.PREPASS_DEPTH_INDEX = -1;
        /** Clip-space depth */
        this.PREPASS_SCREENSPACE_DEPTH = false;
        /** Clip-space depth index */
        this.PREPASS_SCREENSPACE_DEPTH_INDEX = -1;
        /** Scene MRT count */
        this.SCENE_MRT_COUNT = 0;
        /** BONES */
        this.NUM_BONE_INFLUENCERS = 0;
        /** Bones per mesh */
        this.BonesPerMesh = 0;
        /** Using texture for bone storage */
        this.BONETEXTURE = false;
        /** MORPH TARGETS */
        this.MORPHTARGETS = false;
        /** Morph target position */
        this.MORPHTARGETS_POSITION = false;
        /** Morph target normal */
        this.MORPHTARGETS_NORMAL = false;
        /** Morph target tangent */
        this.MORPHTARGETS_TANGENT = false;
        /** Morph target uv */
        this.MORPHTARGETS_UV = false;
        /** Morph target uv2 */
        this.MORPHTARGETS_UV2 = false;
        /** Morph target support positions */
        this.MORPHTARGETTEXTURE_HASPOSITIONS = false;
        /** Morph target support normals */
        this.MORPHTARGETTEXTURE_HASNORMALS = false;
        /** Morph target support tangents */
        this.MORPHTARGETTEXTURE_HASTANGENTS = false;
        /** Morph target support uvs */
        this.MORPHTARGETTEXTURE_HASUVS = false;
        /** Morph target support uv2s */
        this.MORPHTARGETTEXTURE_HASUV2S = false;
        /** Number of morph influencers */
        this.NUM_MORPH_INFLUENCERS = 0;
        /** Using a texture to store morph target data */
        this.MORPHTARGETS_TEXTURE = false;
        /** IMAGE PROCESSING */
        this.IMAGEPROCESSING = false;
        /** Vignette */
        this.VIGNETTE = false;
        /** Multiply blend mode for vignette */
        this.VIGNETTEBLENDMODEMULTIPLY = false;
        /** Opaque blend mode for vignette */
        this.VIGNETTEBLENDMODEOPAQUE = false;
        /** Tone mapping */
        this.TONEMAPPING = 0;
        /** Contrast */
        this.CONTRAST = false;
        /** Exposure */
        this.EXPOSURE = false;
        /** Color curves */
        this.COLORCURVES = false;
        /** Color grading */
        this.COLORGRADING = false;
        /** 3D color grading */
        this.COLORGRADING3D = false;
        /** Sampler green depth */
        this.SAMPLER3DGREENDEPTH = false;
        /** Sampler for BGR map */
        this.SAMPLER3DBGRMAP = false;
        /** Dithering */
        this.DITHER = false;
        /** Using post process for image processing */
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        /** Skip color clamp */
        this.SKIPFINALCOLORCLAMP = false;
        /** MISC. */
        this.BUMPDIRECTUV = 0;
        /** Camera is orthographic */
        this.CAMERA_ORTHOGRAPHIC = false;
        /** Camera is perspective */
        this.CAMERA_PERSPECTIVE = false;
        this.rebuild();
    }
    /**
     * Set the value of a specific key
     * @param name defines the name of the key to set
     * @param value defines the value to set
     * @param markAsUnprocessedIfDirty Flag to indicate to the cache that this value needs processing
     */
    setValue(name, value, markAsUnprocessedIfDirty = false) {
        if (this[name] === undefined) {
            this._keys.push(name);
        }
        if (markAsUnprocessedIfDirty && this[name] !== value) {
            this.markAsUnprocessed();
        }
        this[name] = value;
    }
}
/**
 * Class used to create a node based material built by assembling shader blocks
 */
export class NodeMaterial extends PushMaterial {
    /**
     * Checks if a block is a texture block
     * @param block The block to check
     * @returns True if the block is a texture block
     */
    static _BlockIsTextureBlock(block) {
        return (block.getClassName() === "TextureBlock" ||
            block.getClassName() === "ReflectionTextureBaseBlock" ||
            block.getClassName() === "ReflectionTextureBlock" ||
            block.getClassName() === "ReflectionBlock" ||
            block.getClassName() === "RefractionBlock" ||
            block.getClassName() === "CurrentScreenBlock" ||
            block.getClassName() === "ParticleTextureBlock" ||
            block.getClassName() === "ImageSourceBlock" ||
            block.getClassName() === "TriPlanarBlock" ||
            block.getClassName() === "BiPlanarBlock" ||
            block.getClassName() === "PrePassTextureBlock");
    }
    set _glowModeEnabled(value) {
        this._useAdditionalColor = value;
    }
    /** Get the inspector from bundle or global
     * @returns the global NME
     */
    _getGlobalNodeMaterialEditor() {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODEEDITOR !== "undefined") {
            return NODEEDITOR;
        }
        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.NodeEditor !== "undefined") {
            return BABYLON;
        }
        return undefined;
    }
    /** Gets or sets the active shader language */
    get shaderLanguage() {
        return this._options?.shaderLanguage || NodeMaterial.DefaultShaderLanguage;
    }
    set shaderLanguage(value) {
        this._options.shaderLanguage = value;
    }
    /** Gets or sets options to control the node material overall behavior */
    get options() {
        return this._options;
    }
    set options(options) {
        this._options = options;
    }
    /**
     * Gets the image processing configuration used either in this material.
     */
    get imageProcessingConfiguration() {
        return this._imageProcessingConfiguration;
    }
    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    set imageProcessingConfiguration(value) {
        this._attachImageProcessingConfiguration(value);
        // Ensure the effect will be rebuilt.
        this._markAllSubMeshesAsTexturesDirty();
    }
    /**
     * Gets or sets the mode property
     */
    get mode() {
        return this._mode;
    }
    set mode(value) {
        this._mode = value;
    }
    /** Gets or sets the unique identifier used to identified the effect associated with the material */
    get buildId() {
        return this._buildId;
    }
    set buildId(value) {
        this._buildId = value;
    }
    /**
     * Create a new node based material
     * @param name defines the material name
     * @param scene defines the hosting scene
     * @param options defines creation option
     */
    constructor(name, scene, options = {}) {
        super(name, scene || EngineStore.LastCreatedScene);
        this._buildId = NodeMaterial._BuildIdGenerator++;
        this._buildWasSuccessful = false;
        this._cachedWorldViewMatrix = new Matrix();
        this._cachedWorldViewProjectionMatrix = new Matrix();
        this._optimizers = new Array();
        this._animationFrame = -1;
        this._buildIsInProgress = false;
        this.BJSNODEMATERIALEDITOR = this._getGlobalNodeMaterialEditor();
        /** @internal */
        this._useAdditionalColor = false;
        /**
         * Gets or sets data used by visual editor
         * @see https://nme.babylonjs.com
         */
        this.editorData = null;
        /**
         * Gets or sets a boolean indicating that alpha value must be ignored (This will turn alpha blending off even if an alpha value is produced by the material)
         */
        this.ignoreAlpha = false;
        /**
         * Defines the maximum number of lights that can be used in the material
         */
        this.maxSimultaneousLights = 4;
        /**
         * Observable raised when the material is built
         */
        this.onBuildObservable = new Observable();
        /**
         * Observable raised when an error is detected
         */
        this.onBuildErrorObservable = new Observable();
        /**
         * Gets or sets the root nodes of the material vertex shader
         */
        this._vertexOutputNodes = new Array();
        /**
         * Gets or sets the root nodes of the material fragment (pixel) shader
         */
        this._fragmentOutputNodes = new Array();
        /**
         * Gets an array of blocks that needs to be serialized even if they are not yet connected
         */
        this.attachedBlocks = [];
        /**
         * Specifies the mode of the node material
         * @internal
         */
        this._mode = NodeMaterialModes.Material;
        /**
         * Gets or sets a boolean indicating that alpha blending must be enabled no matter what alpha value or alpha channel of the FragmentBlock are
         */
        this.forceAlphaBlending = false;
        if (options && options.shaderLanguage === 1 /* ShaderLanguage.WGSL */ && !this.getScene().getEngine().isWebGPU) {
            throw new Error("WebGPU shader language is only supported with WebGPU engine");
        }
        this._options = {
            emitComments: false,
            shaderLanguage: NodeMaterial.DefaultShaderLanguage,
            ...options,
        };
        // Setup the default processing configuration to the scene.
        this._attachImageProcessingConfiguration(null);
    }
    /**
     * Gets the current class name of the material e.g. "NodeMaterial"
     * @returns the class name
     */
    getClassName() {
        return "NodeMaterial";
    }
    /**
     * Attaches a new image processing configuration to the Standard Material.
     * @param configuration
     */
    _attachImageProcessingConfiguration(configuration) {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }
        // Detaches observer.
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        // Pick the scene configuration if needed.
        if (!configuration) {
            this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }
        // Attaches observer.
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }
    /**
     * Get a block by its name
     * @param name defines the name of the block to retrieve
     * @returns the required block or null if not found
     */
    getBlockByName(name) {
        let result = null;
        for (const block of this.attachedBlocks) {
            if (block.name === name) {
                if (!result) {
                    result = block;
                }
                else {
                    Tools.Warn("More than one block was found with the name `" + name + "`");
                    return result;
                }
            }
        }
        return result;
    }
    /**
     * Get a block using a predicate
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required block or null if not found
     */
    getBlockByPredicate(predicate) {
        for (const block of this.attachedBlocks) {
            if (predicate(block)) {
                return block;
            }
        }
        return null;
    }
    /**
     * Get an input block using a predicate
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required input block or null if not found
     */
    getInputBlockByPredicate(predicate) {
        for (const block of this.attachedBlocks) {
            if (block.isInput && predicate(block)) {
                return block;
            }
        }
        return null;
    }
    /**
     * Gets the list of input blocks attached to this material
     * @returns an array of InputBlocks
     */
    getInputBlocks() {
        const blocks = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block);
            }
        }
        return blocks;
    }
    /**
     * Adds a new optimizer to the list of optimizers
     * @param optimizer defines the optimizers to add
     * @returns the current material
     */
    registerOptimizer(optimizer) {
        const index = this._optimizers.indexOf(optimizer);
        if (index > -1) {
            return;
        }
        this._optimizers.push(optimizer);
        return this;
    }
    /**
     * Remove an optimizer from the list of optimizers
     * @param optimizer defines the optimizers to remove
     * @returns the current material
     */
    unregisterOptimizer(optimizer) {
        const index = this._optimizers.indexOf(optimizer);
        if (index === -1) {
            return;
        }
        this._optimizers.splice(index, 1);
        return this;
    }
    /**
     * Add a new block to the list of output nodes
     * @param node defines the node to add
     * @returns the current material
     */
    addOutputNode(node) {
        if (node.target === null) {
            // eslint-disable-next-line no-throw-literal
            throw "This node is not meant to be an output node. You may want to explicitly set its target value.";
        }
        if ((node.target & NodeMaterialBlockTargets.Vertex) !== 0) {
            this._addVertexOutputNode(node);
        }
        if ((node.target & NodeMaterialBlockTargets.Fragment) !== 0) {
            this._addFragmentOutputNode(node);
        }
        return this;
    }
    /**
     * Remove a block from the list of root nodes
     * @param node defines the node to remove
     * @returns the current material
     */
    removeOutputNode(node) {
        if (node.target === null) {
            return this;
        }
        if ((node.target & NodeMaterialBlockTargets.Vertex) !== 0) {
            this._removeVertexOutputNode(node);
        }
        if ((node.target & NodeMaterialBlockTargets.Fragment) !== 0) {
            this._removeFragmentOutputNode(node);
        }
        return this;
    }
    _addVertexOutputNode(node) {
        if (this._vertexOutputNodes.indexOf(node) !== -1) {
            return;
        }
        node.target = NodeMaterialBlockTargets.Vertex;
        this._vertexOutputNodes.push(node);
        return this;
    }
    _removeVertexOutputNode(node) {
        const index = this._vertexOutputNodes.indexOf(node);
        if (index === -1) {
            return;
        }
        this._vertexOutputNodes.splice(index, 1);
        return this;
    }
    _addFragmentOutputNode(node) {
        if (this._fragmentOutputNodes.indexOf(node) !== -1) {
            return;
        }
        node.target = NodeMaterialBlockTargets.Fragment;
        this._fragmentOutputNodes.push(node);
        return this;
    }
    _removeFragmentOutputNode(node) {
        const index = this._fragmentOutputNodes.indexOf(node);
        if (index === -1) {
            return;
        }
        this._fragmentOutputNodes.splice(index, 1);
        return this;
    }
    get _supportGlowLayer() {
        if (this._fragmentOutputNodes.length === 0) {
            return false;
        }
        if (this._fragmentOutputNodes.some((f) => f.additionalColor && f.additionalColor.isConnected)) {
            return true;
        }
        return false;
    }
    /**
     * Specifies if the material will require alpha blending
     * @returns a boolean specifying if alpha blending is needed
     */
    needAlphaBlending() {
        if (this.ignoreAlpha) {
            return false;
        }
        return this.forceAlphaBlending || this.alpha < 1.0 || (this._sharedData && this._sharedData.hints.needAlphaBlending);
    }
    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns a boolean specifying if an alpha test is needed.
     */
    needAlphaTesting() {
        return this._sharedData && this._sharedData.hints.needAlphaTesting;
    }
    _processInitializeOnLink(block, state, nodesToProcessForOtherBuildState, autoConfigure = true) {
        if (block.target === NodeMaterialBlockTargets.VertexAndFragment) {
            nodesToProcessForOtherBuildState.push(block);
        }
        else if (state.target === NodeMaterialBlockTargets.Fragment && block.target === NodeMaterialBlockTargets.Vertex && block._preparationId !== this._buildId) {
            nodesToProcessForOtherBuildState.push(block);
        }
        this._initializeBlock(block, state, nodesToProcessForOtherBuildState, autoConfigure);
    }
    _attachBlock(node) {
        if (this.attachedBlocks.indexOf(node) === -1) {
            if (node.isUnique) {
                const className = node.getClassName();
                for (const other of this.attachedBlocks) {
                    if (other.getClassName() === className) {
                        // eslint-disable-next-line no-throw-literal
                        throw `Cannot have multiple blocks of type ${className} in the same NodeMaterial`;
                    }
                }
            }
            this.attachedBlocks.push(node);
        }
    }
    _initializeBlock(node, state, nodesToProcessForOtherBuildState, autoConfigure = true) {
        node.initialize(state);
        if (autoConfigure) {
            node.autoConfigure(this);
        }
        node._preparationId = this._buildId;
        this._attachBlock(node);
        for (const input of node.inputs) {
            input.associatedVariableName = "";
            const connectedPoint = input.connectedPoint;
            if (connectedPoint && !connectedPoint._preventBubbleUp) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._processInitializeOnLink(block, state, nodesToProcessForOtherBuildState, autoConfigure);
                }
            }
        }
        // Loop
        if (node.isLoop) {
            // We need to keep the storage write block in the active blocks
            const loopBlock = node;
            if (loopBlock.loopID.hasEndpoints) {
                for (const endpoint of loopBlock.loopID.endpoints) {
                    const block = endpoint.ownerBlock;
                    if (block.outputs.length !== 0) {
                        continue;
                    }
                    state._terminalBlocks.add(block); // Attach the storage write only
                    this._processInitializeOnLink(block, state, nodesToProcessForOtherBuildState, autoConfigure);
                }
            }
        }
        else if (node.isTeleportOut) {
            // Teleportation
            const teleport = node;
            if (teleport.entryPoint) {
                this._processInitializeOnLink(teleport.entryPoint, state, nodesToProcessForOtherBuildState, autoConfigure);
            }
        }
        for (const output of node.outputs) {
            output.associatedVariableName = "";
        }
    }
    _resetDualBlocks(node, id) {
        if (node.target === NodeMaterialBlockTargets.VertexAndFragment) {
            node.buildId = id;
        }
        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint && !connectedPoint._preventBubbleUp) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._resetDualBlocks(block, id);
                }
            }
        }
        // If this is a teleport out, we need to reset the connected block
        if (node.isTeleportOut) {
            const teleportOut = node;
            if (teleportOut.entryPoint) {
                this._resetDualBlocks(teleportOut.entryPoint, id);
            }
        }
        else if (node.isLoop) {
            // Loop
            const loopBlock = node;
            if (loopBlock.loopID.hasEndpoints) {
                for (const endpoint of loopBlock.loopID.endpoints) {
                    const block = endpoint.ownerBlock;
                    if (block.outputs.length !== 0) {
                        continue;
                    }
                    this._resetDualBlocks(block, id);
                }
            }
        }
    }
    /**
     * Remove a block from the current node material
     * @param block defines the block to remove
     */
    removeBlock(block) {
        const attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }
        if (block.isFinalMerger) {
            this.removeOutputNode(block);
        }
    }
    /**
     * Build the material and generates the inner effect
     * @param verbose defines if the build should log activity
     * @param updateBuildId defines if the internal build Id should be updated (default is true)
     * @param autoConfigure defines if the autoConfigure method should be called when initializing blocks (default is false)
     */
    build(verbose = false, updateBuildId = true, autoConfigure = false) {
        if (this._buildIsInProgress) {
            Logger.Warn("Build is already in progress, You can use NodeMaterial.onBuildObservable to determine when the build is completed.");
            return;
        }
        this._buildIsInProgress = true;
        // First time?
        if (!this._vertexCompilationState && !autoConfigure) {
            autoConfigure = true;
        }
        this._buildWasSuccessful = false;
        const engine = this.getScene().getEngine();
        const allowEmptyVertexProgram = this._mode === NodeMaterialModes.Particle;
        if (this._vertexOutputNodes.length === 0 && !allowEmptyVertexProgram) {
            // eslint-disable-next-line no-throw-literal
            throw "You must define at least one vertexOutputNode";
        }
        if (this._fragmentOutputNodes.length === 0) {
            // eslint-disable-next-line no-throw-literal
            throw "You must define at least one fragmentOutputNode";
        }
        // Compilation state
        this._vertexCompilationState = new NodeMaterialBuildState();
        this._vertexCompilationState.supportUniformBuffers = engine.supportsUniformBuffers;
        this._vertexCompilationState.target = NodeMaterialBlockTargets.Vertex;
        this._fragmentCompilationState = new NodeMaterialBuildState();
        this._fragmentCompilationState.supportUniformBuffers = engine.supportsUniformBuffers;
        this._fragmentCompilationState.target = NodeMaterialBlockTargets.Fragment;
        // Shared data
        this._sharedData = new NodeMaterialBuildStateSharedData();
        this._sharedData.nodeMaterial = this;
        this._sharedData.fragmentOutputNodes = this._fragmentOutputNodes;
        this._vertexCompilationState.sharedData = this._sharedData;
        this._fragmentCompilationState.sharedData = this._sharedData;
        this._sharedData.buildId = this._buildId;
        this._sharedData.emitComments = this._options.emitComments;
        this._sharedData.verbose = verbose;
        this._sharedData.scene = this.getScene();
        this._sharedData.allowEmptyVertexProgram = allowEmptyVertexProgram;
        // Initialize blocks
        const vertexNodes = [];
        const fragmentNodes = [];
        for (const vertexOutputNode of this._vertexOutputNodes) {
            vertexNodes.push(vertexOutputNode);
            this._initializeBlock(vertexOutputNode, this._vertexCompilationState, fragmentNodes, autoConfigure);
        }
        for (const fragmentOutputNode of this._fragmentOutputNodes) {
            fragmentNodes.push(fragmentOutputNode);
            this._initializeBlock(fragmentOutputNode, this._fragmentCompilationState, vertexNodes, autoConfigure);
        }
        // Are blocks code ready?
        let waitingNodeCount = 0;
        for (const node of this.attachedBlocks) {
            if (!node.codeIsReady) {
                waitingNodeCount++;
                node.onCodeIsReadyObservable.addOnce(() => {
                    waitingNodeCount--;
                    if (waitingNodeCount === 0) {
                        this._finishBuildProcess(verbose, updateBuildId, vertexNodes, fragmentNodes);
                    }
                });
            }
        }
        if (waitingNodeCount !== 0) {
            return;
        }
        this._finishBuildProcess(verbose, updateBuildId, vertexNodes, fragmentNodes);
    }
    _finishBuildProcess(verbose = false, updateBuildId = true, vertexNodes, fragmentNodes) {
        // Optimize
        this.optimize();
        // Vertex
        for (const vertexOutputNode of vertexNodes) {
            vertexOutputNode.build(this._vertexCompilationState, vertexNodes);
        }
        // Fragment
        this._fragmentCompilationState.uniforms = this._vertexCompilationState.uniforms.slice(0);
        this._fragmentCompilationState._uniformDeclaration = this._vertexCompilationState._uniformDeclaration;
        this._fragmentCompilationState._constantDeclaration = this._vertexCompilationState._constantDeclaration;
        this._fragmentCompilationState._vertexState = this._vertexCompilationState;
        for (const fragmentOutputNode of fragmentNodes) {
            this._resetDualBlocks(fragmentOutputNode, this._buildId - 1);
        }
        for (const fragmentOutputNode of fragmentNodes) {
            fragmentOutputNode.build(this._fragmentCompilationState, fragmentNodes);
        }
        // Finalize
        this._vertexCompilationState.finalize(this._vertexCompilationState);
        this._fragmentCompilationState.finalize(this._fragmentCompilationState);
        if (updateBuildId) {
            this._buildId = NodeMaterial._BuildIdGenerator++;
        }
        // Errors
        const noError = this._sharedData.emitErrors(this.onBuildErrorObservable);
        if (verbose) {
            Logger.Log("Vertex shader:");
            Logger.Log(this._vertexCompilationState.compilationString);
            Logger.Log("Fragment shader:");
            Logger.Log(this._fragmentCompilationState.compilationString);
        }
        this._buildIsInProgress = false;
        this._buildWasSuccessful = true;
        if (noError) {
            this.onBuildObservable.notifyObservers(this);
        }
        // Wipe defines
        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                if (subMesh.getMaterial() !== this) {
                    continue;
                }
                if (!subMesh.materialDefines) {
                    continue;
                }
                const defines = subMesh.materialDefines;
                defines.markAllAsDirty();
                defines.reset();
            }
        }
        if (this.prePassTextureInputs.length) {
            this.getScene().enablePrePassRenderer();
        }
        const prePassRenderer = this.getScene().prePassRenderer;
        if (prePassRenderer) {
            prePassRenderer.markAsDirty();
        }
    }
    /**
     * Runs an optimization phase to try to improve the shader code
     */
    optimize() {
        for (const optimizer of this._optimizers) {
            optimizer.optimize(this._vertexOutputNodes, this._fragmentOutputNodes);
        }
    }
    _prepareDefinesForAttributes(mesh, defines) {
        const oldNormal = defines["NORMAL"];
        const oldTangent = defines["TANGENT"];
        const oldColor = defines["VERTEXCOLOR_NME"];
        defines["NORMAL"] = mesh.isVerticesDataPresent(VertexBuffer.NormalKind);
        defines["TANGENT"] = mesh.isVerticesDataPresent(VertexBuffer.TangentKind);
        const hasVertexColors = mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind);
        defines["VERTEXCOLOR_NME"] = hasVertexColors;
        let uvChanged = false;
        for (let i = 1; i <= 6; ++i) {
            const oldUV = defines["UV" + i];
            defines["UV" + i] = mesh.isVerticesDataPresent(`uv${i === 1 ? "" : i}`);
            uvChanged = uvChanged || defines["UV" + i] !== oldUV;
        }
        // PrePass
        const oit = this.needAlphaBlendingForMesh(mesh) && this.getScene().useOrderIndependentTransparency;
        PrepareDefinesForPrePass(this.getScene(), defines, !oit);
        MaterialHelperGeometryRendering.PrepareDefines(this.getScene().getEngine().currentRenderPassId, mesh, defines);
        if (oldNormal !== defines["NORMAL"] || oldTangent !== defines["TANGENT"] || oldColor !== defines["VERTEXCOLOR_NME"] || uvChanged) {
            defines.markAsAttributesDirty();
        }
    }
    /**
     * Can this material render to prepass
     */
    get isPrePassCapable() {
        return true;
    }
    /**
     * Outputs written to the prepass
     */
    get prePassTextureOutputs() {
        const prePassOutputBlock = this.getBlockByPredicate((block) => block.getClassName() === "PrePassOutputBlock");
        const result = [4];
        if (!prePassOutputBlock) {
            return result;
        }
        // Cannot write to prepass if we alread read from prepass
        if (this.prePassTextureInputs.length) {
            return result;
        }
        if (prePassOutputBlock.viewDepth.isConnected) {
            result.push(5);
        }
        if (prePassOutputBlock.screenDepth.isConnected) {
            result.push(10);
        }
        if (prePassOutputBlock.viewNormal.isConnected) {
            result.push(6);
        }
        if (prePassOutputBlock.worldNormal.isConnected) {
            result.push(8);
        }
        if (prePassOutputBlock.worldPosition.isConnected) {
            result.push(1);
        }
        return result;
    }
    /**
     * Gets the list of prepass texture required
     */
    get prePassTextureInputs() {
        const prePassTextureBlocks = this.getAllTextureBlocks().filter((block) => block.getClassName() === "PrePassTextureBlock");
        const result = [];
        for (const block of prePassTextureBlocks) {
            if (block.position.isConnected && !result.includes(1)) {
                result.push(1);
            }
            if (block.localPosition.isConnected && !result.includes(9)) {
                result.push(9);
            }
            if (block.depth.isConnected && !result.includes(5)) {
                result.push(5);
            }
            if (block.screenDepth.isConnected && !result.includes(10)) {
                result.push(10);
            }
            if (block.normal.isConnected && !result.includes(6)) {
                result.push(6);
            }
            if (block.worldNormal.isConnected && !result.includes(8)) {
                result.push(8);
            }
        }
        return result;
    }
    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to set
     * @returns true if the pre pass is needed
     */
    setPrePassRenderer(prePassRenderer) {
        const prePassTexturesRequired = this.prePassTextureInputs.concat(this.prePassTextureOutputs);
        if (prePassRenderer && prePassTexturesRequired.length > 1) {
            let cfg = prePassRenderer.getEffectConfiguration("nodeMaterial");
            if (!cfg) {
                cfg = prePassRenderer.addEffectConfiguration({
                    enabled: true,
                    needsImageProcessing: false,
                    name: "nodeMaterial",
                    texturesRequired: [],
                });
            }
            for (const prePassTexture of prePassTexturesRequired) {
                if (!cfg.texturesRequired.includes(prePassTexture)) {
                    cfg.texturesRequired.push(prePassTexture);
                }
            }
            cfg.enabled = true;
        }
        // COLOR_TEXTURE is always required for prepass, length > 1 means
        // we actually need to write to special prepass textures
        return prePassTexturesRequired.length > 1;
    }
    /**
     * Create a post process from the material
     * @param camera The camera to apply the render pass to.
     * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
     * @returns the post process created
     */
    createPostProcess(camera, options = 1, samplingMode = 1, engine, reusable, textureType = 0, textureFormat = 5) {
        if (this.mode !== NodeMaterialModes.PostProcess) {
            Logger.Log("Incompatible material mode");
            return null;
        }
        return this._createEffectForPostProcess(null, camera, options, samplingMode, engine, reusable, textureType, textureFormat);
    }
    /**
     * Create the post process effect from the material
     * @param postProcess The post process to create the effect for
     */
    createEffectForPostProcess(postProcess) {
        this._createEffectForPostProcess(postProcess);
    }
    _createEffectForPostProcess(postProcess, camera, options = 1, samplingMode = 1, engine, reusable, textureType = 0, textureFormat = 5) {
        let tempName = this.name + this._buildId;
        const defines = new NodeMaterialDefines();
        const dummyMesh = new Mesh(tempName + "PostProcess", this.getScene());
        let buildId = this._buildId;
        this._processDefines(dummyMesh, defines);
        Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString, this.shaderLanguage);
        if (!postProcess) {
            postProcess = new PostProcess(this.name + "PostProcess", tempName, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, options, camera, samplingMode, engine, reusable, defines.toString(), textureType, tempName, { maxSimultaneousLights: this.maxSimultaneousLights }, false, textureFormat, this.shaderLanguage);
        }
        else {
            postProcess.updateEffect(defines.toString(), this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, { maxSimultaneousLights: this.maxSimultaneousLights }, undefined, undefined, tempName, tempName);
        }
        postProcess.nodeMaterialSource = this;
        postProcess.onApplyObservable.add((effect) => {
            if (buildId !== this._buildId) {
                delete Effect.ShadersStore[tempName + "VertexShader"];
                delete Effect.ShadersStore[tempName + "PixelShader"];
                tempName = this.name + this._buildId;
                defines.markAllAsDirty();
                buildId = this._buildId;
            }
            const result = this._processDefines(dummyMesh, defines);
            if (result) {
                Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString);
                TimingTools.SetImmediate(() => postProcess.updateEffect(defines.toString(), this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, { maxSimultaneousLights: this.maxSimultaneousLights }, undefined, undefined, tempName, tempName));
            }
            this._checkInternals(effect);
        });
        return postProcess;
    }
    /**
     * Create a new procedural texture based on this node material
     * @param size defines the size of the texture
     * @param scene defines the hosting scene
     * @returns the new procedural texture attached to this node material
     */
    createProceduralTexture(size, scene) {
        if (this.mode !== NodeMaterialModes.ProceduralTexture) {
            Logger.Log("Incompatible material mode");
            return null;
        }
        let tempName = this.name + this._buildId;
        const proceduralTexture = new ProceduralTexture(tempName, size, null, scene);
        const dummyMesh = new Mesh(tempName + "Procedural", this.getScene());
        dummyMesh.reservedDataStore = {
            hidden: true,
        };
        const defines = new NodeMaterialDefines();
        const result = this._processDefines(dummyMesh, defines);
        Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString, this.shaderLanguage);
        let effect = this.getScene().getEngine().createEffect({
            vertexElement: tempName,
            fragmentElement: tempName,
        }, [VertexBuffer.PositionKind], this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, defines.toString(), result?.fallbacks, undefined, undefined, undefined, this.shaderLanguage);
        proceduralTexture.nodeMaterialSource = this;
        proceduralTexture._setEffect(effect);
        let buildId = this._buildId;
        const refreshEffect = () => {
            if (buildId !== this._buildId) {
                delete Effect.ShadersStore[tempName + "VertexShader"];
                delete Effect.ShadersStore[tempName + "PixelShader"];
                tempName = this.name + this._buildId;
                defines.markAllAsDirty();
                buildId = this._buildId;
            }
            const result = this._processDefines(dummyMesh, defines);
            if (result) {
                Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString, this.shaderLanguage);
                TimingTools.SetImmediate(() => {
                    effect = this.getScene().getEngine().createEffect({
                        vertexElement: tempName,
                        fragmentElement: tempName,
                    }, [VertexBuffer.PositionKind], this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, defines.toString(), result?.fallbacks, undefined);
                    proceduralTexture._setEffect(effect);
                });
            }
            this._checkInternals(effect);
        };
        proceduralTexture.onBeforeGenerationObservable.add(() => {
            refreshEffect();
        });
        // This is needed if the procedural texture is not set to refresh automatically
        this.onBuildObservable.add(() => {
            refreshEffect();
        });
        return proceduralTexture;
    }
    _createEffectForParticles(particleSystem, blendMode, onCompiled, onError, effect, defines, dummyMesh, particleSystemDefinesJoined = "") {
        let tempName = this.name + this._buildId + "_" + blendMode;
        if (!defines) {
            defines = new NodeMaterialDefines();
        }
        if (!dummyMesh) {
            dummyMesh = this.getScene().getMeshByName(this.name + "Particle");
            if (!dummyMesh) {
                dummyMesh = new Mesh(this.name + "Particle", this.getScene());
                dummyMesh.reservedDataStore = {
                    hidden: true,
                };
            }
        }
        let buildId = this._buildId;
        const particleSystemDefines = [];
        let join = particleSystemDefinesJoined;
        if (!effect) {
            const result = this._processDefines(dummyMesh, defines);
            Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, undefined, this.shaderLanguage);
            particleSystem.fillDefines(particleSystemDefines, blendMode, false);
            join = particleSystemDefines.join("\n");
            effect = this.getScene()
                .getEngine()
                .createEffectForParticles(tempName, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, defines.toString() + "\n" + join, result?.fallbacks, onCompiled, onError, particleSystem, this.shaderLanguage);
            particleSystem.setCustomEffect(effect, blendMode);
        }
        effect.onBindObservable.add((effect) => {
            if (buildId !== this._buildId) {
                delete Effect.ShadersStore[tempName + "PixelShader"];
                tempName = this.name + this._buildId + "_" + blendMode;
                defines.markAllAsDirty();
                buildId = this._buildId;
            }
            particleSystemDefines.length = 0;
            particleSystem.fillDefines(particleSystemDefines, blendMode, false);
            const particleSystemDefinesJoinedCurrent = particleSystemDefines.join("\n");
            if (particleSystemDefinesJoinedCurrent !== join) {
                defines.markAllAsDirty();
                join = particleSystemDefinesJoinedCurrent;
            }
            const result = this._processDefines(dummyMesh, defines);
            if (result) {
                Effect.RegisterShader(tempName, this._fragmentCompilationState._builtCompilationString, undefined, this.shaderLanguage);
                effect = this.getScene()
                    .getEngine()
                    .createEffectForParticles(tempName, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, defines.toString() + "\n" + join, result?.fallbacks, onCompiled, onError, particleSystem);
                particleSystem.setCustomEffect(effect, blendMode);
                this._createEffectForParticles(particleSystem, blendMode, onCompiled, onError, effect, defines, dummyMesh, particleSystemDefinesJoined); // add the effect.onBindObservable observer
                return;
            }
            this._checkInternals(effect);
        });
    }
    _checkInternals(effect) {
        // Animated blocks
        if (this._sharedData.animatedInputs) {
            const scene = this.getScene();
            const frameId = scene.getFrameId();
            if (this._animationFrame !== frameId) {
                for (const input of this._sharedData.animatedInputs) {
                    input.animate(scene);
                }
                this._animationFrame = frameId;
            }
        }
        // Bindable blocks
        for (const block of this._sharedData.bindableBlocks) {
            block.bind(effect, this);
        }
        // Connection points
        for (const inputBlock of this._sharedData.inputBlocks) {
            inputBlock._transmit(effect, this.getScene(), this);
        }
    }
    /**
     * Create the effect to be used as the custom effect for a particle system
     * @param particleSystem Particle system to create the effect for
     * @param onCompiled defines a function to call when the effect creation is successful
     * @param onError defines a function to call when the effect creation has failed
     */
    createEffectForParticles(particleSystem, onCompiled, onError) {
        if (this.mode !== NodeMaterialModes.Particle) {
            Logger.Log("Incompatible material mode");
            return;
        }
        this._createEffectForParticles(particleSystem, BaseParticleSystem.BLENDMODE_ONEONE, onCompiled, onError);
        this._createEffectForParticles(particleSystem, BaseParticleSystem.BLENDMODE_MULTIPLY, onCompiled, onError);
    }
    /**
     * Use this material as the shadow depth wrapper of a target material
     * @param targetMaterial defines the target material
     */
    createAsShadowDepthWrapper(targetMaterial) {
        if (this.mode !== NodeMaterialModes.Material) {
            Logger.Log("Incompatible material mode");
            return;
        }
        targetMaterial.shadowDepthWrapper = new BABYLON.ShadowDepthWrapper(this, this.getScene());
    }
    _processDefines(mesh, defines, useInstances = false, subMesh) {
        let result = null;
        // Global defines
        const scene = this.getScene();
        if (PrepareDefinesForCamera(scene, defines)) {
            defines.markAsMiscDirty();
        }
        // Shared defines
        this._sharedData.blocksWithDefines.forEach((b) => {
            b.initializeDefines(mesh, this, defines, useInstances);
        });
        this._sharedData.blocksWithDefines.forEach((b) => {
            b.prepareDefines(mesh, this, defines, useInstances, subMesh);
        });
        // Need to recompile?
        if (defines.isDirty) {
            const lightDisposed = defines._areLightsDisposed;
            defines.markAsProcessed();
            // Repeatable content generators
            this._vertexCompilationState.compilationString = this._vertexCompilationState._builtCompilationString;
            this._fragmentCompilationState.compilationString = this._fragmentCompilationState._builtCompilationString;
            this._sharedData.repeatableContentBlocks.forEach((b) => {
                b.replaceRepeatableContent(this._vertexCompilationState, this._fragmentCompilationState, mesh, defines);
            });
            // Uniforms
            const uniformBuffers = [];
            this._sharedData.dynamicUniformBlocks.forEach((b) => {
                b.updateUniformsAndSamples(this._vertexCompilationState, this, defines, uniformBuffers);
            });
            const mergedUniforms = this._vertexCompilationState.uniforms;
            this._fragmentCompilationState.uniforms.forEach((u) => {
                const index = mergedUniforms.indexOf(u);
                if (index === -1) {
                    mergedUniforms.push(u);
                }
            });
            // Samplers
            const mergedSamplers = this._vertexCompilationState.samplers;
            this._fragmentCompilationState.samplers.forEach((s) => {
                const index = mergedSamplers.indexOf(s);
                if (index === -1) {
                    mergedSamplers.push(s);
                }
            });
            const fallbacks = new EffectFallbacks();
            this._sharedData.blocksWithFallbacks.forEach((b) => {
                b.provideFallbacks(mesh, fallbacks);
            });
            result = {
                lightDisposed,
                uniformBuffers,
                mergedUniforms,
                mergedSamplers,
                fallbacks,
            };
        }
        return result;
    }
    /**
     * Get if the submesh is ready to be used and all its information available.
     * Child classes can use it to update shaders
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    isReadyForSubMesh(mesh, subMesh, useInstances = false) {
        if (!this._buildWasSuccessful) {
            return false;
        }
        const scene = this.getScene();
        if (this._sharedData.animatedInputs) {
            const frameId = scene.getFrameId();
            if (this._animationFrame !== frameId) {
                for (const input of this._sharedData.animatedInputs) {
                    input.animate(scene);
                }
                this._animationFrame = frameId;
            }
        }
        const drawWrapper = subMesh._drawWrapper;
        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines || typeof subMesh.materialDefines === "string") {
            subMesh.materialDefines = new NodeMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        this._prepareDefinesForAttributes(mesh, defines);
        // Check if blocks are ready
        if (this._sharedData.blockingBlocks.some((b) => !b.isReady(mesh, this, defines, useInstances))) {
            return false;
        }
        const result = this._processDefines(mesh, defines, useInstances, subMesh);
        if (result) {
            const previousEffect = subMesh.effect;
            // Compilation
            const join = defines.toString();
            let effect = engine.createEffect({
                vertex: "nodeMaterial" + this._buildId,
                fragment: "nodeMaterial" + this._buildId,
                vertexSource: this._vertexCompilationState.compilationString,
                fragmentSource: this._fragmentCompilationState.compilationString,
            }, {
                attributes: this._vertexCompilationState.attributes,
                uniformsNames: result.mergedUniforms,
                uniformBuffersNames: result.uniformBuffers,
                samplers: result.mergedSamplers,
                defines: join,
                fallbacks: result.fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                multiTarget: defines.PREPASS,
                indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights, maxSimultaneousMorphTargets: defines.NUM_MORPH_INFLUENCERS },
                shaderLanguage: this.shaderLanguage,
            }, engine);
            if (effect) {
                if (this._onEffectCreatedObservable) {
                    onCreatedEffectParameters.effect = effect;
                    onCreatedEffectParameters.subMesh = subMesh;
                    this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
                }
                // Use previous effect while new one is compiling
                if (this.allowShaderHotSwapping && previousEffect && !effect.isReady()) {
                    effect = previousEffect;
                    defines.markAsUnprocessed();
                    if (result.lightDisposed) {
                        // re register in case it takes more than one frame.
                        defines._areLightsDisposed = true;
                        return false;
                    }
                }
                else {
                    scene.resetCachedMaterial();
                    subMesh.setEffect(effect, defines, this._materialContext);
                }
            }
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = useInstances;
        this._checkScenePerformancePriority();
        return true;
    }
    /**
     * Get a string representing the shaders built by the current node graph
     */
    get compiledShaders() {
        if (!this._buildWasSuccessful) {
            this.build();
        }
        return `// Vertex shader\n${this._vertexCompilationState.compilationString}\n\n// Fragment shader\n${this._fragmentCompilationState.compilationString}`;
    }
    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     */
    bindOnlyWorldMatrix(world) {
        const scene = this.getScene();
        if (!this._activeEffect) {
            return;
        }
        const hints = this._sharedData.hints;
        if (hints.needWorldViewMatrix) {
            world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
        }
        if (hints.needWorldViewProjectionMatrix) {
            world.multiplyToRef(scene.getTransformMatrix(), this._cachedWorldViewProjectionMatrix);
        }
        // Connection points
        for (const inputBlock of this._sharedData.inputBlocks) {
            inputBlock._transmitWorld(this._activeEffect, world, this._cachedWorldViewMatrix, this._cachedWorldViewProjectionMatrix);
        }
    }
    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    bindForSubMesh(world, mesh, subMesh) {
        const scene = this.getScene();
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;
        // Matrices
        this.bindOnlyWorldMatrix(world);
        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);
        const sharedData = this._sharedData;
        if (mustRebind) {
            // Bindable blocks
            for (const block of sharedData.bindableBlocks) {
                block.bind(effect, this, mesh, subMesh);
            }
            for (const block of sharedData.forcedBindableBlocks) {
                block.bind(effect, this, mesh, subMesh);
            }
            // Connection points
            for (const inputBlock of sharedData.inputBlocks) {
                inputBlock._transmit(effect, scene, this);
            }
        }
        else if (!this.isFrozen) {
            for (const block of sharedData.forcedBindableBlocks) {
                block.bind(effect, this, mesh, subMesh);
            }
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._sharedData) {
            activeTextures.push(...this._sharedData.textureBlocks.filter((tb) => tb.texture).map((tb) => tb.texture));
        }
        return activeTextures;
    }
    /**
     * Gets the list of texture blocks
     * Note that this method will only return blocks that are reachable from the final block(s) and only after the material has been built!
     * @returns an array of texture blocks
     */
    getTextureBlocks() {
        if (!this._sharedData) {
            return [];
        }
        return this._sharedData.textureBlocks;
    }
    /**
     * Gets the list of all texture blocks
     * Note that this method will scan all attachedBlocks and return blocks that are texture blocks
     * @returns
     */
    getAllTextureBlocks() {
        const textureBlocks = [];
        for (const block of this.attachedBlocks) {
            if (NodeMaterial._BlockIsTextureBlock(block)) {
                textureBlocks.push(block);
            }
        }
        return textureBlocks;
    }
    /**
     * Specifies if the material uses a texture
     * @param texture defines the texture to check against the material
     * @returns a boolean specifying if the material uses the texture
     */
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (!this._sharedData) {
            return false;
        }
        for (const t of this._sharedData.textureBlocks) {
            if (t.texture === texture) {
                return true;
            }
        }
        return false;
    }
    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
     */
    dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh) {
        if (forceDisposeTextures) {
            for (const texture of this.getTextureBlocks()
                .filter((tb) => tb.texture)
                .map((tb) => tb.texture)) {
                texture.dispose();
            }
        }
        for (const block of this.attachedBlocks) {
            block.dispose();
        }
        this.attachedBlocks.length = 0;
        this._sharedData = null;
        this._vertexCompilationState = null;
        this._fragmentCompilationState = null;
        this.onBuildObservable.clear();
        this.onBuildErrorObservable.clear();
        if (this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
            this._imageProcessingObserver = null;
        }
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
    }
    /** Creates the node editor window.
     * @param additionalConfig Define the configuration of the editor
     */
    _createNodeEditor(additionalConfig) {
        const nodeEditorConfig = {
            nodeMaterial: this,
            ...additionalConfig,
        };
        this.BJSNODEMATERIALEDITOR.NodeEditor.Show(nodeEditorConfig);
    }
    /**
     * Launch the node material editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    edit(config) {
        return new Promise((resolve) => {
            this.BJSNODEMATERIALEDITOR = this.BJSNODEMATERIALEDITOR || this._getGlobalNodeMaterialEditor();
            if (typeof this.BJSNODEMATERIALEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeMaterial.EditorURL;
                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSNODEMATERIALEDITOR = this.BJSNODEMATERIALEDITOR || this._getGlobalNodeMaterialEditor();
                    this._createNodeEditor(config?.nodeEditorConfig);
                    resolve();
                });
            }
            else {
                // Otherwise creates the editor
                this._createNodeEditor(config?.nodeEditorConfig);
                resolve();
            }
        });
    }
    /**
     * Clear the current material
     */
    clear() {
        this._vertexOutputNodes.length = 0;
        this._fragmentOutputNodes.length = 0;
        this.attachedBlocks.length = 0;
        this._buildIsInProgress = false;
    }
    /**
     * Clear the current material and set it to a default state
     */
    setToDefault() {
        this.clear();
        this.editorData = null;
        const positionInput = new InputBlock("Position");
        positionInput.setAsAttribute("position");
        const worldInput = new InputBlock("World");
        worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
        const worldPos = new TransformBlock("WorldPos");
        positionInput.connectTo(worldPos);
        worldInput.connectTo(worldPos);
        const viewProjectionInput = new InputBlock("ViewProjection");
        viewProjectionInput.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
        const worldPosdMultipliedByViewProjection = new TransformBlock("WorldPos * ViewProjectionTransform");
        worldPos.connectTo(worldPosdMultipliedByViewProjection);
        viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);
        const vertexOutput = new VertexOutputBlock("VertexOutput");
        worldPosdMultipliedByViewProjection.connectTo(vertexOutput);
        // Pixel
        const pixelColor = new InputBlock("color");
        pixelColor.value = new Color4(0.8, 0.8, 0.8, 1);
        const fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        pixelColor.connectTo(fragmentOutput);
        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this._mode = NodeMaterialModes.Material;
    }
    /**
     * Clear the current material and set it to a default state for post process
     */
    setToDefaultPostProcess() {
        this.clear();
        this.editorData = null;
        const position = new InputBlock("Position");
        position.setAsAttribute("position2d");
        const const1 = new InputBlock("Constant1");
        const1.isConstant = true;
        const1.value = 1;
        const vmerger = new VectorMergerBlock("Position3D");
        position.connectTo(vmerger);
        const1.connectTo(vmerger, { input: "w" });
        const vertexOutput = new VertexOutputBlock("VertexOutput");
        vmerger.connectTo(vertexOutput);
        // Pixel
        const scale = new InputBlock("Scale");
        scale.visibleInInspector = true;
        scale.value = new Vector2(1, 1);
        const uv0 = new RemapBlock("uv0");
        position.connectTo(uv0);
        const uv = new MultiplyBlock("UV scale");
        uv0.connectTo(uv);
        scale.connectTo(uv);
        const currentScreen = new CurrentScreenBlock("CurrentScreen");
        uv.connectTo(currentScreen);
        const textureUrl = Tools.GetAssetUrl("https://assets.babylonjs.com/core/nme/currentScreenPostProcess.png");
        currentScreen.texture = new Texture(textureUrl, this.getScene());
        const fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        currentScreen.connectTo(fragmentOutput, { output: "rgba" });
        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this._mode = NodeMaterialModes.PostProcess;
    }
    /**
     * Clear the current material and set it to a default state for procedural texture
     */
    setToDefaultProceduralTexture() {
        this.clear();
        this.editorData = null;
        const position = new InputBlock("Position");
        position.setAsAttribute("position2d");
        const const1 = new InputBlock("Constant1");
        const1.isConstant = true;
        const1.value = 1;
        const vmerger = new VectorMergerBlock("Position3D");
        position.connectTo(vmerger);
        const1.connectTo(vmerger, { input: "w" });
        const vertexOutput = new VertexOutputBlock("VertexOutput");
        vmerger.connectTo(vertexOutput);
        // Pixel
        const time = new InputBlock("Time");
        time.value = 0;
        time.min = 0;
        time.max = 0;
        time.isBoolean = false;
        time.matrixMode = 0;
        time.animationType = AnimatedInputBlockTypes.Time;
        time.isConstant = false;
        const color = new InputBlock("Color3");
        color.value = new Color3(1, 1, 1);
        color.isConstant = false;
        const fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        const vectorMerger = new VectorMergerBlock("VectorMerger");
        vectorMerger.visibleInInspector = false;
        const cos = new TrigonometryBlock("Cos");
        cos.operation = TrigonometryBlockOperations.Cos;
        position.connectTo(vectorMerger);
        time.output.connectTo(cos.input);
        cos.output.connectTo(vectorMerger.z);
        vectorMerger.xyzOut.connectTo(fragmentOutput.rgb);
        // Add to nodes
        this.addOutputNode(vertexOutput);
        this.addOutputNode(fragmentOutput);
        this._mode = NodeMaterialModes.ProceduralTexture;
    }
    /**
     * Clear the current material and set it to a default state for particle
     */
    setToDefaultParticle() {
        this.clear();
        this.editorData = null;
        // Pixel
        const uv = new InputBlock("uv");
        uv.setAsAttribute("particle_uv");
        const texture = new ParticleTextureBlock("ParticleTexture");
        uv.connectTo(texture);
        const color = new InputBlock("Color");
        color.setAsAttribute("particle_color");
        const multiply = new MultiplyBlock("Texture * Color");
        texture.connectTo(multiply);
        color.connectTo(multiply);
        const rampGradient = new ParticleRampGradientBlock("ParticleRampGradient");
        multiply.connectTo(rampGradient);
        const cSplitter = new ColorSplitterBlock("ColorSplitter");
        color.connectTo(cSplitter);
        const blendMultiply = new ParticleBlendMultiplyBlock("ParticleBlendMultiply");
        rampGradient.connectTo(blendMultiply);
        texture.connectTo(blendMultiply, { output: "a" });
        cSplitter.connectTo(blendMultiply, { output: "a" });
        const fragmentOutput = new FragmentOutputBlock("FragmentOutput");
        blendMultiply.connectTo(fragmentOutput);
        // Add to nodes
        this.addOutputNode(fragmentOutput);
        this._mode = NodeMaterialModes.Particle;
    }
    /**
     * Loads the current Node Material from a url pointing to a file save by the Node Material Editor
     * @deprecated Please use NodeMaterial.ParseFromFileAsync instead
     * @param url defines the url to load from
     * @param rootUrl defines the root URL for nested url in the node material
     * @returns a promise that will fulfil when the material is fully loaded
     */
    async loadAsync(url, rootUrl = "") {
        return NodeMaterial.ParseFromFileAsync("", url, this.getScene(), rootUrl, true, this);
    }
    _gatherBlocks(rootNode, list) {
        if (list.indexOf(rootNode) !== -1) {
            return;
        }
        list.push(rootNode);
        for (const input of rootNode.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== rootNode) {
                    this._gatherBlocks(block, list);
                }
            }
        }
        // Teleportation
        if (rootNode.isTeleportOut) {
            const block = rootNode;
            if (block.entryPoint) {
                this._gatherBlocks(block.entryPoint, list);
            }
        }
    }
    /**
     * Generate a string containing the code declaration required to create an equivalent of this material
     * @returns a string
     */
    generateCode() {
        let alreadyDumped = [];
        const vertexBlocks = [];
        const uniqueNames = ["const", "var", "let"];
        // Gets active blocks
        for (const outputNode of this._vertexOutputNodes) {
            this._gatherBlocks(outputNode, vertexBlocks);
        }
        const fragmentBlocks = [];
        for (const outputNode of this._fragmentOutputNodes) {
            this._gatherBlocks(outputNode, fragmentBlocks);
        }
        // Generate vertex shader
        let codeString = `var nodeMaterial = new BABYLON.NodeMaterial("${this.name || "node material"}");\n`;
        codeString += `nodeMaterial.mode = BABYLON.NodeMaterialModes.${NodeMaterialModes[this.mode]};\n`;
        for (const node of vertexBlocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }
        // Generate fragment shader
        for (const node of fragmentBlocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }
        // Connections
        alreadyDumped = [];
        codeString += "\n// Connections\n";
        for (const node of this._vertexOutputNodes) {
            codeString += node._dumpCodeForOutputConnections(alreadyDumped);
        }
        for (const node of this._fragmentOutputNodes) {
            codeString += node._dumpCodeForOutputConnections(alreadyDumped);
        }
        // Output nodes
        codeString += "\n// Output nodes\n";
        for (const node of this._vertexOutputNodes) {
            codeString += `nodeMaterial.addOutputNode(${node._codeVariableName});\n`;
        }
        for (const node of this._fragmentOutputNodes) {
            codeString += `nodeMaterial.addOutputNode(${node._codeVariableName});\n`;
        }
        codeString += `nodeMaterial.build();\n`;
        return codeString;
    }
    /**
     * Serializes this material in a JSON representation
     * @param selectedBlocks defines an optional list of blocks to serialize
     * @returns the serialized material object
     */
    serialize(selectedBlocks) {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy
        let blocks = [];
        if (selectedBlocks) {
            blocks = selectedBlocks;
        }
        else {
            serializationObject.customType = "BABYLON.NodeMaterial";
            serializationObject.outputNodes = [];
            // Outputs
            for (const outputNode of this._vertexOutputNodes) {
                this._gatherBlocks(outputNode, blocks);
                serializationObject.outputNodes.push(outputNode.uniqueId);
            }
            for (const outputNode of this._fragmentOutputNodes) {
                this._gatherBlocks(outputNode, blocks);
                if (serializationObject.outputNodes.indexOf(outputNode.uniqueId) === -1) {
                    serializationObject.outputNodes.push(outputNode.uniqueId);
                }
            }
        }
        // Blocks
        serializationObject.blocks = [];
        for (const block of blocks) {
            serializationObject.blocks.push(block.serialize());
        }
        if (!selectedBlocks) {
            for (const block of this.attachedBlocks) {
                if (blocks.indexOf(block) !== -1) {
                    continue;
                }
                serializationObject.blocks.push(block.serialize());
            }
        }
        serializationObject.uniqueId = this.uniqueId;
        return serializationObject;
    }
    _restoreConnections(block, source, map) {
        for (const outputPoint of block.outputs) {
            for (const candidate of source.blocks) {
                const target = map[candidate.id];
                if (!target) {
                    continue;
                }
                for (const input of candidate.inputs) {
                    if (map[input.targetBlockId] === block && input.targetConnectionName === outputPoint.name) {
                        const inputPoint = target.getInputByName(input.inputName);
                        if (!inputPoint || inputPoint.isConnected) {
                            continue;
                        }
                        outputPoint.connectTo(inputPoint, true);
                        this._restoreConnections(target, source, map);
                        continue;
                    }
                }
            }
        }
    }
    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the material
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param merge defines whether or not the source must be merged or replace the current content
     * @param urlRewriter defines a function used to rewrite urls
     */
    parseSerializedObject(source, rootUrl = "", merge = false, urlRewriter) {
        if (!merge) {
            this.clear();
        }
        const map = {};
        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const block = new blockType();
                block._deserialize(parsedBlock, this.getScene(), rootUrl, urlRewriter);
                map[parsedBlock.id] = block;
                this.attachedBlocks.push(block);
            }
        }
        // Reconnect teleportation
        for (const block of this.attachedBlocks) {
            if (block.isTeleportOut) {
                const teleportOut = block;
                const id = teleportOut._tempEntryPointUniqueId;
                if (id) {
                    const source = map[id];
                    source.attachToEndpoint(teleportOut);
                }
            }
        }
        // Connections - Starts with input blocks only (except if in "merge" mode where we scan all blocks)
        for (let blockIndex = 0; blockIndex < source.blocks.length; blockIndex++) {
            const parsedBlock = source.blocks[blockIndex];
            const block = map[parsedBlock.id];
            if (!block) {
                continue;
            }
            if (block.inputs.length && !merge) {
                continue;
            }
            this._restoreConnections(block, source, map);
        }
        // Outputs
        if (source.outputNodes) {
            for (const outputNodeId of source.outputNodes) {
                this.addOutputNode(map[outputNodeId]);
            }
        }
        // UI related info
        if (source.locations || (source.editorData && source.editorData.locations)) {
            const locations = source.locations || source.editorData.locations;
            for (const location of locations) {
                if (map[location.blockId]) {
                    location.blockId = map[location.blockId].uniqueId;
                }
            }
            if (merge && this.editorData && this.editorData.locations) {
                locations.concat(this.editorData.locations);
            }
            if (source.locations) {
                this.editorData = {
                    locations: locations,
                };
            }
            else {
                this.editorData = source.editorData;
                this.editorData.locations = locations;
            }
            const blockMap = [];
            for (const key in map) {
                blockMap[key] = map[key].uniqueId;
            }
            this.editorData.map = blockMap;
        }
        this.comment = source.comment;
        if (source.forceAlphaBlending !== undefined) {
            this.forceAlphaBlending = source.forceAlphaBlending;
        }
        if (source.alphaMode !== undefined) {
            this.alphaMode = source.alphaMode;
        }
        if (!merge) {
            this._mode = source.mode ?? NodeMaterialModes.Material;
        }
    }
    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the material
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param merge defines whether or not the source must be merged or replace the current content
     * @deprecated Please use the parseSerializedObject method instead
     */
    loadFromSerialization(source, rootUrl = "", merge = false) {
        this.parseSerializedObject(source, rootUrl, merge);
    }
    /**
     * Makes a duplicate of the current material.
     * @param name defines the name to use for the new material
     * @param shareEffect defines if the clone material should share the same effect (default is false)
     * @returns the cloned material
     */
    clone(name, shareEffect = false) {
        const serializationObject = this.serialize();
        const clone = SerializationHelper.Clone(() => new NodeMaterial(name, this.getScene(), this.options), this);
        clone.id = name;
        clone.name = name;
        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;
        clone.build(false, !shareEffect);
        return clone;
    }
    /**
     * Awaits for all the material textures to be ready before resolving the returned promise.
     * @returns A promise that resolves when the textures are ready.
     */
    whenTexturesReadyAsync() {
        // Ensures all textures are ready to render.
        const textureReadyPromises = [];
        this.getActiveTextures().forEach((texture) => {
            const internalTexture = texture.getInternalTexture();
            if (internalTexture && !internalTexture.isReady) {
                textureReadyPromises.push(new Promise((textureResolve, textureReject) => {
                    internalTexture.onLoadedObservable.addOnce(() => {
                        textureResolve();
                    });
                    internalTexture.onErrorObservable.addOnce((e) => {
                        textureReject(e);
                    });
                }));
            }
        });
        return Promise.all(textureReadyPromises);
    }
    /**
     * Creates a node material from parsed material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param shaderLanguage defines the language to use (GLSL by default)
     * @returns a new node material
     */
    static Parse(source, scene, rootUrl = "", shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        const nodeMaterial = SerializationHelper.Parse(() => new NodeMaterial(source.name, scene, { shaderLanguage: shaderLanguage }), source, scene, rootUrl);
        nodeMaterial.parseSerializedObject(source, rootUrl);
        nodeMaterial.build();
        return nodeMaterial;
    }
    /**
     * Creates a node material from a snippet saved in a remote file
     * @param name defines the name of the material to create
     * @param url defines the url to load from
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL for nested url in the node material
     * @param skipBuild defines whether to build the node material
     * @param targetMaterial defines a material to use instead of creating a new one
     * @param urlRewriter defines a function used to rewrite urls
     * @param options defines options to be used with the node material
     * @returns a promise that will resolve to the new node material
     */
    static async ParseFromFileAsync(name, url, scene, rootUrl = "", skipBuild = false, targetMaterial, urlRewriter, options) {
        const material = targetMaterial ?? new NodeMaterial(name, scene, options);
        const data = await scene._loadFileAsync(url);
        const serializationObject = JSON.parse(data);
        material.parseSerializedObject(serializationObject, rootUrl, undefined, urlRewriter);
        if (!skipBuild) {
            material.build();
        }
        return material;
    }
    /**
     * Creates a node material from a snippet saved by the node material editor
     * @param snippetId defines the snippet to load
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param nodeMaterial defines a node material to update (instead of creating a new one)
     * @param skipBuild defines whether to build the node material
     * @param waitForTextureReadyness defines whether to wait for texture readiness resolving the promise (default: false)
     * @param urlRewriter defines a function used to rewrite urls
     * @param options defines options to be used with the node material
     * @returns a promise that will resolve to the new node material
     */
    static ParseFromSnippetAsync(snippetId, scene = EngineStore.LastCreatedScene, rootUrl = "", nodeMaterial, skipBuild = false, waitForTextureReadyness = false, urlRewriter, options) {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeMaterial.CreateDefault("blank", scene));
        }
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeMaterial);
                        if (!nodeMaterial) {
                            nodeMaterial = SerializationHelper.Parse(() => new NodeMaterial(snippetId, scene, options), serializationObject, scene, rootUrl);
                            nodeMaterial.uniqueId = scene.getUniqueId();
                        }
                        nodeMaterial.parseSerializedObject(serializationObject, undefined, undefined, urlRewriter);
                        nodeMaterial.snippetId = snippetId;
                        // We reset sideOrientation to default value
                        nodeMaterial.sideOrientation = null;
                        try {
                            if (!skipBuild) {
                                nodeMaterial.build();
                            }
                        }
                        catch (err) {
                            reject(err);
                        }
                        if (waitForTextureReadyness) {
                            nodeMaterial
                                .whenTexturesReadyAsync()
                                .then(() => {
                                resolve(nodeMaterial);
                            })
                                .catch((err) => {
                                reject(err);
                            });
                        }
                        else {
                            resolve(nodeMaterial);
                        }
                    }
                    else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });
            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }
    /**
     * Creates a new node material set to default basic configuration
     * @param name defines the name of the material
     * @param scene defines the hosting scene
     * @returns a new NodeMaterial
     */
    static CreateDefault(name, scene) {
        const newMaterial = new NodeMaterial(name, scene);
        newMaterial.setToDefault();
        newMaterial.build();
        return newMaterial;
    }
}
NodeMaterial._BuildIdGenerator = 0;
/** Define the Url to load node editor script */
NodeMaterial.EditorURL = `${Tools._DefaultCdnUrl}/v${AbstractEngine.Version}/nodeEditor/babylon.nodeEditor.js`;
/** Define the Url to load snippets */
NodeMaterial.SnippetUrl = `https://snippet.babylonjs.com`;
/** Gets or sets a boolean indicating that node materials should not deserialize textures from json / snippet content */
NodeMaterial.IgnoreTexturesAtLoadTime = false;
/** Defines default shader language when no option is defined */
NodeMaterial.DefaultShaderLanguage = 0 /* ShaderLanguage.GLSL */;
__decorate([
    serialize()
], NodeMaterial.prototype, "ignoreAlpha", void 0);
__decorate([
    serialize()
], NodeMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize("mode")
], NodeMaterial.prototype, "_mode", void 0);
__decorate([
    serialize("comment")
], NodeMaterial.prototype, "comment", void 0);
__decorate([
    serialize()
], NodeMaterial.prototype, "forceAlphaBlending", void 0);
RegisterClass("BABYLON.NodeMaterial", NodeMaterial);
//# sourceMappingURL=nodeMaterial.js.map