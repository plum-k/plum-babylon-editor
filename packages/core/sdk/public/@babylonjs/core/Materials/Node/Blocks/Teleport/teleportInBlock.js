import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets.js";
import { NodeMaterialBlock } from "../../nodeMaterialBlock.js";
/**
 * Defines a block used to teleport a value to an endpoint
 */
export class NodeMaterialTeleportInBlock extends NodeMaterialBlock {
    /** Gets the list of attached endpoints */
    get endpoints() {
        return this._endpoints;
    }
    /**
     * Gets or sets the target of the block
     */
    get target() {
        const input = this._inputs[0];
        if (input.isConnected) {
            const block = input.connectedPoint.ownerBlock;
            if (block.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return block.target;
            }
            if (input.connectedPoint.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return input.connectedPoint.target;
            }
        }
        return this._target;
    }
    set target(value) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }
    /**
     * Create a new NodeMaterialTeleportInBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this._endpoints = [];
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeMaterialTeleportInBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * @returns a boolean indicating that this connection will be used in the fragment shader
     */
    isConnectedInFragmentShader() {
        return this.endpoints.some((e) => e.output.isConnectedInFragmentShader);
    }
    _dumpCode(uniqueNames, alreadyDumped) {
        let codeString = super._dumpCode(uniqueNames, alreadyDumped);
        for (const endpoint of this.endpoints) {
            if (alreadyDumped.indexOf(endpoint) === -1) {
                codeString += endpoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }
        return codeString;
    }
    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    isAnAncestorOf(block) {
        for (const endpoint of this.endpoints) {
            if (endpoint === block) {
                return true;
            }
            if (endpoint.isAnAncestorOf(block)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Add an enpoint to this block
     * @param endpoint define the endpoint to attach to
     */
    attachToEndpoint(endpoint) {
        endpoint.detach();
        this._endpoints.push(endpoint);
        endpoint._entryPoint = this;
        endpoint._outputs[0]._typeConnectionSource = this._inputs[0];
        endpoint._tempEntryPointUniqueId = null;
        endpoint.name = "> " + this.name;
        this._outputs = this._endpoints.map((e) => e.output);
    }
    /**
     * Remove enpoint from this block
     * @param endpoint define the endpoint to remove
     */
    detachFromEndpoint(endpoint) {
        const index = this._endpoints.indexOf(endpoint);
        if (index !== -1) {
            this._endpoints.splice(index, 1);
            endpoint._outputs[0]._typeConnectionSource = null;
            endpoint._entryPoint = null;
            this._outputs = this._endpoints.map((e) => e.output);
        }
    }
    /**
     * Release resources
     */
    dispose() {
        super.dispose();
        for (const endpoint of this._endpoints) {
            this.detachFromEndpoint(endpoint);
        }
        this._endpoints = [];
    }
}
RegisterClass("BABYLON.NodeMaterialTeleportInBlock", NodeMaterialTeleportInBlock);
//# sourceMappingURL=teleportInBlock.js.map