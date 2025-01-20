import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that waits for all input flows to be activated before activating its output flow.
 */
export class FlowGraphWaitAllBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
        /**
         * Input connection: The 2nd to nth input flows (the first is named onStart)
         */
        this.inFlows = [];
        this._cachedActivationState = [];
        this.reset = this._registerSignalInput("reset");
        // The first inFlow is the default input signal all execution blocks have
        for (let i = 1; i < this.config.numberInputFlows; i++) {
            this.inFlows.push(this._registerSignalInput(`in${i}`));
        }
    }
    _getCurrentActivationState(context) {
        const activationState = this._cachedActivationState;
        activationState.length = 0;
        if (!context._hasExecutionVariable(this, "activationState")) {
            for (let i = 0; i < this.config.numberInputFlows; i++) {
                activationState.push(false);
            }
        }
        else {
            const contextActivationState = context._getExecutionVariable(this, "activationState");
            for (let i = 0; i < contextActivationState.length; i++) {
                activationState.push(contextActivationState[i]);
            }
        }
        return activationState;
    }
    _execute(context, callingSignal) {
        const activationState = this._getCurrentActivationState(context);
        if (callingSignal === this.reset) {
            for (let i = 0; i < this.config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        }
        else if (callingSignal === this.in) {
            activationState[0] = true;
        }
        else {
            const index = this.inFlows.indexOf(callingSignal);
            if (index >= 0) {
                activationState[index + 1] = true;
            }
        }
        context._setExecutionVariable(this, "activationState", activationState.slice());
        if (activationState.every((value) => value)) {
            this.out._activateSignal(context);
            for (let i = 0; i < this.config.numberInputFlows; i++) {
                activationState[i] = false;
            }
        }
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return "FGWaitAllBlock";
    }
    /**
     * Serializes this block into a object
     * @param serializationObject the object to serialize to
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.config.numberInputFlows = this.config.numberInputFlows;
    }
}
RegisterClass("FGWaitAllBlock", FlowGraphWaitAllBlock);
//# sourceMappingURL=flowGraphWaitAllBlock.js.map