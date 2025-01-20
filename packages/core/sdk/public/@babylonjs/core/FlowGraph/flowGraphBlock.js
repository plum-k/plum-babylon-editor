import { RandomGUID } from "../Misc/guid.js";
import { FlowGraphDataConnection } from "./flowGraphDataConnection.js";
import { Tools } from "../Misc/tools.js";
import { defaultValueParseFunction, defaultValueSerializationFunction, needsPathConverter } from "./serialization.js";
/**
 * @experimental
 * A block in a flow graph. The most basic form
 * of a block has inputs and outputs that contain
 * data.
 */
export class FlowGraphBlock {
    /** Constructor is protected so only subclasses can be instantiated
     * @param config optional configuration for this block
     */
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        this.config = config;
        /**
         * A randomly generated GUID for each block.
         */
        this.uniqueId = RandomGUID();
        this.name = this.config?.name ?? this.getClassName();
        this.dataInputs = [];
        this.dataOutputs = [];
    }
    /**
     * @internal
     */
    _updateOutputs(_context) {
        // empty by default, overriden in data blocks
    }
    /**
     * Registers a data input on the block.
     * @param name the name of the input
     * @param richType the type of the input
     * @returns the created connection
     */
    registerDataInput(name, richType) {
        const input = new FlowGraphDataConnection(name, 0 /* FlowGraphConnectionType.Input */, this, richType);
        this.dataInputs.push(input);
        return input;
    }
    /**
     * Registers a data output on the block.
     * @param name the name of the input
     * @param richType the type of the input
     * @returns the created connection
     */
    registerDataOutput(name, richType) {
        const output = new FlowGraphDataConnection(name, 1 /* FlowGraphConnectionType.Output */, this, richType);
        this.dataOutputs.push(output);
        return output;
    }
    /**
     * Given the name of a data input, returns the connection if it exists
     * @param name the name of the input
     * @returns the connection if it exists, undefined otherwise
     */
    getDataInput(name) {
        return this.dataInputs.find((i) => i.name === name);
    }
    /**
     * Given the name of a data output, returns the connection if it exists
     * @param name the name of the output
     * @returns the connection if it exists, undefined otherwise
     */
    getDataOutput(name) {
        return this.dataOutputs.find((i) => i.name === name);
    }
    /**
     * Serializes this block
     * @param serializationObject the object to serialize to
     * @param _valueSerializeFunction a function that serializes a specific value
     */
    serialize(serializationObject = {}, _valueSerializeFunction = defaultValueSerializationFunction) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject.config = {};
        if (this.config) {
            serializationObject.config["name"] = this.config.name;
        }
        serializationObject.dataInputs = [];
        serializationObject.dataOutputs = [];
        serializationObject.className = this.getClassName();
        for (const input of this.dataInputs) {
            const serializedInput = {};
            input.serialize(serializedInput);
            serializationObject.dataInputs.push(serializedInput);
        }
        for (const output of this.dataOutputs) {
            const serializedOutput = {};
            output.serialize(serializedOutput);
            serializationObject.dataOutputs.push(serializedOutput);
        }
    }
    /**
     * Gets the class name of this block
     * @returns the class name
     */
    getClassName() {
        return "FGBlock";
    }
    /**
     * Parses a block from a serialization object
     * @param serializationObject the object to parse from
     * @param parseOptions options for parsing the block
     * @returns the parsed block
     */
    static Parse(serializationObject, parseOptions) {
        const classType = Tools.Instantiate(serializationObject.className);
        const parsedConfig = {};
        const valueParseFunction = parseOptions.valueParseFunction ?? defaultValueParseFunction;
        if (serializationObject.config) {
            for (const key in serializationObject.config) {
                parsedConfig[key] = valueParseFunction(key, serializationObject.config, parseOptions.scene);
            }
        }
        if (needsPathConverter(serializationObject.className)) {
            parsedConfig.pathConverter = parseOptions.pathConverter;
        }
        const obj = new classType(parsedConfig);
        obj.uniqueId = serializationObject.uniqueId;
        for (let i = 0; i < serializationObject.dataInputs.length; i++) {
            const dataInput = obj.getDataInput(serializationObject.dataInputs[i].name);
            if (dataInput) {
                dataInput.deserialize(serializationObject.dataInputs[i]);
            }
            else {
                throw new Error("Could not find data input with name " + serializationObject.dataInputs[i].name + " in block " + serializationObject.className);
            }
        }
        for (let i = 0; i < serializationObject.dataOutputs.length; i++) {
            const dataOutput = obj.getDataOutput(serializationObject.dataOutputs[i].name);
            if (dataOutput) {
                dataOutput.deserialize(serializationObject.dataOutputs[i]);
            }
            else {
                throw new Error("Could not find data output with name " + serializationObject.dataOutputs[i].name + " in block " + serializationObject.className);
            }
        }
        obj.metadata = serializationObject.metadata;
        obj.deserialize && obj.deserialize(serializationObject);
        return obj;
    }
}
//# sourceMappingURL=flowGraphBlock.js.map