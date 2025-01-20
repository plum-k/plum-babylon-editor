const isWeakRefSupported = typeof WeakRef !== "undefined";
/**
 * A class serves as a medium between the observable and its observers
 */
export class EventState {
    /**
     * Create a new EventState
     * @param mask defines the mask associated with this state
     * @param skipNextObservers defines a flag which will instruct the observable to skip following observers when set to true
     * @param target defines the original target of the state
     * @param currentTarget defines the current target of the state
     */
    constructor(mask, skipNextObservers = false, target, currentTarget) {
        this.initialize(mask, skipNextObservers, target, currentTarget);
    }
    /**
     * Initialize the current event state
     * @param mask defines the mask associated with this state
     * @param skipNextObservers defines a flag which will instruct the observable to skip following observers when set to true
     * @param target defines the original target of the state
     * @param currentTarget defines the current target of the state
     * @returns the current event state
     */
    initialize(mask, skipNextObservers = false, target, currentTarget) {
        this.mask = mask;
        this.skipNextObservers = skipNextObservers;
        this.target = target;
        this.currentTarget = currentTarget;
        return this;
    }
}
/**
 * Represent an Observer registered to a given Observable object.
 */
export class Observer {
    /**
     * Creates a new observer
     * @param callback defines the callback to call when the observer is notified
     * @param mask defines the mask of the observer (used to filter notifications)
     * @param scope defines the current scope used to restore the JS context
     */
    constructor(
    /**
     * Defines the callback to call when the observer is notified
     */
    callback, 
    /**
     * Defines the mask of the observer (used to filter notifications)
     */
    mask, 
    /**
     * [null] Defines the current scope used to restore the JS context
     */
    scope = null) {
        this.callback = callback;
        this.mask = mask;
        this.scope = scope;
        /** @internal */
        this._willBeUnregistered = false;
        /**
         * Gets or sets a property defining that the observer as to be unregistered after the next notification
         */
        this.unregisterOnNextCall = false;
        /**
         * this function can be used to remove the observer from the observable.
         * It will be set by the observable that the observer belongs to.
         * @internal
         */
        this._remove = null;
    }
    /**
     * Remove the observer from its observable
     * This can be used instead of using the observable's remove function.
     */
    remove() {
        if (this._remove) {
            this._remove();
        }
    }
}
/**
 * The Observable class is a simple implementation of the Observable pattern.
 *
 * There's one slight particularity though: a given Observable can notify its observer using a particular mask value, only the Observers registered with this mask value will be notified.
 * This enable a more fine grained execution without having to rely on multiple different Observable objects.
 * For instance you may have a given Observable that have four different types of notifications: Move (mask = 0x01), Stop (mask = 0x02), Turn Right (mask = 0X04), Turn Left (mask = 0X08).
 * A given observer can register itself with only Move and Stop (mask = 0x03), then it will only be notified when one of these two occurs and will never be for Turn Left/Right.
 */
export class Observable {
    /**
     * Create an observable from a Promise.
     * @param promise a promise to observe for fulfillment.
     * @param onErrorObservable an observable to notify if a promise was rejected.
     * @returns the new Observable
     */
    static FromPromise(promise, onErrorObservable) {
        const observable = new Observable();
        promise
            .then((ret) => {
            observable.notifyObservers(ret);
        })
            .catch((err) => {
            if (onErrorObservable) {
                onErrorObservable.notifyObservers(err);
            }
            else {
                throw err;
            }
        });
        return observable;
    }
    /**
     * Gets the list of observers
     * Note that observers that were recently deleted may still be present in the list because they are only really deleted on the next javascript tick!
     */
    get observers() {
        return this._observers;
    }
    /**
     * Creates a new observable
     * @param onObserverAdded defines a callback to call when a new observer is added
     * @param notifyIfTriggered If set to true the observable will notify when an observer was added if the observable was already triggered.
     */
    constructor(onObserverAdded, 
    /**
     * [false] If set to true the observable will notify when an observer was added if the observable was already triggered.
     * This is helpful to single-state observables like the scene onReady or the dispose observable.
     */
    notifyIfTriggered = false) {
        this.notifyIfTriggered = notifyIfTriggered;
        this._observers = new Array();
        this._numObserversMarkedAsDeleted = 0;
        this._hasNotified = false;
        this._eventState = new EventState(0);
        if (onObserverAdded) {
            this._onObserverAdded = onObserverAdded;
        }
    }
    add(callback, mask = -1, insertFirst = false, scope = null, unregisterOnFirstCall = false) {
        if (!callback) {
            return null;
        }
        const observer = new Observer(callback, mask, scope);
        observer.unregisterOnNextCall = unregisterOnFirstCall;
        if (insertFirst) {
            this._observers.unshift(observer);
        }
        else {
            this._observers.push(observer);
        }
        if (this._onObserverAdded) {
            this._onObserverAdded(observer);
        }
        // If the observable was already triggered and the observable is set to notify if triggered, notify the new observer
        if (this._hasNotified && this.notifyIfTriggered) {
            if (this._lastNotifiedValue !== undefined) {
                this.notifyObserver(observer, this._lastNotifiedValue);
            }
        }
        // attach the remove function to the observer
        const observableWeakRef = isWeakRefSupported ? new WeakRef(this) : { deref: () => this };
        observer._remove = () => {
            const observable = observableWeakRef.deref();
            if (observable) {
                observable._remove(observer);
            }
        };
        return observer;
    }
    addOnce(callback) {
        return this.add(callback, undefined, undefined, undefined, true);
    }
    /**
     * Remove an Observer from the Observable object
     * @param observer the instance of the Observer to remove
     * @returns false if it doesn't belong to this Observable
     */
    remove(observer) {
        if (!observer) {
            return false;
        }
        observer._remove = null;
        const index = this._observers.indexOf(observer);
        if (index !== -1) {
            this._deferUnregister(observer);
            return true;
        }
        return false;
    }
    /**
     * Remove a callback from the Observable object
     * @param callback the callback to remove
     * @param scope optional scope. If used only the callbacks with this scope will be removed
     * @returns false if it doesn't belong to this Observable
     */
    removeCallback(callback, scope) {
        for (let index = 0; index < this._observers.length; index++) {
            const observer = this._observers[index];
            if (observer._willBeUnregistered) {
                continue;
            }
            if (observer.callback === callback && (!scope || scope === observer.scope)) {
                this._deferUnregister(observer);
                return true;
            }
        }
        return false;
    }
    /**
     * @internal
     */
    _deferUnregister(observer) {
        if (observer._willBeUnregistered) {
            return;
        }
        this._numObserversMarkedAsDeleted++;
        observer.unregisterOnNextCall = false;
        observer._willBeUnregistered = true;
        setTimeout(() => {
            this._remove(observer);
        }, 0);
    }
    // This should only be called when not iterating over _observers to avoid callback skipping.
    // Removes an observer from the _observer Array.
    _remove(observer, updateCounter = true) {
        if (!observer) {
            return false;
        }
        const index = this._observers.indexOf(observer);
        if (index !== -1) {
            if (updateCounter) {
                this._numObserversMarkedAsDeleted--;
            }
            this._observers.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Moves the observable to the top of the observer list making it get called first when notified
     * @param observer the observer to move
     */
    makeObserverTopPriority(observer) {
        this._remove(observer, false);
        this._observers.unshift(observer);
    }
    /**
     * Moves the observable to the bottom of the observer list making it get called last when notified
     * @param observer the observer to move
     */
    makeObserverBottomPriority(observer) {
        this._remove(observer, false);
        this._observers.push(observer);
    }
    /**
     * Notify all Observers by calling their respective callback with the given data
     * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
     * @param eventData defines the data to send to all observers
     * @param mask defines the mask of the current notification (observers with incompatible mask (ie mask & observer.mask === 0) will not be notified)
     * @param target defines the original target of the state
     * @param currentTarget defines the current target of the state
     * @param userInfo defines any user info to send to observers
     * @returns false if the complete observer chain was not processed (because one observer set the skipNextObservers to true)
     */
    notifyObservers(eventData, mask = -1, target, currentTarget, userInfo) {
        // this prevents potential memory leaks - if an object is disposed but the observable doesn't get cleared.
        if (this.notifyIfTriggered) {
            this._hasNotified = true;
            this._lastNotifiedValue = eventData;
        }
        if (!this._observers.length) {
            return true;
        }
        const state = this._eventState;
        state.mask = mask;
        state.target = target;
        state.currentTarget = currentTarget;
        state.skipNextObservers = false;
        state.lastReturnValue = eventData;
        state.userInfo = userInfo;
        for (const obs of this._observers) {
            if (obs._willBeUnregistered) {
                continue;
            }
            if (obs.mask & mask) {
                if (obs.unregisterOnNextCall) {
                    this._deferUnregister(obs);
                }
                if (obs.scope) {
                    state.lastReturnValue = obs.callback.apply(obs.scope, [eventData, state]);
                }
                else {
                    state.lastReturnValue = obs.callback(eventData, state);
                }
            }
            if (state.skipNextObservers) {
                return false;
            }
        }
        return true;
    }
    /**
     * Notify a specific observer
     * @param observer defines the observer to notify
     * @param eventData defines the data to be sent to each callback
     * @param mask is used to filter observers defaults to -1
     */
    notifyObserver(observer, eventData, mask = -1) {
        // this prevents potential memory leaks - if an object is disposed but the observable doesn't get cleared.
        if (this.notifyIfTriggered) {
            this._hasNotified = true;
            this._lastNotifiedValue = eventData;
        }
        if (observer._willBeUnregistered) {
            return;
        }
        const state = this._eventState;
        state.mask = mask;
        state.skipNextObservers = false;
        if (observer.unregisterOnNextCall) {
            this._deferUnregister(observer);
        }
        observer.callback(eventData, state);
    }
    /**
     * Gets a boolean indicating if the observable has at least one observer
     * @returns true is the Observable has at least one Observer registered
     */
    hasObservers() {
        return this._observers.length - this._numObserversMarkedAsDeleted > 0;
    }
    /**
     * Clear the list of observers
     */
    clear() {
        while (this._observers.length) {
            const o = this._observers.pop();
            if (o) {
                o._remove = null;
            }
        }
        this._onObserverAdded = null;
        this._numObserversMarkedAsDeleted = 0;
        this.cleanLastNotifiedState();
    }
    /**
     * Clean the last notified state - both the internal last value and the has-notified flag
     */
    cleanLastNotifiedState() {
        this._hasNotified = false;
        this._lastNotifiedValue = undefined;
    }
    /**
     * Clone the current observable
     * @returns a new observable
     */
    clone() {
        const result = new Observable();
        result._observers = this._observers.slice(0);
        return result;
    }
    /**
     * Does this observable handles observer registered with a given mask
     * @param mask defines the mask to be tested
     * @returns whether or not one observer registered with the given mask is handled
     **/
    hasSpecificMask(mask = -1) {
        for (const obs of this._observers) {
            if (obs.mask & mask || obs.mask === mask) {
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=observable.js.map