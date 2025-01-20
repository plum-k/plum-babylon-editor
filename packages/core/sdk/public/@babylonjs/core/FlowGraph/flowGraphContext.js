import { __decorate } from "../tslib.es6.js";
import { serialize } from "../Misc/decorators.js";
import { RandomGUID } from "../Misc/guid.js";
import { defaultValueParseFunction, defaultValueSerializationFunction } from "./serialization.js";
import { Observable } from "../Misc/observable.js";
/**
 * @experimental
 * The context represents the current state and execution of the flow graph.
 * It contains both user-defined variables, which are derived from
 * a more general variable definition, and execution variables that
 * are set by the blocks.
 */
export class FlowGraphContext {
    constructor(params) {
        /**
         * A randomly generated GUID for each context.
         */
        this.uniqueId = RandomGUID();
        /**
         * These are the variables defined by a user.
         */
        this._userVariables = {};
        /**
         * These are the variables set by the blocks.
         */
        this._executionVariables = {};
        /**
         * These are the values for the data connection points
         */
        this._connectionValues = {};
        /**
         * These are blocks that have currently pending tasks/listeners that need to be cleaned up.
         */
        this._pendingBlocks = [];
        /**
         * A monotonically increasing ID for each execution.
         * Incremented for every block executed.
         */
        this._executionId = 0;
        /**
         * Observable that is triggered when a node is executed.
         */
        this.onNodeExecutedObservable = new Observable();
        this._configuration = params;
    }
    /**
     * Check if a user-defined variable is defined.
     * @param name the name of the variable
     * @returns true if the variable is defined
     */
    hasVariable(name) {
        return name in this._userVariables;
    }
    /**
     * Set a user-defined variable.
     * @param name the name of the variable
     * @param value the value of the variable
     */
    setVariable(name, value) {
        this._userVariables[name] = value;
    }
    /**
     * Get a user-defined variable.
     * @param name the name of the variable
     * @returns the value of the variable
     */
    getVariable(name) {
        return this._userVariables[name];
    }
    /**
     * Gets all user variables map
     */
    get userVariables() {
        return this._userVariables;
    }
    _getUniqueIdPrefixedName(obj, name) {
        return `${obj.uniqueId}_${name}`;
    }
    /**
     * Set an internal execution variable
     * @internal
     * @param name
     * @param value
     */
    _setExecutionVariable(block, name, value) {
        this._executionVariables[this._getUniqueIdPrefixedName(block, name)] = value;
    }
    /**
     * Get an internal execution variable
     * @internal
     * @param name
     * @returns
     */
    _getExecutionVariable(block, name, defaultValue) {
        if (this._hasExecutionVariable(block, name)) {
            return this._executionVariables[this._getUniqueIdPrefixedName(block, name)];
        }
        else {
            return defaultValue;
        }
    }
    /**
     * Delete an internal execution variable
     * @internal
     * @param block
     * @param name
     */
    _deleteExecutionVariable(block, name) {
        delete this._executionVariables[this._getUniqueIdPrefixedName(block, name)];
    }
    /**
     * Check if an internal execution variable is defined
     * @internal
     * @param block
     * @param name
     * @returns
     */
    _hasExecutionVariable(block, name) {
        return this._getUniqueIdPrefixedName(block, name) in this._executionVariables;
    }
    /**
     * Check if a connection value is defined
     * @internal
     * @param connectionPoint
     * @returns
     */
    _hasConnectionValue(connectionPoint) {
        return connectionPoint.uniqueId in this._connectionValues;
    }
    /**
     * Set a connection value
     * @internal
     * @param connectionPoint
     * @param value
     */
    _setConnectionValue(connectionPoint, value) {
        this._connectionValues[connectionPoint.uniqueId] = value;
    }
    /**
     * Get a connection value
     * @internal
     * @param connectionPoint
     * @returns
     */
    _getConnectionValue(connectionPoint) {
        return this._connectionValues[connectionPoint.uniqueId];
    }
    /**
     * Get the configuration
     * @internal
     * @param name
     * @param value
     */
    get configuration() {
        return this._configuration;
    }
    /**
     * Add a block to the list of blocks that have pending tasks.
     * @internal
     * @param block
     */
    _addPendingBlock(block) {
        this._pendingBlocks.push(block);
    }
    /**
     * Remove a block from the list of blocks that have pending tasks.
     * @internal
     * @param block
     */
    _removePendingBlock(block) {
        const index = this._pendingBlocks.indexOf(block);
        if (index !== -1) {
            this._pendingBlocks.splice(index, 1);
        }
    }
    /**
     * Clear all pending blocks.
     * @internal
     */
    _clearPendingBlocks() {
        for (const block of this._pendingBlocks) {
            block._cancelPendingTasks(this);
        }
        this._pendingBlocks.length = 0;
    }
    /**
     * @internal
     * Function that notifies the node executed observable
     * @param node
     */
    _notifyExecuteNode(node) {
        this.onNodeExecutedObservable.notifyObservers(node);
    }
    /**
     * @internal
     */
    _increaseExecutionId() {
        this._executionId++;
    }
    /**
     * A monotonically increasing ID for each execution.
     * Incremented for every block executed.
     */
    get executionId() {
        return this._executionId;
    }
    /**
     * Serializes a context
     * @param serializationObject the object to write the values in
     * @param valueSerializationFunction a function to serialize complex values
     */
    serialize(serializationObject = {}, valueSerializationFunction = defaultValueSerializationFunction) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject._userVariables = {};
        for (const key in this._userVariables) {
            valueSerializationFunction(key, this._userVariables[key], serializationObject._userVariables);
        }
        serializationObject._connectionValues = {};
        for (const key in this._connectionValues) {
            valueSerializationFunction(key, this._connectionValues[key], serializationObject._connectionValues);
        }
    }
    /**
     * @returns the class name of the object.
     */
    getClassName() {
        return "FGContext";
    }
    /**
     * Parses a context
     * @param serializationObject the object containing the context serialization values
     * @param options the options for parsing the context
     * @returns
     */
    static Parse(serializationObject, options) {
        const result = options.graph.createContext();
        const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
        result.uniqueId = serializationObject.uniqueId;
        for (const key in serializationObject._userVariables) {
            const value = valueParseFunction(key, serializationObject._userVariables, result._configuration.scene);
            result._userVariables[key] = value;
        }
        for (const key in serializationObject._connectionValues) {
            const value = valueParseFunction(key, serializationObject._connectionValues, result._configuration.scene);
            result._connectionValues[key] = value;
        }
        return result;
    }
}
__decorate([
    serialize()
], FlowGraphContext.prototype, "uniqueId", void 0);
//# sourceMappingURL=flowGraphContext.js.map