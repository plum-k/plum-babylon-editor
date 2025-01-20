import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
/**
 * Defines a block used to teleport a value to an endpoint
 */
export class TeleportInBlock extends NodeGeometryBlock {
    /** Gets the list of attached endpoints */
    get endpoints() {
        return this._endpoints;
    }
    /**
     * Create a new TeleportInBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this._endpoints = [];
        this._isTeleportIn = true;
        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "TeleportInBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
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
     * Checks if the current block is an ancestor of a given type
     * @param type defines the potential type to check
     * @returns true if block is a descendant
     */
    isAnAncestorOfType(type) {
        if (this.getClassName() === type) {
            return true;
        }
        for (const endpoint of this.endpoints) {
            if (endpoint.isAnAncestorOfType(type)) {
                return true;
            }
        }
        return false;
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
     * Get the first descendant using a predicate
     * @param predicate defines the predicate to check
     * @returns descendant or null if none found
     */
    getDescendantOfPredicate(predicate) {
        if (predicate(this)) {
            return this;
        }
        for (const endpoint of this.endpoints) {
            const descendant = endpoint.getDescendantOfPredicate(predicate);
            if (descendant) {
                return descendant;
            }
        }
        return null;
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
        }
    }
    _buildBlock() {
        for (const endpoint of this._endpoints) {
            endpoint.output._storedFunction = (state) => {
                return this.input.getConnectedValue(state);
            };
        }
    }
}
RegisterClass("BABYLON.TeleportInBlock", TeleportInBlock);
//# sourceMappingURL=teleportInBlock.js.map