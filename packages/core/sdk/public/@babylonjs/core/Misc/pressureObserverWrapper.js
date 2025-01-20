import { Observable } from "./observable.js";
/**
 * A wrapper for the experimental pressure api which allows a callback to be called whenever certain thresholds are met.
 */
export class PressureObserverWrapper {
    /**
     * A pressure observer will call this callback, whenever these thresholds are met.
     * @param options An object containing the thresholds used to decide what value to to return for each update property (average of start and end of a threshold boundary).
     */
    constructor(options) {
        this._observer = null;
        this._currentState = [];
        /**
         * An event triggered when the cpu usage/speed meets certain thresholds.
         * Note: pressure is an experimental API.
         */
        this.onPressureChanged = new Observable();
        if (PressureObserverWrapper.IsAvailable) {
            this._observer = new PressureObserver((update) => {
                this._currentState = update;
                this.onPressureChanged.notifyObservers(update);
            }, options);
        }
    }
    /**
     * Returns true if PressureObserver is available for use, false otherwise.
     */
    static get IsAvailable() {
        return typeof PressureObserver !== "undefined" && PressureObserver.knownSources && PressureObserver.knownSources.includes("cpu");
    }
    /**
     * Method that must be called to begin observing changes, and triggering callbacks.
     * @param source defines the source to observe
     */
    observe(source) {
        try {
            this._observer?.observe(source);
            this.onPressureChanged.notifyObservers(this._currentState);
        }
        catch {
            // Ignore error
        }
    }
    /**
     * Method that must be called to stop observing changes and triggering callbacks (cleanup function).
     * @param source defines the source to unobserve
     */
    unobserve(source) {
        try {
            this._observer?.unobserve(source);
        }
        catch {
            // Ignore error
        }
    }
    /**
     * Release the associated resources.
     */
    dispose() {
        this._observer?.disconnect();
        this._observer = null;
        this.onPressureChanged.clear();
    }
}
//# sourceMappingURL=pressureObserverWrapper.js.map