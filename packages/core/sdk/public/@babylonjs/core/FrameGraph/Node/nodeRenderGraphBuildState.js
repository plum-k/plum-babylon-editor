import { Logger } from "../../Misc/logger.js";
/**
 * Class used to store node based render graph build state
 */
export class NodeRenderGraphBuildState {
    constructor() {
        /** Gets or sets a boolean indicating that verbose mode is on */
        this.verbose = false;
        /**
         * Gets or sets the list of non connected mandatory inputs
         * @internal
         */
        this._notConnectedNonOptionalInputs = [];
    }
    /**
     * Emits console errors and exceptions if there is a failing check
     * @param errorObservable defines an Observable to send the error message
     * @returns true if all checks pass
     */
    emitErrors(errorObservable = null) {
        let errorMessage = "";
        for (const notConnectedInput of this._notConnectedNonOptionalInputs) {
            errorMessage += `input "${notConnectedInput.name}" from block "${notConnectedInput.ownerBlock.name}"[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            if (errorObservable) {
                errorObservable.notifyObservers(errorMessage);
            }
            Logger.Error("Build of node render graph failed:\n" + errorMessage);
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=nodeRenderGraphBuildState.js.map