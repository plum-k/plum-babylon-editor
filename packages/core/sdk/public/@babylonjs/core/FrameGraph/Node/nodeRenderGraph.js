import { __decorate } from "../../tslib.es6.js";
import { Observable } from "../../Misc/observable.js";
import { NodeRenderGraphOutputBlock } from "./Blocks/outputBlock.js";
import { FrameGraph } from "../frameGraph.js";
import { GetClass } from "../../Misc/typeStore.js";
import { serialize } from "../../Misc/decorators.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";

import { WebRequest } from "../../Misc/webRequest.js";
import { NodeRenderGraphInputBlock } from "./Blocks/inputBlock.js";
import { Tools } from "../../Misc/tools.js";
import { Engine } from "../../Engines/engine.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "./Types/nodeRenderGraphTypes.js";
import { NodeRenderGraphClearBlock } from "./Blocks/Textures/clearBlock.js";
import { NodeRenderGraphObjectRendererBlock } from "./Blocks/Rendering/objectRendererBlock.js";
import { NodeRenderGraphBuildState } from "./nodeRenderGraphBuildState.js";
/**
 * Defines a node render graph
 */
export class NodeRenderGraph {
    /** @returns the inspector from bundle or global */
    _getGlobalNodeRenderGraphEditor() {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODERENDERGRAPHEDITOR !== "undefined") {
            return NODERENDERGRAPHEDITOR;
        }
        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.NodeRenderGraphEditor !== "undefined") {
            return BABYLON;
        }
        return undefined;
    }
    /**
     * Gets the frame graph used by this node render graph
     */
    get frameGraph() {
        return this._frameGraph;
    }
    /**
     * Gets the scene used by this node render graph
     * @returns the scene used by this node render graph
     */
    getScene() {
        return this._scene;
    }
    /**
     * Creates a new node render graph
     * @param name defines the name of the node render graph
     * @param scene defines the scene to use to execute the graph
     * @param options defines the options to use when creating the graph
     */
    constructor(name, scene, options) {
        this._buildId = NodeRenderGraph._BuildIdGenerator++;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.BJSNODERENDERGRAPHEDITOR = this._getGlobalNodeRenderGraphEditor();
        /**
         * Gets or sets data used by visual editor
         * @see https://nrge.babylonjs.com
         */
        this.editorData = null;
        /**
         * Gets an array of blocks that needs to be serialized even if they are not yet connected
         */
        this.attachedBlocks = [];
        /**
         * Observable raised when the node render graph is built
         */
        this.onBuildObservable = new Observable();
        /**
         * Observable raised when an error is detected
         */
        this.onBuildErrorObservable = new Observable();
        /** Gets or sets the RenderGraphOutputBlock used to gather the final node render graph data */
        this.outputBlock = null;
        this._resizeObserver = null;
        this.name = name;
        this._scene = scene;
        this._engine = scene.getEngine();
        options = {
            debugTextures: false,
            autoConfigure: false,
            verbose: false,
            rebuildGraphOnEngineResize: true,
            autoFillExternalInputs: true,
            ...options,
        };
        this._options = options;
        this._frameGraph = new FrameGraph(this._engine, options.debugTextures, this._scene);
        if (options.rebuildGraphOnEngineResize) {
            this._resizeObserver = this._engine.onResizeObservable.add(() => {
                this.build();
            });
        }
    }
    /**
     * Gets the current class name ("NodeRenderGraph")
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraph";
    }
    /**
     * Gets a block by its name
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
     * Get all blocks that match a predicate
     * @param predicate defines the predicate used to find the good candidate(s)
     * @returns the list of blocks found
     */
    getBlocksByPredicate(predicate) {
        const blocks = [];
        for (const block of this.attachedBlocks) {
            if (predicate(block)) {
                blocks.push(block);
            }
        }
        return blocks;
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
     * Launch the node render graph editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    edit(config) {
        return new Promise((resolve) => {
            this.BJSNODERENDERGRAPHEDITOR = this.BJSNODERENDERGRAPHEDITOR || this._getGlobalNodeRenderGraphEditor();
            if (typeof this.BJSNODERENDERGRAPHEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeRenderGraph.EditorURL;
                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSNODERENDERGRAPHEDITOR = this.BJSNODERENDERGRAPHEDITOR || this._getGlobalNodeRenderGraphEditor();
                    this._createNodeEditor(config?.nodeRenderGraphEditorConfig);
                    resolve();
                });
            }
            else {
                // Otherwise creates the editor
                this._createNodeEditor(config?.nodeRenderGraphEditorConfig);
                resolve();
            }
        });
    }
    /**
     * Creates the node editor window.
     * @param additionalConfig Additional configuration for the FGE
     */
    _createNodeEditor(additionalConfig) {
        const nodeEditorConfig = {
            nodeRenderGraph: this,
            ...additionalConfig,
        };
        this.BJSNODERENDERGRAPHEDITOR.NodeRenderGraphEditor.Show(nodeEditorConfig);
    }
    /**
     * Build the final list of blocks that will be executed by the "execute" method
     */
    build() {
        if (!this.outputBlock) {
            throw new Error("You must define the outputBlock property before building the node render graph");
        }
        this._initializeBlock(this.outputBlock);
        this._frameGraph.clear();
        const state = new NodeRenderGraphBuildState();
        state.buildId = this._buildId;
        state.verbose = this._options.verbose;
        if (this._options.autoFillExternalInputs) {
            this._autoFillExternalInputs();
        }
        this.outputBlock.build(state);
        this._frameGraph.build();
        this._buildId = NodeRenderGraph._BuildIdGenerator++;
        if (state.emitErrors(this.onBuildErrorObservable)) {
            this.onBuildObservable.notifyObservers(this);
        }
    }
    _autoFillExternalInputs() {
        const allInputs = this.getInputBlocks();
        const shadowLights = [];
        for (const light of this._scene.lights) {
            if (light.setShadowProjectionMatrix !== undefined) {
                shadowLights.push(light);
            }
        }
        let cameraIndex = 0;
        let lightIndex = 0;
        for (const input of allInputs) {
            if (!input.isExternal) {
                continue;
            }
            if (!input.isAnAncestorOfType("NodeRenderGraphOutputBlock")) {
                continue;
            }
            if ((input.type & NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer) !== 0) {
                // nothing to do
            }
            else if (input.isCamera()) {
                const camera = this._scene.cameras[cameraIndex++] || this._scene.cameras[0];
                if (!this._scene.cameraToUseForPointers) {
                    this._scene.cameraToUseForPointers = camera;
                }
                input.value = camera;
            }
            else if (input.isObjectList()) {
                input.value = { meshes: this._scene.meshes, particleSystems: this._scene.particleSystems };
            }
            else if (input.isShadowLight()) {
                if (lightIndex < shadowLights.length) {
                    input.value = shadowLights[lightIndex++];
                    lightIndex = lightIndex % shadowLights.length;
                }
            }
        }
    }
    /**
     * Returns a promise that resolves when the node render graph is ready to be executed
     * This method must be called after the graph has been built (NodeRenderGraph.build called)!
     * @param timeout Timeout in ms between retries (default is 16)
     * @returns The promise that resolves when the graph is ready
     */
    whenReadyAsync(timeout = 16) {
        return this._frameGraph.whenReadyAsync(timeout);
    }
    /**
     * Execute the graph (the graph must have been built before!)
     */
    execute() {
        this._frameGraph.execute();
    }
    _initializeBlock(node) {
        node.initialize();
        if (this._options.autoConfigure) {
            node.autoConfigure();
        }
        if (this.attachedBlocks.indexOf(node) === -1) {
            this.attachedBlocks.push(node);
        }
        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block);
                }
            }
        }
    }
    /**
     * Clear the current graph
     */
    clear() {
        this.outputBlock = null;
        this.attachedBlocks.length = 0;
    }
    /**
     * Remove a block from the current graph
     * @param block defines the block to remove
     */
    removeBlock(block) {
        const attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }
        if (block === this.outputBlock) {
            this.outputBlock = null;
        }
    }
    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the graph
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    parseSerializedObject(source, merge = false) {
        if (!merge) {
            this.clear();
        }
        const map = {};
        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const additionalConstructionParameters = parsedBlock.additionalConstructionParameters;
                const block = additionalConstructionParameters
                    ? new blockType("", this._frameGraph, this._scene, ...additionalConstructionParameters)
                    : new blockType("", this._frameGraph, this._scene);
                block._deserialize(parsedBlock);
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
                    if (source) {
                        source.attachToEndpoint(teleportOut);
                    }
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
            if (block.inputs.length && parsedBlock.inputs.some((i) => i.targetConnectionName) && !merge) {
                continue;
            }
            this._restoreConnections(block, source, map);
        }
        // Outputs
        if (source.outputNodeId) {
            this.outputBlock = map[source.outputNodeId];
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
     * Generate a string containing the code declaration required to create an equivalent of this node render graph
     * @returns a string
     */
    generateCode() {
        let alreadyDumped = [];
        const blocks = [];
        const uniqueNames = ["const", "var", "let"];
        // Gets active blocks
        if (this.outputBlock) {
            this._gatherBlocks(this.outputBlock, blocks);
        }
        // Generate
        const options = JSON.stringify(this._options);
        let codeString = `let nodeRenderGraph = new BABYLON.NodeRenderGraph("${this.name || "render graph"}", scene, ${options});\n`;
        for (const node of blocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped) + "\n";
            }
        }
        if (this.outputBlock) {
            // Connections
            alreadyDumped = [];
            codeString += "// Connections\n";
            codeString += this.outputBlock._dumpCodeForOutputConnections(alreadyDumped);
            // Output nodes
            codeString += "// Output nodes\n";
            codeString += `nodeRenderGraph.outputBlock = ${this.outputBlock._codeVariableName};\n`;
            codeString += `nodeRenderGraph.build();\n`;
        }
        return codeString;
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
     * Clear the current graph and set it to a default state
     */
    setToDefault() {
        this.clear();
        this.editorData = null;
        // Source textures
        const colorTexture = new NodeRenderGraphInputBlock("Color Texture", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.Texture);
        colorTexture.creationOptions.options.samples = 4;
        const depthTexture = new NodeRenderGraphInputBlock("Depth Texture", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        depthTexture.creationOptions.options.samples = 4;
        // Clear texture
        const clear = new NodeRenderGraphClearBlock("Clear", this._frameGraph, this._scene);
        clear.clearDepth = true;
        clear.clearStencil = true;
        colorTexture.output.connectTo(clear.texture);
        depthTexture.output.connectTo(clear.depth);
        // Render objects
        const camera = new NodeRenderGraphInputBlock("Camera", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.Camera);
        const objectList = new NodeRenderGraphInputBlock("Object List", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        const mainRendering = new NodeRenderGraphObjectRendererBlock("Main Rendering", this._frameGraph, this._scene);
        camera.output.connectTo(mainRendering.camera);
        objectList.output.connectTo(mainRendering.objects);
        clear.output.connectTo(mainRendering.destination);
        clear.outputDepth.connectTo(mainRendering.depth);
        // Final output
        const output = new NodeRenderGraphOutputBlock("Output", this._frameGraph, this._scene);
        mainRendering.output.connectTo(output.texture);
        this.outputBlock = output;
    }
    /**
     * Makes a duplicate of the current node render graph.
     * @param name defines the name to use for the new node render graph
     * @returns the new node render graph
     */
    clone(name) {
        const serializationObject = this.serialize();
        const clone = SerializationHelper.Clone(() => new NodeRenderGraph(name, this._scene), this);
        clone.name = name;
        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;
        clone.build();
        return clone;
    }
    /**
     * Serializes this node render graph in a JSON representation
     * @param selectedBlocks defines the list of blocks to save (if null the whole node render graph will be saved)
     * @returns the serialized node render graph object
     */
    serialize(selectedBlocks) {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy
        let blocks = [];
        if (selectedBlocks) {
            blocks = selectedBlocks;
        }
        else {
            serializationObject.customType = "BABYLON.NodeRenderGraph";
            if (this.outputBlock) {
                serializationObject.outputNodeId = this.outputBlock.uniqueId;
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
        return serializationObject;
    }
    /**
     * Disposes the ressources
     */
    dispose() {
        for (const block of this.attachedBlocks) {
            block.dispose();
        }
        this._frameGraph.dispose();
        this._frameGraph = undefined;
        this._engine.onResizeObservable.remove(this._resizeObserver);
        this._resizeObserver = null;
        this.attachedBlocks.length = 0;
        this.onBuildObservable.clear();
        this.onBuildErrorObservable.clear();
    }
    /**
     * Creates a new node render graph set to default basic configuration
     * @param name defines the name of the node render graph
     * @param scene defines the scene to use
     * @param nodeRenderGraphOptions defines options to use when creating the node render graph
     * @returns a new NodeRenderGraph
     */
    static CreateDefault(name, scene, nodeRenderGraphOptions) {
        const renderGraph = new NodeRenderGraph(name, scene, nodeRenderGraphOptions);
        renderGraph.setToDefault();
        renderGraph.build();
        return renderGraph;
    }
    /**
     * Creates a node render graph from parsed graph data
     * @param source defines the JSON representation of the node render graph
     * @param scene defines the scene to use
     * @param nodeRenderGraphOptions defines options to use when creating the node render
     * @param skipBuild defines whether to skip building the node render graph (default is true)
     * @returns a new node render graph
     */
    static Parse(source, scene, nodeRenderGraphOptions, skipBuild = true) {
        const renderGraph = SerializationHelper.Parse(() => new NodeRenderGraph(source.name, scene, nodeRenderGraphOptions), source, null);
        renderGraph.parseSerializedObject(source);
        if (!skipBuild) {
            renderGraph.build();
        }
        return renderGraph;
    }
    /**
     * Creates a node render graph from a snippet saved by the node render graph editor
     * @param snippetId defines the snippet to load
     * @param scene defines the scene to use
     * @param nodeRenderGraphOptions defines options to use when creating the node render graph
     * @param nodeRenderGraph defines a node render graph to update (instead of creating a new one)
     * @param skipBuild defines whether to skip building the node render graph (default is true)
     * @returns a promise that will resolve to the new node render graph
     */
    static ParseFromSnippetAsync(snippetId, scene, nodeRenderGraphOptions, nodeRenderGraph, skipBuild = true) {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeRenderGraph.CreateDefault("blank", scene, nodeRenderGraphOptions));
        }
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeRenderGraph);
                        if (!nodeRenderGraph) {
                            nodeRenderGraph = SerializationHelper.Parse(() => new NodeRenderGraph(snippetId, scene, nodeRenderGraphOptions), serializationObject, null);
                        }
                        nodeRenderGraph.parseSerializedObject(serializationObject);
                        nodeRenderGraph.snippetId = snippetId;
                        try {
                            if (!skipBuild) {
                                nodeRenderGraph.build();
                            }
                            resolve(nodeRenderGraph);
                        }
                        catch (err) {
                            reject(err);
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
}
NodeRenderGraph._BuildIdGenerator = 0;
/** Define the Url to load node editor script */
NodeRenderGraph.EditorURL = `${Tools._DefaultCdnUrl}/v${Engine.Version}/NodeRenderGraph/babylon.nodeRenderGraph.js`;
/** Define the Url to load snippets */
NodeRenderGraph.SnippetUrl = `https://snippet.babylonjs.com`;
__decorate([
    serialize()
], NodeRenderGraph.prototype, "name", void 0);
__decorate([
    serialize("comment")
], NodeRenderGraph.prototype, "comment", void 0);
//# sourceMappingURL=nodeRenderGraph.js.map