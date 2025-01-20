import { RegisterClass } from "../Misc/typeStore.js";
import { FlowGraphConnection } from "./flowGraphConnection.js";
import { RichType } from "./flowGraphRichTypes.js";
/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection extends FlowGraphConnection {
    /**
     * Create a new data connection point.
     * @param name
     * @param connectionType
     * @param ownerBlock
     * @param richType
     */
    constructor(name, connectionType, ownerBlock, 
    /**
     * the type of the data in this block
     */
    richType) {
        super(name, connectionType, ownerBlock);
        this.richType = richType;
    }
    /**
     * An output data block can connect to multiple input data blocks,
     * but an input data block can only connect to one output data block.
     * @returns true if the connection is singular
     */
    _isSingularConnection() {
        return this.connectionType === 0 /* FlowGraphConnectionType.Input */;
    }
    /**
     * Set the value of the connection in a specific context.
     * @param value the value to set
     * @param context the context to which the value is set
     */
    setValue(value, context) {
        context._setConnectionValue(this, value);
    }
    /**
     * Connect this point to another point.
     * @param point the point to connect to.
     */
    connectTo(point) {
        super.connectTo(point);
    }
    _getValueOrDefault(context) {
        if (context._hasConnectionValue(this)) {
            return context._getConnectionValue(this);
        }
        else {
            return this.richType.defaultValue;
        }
    }
    /**
     * Gets the value of the connection in a specific context.
     * @param context the context from which the value is retrieved
     * @returns the value of the connection
     */
    getValue(context) {
        if (this.connectionType === 1 /* FlowGraphConnectionType.Output */) {
            context._notifyExecuteNode(this._ownerBlock);
            this._ownerBlock._updateOutputs(context);
            return this._getValueOrDefault(context);
        }
        if (!this.isConnected()) {
            return this._getValueOrDefault(context);
        }
        else {
            return this._connectedPoint[0].getValue(context);
        }
    }
    /**
     * @returns class name of the object.
     */
    getClassName() {
        return "FGDataConnection";
    }
    /**
     * Serializes this object.
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject = {}) {
        super.serialize(serializationObject);
        serializationObject.richType = {};
        this.richType.serialize(serializationObject.richType);
    }
    /**
     * Parses a data connection from a serialized object.
     * @param serializationObject the object to parse from
     * @param ownerBlock the block that owns the connection
     * @returns the parsed connection
     */
    static Parse(serializationObject, ownerBlock) {
        const obj = FlowGraphConnection.Parse(serializationObject, ownerBlock);
        obj.richType = RichType.Parse(serializationObject.richType);
        return obj;
    }
}
RegisterClass("FGDataConnection", FlowGraphDataConnection);
//# sourceMappingURL=flowGraphDataConnection.js.map