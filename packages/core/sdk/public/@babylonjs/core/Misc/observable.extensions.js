import { Observable } from "./observable.js";
/**
 * Represent a list of observers registered to multiple Observables object.
 */
export class MultiObserver {
    /**
     * Release associated resources
     */
    dispose() {
        if (this._observers && this._observables) {
            for (let index = 0; index < this._observers.length; index++) {
                this._observables[index].remove(this._observers[index]);
            }
        }
        this._observers = null;
        this._observables = null;
    }
    /**
     * Raise a callback when one of the observable will notify
     * @param observables defines a list of observables to watch
     * @param callback defines the callback to call on notification
     * @param mask defines the mask used to filter notifications
     * @param scope defines the current scope used to restore the JS context
     * @returns the new MultiObserver
     */
    static Watch(observables, callback, mask = -1, scope = null) {
        const result = new MultiObserver();
        result._observers = new Array();
        result._observables = observables;
        for (const observable of observables) {
            const observer = observable.add(callback, mask, false, scope);
            if (observer) {
                result._observers.push(observer);
            }
        }
        return result;
    }
}
Observable.prototype.notifyObserversWithPromise = async function (eventData, mask = -1, target, currentTarget, userInfo) {
    // create an empty promise
    let p = Promise.resolve(eventData);
    // no observers? return this promise.
    if (!this.observers.length) {
        return p;
    }
    const state = this._eventState;
    state.mask = mask;
    state.target = target;
    state.currentTarget = currentTarget;
    state.skipNextObservers = false;
    state.userInfo = userInfo;
    // execute one callback after another (not using Promise.all, the order is important)
    this.observers.forEach((obs) => {
        if (state.skipNextObservers) {
            return;
        }
        if (obs._willBeUnregistered) {
            return;
        }
        if (obs.mask & mask) {
            if (obs.scope) {
                p = p.then((lastReturnedValue) => {
                    state.lastReturnValue = lastReturnedValue;
                    return obs.callback.apply(obs.scope, [eventData, state]);
                });
            }
            else {
                p = p.then((lastReturnedValue) => {
                    state.lastReturnValue = lastReturnedValue;
                    return obs.callback(eventData, state);
                });
            }
            if (obs.unregisterOnNextCall) {
                this._deferUnregister(obs);
            }
        }
    });
    // return the eventData
    await p;
    return eventData;
};
//# sourceMappingURL=observable.extensions.js.map