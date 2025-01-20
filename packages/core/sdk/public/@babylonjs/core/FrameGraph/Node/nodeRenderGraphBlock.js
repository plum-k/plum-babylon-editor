import { __decorate } from "../../tslib.es6.js";
import { GetClass } from "../../Misc/typeStore.js";
import { serialize } from "../../Misc/decorators.js";
import { UniqueIdGenerator } from "../../Misc/uniqueIdGenerator.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "./Types/nodeRenderGraphTypes.js";
import { Observable } from "../../Misc/observable.js";
import { Logger } from "../../Misc/logger.js";
import { NodeRenderGraphConnectionPoint } from "./nodeRenderGraphBlockConnectionPoint.js";
/**
 * Defines a block that can be used inside a node render graph
 */
export class NodeRenderGraphBlock {
    /**
     * Gets or sets the disable flag of the task associated with this block
     */
    get disabled() {
        return !!this._frameGraphTask?.disabled;
    }
    set disabled(value) {
        if (this._frameGraphTask) {
            this._frameGraphTask.disabled = value;
        }
    }
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
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
     * Gets or set the name of the block
     */
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    /**
     * Gets a boolean indicating if this block is an input
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
     * Gets a boolean indicating if this block is a debug block
     */
    get isDebug() {
        return this._isDebug;
    }
    /**
     * Gets a boolean indicating that this block can only be used once per node render graph
     */
    get isUnique() {
        return this._isUnique;
    }
    /**
     * Gets the current class name e.g. "NodeRenderGraphBlock"
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphBlock";
    }
    _inputRename(name) {
        return name;
    }
    _outputRename(name) {
        return name;
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
     * Checks if the current block is an ancestor of a given type
     * @param type defines the potential type to check
     * @returns true if block is a descendant
     */
    isAnAncestorOfType(type) {
        if (this.getClassName() === type) {
            return true;
        }
        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }
            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock.isAnAncestorOfType(type)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Get the first descendant using a predicate
     * @param predicate defines the predicate to check
     * @returns descendant or null if none found
     */
    getDescendantOfPredicate(predicate) {
        if (predicate(this)) {
            return this;
        }
        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }
            for (const endpoint of output.endpoints) {
                const descendant = endpoint.ownerBlock.getDescendantOfPredicate(predicate);
                if (descendant) {
                    return descendant;
                }
            }
        }
        return null;
    }
    /**
     * Creates a new NodeRenderGraphBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param _additionalConstructionParameters defines additional parameters to pass to the block constructor
     */
    constructor(name, frameGraph, scene, ..._additionalConstructionParameters) {
        this._name = "";
        this._isInput = false;
        this._isTeleportOut = false;
        this._isTeleportIn = false;
        this._isDebug = false;
        this._isUnique = false;
        /**
         * Gets an observable raised when the block is built
         */
        this.onBuildObservable = new Observable();
        /** @internal */
        this._inputs = new Array();
        /** @internal */
        this._outputs = new Array();
        /** @internal */
        this._codeVariableName = "";
        /** @internal */
        this._additionalConstructionParameters = null;
        /** Gets or sets a boolean indicating that this input can be edited from a collapsed frame */
        this.visibleOnFrame = false;
        this._name = name;
        this._frameGraph = frameGraph;
        this._scene = scene;
        this._engine = scene.getEngine();
        this.uniqueId = UniqueIdGenerator.UniqueId;
    }
    /**
     * Register a new input. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param isOptional defines a boolean indicating that this input can be omitted
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    registerInput(name, type, isOptional = false, point) {
        point = point ?? new NodeRenderGraphConnectionPoint(name, this, 0 /* NodeRenderGraphConnectionPointDirection.Input */);
        point.type = type;
        point.isOptional = isOptional;
        this._inputs.push(point);
        return this;
    }
    /**
     * Register a new output. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    registerOutput(name, type, point) {
        point = point ?? new NodeRenderGraphConnectionPoint(name, this, 1 /* NodeRenderGraphConnectionPointDirection.Output */);
        point.type = type;
        this._outputs.push(point);
        return this;
    }
    _addDependenciesInput() {
        this.registerInput("dependencies", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        const dependencies = this.getInputByName("dependencies");
        dependencies.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer |
            NodeRenderGraphBlockConnectionPointTypes.ResourceContainer |
            NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator);
        return dependencies;
    }
    _buildBlock(_state) {
        // Empty. Must be defined by child nodes
    }
    _customBuildStep(_state) {
        // Must be implemented by children
    }
    _propagateInputValueToOutput(inputConnectionPoint, outputConnectionPoint) {
        if (inputConnectionPoint.connectedPoint) {
            outputConnectionPoint.value = inputConnectionPoint.connectedPoint.value;
        }
    }
    /**
     * Build the current node and generate the vertex data
     * @param state defines the current generation state
     * @returns true if already built
     */
    build(state) {
        if (this._buildId === state.buildId) {
            return true;
        }
        this._buildId = state.buildId;
        // Check if "parent" blocks are compiled
        for (const input of this._inputs) {
            if (!input.connectedPoint) {
                if (!input.isOptional) {
                    // Emit a warning
                    state._notConnectedNonOptionalInputs.push(input);
                }
                continue;
            }
            const block = input.connectedPoint.ownerBlock;
            if (block && block !== this) {
                block.build(state);
            }
        }
        this._customBuildStep(state);
        // Logs
        if (state.verbose) {
            Logger.Log(`Building ${this.name} [${this.getClassName()}]`);
        }
        if (this._frameGraphTask) {
            this._frameGraphTask.name = this.name;
        }
        this._buildBlock(state);
        if (this._frameGraphTask) {
            const dependenciesConnectedPoint = this.getInputByName("dependencies")?.connectedPoint;
            if (dependenciesConnectedPoint) {
                if (dependenciesConnectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.ResourceContainer) {
                    const container = dependenciesConnectedPoint.ownerBlock;
                    for (let i = 0; i < container.inputs.length; i++) {
                        const input = container.inputs[i];
                        if (input.connectedPoint && input.connectedPoint.value !== undefined && NodeRenderGraphConnectionPoint.IsTextureHandle(input.connectedPoint.value)) {
                            this._frameGraphTask.dependencies = this._frameGraphTask.dependencies || [];
                            this._frameGraphTask.dependencies.push(input.connectedPoint.value);
                        }
                    }
                }
                else if (NodeRenderGraphConnectionPoint.IsTextureHandle(dependenciesConnectedPoint.value)) {
                    this._frameGraphTask.dependencies = this._frameGraphTask.dependencies || [];
                    this._frameGraphTask.dependencies[0] = dependenciesConnectedPoint.value;
                }
            }
            this._frameGraph.addTask(this._frameGraphTask);
        }
        this.onBuildObservable.notifyObservers(this);
        return false;
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
    /**
     * Initialize the block and prepare the context for build
     */
    initialize() {
        // Do nothing
    }
    /**
     * Lets the block try to connect some inputs automatically
     */
    autoConfigure() {
        // Do nothing
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
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.id = this.uniqueId;
        serializationObject.name = this.name;
        serializationObject.visibleOnFrame = this.visibleOnFrame;
        serializationObject.disabled = this.disabled;
        if (this._additionalConstructionParameters) {
            serializationObject.additionalConstructionParameters = this._additionalConstructionParameters;
        }
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
    _deserialize(serializationObject) {
        this._name = serializationObject.name;
        this.comments = serializationObject.comments;
        this.visibleOnFrame = serializationObject.visibleOnFrame;
        this.disabled = serializationObject.disabled;
        this._deserializePortDisplayNamesAndExposedOnFrame(serializationObject);
    }
    _deserializePortDisplayNamesAndExposedOnFrame(serializationObject) {
        const serializedInputs = serializationObject.inputs;
        const serializedOutputs = serializationObject.outputs;
        if (serializedInputs) {
            serializedInputs.forEach((port) => {
                const input = this.inputs.find((i) => i.name === port.name);
                if (!input) {
                    return;
                }
                if (port.displayName) {
                    input.displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    input.isExposedOnFrame = port.isExposedOnFrame;
                    input.exposedPortPosition = port.exposedPortPosition;
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
    _dumpPropertiesCode() {
        const variableName = this._codeVariableName;
        return `${variableName}.visibleOnFrame = ${this.visibleOnFrame};\n${variableName}.disabled = ${this.disabled};\n`;
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
        const className = this.getClassName();
        if (className === "RenderGraphInputBlock") {
            const block = this;
            const blockType = block.type;
            codeString += `var ${this._codeVariableName} = new BABYLON.NodeRenderGraphInputBlock("${this.name}", nodeRenderGraph.frameGraph, scene, BABYLON.NodeRenderGraphBlockConnectionPointTypes.${NodeRenderGraphBlockConnectionPointTypes[blockType]});\n`;
        }
        else {
            if (this._additionalConstructionParameters) {
                codeString += `var ${this._codeVariableName} = new BABYLON.${className}("${this.name}", nodeRenderGraph.frameGraph, scene, ...${JSON.stringify(this._additionalConstructionParameters)});\n`;
            }
            else {
                codeString += `var ${this._codeVariableName} = new BABYLON.${className}("${this.name}", nodeRenderGraph.frameGraph, scene);\n`;
            }
        }
        // Properties
        codeString += this._dumpPropertiesCode() + "\n";
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
     * Clone the current block to a new identical block
     * @returns a copy of the current block
     */
    clone() {
        const serializationObject = this.serialize();
        const blockType = GetClass(serializationObject.customType);
        if (blockType) {
            const additionalConstructionParameters = serializationObject.additionalConstructionParameters;
            const block = additionalConstructionParameters
                ? new blockType("", this._frameGraph, this._scene, ...additionalConstructionParameters)
                : new blockType("", this._frameGraph, this._scene);
            block._deserialize(serializationObject);
            return block;
        }
        return null;
    }
    /**
     * Release resources
     */
    dispose() {
        for (const input of this.inputs) {
            input.dispose();
        }
        for (const output of this.outputs) {
            output.dispose();
        }
        this._frameGraphTask?.dispose();
        this._frameGraphTask = undefined;
        this.onBuildObservable.clear();
    }
}
__decorate([
    serialize("comment")
], NodeRenderGraphBlock.prototype, "comments", void 0);
//# sourceMappingURL=nodeRenderGraphBlock.js.map