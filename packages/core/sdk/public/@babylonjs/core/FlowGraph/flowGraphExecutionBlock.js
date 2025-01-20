import { FlowGraphBlock } from "./flowGraphBlock.js";
import { FlowGraphSignalConnection } from "./flowGraphSignalConnection.js";
/**
 * @experimental
 * A block that executes some action. Always has an input signal (which is not used by event blocks).
 * Can have one or more output signals.
 */
export class FlowGraphExecutionBlock extends FlowGraphBlock {
    constructor(config) {
        super(config);
        this.signalInputs = [];
        this.signalOutputs = [];
        this.in = this._registerSignalInput("in");
    }
    _registerSignalInput(name) {
        const input = new FlowGraphSignalConnection(name, 0 /* FlowGraphConnectionType.Input */, this);
        this.signalInputs.push(input);
        return input;
    }
    _registerSignalOutput(name) {
        const output = new FlowGraphSignalConnection(name, 1 /* FlowGraphConnectionType.Output */, this);
        this.signalOutputs.push(output);
        return output;
    }
    /**
     * Given a name of a signal input, return that input if it exists
     * @param name the name of the input
     * @returns if the input exists, the input. Otherwise, undefined.
     */
    getSignalInput(name) {
        return this.signalInputs.find((input) => input.name === name);
    }
    /**
     * Given a name of a signal output, return that input if it exists
     * @param name the name of the input
     * @returns if the input exists, the input. Otherwise, undefined.
     */
    getSignalOutput(name) {
        return this.signalOutputs.find((output) => output.name === name);
    }
    /**
     * Serializes this block
     * @param serializationObject the object to serialize in
     */
    serialize(serializationObject = {}) {
        super.serialize(serializationObject);
        serializationObject.signalInputs = [];
        serializationObject.signalOutputs = [];
        for (const input of this.signalInputs) {
            const serializedInput = {};
            input.serialize(serializedInput);
            serializationObject.signalInputs.push(serializedInput);
        }
        for (const output of this.signalOutputs) {
            const serializedOutput = {};
            output.serialize(serializedOutput);
            serializationObject.signalOutputs.push(serializedOutput);
        }
    }
    /**
     * Deserializes from an object
     * @param serializationObject the object to deserialize from
     */
    deserialize(serializationObject) {
        for (let i = 0; i < serializationObject.signalInputs.length; i++) {
            const signalInput = this.getSignalInput(serializationObject.signalInputs[i].name);
            if (signalInput) {
                signalInput.deserialize(serializationObject.signalInputs[i]);
            }
            else {
                throw new Error("Could not find signal input with name " + serializationObject.signalInputs[i].name + " in block " + serializationObject.className);
            }
        }
        for (let i = 0; i < serializationObject.signalOutputs.length; i++) {
            const signalOutput = this.getSignalOutput(serializationObject.signalOutputs[i].name);
            if (signalOutput) {
                signalOutput.deserialize(serializationObject.signalOutputs[i]);
            }
            else {
                throw new Error("Could not find signal output with name " + serializationObject.signalOutputs[i].name + " in block " + serializationObject.className);
            }
        }
    }
    /**
     * @returns the class name
     */
    getClassName() {
        return "FGExecutionBlock";
    }
}
//# sourceMappingURL=flowGraphExecutionBlock.js.map