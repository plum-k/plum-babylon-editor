/**
 * Gather the list of keyboard event types as constants.
 */
export class KeyboardEventTypes {
}
/**
 * The keydown event is fired when a key becomes active (pressed).
 */
KeyboardEventTypes.KEYDOWN = 0x01;
/**
 * The keyup event is fired when a key has been released.
 */
KeyboardEventTypes.KEYUP = 0x02;
/**
 * This class is used to store keyboard related info for the onKeyboardObservable event.
 */
export class KeyboardInfo {
    /**
     * Instantiates a new keyboard info.
     * This class is used to store keyboard related info for the onKeyboardObservable event.
     * @param type Defines the type of event (KeyboardEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
    /**
     * Defines the type of event (KeyboardEventTypes)
     */
    type, 
    /**
     * Defines the related dom event
     */
    event) {
        this.type = type;
        this.event = event;
    }
}
/**
 * This class is used to store keyboard related info for the onPreKeyboardObservable event.
 * Set the skipOnKeyboardObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onKeyboardObservable
 */
export class KeyboardInfoPre extends KeyboardInfo {
    /**
     * Defines whether the engine should skip the next onKeyboardObservable associated to this pre.
     * @deprecated use skipOnKeyboardObservable property instead
     */
    get skipOnPointerObservable() {
        return this.skipOnKeyboardObservable;
    }
    set skipOnPointerObservable(value) {
        this.skipOnKeyboardObservable = value;
    }
    /**
     * Instantiates a new keyboard pre info.
     * This class is used to store keyboard related info for the onPreKeyboardObservable event.
     * @param type Defines the type of event (KeyboardEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
    /**
     * Defines the type of event (KeyboardEventTypes)
     */
    type, 
    /**
     * Defines the related dom event
     */
    event) {
        super(type, event);
        this.type = type;
        this.event = event;
        this.skipOnKeyboardObservable = false;
    }
}
//# sourceMappingURL=keyboardEvents.js.map