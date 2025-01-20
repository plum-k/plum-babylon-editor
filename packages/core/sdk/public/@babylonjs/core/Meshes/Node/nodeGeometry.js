import { __decorate } from "../../tslib.es6.js";
import { Observable } from "../../Misc/observable.js";
import { Mesh } from "../mesh.js";
import { GeometryOutputBlock } from "./Blocks/geometryOutputBlock.js";
import { NodeGeometryBuildState } from "./nodeGeometryBuildState.js";
import { GetClass } from "../../Misc/typeStore.js";
import { serialize } from "../../Misc/decorators.js";
import { SerializationHelper } from "../../Misc/decorators.serialization.js";

import { WebRequest } from "../../Misc/webRequest.js";
import { BoxBlock } from "./Blocks/Sources/boxBlock.js";
import { PrecisionDate } from "../../Misc/precisionDate.js";
import { Tools } from "../../Misc/tools.js";
import { AbstractEngine } from "../../Engines/abstractEngine.js";
/**
 * Defines a node based geometry
 * @see demo at https://playground.babylonjs.com#PYY6XE#69
 */
export class NodeGeometry {
    /** @returns the inspector from bundle or global */
    _getGlobalNodeGeometryEditor() {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODEGEOMETRYEDITOR !== "undefined") {
            return NODEGEOMETRYEDITOR;
        }
        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.NodeGeometryEditor !== "undefined") {
            return BABYLON;
        }
        return undefined;
    }
    /**
     * Gets the time spent to build this block (in ms)
     */
    get buildExecutionTime() {
        return this._buildExecutionTime;
    }
    /**
     * Creates a new geometry
     * @param name defines the name of the geometry
     */
    constructor(name) {
        this._buildId = NodeGeometry._BuildIdGenerator++;
        this._buildWasSuccessful = false;
        this._vertexData = null;
        this._buildExecutionTime = 0;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        this.BJSNODEGEOMETRYEDITOR = this._getGlobalNodeGeometryEditor();
        /**
         * Gets or sets data used by visual editor
         * @see https://nge.babylonjs.com
         */
        this.editorData = null;
        /**
         * Gets an array of blocks that needs to be serialized even if they are not yet connected
         */
        this.attachedBlocks = [];
        /**
         * Observable raised when the geometry is built
         */
        this.onBuildObservable = new Observable();
        /** Gets or sets the GeometryOutputBlock used to gather the final geometry data */
        this.outputBlock = null;
        this.name = name;
    }
    /**
     * Gets the current class name of the geometry e.g. "NodeGeometry"
     * @returns the class name
     */
    getClassName() {
        return "NodeGeometry";
    }
    /**
     * Gets the vertex data. This needs to be done after build() was called.
     * This is used to access vertexData when creating a mesh is not required.
     */
    get vertexData() {
        return this._vertexData;
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
     * Launch the node geometry editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    edit(config) {
        return new Promise((resolve) => {
            this.BJSNODEGEOMETRYEDITOR = this.BJSNODEGEOMETRYEDITOR || this._getGlobalNodeGeometryEditor();
            if (typeof this.BJSNODEGEOMETRYEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeGeometry.EditorURL;
                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSNODEGEOMETRYEDITOR = this.BJSNODEGEOMETRYEDITOR || this._getGlobalNodeGeometryEditor();
                    this._createNodeEditor(config?.nodeGeometryEditorConfig);
                    resolve();
                });
            }
            else {
                // Otherwise creates the editor
                this._createNodeEditor(config?.nodeGeometryEditorConfig);
                resolve();
            }
        });
    }
    /**
     * Creates the node editor window.
     * @param additionalConfig Additional configuration for the NGE
     */
    _createNodeEditor(additionalConfig) {
        const nodeEditorConfig = {
            nodeGeometry: this,
            ...additionalConfig,
        };
        this.BJSNODEGEOMETRYEDITOR.NodeGeometryEditor.Show(nodeEditorConfig);
    }
    /**
     * Build the final geometry. Please note that the geometry MAY not be ready until the onBuildObservable is raised.
     * @param verbose defines if the build should log activity
     * @param updateBuildId defines if the internal build Id should be updated (default is true)
     * @param autoConfigure defines if the autoConfigure method should be called when initializing blocks (default is false)
     */
    build(verbose = false, updateBuildId = true, autoConfigure = false) {
        this._buildWasSuccessful = false;
        if (!this.outputBlock) {
            // eslint-disable-next-line no-throw-literal
            throw "You must define the outputBlock property before building the geometry";
        }
        const now = PrecisionDate.Now;
        // Initialize blocks
        this._initializeBlock(this.outputBlock, autoConfigure);
        // Check async states
        const promises = [];
        for (const block of this.attachedBlocks) {
            if (block._isReadyState) {
                promises.push(block._isReadyState);
            }
        }
        if (promises.length) {
            Promise.all(promises).then(() => {
                this.build(verbose, updateBuildId, autoConfigure);
            });
            return;
        }
        // Build
        const state = new NodeGeometryBuildState();
        state.buildId = this._buildId;
        state.verbose = verbose;
        try {
            this.outputBlock.build(state);
        }
        finally {
            if (updateBuildId) {
                this._buildId = NodeGeometry._BuildIdGenerator++;
            }
        }
        this._buildExecutionTime = PrecisionDate.Now - now;
        // Errors
        state.emitErrors();
        this._buildWasSuccessful = true;
        this._vertexData = state.vertexData;
        this.onBuildObservable.notifyObservers(this);
    }
    /**
     * Creates a mesh from the geometry blocks
     * @param name defines the name of the mesh
     * @param scene The scene the mesh is scoped to
     * @returns The new mesh
     */
    createMesh(name, scene = null) {
        if (!this._buildWasSuccessful) {
            this.build();
        }
        if (!this._vertexData) {
            return null;
        }
        const mesh = new Mesh(name, scene);
        this._vertexData.applyToMesh(mesh);
        mesh._internalMetadata = mesh._internalMetadata || {};
        mesh._internalMetadata.nodeGeometry = this;
        return mesh;
    }
    /**
     * Creates a mesh from the geometry blocks
     * @param mesh the mesh to update
     * @returns True if successfully updated
     */
    updateMesh(mesh) {
        if (!this._buildWasSuccessful) {
            this.build();
        }
        if (!this._vertexData) {
            return false;
        }
        this._vertexData.applyToMesh(mesh);
        mesh._internalMetadata = mesh._internalMetadata || {};
        mesh._internalMetadata.nodeGeometry = this;
        return mesh;
    }
    _initializeBlock(node, autoConfigure = true) {
        node.initialize();
        if (autoConfigure) {
            node.autoConfigure(this);
        }
        node._preparationId = this._buildId;
        if (this.attachedBlocks.indexOf(node) === -1) {
            this.attachedBlocks.push(node);
        }
        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block, autoConfigure);
                }
            }
        }
    }
    /**
     * Clear the current geometry
     */
    clear() {
        this.outputBlock = null;
        this.attachedBlocks.length = 0;
    }
    /**
     * Remove a block from the current geometry
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
     * @param source defines the JSON representation of the geometry
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
                const block = new blockType();
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
     * Generate a string containing the code declaration required to create an equivalent of this geometry
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
        let codeString = `let nodeGeometry = new BABYLON.NodeGeometry("${this.name || "node geometry"}");\n`;
        for (const node of blocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }
        if (this.outputBlock) {
            // Connections
            alreadyDumped = [];
            codeString += "// Connections\n";
            codeString += this.outputBlock._dumpCodeForOutputConnections(alreadyDumped);
            // Output nodes
            codeString += "// Output nodes\n";
            codeString += `nodeGeometry.outputBlock = ${this.outputBlock._codeVariableName};\n`;
            codeString += `nodeGeometry.build();\n`;
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
     * Clear the current geometry and set it to a default state
     */
    setToDefault() {
        this.clear();
        this.editorData = null;
        // Source
        const dataBlock = new BoxBlock("Box");
        dataBlock.autoConfigure();
        // Final output
        const output = new GeometryOutputBlock("Geometry Output");
        dataBlock.geometry.connectTo(output.geometry);
        this.outputBlock = output;
    }
    /**
     * Makes a duplicate of the current geometry.
     * @param name defines the name to use for the new geometry
     * @returns the new geometry
     */
    clone(name) {
        const serializationObject = this.serialize();
        const clone = SerializationHelper.Clone(() => new NodeGeometry(name), this);
        clone.name = name;
        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;
        clone.build(false);
        return clone;
    }
    /**
     * Serializes this geometry in a JSON representation
     * @param selectedBlocks defines the list of blocks to save (if null the whole geometry will be saved)
     * @returns the serialized geometry object
     */
    serialize(selectedBlocks) {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy
        let blocks = [];
        if (selectedBlocks) {
            blocks = selectedBlocks;
        }
        else {
            serializationObject.customType = "BABYLON.NodeGeometry";
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
        this.attachedBlocks.length = 0;
        this.onBuildObservable.clear();
    }
    /**
     * Creates a new node geometry set to default basic configuration
     * @param name defines the name of the geometry
     * @returns a new NodeGeometry
     */
    static CreateDefault(name) {
        const nodeGeometry = new NodeGeometry(name);
        nodeGeometry.setToDefault();
        nodeGeometry.build();
        return nodeGeometry;
    }
    /**
     * Creates a node geometry from parsed geometry data
     * @param source defines the JSON representation of the geometry
     * @returns a new node geometry
     */
    static Parse(source) {
        const nodeGeometry = SerializationHelper.Parse(() => new NodeGeometry(source.name), source, null);
        nodeGeometry.parseSerializedObject(source);
        nodeGeometry.build();
        return nodeGeometry;
    }
    /**
     * Creates a node geometry from a snippet saved by the node geometry editor
     * @param snippetId defines the snippet to load
     * @param nodeGeometry defines a node geometry to update (instead of creating a new one)
     * @param skipBuild defines whether to build the node geometry
     * @returns a promise that will resolve to the new node geometry
     */
    static ParseFromSnippetAsync(snippetId, nodeGeometry, skipBuild = false) {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeGeometry.CreateDefault("blank"));
        }
        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeGeometry);
                        if (!nodeGeometry) {
                            nodeGeometry = SerializationHelper.Parse(() => new NodeGeometry(snippetId), serializationObject, null);
                        }
                        nodeGeometry.parseSerializedObject(serializationObject);
                        nodeGeometry.snippetId = snippetId;
                        try {
                            if (!skipBuild) {
                                nodeGeometry.build();
                            }
                            resolve(nodeGeometry);
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
NodeGeometry._BuildIdGenerator = 0;
/** Define the Url to load node editor script */
NodeGeometry.EditorURL = `${Tools._DefaultCdnUrl}/v${AbstractEngine.Version}/nodeGeometryEditor/babylon.nodeGeometryEditor.js`;
/** Define the Url to load snippets */
NodeGeometry.SnippetUrl = `https://snippet.babylonjs.com`;
__decorate([
    serialize()
], NodeGeometry.prototype, "name", void 0);
__decorate([
    serialize("comment")
], NodeGeometry.prototype, "comment", void 0);
//# sourceMappingURL=nodeGeometry.js.map