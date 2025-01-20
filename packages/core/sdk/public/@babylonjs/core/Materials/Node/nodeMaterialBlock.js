import { NodeMaterialBlockConnectionPointTypes } from "./Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialConnectionPoint } from "./nodeMaterialBlockConnectionPoint.js";
import { NodeMaterialBlockTargets } from "./Enums/nodeMaterialBlockTargets.js";
import { UniqueIdGenerator } from "../../Misc/uniqueIdGenerator.js";
import { GetClass } from "../../Misc/typeStore.js";
import { Logger } from "../../Misc/logger.js";
import { Observable } from "../../Misc/observable.js";
/**
 * Defines a block that can be used inside a node based material
 */
export class NodeMaterialBlock {
    /**
     * Gets the name of the block
     */
    get name() {
        return this._name;
    }
    /**
     * Gets a boolean indicating that this block has is code ready to be used
     */
    get codeIsReady() {
        return this._codeIsReady;
    }
    /**
     * Sets the name of the block. Will check if the name is valid.
     */
    set name(newName) {
        if (!this.validateBlockName(newName)) {
            return;
        }
        this._name = newName;
    }
    /**
     * Gets a boolean indicating that this block can only be used once per NodeMaterial
     */
    get isUnique() {
        return this._isUnique;
    }
    /**
     * Gets a boolean indicating that this block is an end block (e.g. it is generating a system value)
     */
    get isFinalMerger() {
        return this._isFinalMerger;
    }
    /**
     * Gets a boolean indicating that this block is an input (e.g. it sends data to the shader)
     */
    get isInput() {
        return this._isInput;
    }
    /**
     * Gets a boolean indicating if this block is a teleport out
     */
    get isTeleportOut() {
        return this._isTeleportOut;
    }
    /**
     * Gets a boolean indicating if this block is a teleport in
     */
    get isTeleportIn() {
        return this._isTeleportIn;
    }
    /**
     * Gets a boolean indicating if this block is a loop
     */
    get isLoop() {
        return this._isLoop;
    }
    /**
     * Gets or sets the build Id
     */
    get buildId() {
        return this._buildId;
    }
    set buildId(value) {
        this._buildId = value;
    }
    /**
     * Gets or sets the target of the block
     */
    get target() {
        return this._target;
    }
    set target(value) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }
    /**
     * Gets the list of input points
     */
    get inputs() {
        return this._inputs;
    }
    /** Gets the list of output points */
    get outputs() {
        return this._outputs;
    }
    /**
     * Find an input by its name
     * @param name defines the name of the input to look for
     * @returns the input or null if not found
     */
    getInputByName(name) {
        const filter = this._inputs.filter((e) => e.name === name);
        if (filter.length) {
            return filter[0];
        }
        return null;
    }
    /**
     * Find an output by its name
     * @param name defines the name of the output to look for
     * @returns the output or null if not found
     */
    getOutputByName(name) {
        const filter = this._outputs.filter((e) => e.name === name);
        if (filter.length) {
            return filter[0];
        }
        return null;
    }
    /**
     * Creates a new NodeMaterialBlock
     * @param name defines the block name
     * @param target defines the target of that block (Vertex by default)
     * @param isFinalMerger defines a boolean indicating that this block is an end block (e.g. it is generating a system value). Default is false
     */
    constructor(name, target = NodeMaterialBlockTargets.Vertex, isFinalMerger = false) {
        this._isFinalMerger = false;
        this._isInput = false;
        this._isLoop = false;
        this._isTeleportOut = false;
        this._isTeleportIn = false;
        this._name = "";
        this._isUnique = false;
        this._codeIsReady = true;
        /**
         * Observable raised when the block code is ready (if the code loading is async)
         */
        this.onCodeIsReadyObservable = new Observable();
        /** Gets or sets a boolean indicating that only one input can be connected at a time */
        this.inputsAreExclusive = false;
        /** @internal */
        this._codeVariableName = "";
        /** @internal */
        this._inputs = new Array();
        /** @internal */
        this._outputs = new Array();
        /**
         * Gets or sets the comments associated with this block
         */
        this.comments = "";
        /** Gets or sets a boolean indicating that this input can be edited in the Inspector (false by default) */
        this.visibleInInspector = false;
        /** Gets or sets a boolean indicating that this input can be edited from a collapsed frame */
        this.visibleOnFrame = false;
        this._target = target;
        this._originalTargetIsNeutral = target === NodeMaterialBlockTargets.Neutral;
        this._isFinalMerger = isFinalMerger;
        switch (this.getClassName()) {
            case "InputBlock":
                this._isInput = true;
                break;
            case "NodeMaterialTeleportOutBlock":
                this._isTeleportOut = true;
                break;
            case "NodeMaterialTeleportInBlock":
                this._isTeleportIn = true;
                break;
            case "LoopBlock":
                this._isLoop = true;
                break;
        }
        this._name = name;
        this.uniqueId = UniqueIdGenerator.UniqueId;
    }
    /** @internal */
    _setInitialTarget(target) {
        this._target = target;
        this._originalTargetIsNeutral = target === NodeMaterialBlockTargets.Neutral;
    }
    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initialize(state) {
        // Do nothing
    }
    /**
     * Bind data to effect. Will only be called for blocks with isBindable === true
     * @param effect defines the effect to bind data to
     * @param nodeMaterial defines the hosting NodeMaterial
     * @param mesh defines the mesh that will be rendered
     * @param subMesh defines the submesh that will be rendered
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bind(effect, nodeMaterial, mesh, subMesh) {
        // Do nothing
    }
    _writeVariable(currentPoint) {
        const connectionPoint = currentPoint.connectedPoint;
        if (connectionPoint) {
            return `${currentPoint.associatedVariableName}`;
        }
        return `0.`;
    }
    _writeFloat(value) {
        let stringVersion = value.toString();
        if (stringVersion.indexOf(".") === -1) {
            stringVersion += ".0";
        }
        return `${stringVersion}`;
    }
    /**
     * Gets the current class name e.g. "NodeMaterialBlock"
     * @returns the class name
     */
    getClassName() {
        return "NodeMaterialBlock";
    }
    /** Gets a boolean indicating that this connection will be used in the fragment shader
     * @returns true if connected in fragment shader
     */
    isConnectedInFragmentShader() {
        return this.outputs.some((o) => o.isConnectedInFragmentShader);
    }
    /**
     * Register a new input. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param isOptional defines a boolean indicating that this input can be omitted
     * @param target defines the target to use to limit the connection point (will be VertexAndFragment by default)
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    registerInput(name, type, isOptional = false, target, point) {
        point = point ?? new NodeMaterialConnectionPoint(name, this, 0 /* NodeMaterialConnectionPointDirection.Input */);
        point.type = type;
        point.isOptional = isOptional;
        if (target) {
            point.target = target;
        }
        this._inputs.push(point);
        return this;
    }
    /**
     * Register a new output. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param target defines the target to use to limit the connection point (will be VertexAndFragment by default)
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    registerOutput(name, type, target, point) {
        point = point ?? new NodeMaterialConnectionPoint(name, this, 1 /* NodeMaterialConnectionPointDirection.Output */);
        point.type = type;
        if (target) {
            point.target = target;
        }
        this._outputs.push(point);
        return this;
    }
    /**
     * Will return the first available input e.g. the first one which is not an uniform or an attribute
     * @param forOutput defines an optional connection point to check compatibility with
     * @returns the first available input or null
     */
    getFirstAvailableInput(forOutput = null) {
        for (const input of this._inputs) {
            if (!input.connectedPoint) {
                if (!forOutput ||
                    forOutput.type === input.type ||
                    input.type === NodeMaterialBlockConnectionPointTypes.AutoDetect ||
                    input.acceptedConnectionPointTypes.indexOf(forOutput.type) !== -1) {
                    return input;
                }
            }
        }
        return null;
    }
    /**
     * Will return the first available output e.g. the first one which is not yet connected and not a varying
     * @param forBlock defines an optional block to check compatibility with
     * @returns the first available input or null
     */
    getFirstAvailableOutput(forBlock = null) {
        for (const output of this._outputs) {
            if (!forBlock || !forBlock.target || forBlock.target === NodeMaterialBlockTargets.Neutral || (forBlock.target & output.target) !== 0) {
                return output;
            }
        }
        return null;
    }
    /**
     * Gets the sibling of the given output
     * @param current defines the current output
     * @returns the next output in the list or null
     */
    getSiblingOutput(current) {
        const index = this._outputs.indexOf(current);
        if (index === -1 || index >= this._outputs.length) {
            return null;
        }
        return this._outputs[index + 1];
    }
    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    isAnAncestorOf(block) {
        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }
            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock === block) {
                    return true;
                }
                if (endpoint.ownerBlock.isAnAncestorOf(block)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Connect current block with another block
     * @param other defines the block to connect with
     * @param options define the various options to help pick the right connections
     * @param options.input
     * @param options.output
     * @param options.outputSwizzle
     * @returns the current block
     */
    connectTo(other, options) {
        if (this._outputs.length === 0) {
            return;
        }
        let output = options && options.output ? this.getOutputByName(options.output) : this.getFirstAvailableOutput(other);
        let notFound = true;
        while (notFound) {
            const input = options && options.input ? other.getInputByName(options.input) : other.getFirstAvailableInput(output);
            if (output && input && output.canConnectTo(input)) {
                output.connectTo(input);
                notFound = false;
            }
            else if (!output) {
                // eslint-disable-next-line no-throw-literal
                throw "Unable to find a compatible match";
            }
            else {
                output = this.getSiblingOutput(output);
            }
        }
        return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _buildBlock(state) {
        // Empty. Must be defined by child nodes
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _postBuildBlock(state) {
        // Empty. Must be defined by child nodes
    }
    /**
     * Add uniforms, samplers and uniform buffers at compilation time
     * @param state defines the state to update
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param uniformBuffers defines the list of uniform buffer names
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateUniformsAndSamples(state, nodeMaterial, defines, uniformBuffers) {
        // Do nothing
    }
    /**
     * Add potential fallbacks if shader compilation fails
     * @param mesh defines the mesh to be rendered
     * @param fallbacks defines the current prioritized list of fallbacks
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    provideFallbacks(mesh, fallbacks) {
        // Do nothing
    }
    /**
     * Initialize defines for shader compilation
     * @param mesh defines the mesh to be rendered
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param useInstances specifies that instances should be used
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeDefines(mesh, nodeMaterial, defines, useInstances = false) { }
    /**
     * Update defines for shader compilation
     * @param mesh defines the mesh to be rendered
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param useInstances specifies that instances should be used
     * @param subMesh defines which submesh to render
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prepareDefines(mesh, nodeMaterial, defines, useInstances = false, subMesh) {
        // Do nothing
    }
    /**
     * Lets the block try to connect some inputs automatically
     * @param material defines the hosting NodeMaterial
     * @param additionalFilteringInfo optional additional filtering condition when looking for compatible blocks
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    autoConfigure(material, additionalFilteringInfo = () => true) {
        // Do nothing
    }
    /**
     * Function called when a block is declared as repeatable content generator
     * @param vertexShaderState defines the current compilation state for the vertex shader
     * @param fragmentShaderState defines the current compilation state for the fragment shader
     * @param mesh defines the mesh to be rendered
     * @param defines defines the material defines to update
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    replaceRepeatableContent(vertexShaderState, fragmentShaderState, mesh, defines) {
        // Do nothing
    }
    /** Gets a boolean indicating that the code of this block will be promoted to vertex shader even if connected to fragment output */
    get willBeGeneratedIntoVertexShaderFromFragmentShader() {
        if (this.isInput || this.isFinalMerger) {
            return false;
        }
        if (this._outputs.some((o) => o.isDirectlyConnectedToVertexOutput)) {
            return false;
        }
        if (this.target === NodeMaterialBlockTargets.Vertex) {
            return false;
        }
        if (this.target === NodeMaterialBlockTargets.VertexAndFragment || this.target === NodeMaterialBlockTargets.Neutral) {
            if (this._outputs.some((o) => o.isConnectedInVertexShader)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Checks if the block is ready
     * @param mesh defines the mesh to be rendered
     * @param nodeMaterial defines the node material requesting the update
     * @param defines defines the material defines to update
     * @param useInstances specifies that instances should be used
     * @returns true if the block is ready
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isReady(mesh, nodeMaterial, defines, useInstances = false) {
        return true;
    }
    _linkConnectionTypes(inputIndex0, inputIndex1, looseCoupling = false) {
        if (looseCoupling) {
            this._inputs[inputIndex1]._acceptedConnectionPointType = this._inputs[inputIndex0];
        }
        else {
            this._inputs[inputIndex0]._linkedConnectionSource = this._inputs[inputIndex1];
            this._inputs[inputIndex0]._isMainLinkSource = true;
        }
        this._inputs[inputIndex1]._linkedConnectionSource = this._inputs[inputIndex0];
    }
    _processBuild(block, state, input, activeBlocks) {
        block.build(state, activeBlocks);
        const localBlockIsFragment = state._vertexState != null;
        const otherBlockWasGeneratedInVertexShader = block._buildTarget === NodeMaterialBlockTargets.Vertex && block.target !== NodeMaterialBlockTargets.VertexAndFragment;
        if (localBlockIsFragment &&
            ((block.target & block._buildTarget) === 0 ||
                (block.target & input.target) === 0 ||
                (this.target !== NodeMaterialBlockTargets.VertexAndFragment && otherBlockWasGeneratedInVertexShader))) {
            // context switch! We need a varying
            if ((!block.isInput && state.target !== block._buildTarget) || // block was already emitted by vertex shader
                (block.isInput && block.isAttribute && !block._noContextSwitch) // block is an attribute
            ) {
                const connectedPoint = input.connectedPoint;
                if (state._vertexState._emitVaryingFromString("v_" + connectedPoint.declarationVariableName, connectedPoint.type)) {
                    const prefix = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "vertexOutputs." : "";
                    state._vertexState.compilationString += `${prefix}${"v_" + connectedPoint.declarationVariableName} = ${connectedPoint.associatedVariableName};\n`;
                }
                const prefix = state.shaderLanguage === 1 /* ShaderLanguage.WGSL */ ? "fragmentInputs." : "";
                input.associatedVariableName = prefix + "v_" + connectedPoint.declarationVariableName;
                input._enforceAssociatedVariableName = true;
            }
        }
    }
    /**
     * Validates the new name for the block node.
     * @param newName the new name to be given to the node.
     * @returns false if the name is a reserve word, else true.
     */
    validateBlockName(newName) {
        const reservedNames = [
            "position",
            "normal",
            "tangent",
            "particle_positionw",
            "uv",
            "uv2",
            "uv3",
            "uv4",
            "uv5",
            "uv6",
            "position2d",
            "particle_uv",
            "matricesIndices",
            "matricesWeights",
            "world0",
            "world1",
            "world2",
            "world3",
            "particle_color",
            "particle_texturemask",
        ];
        for (const reservedName of reservedNames) {
            if (newName === reservedName) {
                return false;
            }
        }
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _customBuildStep(state, activeBlocks) {
        // Must be implemented by children
    }
    /**
     * Compile the current node and generate the shader code
     * @param state defines the current compilation state (uniforms, samplers, current string)
     * @param activeBlocks defines the list of active blocks (i.e. blocks to compile)
     * @returns true if already built
     */
    build(state, activeBlocks) {
        if (this._buildId === state.sharedData.buildId) {
            return true;
        }
        if (!this.isInput) {
            /** Prepare outputs */
            for (const output of this._outputs) {
                if (!output.associatedVariableName) {
                    output.associatedVariableName = state._getFreeVariableName(output.name);
                }
            }
        }
        // Check if "parent" blocks are compiled
        for (const input of this._inputs) {
            if (!input.connectedPoint) {
                if (!input.isOptional) {
                    // Emit a warning
                    state.sharedData.checks.notConnectedNonOptionalInputs.push(input);
                }
                continue;
            }
            if (this.target !== NodeMaterialBlockTargets.Neutral) {
                if ((input.target & this.target) === 0) {
                    continue;
                }
                if ((input.target & state.target) === 0) {
                    continue;
                }
            }
            const block = input.connectedPoint.ownerBlock;
            if (block && block !== this) {
                this._processBuild(block, state, input, activeBlocks);
            }
        }
        this._customBuildStep(state, activeBlocks);
        if (this._buildId === state.sharedData.buildId) {
            return true; // Need to check again as inputs can be connected multiple time to this endpoint
        }
        // Logs
        if (state.sharedData.verbose) {
            Logger.Log(`${state.target === NodeMaterialBlockTargets.Vertex ? "Vertex shader" : "Fragment shader"}: Building ${this.name} [${this.getClassName()}]`);
        }
        // Checks final outputs
        if (this.isFinalMerger) {
            switch (state.target) {
                case NodeMaterialBlockTargets.Vertex:
                    state.sharedData.checks.emitVertex = true;
                    break;
                case NodeMaterialBlockTargets.Fragment:
                    state.sharedData.checks.emitFragment = true;
                    break;
            }
        }
        if (!this.isInput && state.sharedData.emitComments) {
            state.compilationString += `\n//${this.name}\n`;
        }
        this._buildBlock(state);
        this._buildId = state.sharedData.buildId;
        this._buildTarget = state.target;
        // Compile connected blocks
        for (const output of this._outputs) {
            if (output._forPostBuild) {
                continue;
            }
            if ((output.target & state.target) === 0) {
                continue;
            }
            for (const endpoint of output.endpoints) {
                const block = endpoint.ownerBlock;
                if (block) {
                    if (((block.target & state.target) !== 0 && activeBlocks.indexOf(block) !== -1) || state._terminalBlocks.has(block)) {
                        this._processBuild(block, state, endpoint, activeBlocks);
                    }
                }
            }
        }
        this._postBuildBlock(state);
        // Compile post build connected blocks
        for (const output of this._outputs) {
            if (!output._forPostBuild) {
                continue;
            }
            if ((output.target & state.target) === 0) {
                continue;
            }
            for (const endpoint of output.endpoints) {
                const block = endpoint.ownerBlock;
                if (block && (block.target & state.target) !== 0 && activeBlocks.indexOf(block) !== -1) {
                    this._processBuild(block, state, endpoint, activeBlocks);
                }
            }
        }
        return false;
    }
    _inputRename(name) {
        return name;
    }
    _outputRename(name) {
        return name;
    }
    _dumpPropertiesCode() {
        const variableName = this._codeVariableName;
        return `${variableName}.visibleInInspector = ${this.visibleInInspector};\n${variableName}.visibleOnFrame = ${this.visibleOnFrame};\n${variableName}.target = ${this.target};\n`;
    }
    /**
     * @internal
     */
    _dumpCode(uniqueNames, alreadyDumped) {
        alreadyDumped.push(this);
        // Get unique name
        const nameAsVariableName = this.name.replace(/[^A-Za-z_]+/g, "");
        this._codeVariableName = nameAsVariableName || `${this.getClassName()}_${this.uniqueId}`;
        if (uniqueNames.indexOf(this._codeVariableName) !== -1) {
            let index = 0;
            do {
                index++;
                this._codeVariableName = nameAsVariableName + index;
            } while (uniqueNames.indexOf(this._codeVariableName) !== -1);
        }
        uniqueNames.push(this._codeVariableName);
        // Declaration
        let codeString = `\n// ${this.getClassName()}\n`;
        if (this.comments) {
            codeString += `// ${this.comments}\n`;
        }
        codeString += `var ${this._codeVariableName} = new BABYLON.${this.getClassName()}("${this.name}");\n`;
        // Properties
        codeString += this._dumpPropertiesCode();
        // Inputs
        for (const input of this.inputs) {
            if (!input.isConnected) {
                continue;
            }
            const connectedOutput = input.connectedPoint;
            const connectedBlock = connectedOutput.ownerBlock;
            if (alreadyDumped.indexOf(connectedBlock) === -1) {
                codeString += connectedBlock._dumpCode(uniqueNames, alreadyDumped);
            }
        }
        // Outputs
        for (const output of this.outputs) {
            if (!output.hasEndpoints) {
                continue;
            }
            for (const endpoint of output.endpoints) {
                const connectedBlock = endpoint.ownerBlock;
                if (connectedBlock && alreadyDumped.indexOf(connectedBlock) === -1) {
                    codeString += connectedBlock._dumpCode(uniqueNames, alreadyDumped);
                }
            }
        }
        return codeString;
    }
    /**
     * @internal
     */
    _dumpCodeForOutputConnections(alreadyDumped) {
        let codeString = "";
        if (alreadyDumped.indexOf(this) !== -1) {
            return codeString;
        }
        alreadyDumped.push(this);
        for (const input of this.inputs) {
            if (!input.isConnected) {
                continue;
            }
            const connectedOutput = input.connectedPoint;
            const connectedBlock = connectedOutput.ownerBlock;
            codeString += connectedBlock._dumpCodeForOutputConnections(alreadyDumped);
            codeString += `${connectedBlock._codeVariableName}.${connectedBlock._outputRename(connectedOutput.name)}.connectTo(${this._codeVariableName}.${this._inputRename(input.name)});\n`;
        }
        return codeString;
    }
    /**
     * Clone the current block to a new identical block
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a copy of the current block
     */
    clone(scene, rootUrl = "") {
        const serializationObject = this.serialize();
        const blockType = GetClass(serializationObject.customType);
        if (blockType) {
            const block = new blockType();
            block._deserialize(serializationObject, scene, rootUrl);
            return block;
        }
        return null;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.id = this.uniqueId;
        serializationObject.name = this.name;
        serializationObject.comments = this.comments;
        serializationObject.visibleInInspector = this.visibleInInspector;
        serializationObject.visibleOnFrame = this.visibleOnFrame;
        serializationObject.target = this.target;
        serializationObject.inputs = [];
        serializationObject.outputs = [];
        for (const input of this.inputs) {
            serializationObject.inputs.push(input.serialize());
        }
        for (const output of this.outputs) {
            serializationObject.outputs.push(output.serialize(false));
        }
        return serializationObject;
    }
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _deserialize(serializationObject, scene, rootUrl, urlRewriter) {
        this.name = serializationObject.name;
        this.comments = serializationObject.comments;
        this.visibleInInspector = !!serializationObject.visibleInInspector;
        this.visibleOnFrame = !!serializationObject.visibleOnFrame;
        this._target = serializationObject.target ?? this.target;
        this._deserializePortDisplayNamesAndExposedOnFrame(serializationObject);
    }
    _deserializePortDisplayNamesAndExposedOnFrame(serializationObject) {
        const serializedInputs = serializationObject.inputs;
        const serializedOutputs = serializationObject.outputs;
        if (serializedInputs) {
            serializedInputs.forEach((port, i) => {
                if (port.displayName) {
                    this.inputs[i].displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    this.inputs[i].isExposedOnFrame = port.isExposedOnFrame;
                    this.inputs[i].exposedPortPosition = port.exposedPortPosition;
                }
            });
        }
        if (serializedOutputs) {
            serializedOutputs.forEach((port, i) => {
                if (port.displayName) {
                    this.outputs[i].displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    this.outputs[i].isExposedOnFrame = port.isExposedOnFrame;
                    this.outputs[i].exposedPortPosition = port.exposedPortPosition;
                }
            });
        }
    }
    /**
     * Release resources
     */
    dispose() {
        this.onCodeIsReadyObservable.clear();
        for (const input of this.inputs) {
            input.dispose();
        }
        for (const output of this.outputs) {
            output.dispose();
        }
    }
}
//# sourceMappingURL=nodeMaterialBlock.js.map