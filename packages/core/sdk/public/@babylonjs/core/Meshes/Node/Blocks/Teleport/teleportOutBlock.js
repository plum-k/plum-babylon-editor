import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
/**
 * Defines a block used to receive a value from a teleport entry point
 */
export class TeleportOutBlock extends NodeGeometryBlock {
    /**
     * Create a new TeleportOutBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /** @internal */
        this._entryPoint = null;
        /** @internal */
        this._tempEntryPointUniqueId = null;
        this._isTeleportOut = true;
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
    }
    /**
     * Gets the entry point
     */
    get entryPoint() {
        return this._entryPoint;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "TeleportOutBlock";
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    /** Detach from entry point */
    detach() {
        if (!this._entryPoint) {
            return;
        }
        this._entryPoint.detachFromEndpoint(this);
    }
    _buildBlock() {
        // Do nothing
        // All work done by the emitter
    }
    _customBuildStep(state) {
        if (this.entryPoint) {
            this.entryPoint.build(state);
        }
    }
    _dumpCode(uniqueNames, alreadyDumped) {
        let codeString = "";
        if (this.entryPoint) {
            if (alreadyDumped.indexOf(this.entryPoint) === -1) {
                codeString += this.entryPoint._dumpCode(uniqueNames, alreadyDumped);
            }
        }
        return codeString + super._dumpCode(uniqueNames, alreadyDumped);
    }
    _dumpCodeForOutputConnections(alreadyDumped) {
        let codeString = super._dumpCodeForOutputConnections(alreadyDumped);
        if (this.entryPoint) {
            codeString += this.entryPoint._dumpCodeForOutputConnections(alreadyDumped);
        }
        return codeString;
    }
    /**
     * Clone the current block to a new identical block
     * @returns a copy of the current block
     */
    clone() {
        const clone = super.clone();
        if (this.entryPoint) {
            this.entryPoint.attachToEndpoint(clone);
        }
        return clone;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        if (this.entryPoint) {
            codeString += `${this.entryPoint._codeVariableName}.attachToEndpoint(${this._codeVariableName});\n`;
        }
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.entryPoint = this.entryPoint?.uniqueId ?? "";
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this._tempEntryPointUniqueId = serializationObject.entryPoint;
    }
}
RegisterClass("BABYLON.TeleportOutBlock", TeleportOutBlock);
//# sourceMappingURL=teleportOutBlock.js.map